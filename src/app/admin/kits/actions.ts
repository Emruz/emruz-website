'use server';

import { notFound, redirect } from 'next/navigation';
import { accountForEmail } from '@/lib/server/accounts';
import { isUuid } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { isRef } from '@/lib/server/kits/content-core';
import { isDay } from '@/lib/server/kits/launch-core';
import { oauthStore } from '@/lib/server/kits/store';
import { stripe } from '@/lib/server/stripe';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';
import { saveSetting } from '@/lib/server/settings';
import { KITS_LAUNCH_DATE } from '@/lib/server/settings-core';

/** Staff grants and revocation of Emruz kit access (#67). */

async function admin() {
  const a = await currentAccount();
  if (!a) redirect('/signin?reauth=1&next=%2Fadmin%2Fkits');
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a, '/admin/kits');
  return `admin:${a.email}`;
}

const isEmail = (e: string) => e.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function back(msg: string, error = false): never {
  redirect(`/admin/kits?${error ? 'err=1&' : ''}msg=${encodeURIComponent(msg)}`);
}

export async function grantKit(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const pack = String(form.get('pack') || '');
  const version = String(form.get('version') || 'latest');
  const note = String(form.get('note') || '').trim().slice(0, 300) || null;
  if (!isEmail(email)) back('Enter an email address.', true);
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

/** True only when Stripe confirms the subscription is cancelled. */
async function subscriptionCancelled(id: string): Promise<boolean> {
  try {
    return (await stripe().subscriptions.retrieve(id)).status === 'canceled';
  } catch (e) {
    console.error('kit subscription re-check failed', e);
    return false;
  }
}

export async function revokeKit(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  const reason = String(form.get('reason') || '').trim().slice(0, 300);
  if (!isUuid(id)) back('Not found.', true);
  if (!reason) back('Give a reason to revoke.', true);
  // Revoke first with the admin's reason, so the customer.subscription.deleted webhook that the
  // cancel triggers finds nothing left to revoke; if Stripe refuses the cancel, undo it.
  // The time is set here (millisecond precision) so the undo can match this revocation only.
  const at = new Date();
  const [row] = await db()<{ account_id: string; pack: string; stripe_subscription_id: string | null }[]>`
    update kit_entitlements set revoked_at = ${at}, revoked_by = ${actor}, revoked_reason = ${reason}
    where id = ${id} and revoked_at is null returning account_id, pack, stripe_subscription_id`;
  if (row?.stripe_subscription_id) {
    let cancelled = false;
    try {
      const s = await stripe().subscriptions.retrieve(row.stripe_subscription_id);
      if (s.status !== 'canceled') await stripe().subscriptions.cancel(row.stripe_subscription_id);
      cancelled = true;
    } catch (e) {
      console.error('kit subscription cancel failed', e);
      // The cancel may have gone through before the error: check again before undoing
      cancelled = await subscriptionCancelled(row.stripe_subscription_id);
    }
    if (!cancelled) {
      await db()`
        update kit_entitlements set revoked_at = null, revoked_by = null, revoked_reason = null
        where id = ${id} and revoked_at = ${at} and revoked_by = ${actor} and revoked_reason = ${reason}`;
      back('Stripe would not cancel the subscription, so the kit was not revoked. Try again or cancel it in Stripe.', true);
    }
  }
  if (!row) back('Already revoked.', true);
  await oauthStore.audit('kit_revoked', { accountId: row.account_id, detail: { pack: row.pack, reason, by: actor } });
  back(`Revoked ${row.pack}.`);
}

/** Leave an email address out of the kits sales metrics (#71). */
export async function excludeEmail(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const note = String(form.get('note') || '').trim().slice(0, 300) || null;
  if (!isEmail(email)) back('Enter an email address to leave out.', true);
  const rows = await db()`
    insert into kit_excluded_emails (email, note, added_by) values (${email}, ${note}, ${actor})
    on conflict (email) do nothing returning email`;
  if (!rows.length) back(`${email} is already left out.`, true);
  await oauthStore.audit('kit_metrics_excluded', { detail: { email, by: actor } });
  back(`${email} is now left out of the sales metrics.`);
}

/** Count an email address in the kits sales metrics again (#71). */
export async function includeEmail(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (!isEmail(email)) back('Not found.', true);
  const rows = await db()`delete from kit_excluded_emails where email = ${email} returning email`;
  if (!rows.length) back('Not found.', true);
  await oauthStore.audit('kit_metrics_included', { detail: { email, by: actor } });
  back(`${email} is counted in the sales metrics again.`);
}

/** Kits launch day: the 90-day review and the kill lines count from it (#71). Empty clears it. */
export async function setLaunchDate(form: FormData) {
  const actor = await admin();
  const day = String(form.get('launch_date') || '').trim();
  if (!day) {
    const r = await saveSetting(KITS_LAUNCH_DATE, null, actor);
    if (r !== 'unchanged') await oauthStore.audit('kit_setting_changed', { detail: { key: 'launch_date', value: null, by: actor } });
    back('Launch date cleared.');
  }
  if (!isDay(day)) back('Enter the launch date as a day, for example 2026-12-01.', true);
  const r = await saveSetting(KITS_LAUNCH_DATE, day, actor);
  if (r !== 'unchanged') await oauthStore.audit('kit_setting_changed', { detail: { key: 'launch_date', value: day, by: actor } });
  back(`Launch date set to ${day}.`);
}
