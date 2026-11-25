// OAuth server for the Emruz kits MCP endpoint (#67): registration, PKCE code flow,
// expiry, refresh rotation and reuse, revocation, and the rate limits.
// Run: node --conditions=react-server --experimental-strip-types tests/kits-oauth.test.mts
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  approve, checkAuthorize, grantActive, keysFromPem, redirectMatches, redirectUriProblem, registerClient, revoke, token, verifyAccessToken,
  ACCESS_TTL_SECONDS, CODE_TTL_SECONDS, REFRESH_TTL_SECONDS, SCOPE,
  type ClientRecord, type CodeRecord, type GrantRecord, type OAuthStore, type RefreshUse,
} from '../src/lib/server/kits/oauth-core.ts';
import { LIMITS, memoryLimiter, overLimit, rules } from '../src/lib/server/kits/limits.ts';

// ---------- In-memory store ----------
function memoryStore() {
  const clients = new Map<string, ClientRecord>();
  const codes = new Map<string, CodeRecord>();
  const grants = new Map<string, GrantRecord>();
  const refresh = new Map<string, { grantId: string; expiresAt: number; used: boolean }>();
  const audit: string[] = [];
  const store: OAuthStore = {
    async insertClient(c) { clients.set(c.id, c); },
    async getClient(id) { return clients.get(id) ?? null; },
    async insertCode(c) { codes.set(c.codeHash, c); },
    async takeCode(h) { const c = codes.get(h) ?? null; codes.delete(h); return c; },
    async createGrant(accountId, clientId, scope) { const id = crypto.randomUUID(); grants.set(id, { id, accountId, clientId, scope, revoked: false }); return id; },
    async getGrant(id) { return grants.get(id) ?? null; },
    async revokeGrant(id) { const g = grants.get(id); if (g) g.revoked = true; for (const [k, r] of refresh) if (r.grantId === id) refresh.delete(k); },
    async insertRefresh(h, grantId, expiresAt) { refresh.set(h, { grantId, expiresAt, used: false }); },
    async useRefresh(h, now): Promise<RefreshUse> {
      const r = refresh.get(h);
      if (!r) return { status: 'missing' };
      if (r.used) return { status: 'used', grantId: r.grantId };
      r.used = true;
      return r.expiresAt <= now ? { status: 'expired' } : { status: 'ok', grantId: r.grantId };
    },
    async audit(kind) { audit.push(kind); },
  };
  return { store, codes, grants, audit };
}

const { privateKey } = crypto.generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
// The env value has literal \n, as pasted into Netlify
const keys = keysFromPem(pem.replace(/\n/g, '\\n'), 'm1');
const cfg = { issuer: 'https://emruz.test', resource: 'https://emruz.test/api/mcp' };
const IP = '203.0.113.9';
const ACCOUNT = '11111111-1111-4111-8111-111111111111';
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
let now = Date.UTC(2030, 0, 1);

// ---------- Redirect URI rules ----------
assert.equal(redirectUriProblem(REDIRECT), null);
assert.equal(redirectUriProblem('http://127.0.0.1:33418/callback'), null, 'loopback http');
assert.equal(redirectUriProblem('http://localhost/cb'), null);
assert.equal(redirectUriProblem('com.example.app:/oauth'), null, 'reverse-domain private scheme');
assert.ok(redirectUriProblem('http://evil.example/cb'), 'plain http elsewhere');
assert.ok(redirectUriProblem('https://claude.ai/cb#frag'), 'fragment');
assert.ok(redirectUriProblem('javascript:alert(1)'), 'javascript scheme');
assert.ok(redirectUriProblem('https://user:pw@claude.ai/cb'), 'credentials');
assert.ok(redirectMatches(['http://127.0.0.1:1000/cb'], 'http://127.0.0.1:5555/cb'), 'loopback port may change');
assert.ok(!redirectMatches(['http://127.0.0.1:1000/cb'], 'http://127.0.0.1:5555/other'));
assert.ok(!redirectMatches([REDIRECT], `${REDIRECT}?x=1`), 'exact match otherwise');

// ---------- Registration ----------
const m = memoryStore();
const reg = await registerClient(m.store, { client_name: 'Claude', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'client_secret_post' }, IP);
assert.equal(reg.status, 201);
assert.equal(reg.body.token_endpoint_auth_method, 'none', 'always a public client');
assert.ok(!('client_secret' in reg.body), 'no secret issued');
const clientId = reg.body.client_id as string;
assert.equal((await registerClient(m.store, { redirect_uris: [] }, IP)).status, 400);
assert.equal((await registerClient(m.store, { redirect_uris: ['http://evil.example/cb'] }, IP)).body.error, 'invalid_redirect_uri');
assert.equal((await registerClient(m.store, { redirect_uris: [REDIRECT], grant_types: ['client_credentials'] }, IP)).status, 400);

// ---------- Authorize checks ----------
const base = { client_id: clientId, redirect_uri: REDIRECT, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', state: 'xyz' };
assert.equal((await checkAuthorize(m.store, cfg, { ...base, client_id: 'nope' })).kind, 'fatal', 'unknown client is shown, not redirected');
assert.equal((await checkAuthorize(m.store, cfg, { ...base, redirect_uri: 'https://evil.example/cb' })).kind, 'fatal', 'unregistered redirect is never used');
const plain = await checkAuthorize(m.store, cfg, { ...base, code_challenge_method: 'plain' });
assert.equal(plain.kind, 'redirect');
assert.match((plain as { url: string }).url, /error=invalid_request/);
assert.match((plain as { url: string }).url, /state=xyz/);
assert.match((await checkAuthorize(m.store, cfg, { ...base, scope: 'admin' }) as { url: string }).url, /invalid_scope/);
assert.match((await checkAuthorize(m.store, cfg, { ...base, resource: 'https://other.example/mcp' }) as { url: string }).url, /invalid_target/);
const ok = await checkAuthorize(m.store, cfg, { ...base, scope: SCOPE, resource: `${cfg.resource}/` });
assert.equal(ok.kind, 'ok');
if (ok.kind !== 'ok') throw new Error('unreachable');

async function newCode(): Promise<string> {
  const url = new URL(await approve(m.store, cfg, ACCOUNT, ok.req, now, IP));
  assert.equal(url.searchParams.get('state'), 'xyz');
  assert.equal(url.searchParams.get('iss'), cfg.issuer, 'RFC 9207 iss parameter');
  return url.searchParams.get('code')!;
}
const exchange = (code: string, extra: Record<string, string> = {}) =>
  token(m.store, keys, cfg, { grant_type: 'authorization_code', code, client_id: clientId, redirect_uri: REDIRECT, code_verifier: verifier, ...extra }, now, IP);

// ---------- Code exchange ----------
// Wrong verifier: refused, and the code is gone (dies after one failed use)
let code = await newCode();
assert.equal((await exchange(code, { code_verifier: crypto.randomBytes(32).toString('base64url') })).body.error, 'invalid_grant');
assert.equal((await exchange(code)).body.error, 'invalid_grant', 'code is dead after a failed attempt');
// Wrong redirect, wrong client, expired
code = await newCode();
assert.equal((await exchange(code, { redirect_uri: 'https://claude.ai/other' })).body.error, 'invalid_grant');
code = await newCode();
assert.equal((await exchange(code, { client_id: 'emz_other' })).body.error, 'invalid_grant');
code = await newCode();
now += (CODE_TTL_SECONDS + 1) * 1000;
assert.equal((await exchange(code)).body.error, 'invalid_grant', 'expired code');
// Good exchange, then replay
code = await newCode();
const t1 = await exchange(code);
assert.equal(t1.status, 200);
assert.equal(t1.body.token_type, 'Bearer');
assert.equal(t1.body.expires_in, ACCESS_TTL_SECONDS);
assert.equal((await exchange(code)).body.error, 'invalid_grant', 'codes are single use');
assert.equal((await token(m.store, keys, cfg, { grant_type: 'password', client_id: clientId }, now, IP)).body.error, 'unsupported_grant_type');
assert.equal((await token(m.store, keys, cfg, { grant_type: 'authorization_code', code: 'x' }, now, IP)).status, 401, 'client_id required');

// ---------- Access tokens ----------
const access1 = t1.body.access_token as string;
const claims = await verifyAccessToken(keys, cfg, access1, now);
assert.ok(claims);
assert.equal(claims!.sub, ACCOUNT);
assert.equal(claims!.client_id, clientId);
assert.ok(await grantActive(m.store, claims!));
assert.equal(await verifyAccessToken(keys, cfg, access1, now + (ACCESS_TTL_SECONDS + 10) * 1000), null, 'access token expires');
assert.equal(await verifyAccessToken(keys, { ...cfg, resource: 'https://other.example/mcp' }, access1, now), null, 'audience bound to /api/mcp');
const otherKeys = keysFromPem(crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), 'm1');
assert.equal(await verifyAccessToken(otherKeys, cfg, access1, now), null, 'signature checked');
const [h, p, s] = access1.split('.');
const forged = JSON.parse(Buffer.from(p, 'base64url').toString());
forged.sub = '22222222-2222-4222-8222-222222222222';
assert.equal(await verifyAccessToken(keys, cfg, `${h}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${s}`, now), null, 'tampered claims rejected');

// ---------- Refresh rotation and reuse ----------
const refresh1 = t1.body.refresh_token as string;
const t2 = await token(m.store, keys, cfg, { grant_type: 'refresh_token', refresh_token: refresh1, client_id: clientId }, now, IP);
assert.equal(t2.status, 200);
assert.notEqual(t2.body.refresh_token, refresh1, 'rotated');
assert.equal((await token(m.store, keys, cfg, { grant_type: 'refresh_token', refresh_token: t2.body.refresh_token as string, client_id: 'emz_other' }, now, IP)).body.error, 'invalid_grant', 'refresh bound to client');
// Replaying the first refresh token ends the grant
assert.equal((await token(m.store, keys, cfg, { grant_type: 'refresh_token', refresh_token: refresh1, client_id: clientId }, now, IP)).body.error, 'invalid_grant');
assert.ok(m.audit.includes('refresh_reuse'));
assert.equal(await grantActive(m.store, claims!), false, 'reuse revokes the grant: access token stops working');
// Expired refresh token
code = await newCode();
const t3 = await exchange(code);
now += (REFRESH_TTL_SECONDS + 1) * 1000;
assert.equal((await token(m.store, keys, cfg, { grant_type: 'refresh_token', refresh_token: t3.body.refresh_token as string, client_id: clientId }, now, IP)).body.error, 'invalid_grant', 'refresh expiry');

// ---------- Revocation (RFC 7009) ----------
code = await newCode();
const t4 = await exchange(code);
const c4 = (await verifyAccessToken(keys, cfg, t4.body.access_token as string, now))!;
assert.equal((await revoke(m.store, keys, cfg, { token: t4.body.refresh_token as string, client_id: clientId }, now, IP)).status, 200);
assert.equal(await grantActive(m.store, c4), false, 'revoking the refresh token ends the access token too');
code = await newCode();
const t5 = await exchange(code);
const c5 = (await verifyAccessToken(keys, cfg, t5.body.access_token as string, now))!;
assert.equal((await revoke(m.store, keys, cfg, { token: t5.body.access_token as string, client_id: 'emz_other' }, now, IP)).status, 200);
assert.equal(await grantActive(m.store, c5), true, 'another client cannot revoke it');
await revoke(m.store, keys, cfg, { token: t5.body.access_token as string }, now, IP);
assert.equal(await grantActive(m.store, c5), false, 'revoking the access token ends the grant');
assert.equal((await token(m.store, keys, cfg, { grant_type: 'refresh_token', refresh_token: t5.body.refresh_token as string, client_id: clientId }, now, IP)).body.error, 'invalid_grant');
assert.equal((await revoke(m.store, keys, cfg, { token: 'unknown' }, now, IP)).status, 200, 'unknown tokens still get 200');
assert.equal((await revoke(m.store, keys, cfg, {}, now, IP)).status, 400);

// ---------- Rate limits ----------
let clock = 0;
const lim = memoryLimiter(() => clock);
const hit = async (list: ReturnType<typeof rules.mcpAnon>, n: number) => {
  let wait = 0;
  for (let i = 0; i < n; i++) wait = await overLimit(lim, list);
  return wait;
};
// 429 at limit + 1 with a Retry-After, then the window resets
assert.equal(await hit(rules.mcpAnon(IP), LIMITS.mcpAnonPerIp.limit), 0, 'up to the limit is fine');
const wait = await overLimit(lim, rules.mcpAnon(IP));
assert.ok(wait > 0 && wait <= 3600, 'limit + 1 is refused with Retry-After');
clock += 3600 * 1000 + 1;
assert.equal(await overLimit(lim, rules.mcpAnon(IP)), 0, 'window reset');
// The per-account cap holds when the user registers new clients
lim.reset();
for (let i = 0; i < LIMITS.mcpPerAccount.limit; i++) {
  assert.equal(await overLimit(lim, rules.mcpSignedIn(ACCOUNT, `emz_client${i}`)), 0);
}
assert.ok((await overLimit(lim, rules.mcpSignedIn(ACCOUNT, 'emz_brand_new_client'))) > 0, 'new client does not reset the account cap');
// Per-client cap
lim.reset();
assert.equal(await hit(rules.mcpSignedIn(ACCOUNT, 'emz_one'), LIMITS.mcpPerClient.limit), 0);
assert.ok((await overLimit(lim, rules.mcpSignedIn('33333333-3333-4333-8333-333333333333', 'emz_one'))) > 0, 'client cap across accounts');
// Global circuit breaker trips
lim.reset();
assert.equal(await hit(rules.mcpTotal(), LIMITS.mcpTotal.limit), 0);
assert.ok((await overLimit(lim, rules.mcpTotal())) > 0, 'global cap trips');
// Registration: per IP and total
lim.reset();
assert.equal(await hit(rules.register(IP), LIMITS.registerPerIp.limit), 0);
assert.ok((await overLimit(lim, rules.register(IP))) > 0);
assert.equal(await overLimit(lim, rules.register('198.51.100.1')), 0, 'other IPs still register');
assert.deepEqual([LIMITS.registerTotal.limit, LIMITS.authorizePerIp.limit, LIMITS.authorizePerIp.windowSeconds, LIMITS.tokenPerClient.limit, LIMITS.tokenPerIp.limit], [200, 30, 600, 60, 120]);

console.log('kits oauth passed');
