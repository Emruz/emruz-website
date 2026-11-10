import 'server-only';
import { randomBytes } from 'node:crypto';
import { SITE_URL } from './config';
import { db } from './db';
import { sendEmail } from './email';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Start (or restart) a double opt-in sign-up and send the confirmation email. */
export async function subscribe(email: string) {
  const token = randomBytes(24).toString('base64url');
  const [row] = await db()<{ token: string; confirmed_at: Date | null; unsubscribed_at: Date | null }[]>`
    insert into newsletter_subscribers (email, token) values (${email}, ${token})
    on conflict (email) do update set email = excluded.email
    returning token, confirmed_at, unsubscribed_at`;
  if (row.confirmed_at && !row.unsubscribed_at) return; // already subscribed, nothing to do
  await sendEmail(
    email,
    'Confirm your Emruz Insights subscription',
    `Please confirm that you want Emruz Insights by email:

${SITE_URL}/newsletter/confirm?token=${row.token}

If you did not ask for this, ignore this email and you will not hear from us.

Emruz`,
  );
}

export async function confirm(token: string) {
  const rows = await db()`
    update newsletter_subscribers set confirmed_at = now(), unsubscribed_at = null
    where token = ${token} returning id`;
  return rows.length > 0;
}

export async function unsubscribe(token: string) {
  const rows = await db()`
    update newsletter_subscribers set unsubscribed_at = coalesce(unsubscribed_at, now())
    where token = ${token} returning id`;
  return rows.length > 0;
}

export interface SubscriberRow {
  email: string;
  token: string;
  confirmed_at: Date | null;
  unsubscribed_at: Date | null;
  created_at: Date;
}

export async function subscribers() {
  return db()<SubscriberRow[]>`select email, token, confirmed_at, unsubscribed_at, created_at
    from newsletter_subscribers order by created_at desc`;
}
