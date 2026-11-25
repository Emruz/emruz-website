import { rules } from '@/lib/server/kits/limits';
import { token } from '@/lib/server/kits/oauth-core';
import { ip, jsonResponse, limited, preflight, readParams, serverConfig, signingKeys, tooMany } from '@/lib/server/kits/server';
import { oauthStore } from '@/lib/server/kits/store';

// Token endpoint: authorization_code with PKCE, and refresh_token with rotation (#67)
export async function POST(req: Request) {
  try {
    const p = await readParams(req);
    if (!p) return jsonResponse({ error: 'invalid_request', error_description: 'Unreadable or repeated parameters.' }, 400);
    const wait = await limited(rules.token(ip(req), p.client_id || 'none'));
    if (wait) return tooMany(wait);
    const r = await token(oauthStore, signingKeys(), serverConfig, p, Date.now(), ip(req));
    return jsonResponse(r.body, r.status);
  } catch (e) {
    console.error('oauth token failed', e);
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export const OPTIONS = preflight;
