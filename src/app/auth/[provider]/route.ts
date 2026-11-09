import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IS_PROD, SITE_URL } from '@/lib/server/config';
import { PROVIDERS, providerConfigured, startAuth, type Provider } from '@/lib/server/oauth';
import { currentAccount, safeNext } from '@/lib/server/session';

// Starts sign-in with Microsoft, Google or Apple. ?next=/path, ?link=1 to add
// this provider to the signed-in account.
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get('next'));
  if (!PROVIDERS.includes(provider as Provider) || !providerConfigured(provider as Provider)) {
    return NextResponse.redirect(new URL(`/signin?error=unavailable&next=${encodeURIComponent(next)}`, SITE_URL));
  }
  const p = provider as Provider;
  const link = url.searchParams.get('link') === '1' && !!(await currentAccount());
  const start = startAuth(p);
  // One cookie per attempt, keyed by state, so a double click or a second tab
  // can't overwrite an attempt that is still in progress.
  (await cookies()).set(`emruz_oauth_${start.state}`, JSON.stringify({ p, state: start.state, cv: start.codeVerifier, nonce: start.nonce, next, link }), {
    httpOnly: true,
    secure: IS_PROD,
    // Providers can return through a cross-site POST or a redirect chain that
    // starts with one (Apple always; Microsoft for some personal accounts).
    // Browsers only send SameSite=None cookies there. The state value in the
    // cookie name still ties the response to this browser.
    sameSite: IS_PROD ? 'none' : 'lax',
    path: '/auth/callback',
    maxAge: 600,
  });
  return NextResponse.redirect(start.url);
}
