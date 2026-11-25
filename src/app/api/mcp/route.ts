import { currentBundle, packTitle, readFile, readSkill } from '@/lib/server/kits/content';
import { decide } from '@/lib/server/kits/content-core';
import { rules } from '@/lib/server/kits/limits';
import { grantActive, verifyAccessToken } from '@/lib/server/kits/oauth-core';
import { handleMessage, type McpDeps } from '@/lib/server/kits/protocol';
import { CORS, ip, jsonResponse, limited, serverConfig, signingKeys, tooMany } from '@/lib/server/kits/server';
import { entitlementsFor, oauthStore, touchGrant } from '@/lib/server/kits/store';
import { SITE_URL } from '@/lib/server/config';

/**
 * Emruz kits MCP server (#67): Streamable HTTP, stateless, read-only.
 * Order per request: token signature (no database), then for no or a bad token
 * only the per-IP limit; for a valid token the global cap and the per-account and
 * per-client limits, then the grant and entitlement checks, then content.
 */

const PRM = `${SITE_URL}/.well-known/oauth-protected-resource/api/mcp`;

function unauthorized(error?: 'invalid_token'): Response {
  const challenge = `Bearer resource_metadata="${PRM}", scope="kits:read"${error ? `, error="${error}"` : ''}`;
  return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Sign in to Emruz to use this server.' } }, 401, { 'www-authenticate': challenge });
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const bearer = /^Bearer\s+(\S+)$/i.exec(auth)?.[1];
    const claims = bearer ? await verifyAccessToken(signingKeys(), serverConfig, bearer, Date.now()) : null;
    if (!claims) {
      const wait = await limited(rules.mcpAnon(ip(req)));
      if (wait) return tooMany(wait);
      return unauthorized(bearer ? 'invalid_token' : undefined);
    }
    // Only signed requests count toward the global cap, so anonymous traffic cannot lock out paying users
    const total = await limited(rules.mcpTotal());
    if (total) return tooMany(total);
    const wait = await limited(rules.mcpSignedIn(claims.sub, claims.client_id));
    if (wait) return tooMany(wait);
    if (!(await grantActive(oauthStore, claims))) return unauthorized('invalid_token');

    const raw = await req.text();
    if (raw.length > 65_536) return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }, 413);
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
    }
    if (Array.isArray(msg)) return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batches are not supported' } }, 400);

    void touchGrant(claims.gid).catch(() => {});
    // Read fresh on every request, so a revoked kit stops working at once
    const entitlements = await entitlementsFor(claims.sub);
    const audit = (kind: string, detail: Record<string, unknown>) =>
      oauthStore.audit(kind, { accountId: claims.sub, clientId: claims.client_id, grantId: claims.gid, ip: ip(req), detail });

    const deps: McpDeps = {
      serverVersion: '1.0.0',
      storeUrl: `${SITE_URL}/kits`,
      catalog: async () => {
        const b = await currentBundle();
        return { latest: b.ref, items: b.manifest.items };
      },
      decide: (item, latest) => decide(item, entitlements, latest),
      readSkill,
      readFile,
      packTitle,
      audit,
    };
    const res = await handleMessage(msg, deps);
    if (!res) return new Response(null, { status: 202, headers: CORS });
    return jsonResponse(res);
  } catch (e) {
    console.error('mcp request failed', e);
    return jsonResponse({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Internal error' } }, 500);
  }
}

/** No server-to-client stream and no sessions. */
const notAllowed = () => new Response(null, { status: 405, headers: { allow: 'POST, OPTIONS', ...CORS } });
export const GET = notAllowed;
export const DELETE = notAllowed;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
