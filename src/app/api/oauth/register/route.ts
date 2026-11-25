import { rules } from '@/lib/server/kits/limits';
import { registerClient } from '@/lib/server/kits/oauth-core';
import { ip, jsonResponse, limited, preflight, tooMany } from '@/lib/server/kits/server';
import { oauthStore } from '@/lib/server/kits/store';

// Dynamic client registration (RFC 7591) for MCP clients (#67)
export async function POST(req: Request) {
  try {
    const wait = await limited(rules.register(ip(req)));
    if (wait) return tooMany(wait);
    const raw = await req.text();
    if (raw.length > 8192) return jsonResponse({ error: 'invalid_client_metadata', error_description: 'Request too large.' }, 400);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: 'invalid_client_metadata', error_description: 'Expected JSON.' }, 400);
    }
    const r = await registerClient(oauthStore, body, ip(req));
    return jsonResponse(r.body, r.status);
  } catch (e) {
    console.error('oauth register failed', e);
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export const OPTIONS = preflight;
