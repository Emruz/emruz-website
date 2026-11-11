'use server';

import { notFound, redirect } from 'next/navigation';
import { accountForEmail } from '@/lib/server/accounts';
import { isUuid } from '@/lib/server/api';
import { motiv, PLANS, SITE_URL, type Plan } from '@/lib/server/config';
import { db, logEvent } from '@/lib/server/db';
import { sendEmail } from '@/lib/server/email';
import { newSubscriptionId } from '@/lib/server/lease';
import { deactivateDevice, type SubscriptionRow } from '@/lib/server/licensing';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';

async function admin() {
  const a = await currentAccount();
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a!, '/admin/motiv');
  return `admin:${a!.email}`;
}

const back = (q: string, msg: string) => redirect(`/admin/motiv?${new URLSearchParams({ q, msg })}`);

export async function revoke(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  const reason = String(form.get('reason') || '').trim() || 'revoked by admin';
  if (isUuid(id)) {
    await db()`update subscriptions set status = 'revoked', revoked_at = now(), revoke_reason = ${reason} where id = ${id}`;
    await logEvent('revoked', { reason }, { subscriptionId: id, actor });
  }
  back(String(form.get('q') || ''), 'Revoked. Motiv turns Premium off at its next check-in.');
}

export async function reinstate(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (isUuid(id)) {
    await db()`update subscriptions set status = 'active', revoked_at = null, revoke_reason = null where id = ${id}`;
    await logEvent('reinstated', {}, { subscriptionId: id, actor });
  }
  back(String(form.get('q') || ''), 'Reinstated.');
}

export async function setSeats(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  const seats = Math.max(1, Math.min(50, Number(form.get('seats')) || motiv.defaultSeats));
  if (isUuid(id)) {
    await db()`update subscriptions set seats = ${seats} where id = ${id}`;
    await logEvent('seats_changed', { seats }, { subscriptionId: id, actor });
  }
  back(String(form.get('q') || ''), `Seats set to ${seats}.`);
}

export async function adminRemoveDevice(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (isUuid(id)) {
    const [s] = await db()<SubscriptionRow[]>`select * from subscriptions where id = ${id}`;
    if (s) await deactivateDevice(s, String(form.get('device') || ''), actor);
  }
  back(String(form.get('q') || ''), 'Computer removed.');
}

export async function grant(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const plan = String(form.get('plan')) as Plan;
  const months = Number(form.get('months') || 12);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !PLANS.includes(plan)) back(email, 'Enter an email and plan.');
  const accountId = await accountForEmail(email);
  const subscriptionId = newSubscriptionId();
  const end = plan === 'lifetime' ? null : new Date(Date.now() + months * 30 * 24 * 3600 * 1000);
  const [row] = await db()<{ id: string }[]>`
    insert into subscriptions (subscription_id, account_id, customer_email, plan, status, period_end, seats, complimentary)
    values (${subscriptionId}, ${accountId}, ${email}, ${plan}, 'active', ${end}, ${motiv.defaultSeats}, true)
    returning id`;
  await logEvent('granted', { plan, months: plan === 'lifetime' ? null : months }, { subscriptionId: row.id, accountId, actor });
  if (form.get('notify') === 'on') {
    await sendEmail(
      email,
      'Your Motiv Premium subscription',
      `You've been given Motiv Premium.\n\nSubscription ID: ${subscriptionId}\n\nIn Motiv, open Settings > Premium and choose "Register this computer", then sign in at ${SITE_URL}/activate with this email. Or paste the subscription ID.\n\nManage it at ${SITE_URL}/motiv/account\n\nEmruz`,
    ).catch((e) => console.error('grant email failed', e));
  }
  back(email, `Granted ${plan} subscription ${subscriptionId}.`);
}
