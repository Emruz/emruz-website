import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IS_PROD } from '@/lib/server/config';
import { PROVIDERS, providerConfigured, startAuth, type Provider } from '@/lib/server/oauth';
import { currentAccount, safeNext } from '@/lib/server/session';

// Starts sign-in with Microsoft, Google or Apple. ?next=/path, ?link=1 to add
// this provider to the signed-in account.
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get('next'));
  if (!PROVIDERS.includes(provider as Provider) || !providerConfigured(provider as Provider)) {
    return NextResponse.redirect(new URL(`/signin?error=unavailable&next=${encodeURIComponent(next)}`, req.url));
  }
  const p = provider as Provider;
  const link = url.searchParams.get('link') === '1' && !!(await currentAccount());
  const start = startAuth(p);
  (await cookies()).set('emruz_oauth', JSON.stringify({ p, state: start.state, cv: start.codeVerifier, nonce: start.nonce, next, link }), {
    httpOnly: true,
    secure: IS_PROD,
    // Apple returns with a cross-site POST, which only carries SameSite=None cookies
    sameSite: p === 'apple' && IS_PROD ? 'none' : 'lax',
    path: '/auth/callback',
    maxAge: 600,
  });
  return NextResponse.redirect(start.url);
}
