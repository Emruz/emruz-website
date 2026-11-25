'use server';

import { notFound, redirect } from 'next/navigation';
import { accountForEmail } from '@/lib/server/accounts';
import { isUuid } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { isRef } from '@/lib/server/kits/content-core';
import { oauthStore } from '@/lib/server/kits/store';
import { stripe } from '@/lib/server/stripe';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';

/** Staff grants and revocation of Emruz kit access (#67). */

async function admin() {
  const a = await currentAccount();
  if (!a) redirect('/signin?reauth=1&next=%2Fadmin%2Fkits');
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a, '/admin/kits');
  return `admin:${a.email}`;
}

function back(msg: string, error = false): never {
  redirect(`/admin/kits?${error ? 'err=1&' : ''}msg=${encodeURIComponent(msg)}`);
}

export async function grantKit(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const pack = String(form.get('pack') || '');
  const version = String(form.get('version') || 'latest');
  const note = String(form.get('note') || '').trim().slice(0, 300) || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back('Enter an email address.', true);
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(pack)) back('Choose a kit.', true);
  if (version !== 'latest' && !isRef(version)) back('Choose a version.', true);
  const accountId = await accountForEmail(email);
  const [dupe] = await db()`
    select 1 from kit_entitlements where account_id = ${accountId} and pack = ${pack} and revoked_at is null
      and through_ref is not distinct from ${version === 'latest' ? null : version}`;
  if (dupe) back(`${email} already has that.`, true);
  await db()`
    insert into kit_entitlements (account_id, pack, through_ref, source, note, granted_by)
    values (${accountId}, ${pack}, ${version === 'latest' ? null : version}, 'staff', ${note}, ${actor})`;
  await oauthStore.audit('kit_granted', { accountId, detail: { pack, version, by: actor } });
  back(`Granted ${pack} (${version}) to ${email}.`);
}

export async function revokeKit(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  const reason = String(form.get('reason') || '').trim().slice(0, 300);
  if (!isUuid(id)) back('Not found.', true);
  if (!reason) back('Give a reason to revoke.', true);
  // Revoke first with the admin's reason, so the customer.subscription.deleted webhook that the
  // cancel triggers finds nothing left to revoke; if Stripe refuses the cancel, undo it
  const [row] = await db()<{ account_id: string; pack: string; stripe_subscription_id: string | null }[]>`
    update kit_entitlements set revoked_at = now(), revoked_by = ${actor}, revoked_reason = ${reason}
    where id = ${id} and revoked_at is null returning account_id, pack, stripe_subscription_id`;
  if (row?.stripe_subscription_id) {
    try {
      const s = await stripe().subscriptions.retrieve(row.stripe_subscription_id);
      if (s.status !== 'canceled') await stripe().subscriptions.cancel(row.stripe_subscription_id);
    } catch (e) {
      console.error('kit subscription cancel failed', e);
      await db()`update kit_entitlements set revoked_at = null, revoked_by = null, revoked_reason = null where id = ${id}`;
      back('Stripe would not cancel the subscription, so the kit was not revoked. Try again or cancel it in Stripe.', true);
    }
  }
  if (!row) back('Already revoked.', true);
  await oauthStore.audit('kit_revoked', { accountId: row.account_id, detail: { pack: row.pack, reason, by: actor } });
  back(`Revoked ${row.pack}.`);
}
