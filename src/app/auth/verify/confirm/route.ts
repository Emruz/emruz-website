import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { claimEmail, signInWithIdentity } from '@/lib/server/accounts';
import { db } from '@/lib/server/db';
import { sha256 } from '@/lib/server/lease';
import { createSession, currentAccount, safeNext } from '@/lib/server/session';

// The link in the email opens /auth/verify, which posts here. Using a POST keeps
// email scanners that prefetch links from using up the token.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const token = String((await req.formData()).get('token') || '');
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  const [t] = await db()<{ email: string; purpose: string; account_id: string | null; return_to: string | null }[]>`
    update email_tokens set used_at = now()
    where token_hash = ${sha256(token)} and used_at is null and expires_at > now()
    returning email, purpose, account_id, return_to`;
  if (!t) return to('/signin?error=link');

  if (t.purpose === 'claim') {
    const current = await currentAccount();
    if (!current || current.id !== t.account_id) return to('/signin?error=claim&next=/motiv/account');
    await claimEmail(current.id, t.email);
    return to('/motiv/account?claim=done');
  }

  const result = await signInWithIdentity({ provider: 'email', subject: t.email, email: t.email, emailVerified: true });
  if (!result.ok) return to(`/signin?error=${encodeURIComponent(result.error)}`);
  await createSession(result.accountId);
  return to(safeNext(t.return_to));
}
