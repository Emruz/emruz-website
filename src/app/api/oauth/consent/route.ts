import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { rules } from '@/lib/server/kits/limits';
import { approve, checkAuthorize, deny } from '@/lib/server/kits/oauth-core';
import { ip, limited, serverConfig } from '@/lib/server/kits/server';
import { oauthStore } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';

const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });

/**
 * The consent page posts here (same origin, signed in). The answer is the URL to
 * send the browser to; the page navigates there itself, because the site's CSP
 * form-action would block a form post that redirects to the app.
 */
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return reply({ error: 'Cross-site request refused.' }, 403);
    const wait = await limited(rules.authorize(ip(req)));
    if (wait) return reply({ error: 'Too many requests. Try again later.' }, 429);
    const a = await currentAccount();
    if (!a) return reply({ error: 'Sign in again.' }, 401);
    if (a.impersonatedBy) return reply({ error: 'Switch back to your own account to connect an app.' }, 403);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return reply({ error: 'Bad request.' }, 400);
    }
    const params: Record<string, string | undefined> = {};
    for (const k of ['client_id', 'redirect_uri', 'response_type', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource']) {
      if (typeof body[k] === 'string') params[k] = body[k] as string;
    }
    const check = await checkAuthorize(oauthStore, serverConfig, params);
    if (check.kind === 'fatal') return reply({ error: check.message }, 400);
    if (check.kind === 'redirect') return reply({ redirect: check.url });
    if (body.decision === 'approve') return reply({ redirect: await approve(oauthStore, serverConfig, a.id, check.req, Date.now(), ip(req)) });
    return reply({ redirect: deny(serverConfig, check.req) });
  } catch (e) {
    console.error('oauth consent failed', e);
    return reply({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
