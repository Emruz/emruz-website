'use server';

import { notFound, redirect } from 'next/navigation';
import { accountForEmail } from '@/lib/server/accounts';
import { isUuid } from '@/lib/server/api';
import { motiv, PLANS, SITE_URL, type Plan } from '@/lib/server/config';
import { db, logEvent } from '@/lib/server/db';
import { sendEmail } from '@/lib/server/email';
import { newSubscriptionId } from '@/lib/server/lease';
import { deactivateDevice, type SubscriptionRow } from '@/lib/server/licensing';
import { canArchive, canDelete, isRevokeCategory, revocationProblem } from '@/lib/server/revocation';
import { revokeLicence, type RevocableRow } from '@/lib/server/stripe';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';

/** An admin action needs a live admin session and a recent sign-in. Otherwise the admin signs in again. */
async function admin() {
  const a = await currentAccount();
  if (!a) redirect('/signin?reauth=1&next=%2Fadmin%2Fmotiv');
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a, '/admin/motiv');
  return `admin:${a.email}`;
}

/** Only admin pages are valid return targets. */
function returnPath(form: FormData, fallback: string): string {
  const v = String(form.get('return') || '');
  return v.startsWith('/admin/motiv') && !v.startsWith('//') ? v : fallback;
}

/** Redirect to a page with a one-line message. */
function back(path: string, msg: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}msg=${encodeURIComponent(msg)}`);
}

/** Redirect with an error message. The page shows it in red. */
function fail(path: string, msg: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}err=1&msg=${encodeURIComponent(msg)}`);
}

const licencePath = (id: string) => `/admin/motiv/licences/${id}`;
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function revoke(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  const to = returnPath(form, isUuid(id) ? licencePath(id) : '/admin/motiv');
  const category = String(form.get('category') || '');
  const note = String(form.get('note') || '').trim().slice(0, 500);
  if (!isUuid(id) || !isRevokeCategory(category)) fail(to, 'Choose a reason to revoke.');
  if (category === 'eula_misuse' && !note) fail(to, 'Write the evidence of the misuse in the note.');

  const [row] = await db()<(RevocableRow & { status: string })[]>`
    select id, customer_email, plan, stripe_subscription_id, status from subscriptions where id = ${id}`;
  if (!row) fail('/admin/motiv', 'Licence not found.');
  if (row.status === 'revoked') fail(to, 'Already revoked.');

  const [support] = await db()<{ support_ends_at: Date | null }[]>`select support_ends_at from motiv_support where id = 1`;
  const problem = revocationProblem(row.plan, category, support?.support_ends_at ?? null);
  if (problem) fail(to, problem);

  try {
    await revokeLicence(row, category, note, actor);
  } catch (e) {
    // Not swallowed: the licence is unchanged and the admin sees why
    fail(to, `Not revoked. Stripe refused the cancellation: ${errorText(e)}`);
  }
  back(to, 'Revoked. Billing is cancelled and Premium turns off at the next check-in.');
}

export async function reinstate(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  const [row] = await db()<{ stripe_subscription_id: string | null; revoke_category: string | null }[]>`
    select stripe_subscription_id, revoke_category from subscriptions where id = ${id}`;
  if (!row) fail('/admin/motiv', 'Licence not found.');
  // Billing was cancelled with this subscription, and a refund or chargeback has returned the money,
  // so reinstating either would give Premium for free. Use a complimentary grant instead.
  if (row.stripe_subscription_id) {
    fail(to, 'Billing was cancelled for this subscription, so it cannot be reinstated. Grant a complimentary subscription instead.');
  }
  if (row.revoke_category === 'refund' || row.revoke_category === 'chargeback') {
    fail(to, 'This licence ended with a refund or chargeback, so it cannot be reinstated. Grant a complimentary subscription instead.');
  }
  await db()`update subscriptions set status = 'active', revoked_at = null, revoke_reason = null, revoke_category = null where id = ${id}`;
  await logEvent('reinstated', {}, { subscriptionId: id, actor });
  back(to, 'Reinstated.');
}

/** Store the Motiv support end date and the date buyers were told, in the database. */
export async function setSupport(form: FormData) {
  const actor = await admin();
  const to = '/admin/motiv/support';
  const parseDay = (v: string) => {
    if (!v) return { ok: true as const, date: null };
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? { ok: false as const } : { ok: true as const, date: d };
  };
  const end = parseDay(String(form.get('support_ends_at') || '').trim());
  const notice = parseDay(String(form.get('notice_given_at') || '').trim());
  if (!end.ok || !notice.ok) fail(to, 'Enter valid dates.');
  await db()`
    insert into motiv_support (id, notice_given_at, support_ends_at, updated_at, updated_by)
    values (1, ${notice.date}, ${end.date}, now(), ${actor})
    on conflict (id) do update set notice_given_at = excluded.notice_given_at, support_ends_at = excluded.support_ends_at,
      updated_at = now(), updated_by = excluded.updated_by`;
  await logEvent(
    'support_dates_set',
    { support_ends_at: end.date?.toISOString() ?? null, notice_given_at: notice.date?.toISOString() ?? null },
    { actor },
  );
  back(to, 'Support dates saved. Support ends from 00:00 UTC on the end date.');
}

export async function setSeats(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  const seats = Math.max(1, Math.min(50, Number(form.get('seats')) || motiv.defaultSeats));
  await db()`update subscriptions set seats = ${seats} where id = ${id}`;
  await logEvent('seats_changed', { seats }, { subscriptionId: id, actor });
  back(to, `Seats set to ${seats}.`);
}

export async function adminRemoveDevice(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  const [s] = await db()<SubscriptionRow[]>`select * from subscriptions where id = ${id}`;
  if (s) await deactivateDevice(s, String(form.get('device') || ''), actor);
  back(to, 'Computer removed.');
}

/** Hide a finished licence from the lists. Paid licences are kept for records. */
export async function archiveLicence(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  const [row] = await db()<{ status: string; period_ended: boolean; customer_email: string }[]>`
    select status, customer_email, (period_end is not null and period_end <= now()) as period_ended
    from subscriptions where id = ${id}`;
  if (!row) fail('/admin/motiv', 'Licence not found.');
  if (!canArchive(row.status, row.period_ended)) {
    fail(to, 'Only a revoked licence, or a cancelled one whose period has ended, can be archived.');
  }
  await db()`update subscriptions set archived_at = now() where id = ${id}`;
  await logEvent('archived', {}, { subscriptionId: id, actor });
  back(to, 'Archived. It is hidden from the lists and kept for records.');
}

export async function restoreLicence(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  await db()`update subscriptions set archived_at = null where id = ${id}`;
  await logEvent('restored', {}, { subscriptionId: id, actor });
  back(to, 'Restored.');
}

/** Delete a complimentary licence after it is revoked or cancelled. Paid licences cannot be deleted. */
export async function deleteLicence(form: FormData) {
  const actor = await admin();
  const id = form.get('id');
  if (!isUuid(id)) fail('/admin/motiv', 'Licence not found.');
  const to = returnPath(form, licencePath(id));
  if (String(form.get('confirm') || '').trim() !== 'delete') fail(to, 'Type delete to confirm.');
  const [row] = await db()<{ status: string; complimentary: boolean; period_ended: boolean; customer_email: string; plan: string }[]>`
    select status, complimentary, customer_email, plan, (period_end is not null and period_end <= now()) as period_ended
    from subscriptions where id = ${id}`;
  if (!row) fail('/admin/motiv', 'Licence not found.');
  if (!canDelete(row.complimentary, row.status, row.period_ended)) {
    fail(to, 'Only a complimentary licence that is revoked or cancelled can be deleted. Archive paid licences instead.');
  }
  // The record of the deletion stays in the history; the licence's link to it is cleared by the database
  await logEvent('deleted', { customer_email: row.customer_email, plan: row.plan }, { subscriptionId: id, actor });
  await db()`delete from subscriptions where id = ${id}`;
  const [left] = await db()<{ n: number }[]>`select count(*)::int as n from subscriptions where lower(customer_email) = ${row.customer_email.toLowerCase()}`;
  back(left.n > 0 ? `/admin/motiv/customers/${encodeURIComponent(row.customer_email)}` : '/admin/motiv', 'Deleted.');
}

export async function grant(form: FormData) {
  const actor = await admin();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const plan = String(form.get('plan')) as Plan;
  const months = Number(form.get('months') || 12);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !PLANS.includes(plan)) {
    fail(`/admin/motiv/grant?email=${encodeURIComponent(email)}`, 'Enter an email and plan.');
  }
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
  back(`/admin/motiv/customers/${encodeURIComponent(email)}`, `Granted ${plan} subscription ${subscriptionId}.`);
}
