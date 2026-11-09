import { NextResponse } from 'next/server';
import { sameOrigin, clientIp } from '@/lib/server/api';
import { db, rateLimit } from '@/lib/server/db';
import { SITE_URL } from '@/lib/server/config';
import { sendEmail } from '@/lib/server/email';
import { randomToken, sha256 } from '@/lib/server/lease';
import { currentAccount, safeNext } from '@/lib/server/session';

// Sends a sign-in link (purpose=signin) or a link that proves a purchase email
// belongs to the signed-in user (purpose=claim).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const form = await req.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const purpose = form.get('purpose') === 'claim' ? 'claim' : 'signin';
  const next = safeNext(form.get('next'));
  const to = (path: string) => NextResponse.redirect(new URL(path, SITE_URL), 303);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return to(`${purpose === 'claim' ? '/motiv/account?claim=invalid' : `/signin?error=email&next=${encodeURIComponent(next)}`}`);
  }
  const account = purpose === 'claim' ? await currentAccount() : null;
  if (purpose === 'claim' && !account) return to('/signin?next=/motiv/account');

  const allowed = (await rateLimit(`email:${email}`, 5, 3600)) && (await rateLimit(`email-ip:${clientIp(req)}`, 20, 3600));
  if (allowed) {
    const token = randomToken(32);
    await db()`
      insert into email_tokens (token_hash, email, purpose, account_id, return_to, expires_at)
      values (${sha256(token)}, ${email}, ${purpose}, ${account?.id ?? null}, ${next}, now() + interval '20 minutes')`;
    const link = `${SITE_URL}/auth/verify?token=${token}`;
    const text =
      purpose === 'claim'
        ? `Someone signed in to emruz.com asked to add this email address to their account, so purchases made with it show up there.\n\nIf that was you, open this link within 20 minutes:\n${link}\n\nIf it wasn't, ignore this email.`
        : `Open this link within 20 minutes to sign in to emruz.com:\n${link}\n\nIf you didn't ask to sign in, ignore this email.`;
    try {
      await sendEmail(email, purpose === 'claim' ? 'Confirm your email for Emruz' : 'Your Emruz sign-in link', text);
    } catch (e) {
      console.error('sign-in email failed', e);
      return to(purpose === 'claim' ? '/motiv/account?claim=failed' : `/signin?error=send&next=${encodeURIComponent(next)}`);
    }
  }
  // Same response whether or not the address is known or rate limited
  return to(purpose === 'claim' ? '/motiv/account?claim=sent' : `/signin/check-email?email=${encodeURIComponent(email)}`);
}
