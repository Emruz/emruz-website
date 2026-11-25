import 'server-only';
import { SITE_URL } from '../config';
import { rateLimitCheck } from '../db';
import { ipFromHeaders } from '../api';
import { keysFromPem, type Keys, type ServerConfig } from './oauth-core';
import { overLimit, type Rule } from './limits';

/** Shared setup for the OAuth and MCP route handlers (#67). */

export const serverConfig: ServerConfig = { issuer: SITE_URL, resource: `${SITE_URL}/api/mcp` };

let keys: Keys | null = null;
export function signingKeys(): Keys {
  if (!keys) {
    const raw = process.env.MCP_TOKEN_PRIVATE_KEY;
    if (!raw) throw new Error('MCP_TOKEN_PRIVATE_KEY is not set');
    keys = keysFromPem(raw, (process.env.MCP_TOKEN_KID || 'm1').trim());
  }
  return keys;
}

export const ip = (req: Request) => ipFromHeaders(req.headers);

/** Bearer-token and public endpoints: no cookies are used, so any origin may call them. */
export const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id',
  'access-control-expose-headers': 'www-authenticate, retry-after, mcp-session-id',
  'access-control-max-age': '86400',
};

export function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', pragma: 'no-cache', ...CORS, ...extra },
  });
}

export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function tooMany(retryAfter: number, extra: Record<string, string> = {}): Response {
  return jsonResponse({ error: 'rate_limited', error_description: 'Too many requests. Try again later.' }, 429, { 'retry-after': String(retryAfter), ...extra });
}

/** Seconds to wait if any rule is over its limit, else 0. */
export const limited = (list: Rule[]) => overLimit(rateLimitCheck, list);

/** Token and revocation requests are form-encoded (RFC 6749); JSON is accepted too. */
export async function readParams(req: Request): Promise<Record<string, string | undefined> | null> {
  const type = req.headers.get('content-type') || '';
  const raw = await req.text();
  if (raw.length > 16_384) return null;
  const out: Record<string, string | undefined> = {};
  if (type.includes('application/json')) {
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(j)) if (typeof v === 'string') out[k] = v;
      return out;
    } catch {
      return null;
    }
  }
  for (const [k, v] of new URLSearchParams(raw)) {
    if (k in out) return null; // a parameter may appear only once (RFC 6749 3.1)
    out[k] = v;
  }
  return out;
}
