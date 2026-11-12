import { SITE_URL } from '@/lib/server/config';
import { NextResponse } from 'next/server';
import { clientIp, sameOrigin } from '@/lib/server/api';
import { securityEvent } from '@/lib/server/alerts';
import { changeEmail, claimEmail, signInWithIdentity } from '@/lib/server/accounts';
import { sendEmail } from '@/lib/server/email';
import { db } from '@/lib/server/db';
import { sha256 } from '@/lib/server/lease';
import { createSession, currentAccount, safeNext } from '@/lib/server/session';

// The link in the email opens /auth/verify, which posts here. Using a POST keeps
// email scanners that prefetch links from using up the token.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const token = String((await req.formData()).get('token') || '');
  const to = (path: string) => NextResponse.redirect(new URL(path, SITE_URL), 303);
  const [t] = await db()<{ email: string; purpose: string; account_id: string | null; return_to: string | null }[]>`
    update email_tokens set used_at = now()
    where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
    returning email, purpose, account_id, return_to`;
  if (!t) {
    await securityEvent('signin_failure', { provider: 'email', reason: 'invalid or used link', ip: clientIp(req) });
    return to('/signin?error=link');
  }

  if (t.purpose === 'claim') {
    const current = await currentAccount();
    if (!current || current.id !== t.account_id) return to('/signin?error=claim&next=/motiv/account');
    await claimEmail(current.id, t.email);
    return to('/motiv/account?claim=done');
  }

  if (t.purpose === 'change_email') {
    const current = await currentAccount();
    if (!current || current.id !== t.account_id) return to('/signin?error=claim&next=/account');
    const old = current.email;
    const r = await changeEmail(current.id, t.email);
    if (r === 'done' && old.toLowerCase() !== t.email) {
      await sendEmail(
        old,
        'Your Emruz email address was changed',
        `The email address on your Emruz account was changed to ${t.email}.\n\nIf you did not make this change, reply to this email right away.`,
      ).catch((e) => console.error('email change notice failed', e));
    }
    return to(`/account?email=${r}`);
  }

  const result = await signInWithIdentity({ provider: 'email', subject: t.email, email: t.email, emailVerified: true });
  if (!result.ok) return to(`/signin?error=${encodeURIComponent(result.error)}`);
  await createSession(result.accountId);
  return to(safeNext(t.return_to));
}
