import 'server-only';
import { cookies, headers } from 'next/headers';
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  REQUEST_KIND_LABELS,
  UNCONFIRMED_DAYS,
  consentState,
  dueDate,
  serializeConsent,
  type ConsentState,
  type RequestInput,
  type RequestKind,
  type RequestStatus,
} from '@/lib/privacy/core';
import { eraseSubject, subjectForAccount, subjectForEmail, type EraseResult } from '@/lib/privacy/data';
export { eraseSubject };
import { deleteAvatar } from './avatars';
import { IS_PROD, SITE_URL, adminEmails } from './config';
import { db, logEvent, rateLimit } from './db';
import { sendEmail } from './email';
import { randomToken, sha256 } from './lease';
import { siteSettings } from './settings';

/** The visitor's cookie choice and Global Privacy Control signal for this request. */
export async function currentConsent(): Promise<ConsentState> {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return consentState(jar.get(CONSENT_COOKIE)?.value, h.get('sec-gpc'));
}

/**
 * Server-side check for anything beyond necessary cookies: analytics, and linking
 * chat logs to a visitor. False until the visitor opts in, and always false with GPC.
 */
export async function hasImprovementConsent(): Promise<boolean> {
  return (await currentConsent()).improve;
}

/** Store the choice in a necessary, first-party cookie. Call from a Server Action. */
export async function saveConsent(improve: boolean) {
  (await cookies()).set(CONSENT_COOKIE, serializeConsent({ improve }), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: CONSENT_MAX_AGE,
  });
}

export { exportSubject, subjectForAccount, subjectForEmail } from '@/lib/privacy/data';

// ---------- Privacy requests (public form and admin queue) ----------

const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' });

/**
 * Store an unconfirmed request and email the requester a link to confirm it.
 * From the account page (accountId set) the request is tied to that account.
 * Nothing is changed until an admin approves the request in /admin/privacy.
 */
export async function fileRequest(r: RequestInput, ip: string, accountId: string | null = null): Promise<'sent' | 'limit'> {
  if (!(await rateLimit(`privacy-req:${ip}`, 5, 3600)) || !(await rateLimit(`privacy-req:${r.email}`, 3, 86_400))) return 'limit';
  const token = randomToken(32);
  await db()`insert into privacy_requests (kind, source, email, name, details, california, confirm_token_hash, account_id, ip)
    values (${r.kind}, ${accountId ? 'account' : 'form'}, ${r.email}, ${r.name}, ${r.details}, ${r.california},
      ${sha256(token)}, ${accountId}, ${ip})`;
  await sendEmail(
    r.email,
    'Confirm your privacy request to Emruz',
    `We received a request to: ${REQUEST_KIND_LABELS[r.kind].toLowerCase()}.\n\n` +
      `Open this link within ${UNCONFIRMED_DAYS} days to confirm it's you:\n${SITE_URL}/privacy/request/confirm?token=${token}\n\n` +
      `If you didn't ask for this, ignore this email and nothing will happen.`,
  );
  return 'sent';
}

export interface ConfirmedRequest {
  kind: RequestKind;
  email: string;
  due: Date;
}

/** Confirm by the emailed link: the clock starts now. */
export async function confirmRequest(token: string): Promise<ConfirmedRequest | null> {
  const sql = db();
  const [row] = await sql<{ id: string; kind: RequestKind; email: string; california: boolean; account_id: string | null }[]>`
    update privacy_requests set status = 'open', confirmed_at = now(), confirm_token_hash = null
    where confirm_token_hash = ${sha256(token)} and status = 'unconfirmed'
      and created_at > now() - make_interval(days => ${UNCONFIRMED_DAYS})
    returning id, kind, email, california, account_id`;
  if (!row) return null;
  const due = dueDate(new Date(), row.california);
  const accountId = row.account_id ?? (await subjectForEmail(sql, row.email)).accountId;
  await sql`update privacy_requests set due_at = ${due}, account_id = ${accountId} where id = ${row.id}`;
  await logEvent('privacy_request_confirmed', { kind: row.kind }, { accountId });
  const label = REQUEST_KIND_LABELS[row.kind].toLowerCase();
  await sendEmail(
    row.email,
    'We received your privacy request',
    `Thanks. Your request to ${label} is confirmed. We'll review it and respond by ${fmtDate(due)}.`,
  ).catch((e) => console.error('privacy request receipt failed', e));
  const settings = await siteSettings();
  const to = settings.alertEmails.length ? settings.alertEmails : adminEmails();
  for (const admin of to) {
    await sendEmail(admin, `Privacy request: ${row.kind}`, `A new ${row.kind} request is due ${fmtDate(due)}.\n${SITE_URL}/admin/privacy`).catch(
      (e) => console.error('privacy request alert failed', e),
    );
  }
  return { kind: row.kind, email: row.email, due };
}

export interface RequestRow {
  id: string;
  kind: RequestKind;
  source: 'form' | 'account';
  email: string;
  name: string | null;
  details: string | null;
  california: boolean;
  status: RequestStatus;
  confirmed_at: Date | null;
  due_at: Date | null;
  account_id: string | null;
  resolution: string | null;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Date;
}

export async function listRequests(closed: boolean): Promise<RequestRow[]> {
  return closed
    ? db()<RequestRow[]>`select * from privacy_requests where status in ('completed', 'rejected') order by completed_at desc nulls last limit 200`
    : db()<RequestRow[]>`select * from privacy_requests where status in ('open', 'in_progress') order by due_at asc nulls last`;
}

export async function getRequest(id: string): Promise<RequestRow | null> {
  const [r] = await db()<RequestRow[]>`select * from privacy_requests where id = ${id}`;
  return r ?? null;
}

export async function startRequest(id: string, by: string) {
  await db()`update privacy_requests set status = 'in_progress' where id = ${id} and status = 'open'`;
  await logEvent('privacy_request_started', { id }, { actor: by });
}

/** Close a request and email the requester. Returns false when it was already closed. */
export async function closeRequest(id: string, outcome: 'completed' | 'rejected', resolution: string, by: string): Promise<boolean> {
  const [r] = await db()<{ kind: RequestKind; email: string; source: string }[]>`
    update privacy_requests set status = ${outcome}, resolution = ${resolution}, completed_at = now(), completed_by = ${by}
    where id = ${id} and status in ('open', 'in_progress') returning kind, email, source`;
  if (!r) return false;
  await logEvent('privacy_request_closed', { id, outcome }, { actor: by });
  const label = REQUEST_KIND_LABELS[r.kind].toLowerCase();
  const head = outcome === 'completed' ? `We've completed your request to ${label}.` : `We could not complete your request to ${label}.`;
  await sendEmail(r.email, 'Your privacy request', `${head}\n\n${resolution}\n\nReply to this email with any questions.`).catch((e) =>
    console.error('privacy request notice failed', e),
  );
  return true;
}

/** Delete request: erase everything for the requester's email and linked account. */
export async function eraseForRequest(id: string, by: string): Promise<EraseResult | null> {
  const r = await getRequest(id);
  if (!r || r.kind !== 'delete' || !['open', 'in_progress'].includes(r.status)) return null;
  const sql = db();
  const subject = r.account_id ? await subjectForAccount(sql, r.account_id) : await subjectForEmail(sql, r.email);
  subject.emails = [...new Set([r.email.toLowerCase(), ...subject.emails])];
  if (subject.accountId) await deleteAvatar(subject.accountId).catch((e) => console.error('avatar delete failed', e));
  const result = await eraseSubject(sql, subject);
  await logEvent('privacy_erased', { id, removed: result.removed, kept_shell: result.keptShell }, { actor: by });
  return result;
}

/** Opt-out request: stop newsletter email for the requester. */
export async function optOutForRequest(id: string, by: string): Promise<number> {
  const r = await getRequest(id);
  if (!r || r.kind !== 'opt_out') return 0;
  const subject = await subjectForEmail(db(), r.email);
  const rows = await db()`update newsletter_subscribers set unsubscribed_at = coalesce(unsubscribed_at, now())
    where lower(email) = any(${subject.emails}) returning id`;
  await logEvent('privacy_opt_out', { id, rows: rows.length }, { actor: by });
  return rows.length;
}
