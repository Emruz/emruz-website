import { rules } from '@/lib/server/kits/limits';
import { revoke } from '@/lib/server/kits/oauth-core';
import { ip, jsonResponse, limited, preflight, readParams, serverConfig, signingKeys, tooMany } from '@/lib/server/kits/server';
import { oauthStore } from '@/lib/server/kits/store';

// Token revocation (RFC 7009) (#67). Revoking either token ends the whole grant.
export async function POST(req: Request) {
  try {
    const p = await readParams(req);
    if (!p) return jsonResponse({ error: 'invalid_request' }, 400);
    const wait = await limited(rules.token(ip(req), p.client_id || 'none'));
    if (wait) return tooMany(wait);
    const r = await revoke(oauthStore, signingKeys(), serverConfig, p, Date.now(), ip(req));
    return jsonResponse(r.body, r.status);
  } catch (e) {
    console.error('oauth revoke failed', e);
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export const OPTIONS = preflight;
