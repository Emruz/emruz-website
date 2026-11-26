import 'server-only';
import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

/**
 * OAuth 2.1 authorization server for MCP clients (#67). Pure logic: storage,
 * clock and keys are passed in, so tests run the full flow without a database.
 * Public clients only (token_endpoint_auth_method "none"), PKCE S256 required,
 * single-use codes, short-lived signed access tokens, rotating refresh tokens.
 */

export const SCOPE = 'kits:read';
export const ACCESS_TTL_SECONDS = 600;
export const REFRESH_TTL_SECONDS = 30 * 24 * 3600;
export const CODE_TTL_SECONDS = 300;

export interface ClientRecord {
  id: string;
  clientName: string | null;
  redirectUris: string[];
}

export interface CodeRecord {
  codeHash: string;
  accountId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  expiresAt: number;
}

export interface GrantRecord {
  id: string;
  accountId: string;
  clientId: string;
  scope: string;
  revoked: boolean;
}

export type RefreshUse = { status: 'ok'; grantId: string } | { status: 'used'; grantId: string } | { status: 'missing' | 'expired' };

export interface OAuthStore {
  insertClient(c: ClientRecord, ip: string): Promise<void>;
  getClient(id: string): Promise<ClientRecord | null>;
  insertCode(c: CodeRecord): Promise<void>;
  /** Deletes the code and returns it, so a code works once whatever the outcome. */
  takeCode(codeHash: string): Promise<CodeRecord | null>;
  createGrant(accountId: string, clientId: string, scope: string): Promise<string>;
  getGrant(id: string): Promise<GrantRecord | null>;
  revokeGrant(id: string, reason: string): Promise<void>;
  insertRefresh(tokenHash: string, grantId: string, expiresAt: number): Promise<void>;
  /** Marks the token used in one step and reports what it was. */
  useRefresh(tokenHash: string, now: number): Promise<RefreshUse>;
  /** The grant a refresh token belongs to, without using it up (for revocation). */
  refreshGrant(tokenHash: string): Promise<string | null>;
  audit(kind: string, f: { accountId?: string | null; clientId?: string | null; grantId?: string | null; ip?: string | null; detail?: Record<string, unknown> }): Promise<void>;
}

export interface Keys {
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
  kid: string;
}

export interface ServerConfig {
  issuer: string;
  /** The MCP endpoint URL, the audience of every access token. */
  resource: string;
}

export const sha256hex = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export function keysFromPem(raw: string, kid: string): Keys {
  const body = raw
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');
  if (!body) throw new Error('MCP_TOKEN_PRIVATE_KEY is empty');
  const privateKey = crypto.createPrivateKey({ key: Buffer.from(body, 'base64'), format: 'der', type: 'pkcs8' });
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error(`MCP signing key is ${privateKey.asymmetricKeyType}, expected ed25519`);
  return { privateKey, publicKey: crypto.createPublicKey(privateKey), kid };
}

// ---------- Metadata ----------

export function authServerMetadata(c: ServerConfig) {
  return {
    issuer: c.issuer,
    authorization_endpoint: `${c.issuer}/oauth/authorize`,
    token_endpoint: `${c.issuer}/api/oauth/token`,
    registration_endpoint: `${c.issuer}/api/oauth/register`,
    revocation_endpoint: `${c.issuer}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    revocation_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [SCOPE],
    authorization_response_iss_parameter_supported: true,
  };
}

export function protectedResourceMetadata(c: ServerConfig) {
  return {
    resource: c.resource,
    authorization_servers: [c.issuer],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Emruz kits',
  };
}

// ---------- Redirect URIs ----------

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** https, http on a loopback address (any port), or a reverse-domain private-use scheme for native apps. */
export function redirectUriProblem(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2000) return 'redirect_uri must be a string of at most 2000 characters';
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return 'redirect_uri is not a valid URL';
  }
  if (u.hash || raw.includes('#')) return 'redirect_uri must not have a fragment';
  if (u.username || u.password) return 'redirect_uri must not carry credentials';
  if (u.protocol === 'https:') return u.hostname ? null : 'redirect_uri needs a host';
  if (u.protocol === 'http:') return LOOPBACK.has(u.hostname) ? null : 'http redirect URIs are only allowed on loopback addresses';
  const scheme = u.protocol.slice(0, -1);
  // Reverse-domain scheme: letters, digits, + and - in dot-separated parts, at least two parts.
  // One character class and a split instead of a nested group, so the check stays linear.
  if (/^[a-z][a-z0-9+.-]*$/.test(scheme) && scheme.includes('.') && scheme.split('.').every((part) => part.length > 0)) return null;
  return 'redirect_uri scheme is not allowed';
}

/** Exact match, except that a loopback redirect may use any port (RFC 8252 7.3). */
export function redirectMatches(registered: string[], given: string): boolean {
  if (registered.includes(given)) return true;
  let g: URL;
  try {
    g = new URL(given);
  } catch {
    return false;
  }
  if (g.protocol !== 'http:' || !LOOPBACK.has(g.hostname)) return false;
  return registered.some((r) => {
    try {
      const u = new URL(r);
      return u.protocol === 'http:' && u.hostname === g.hostname && u.pathname === g.pathname && u.search === g.search;
    } catch {
      return false;
    }
  });
}

// ---------- Dynamic client registration (RFC 7591) ----------

export type Result = { status: number; body: Record<string, unknown> };
const err = (status: number, error: string, description?: string): Result => ({
  status,
  body: description ? { error, error_description: description } : { error },
});

export async function registerClient(store: OAuthStore, body: unknown, ip: string): Promise<Result> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return err(400, 'invalid_client_metadata', 'Expected a JSON object.');
  const b = body as Record<string, unknown>;
  const uris = b.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > 5) return err(400, 'invalid_redirect_uri', 'Give one to five redirect_uris.');
  for (const u of uris) {
    const p = redirectUriProblem(u);
    if (p) return err(400, 'invalid_redirect_uri', p);
  }
  const grantTypes = b.grant_types ?? ['authorization_code'];
  if (!Array.isArray(grantTypes) || grantTypes.some((g) => g !== 'authorization_code' && g !== 'refresh_token')) {
    return err(400, 'invalid_client_metadata', 'Only authorization_code and refresh_token are supported.');
  }
  const responseTypes = b.response_types ?? ['code'];
  if (!Array.isArray(responseTypes) || responseTypes.some((r) => r !== 'code')) return err(400, 'invalid_client_metadata', 'Only the code response type is supported.');
  const name = typeof b.client_name === 'string' ? b.client_name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 100) || null : null;
  const client: ClientRecord = { id: `emz_${randomToken(18)}`, clientName: name, redirectUris: [...new Set(uris as string[])] };
  await store.insertClient(client, ip);
  await store.audit('client_registered', { clientId: client.id, ip, detail: { client_name: name, redirect_uris: client.redirectUris } });
  return {
    status: 201,
    body: {
      client_id: client.id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name ?? undefined,
      redirect_uris: client.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      // Public client: PKCE instead of a secret, whatever the request asked for
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    },
  };
}

// ---------- Authorization endpoint ----------

export interface AuthorizeRequest {
  client: ClientRecord;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  scope: string;
}

export type AuthorizeCheck =
  | { kind: 'ok'; req: AuthorizeRequest }
  /** Shown on the page; never redirect to an unverified URI. */
  | { kind: 'fatal'; message: string }
  | { kind: 'redirect'; url: string };

const B64URL_43_128 = /^[A-Za-z0-9_-]{43,128}$/;
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;

export function withParams(uri: string, params: Record<string, string | null | undefined>): string {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  return u.toString();
}

export async function checkAuthorize(store: OAuthStore, cfg: ServerConfig, p: Record<string, string | undefined>): Promise<AuthorizeCheck> {
  const clientId = p.client_id;
  if (!clientId || clientId.length > 200) return { kind: 'fatal', message: 'The app did not say who it is (client_id is missing).' };
  const client = await store.getClient(clientId);
  if (!client) return { kind: 'fatal', message: 'This app is not registered with Emruz. Remove the connector and add it again.' };
  const redirectUri = p.redirect_uri;
  if (!redirectUri || !redirectMatches(client.redirectUris, redirectUri)) {
    return { kind: 'fatal', message: 'The app asked to return to an address it did not register.' };
  }
  const state = p.state ?? null;
  if (state && state.length > 1000) return { kind: 'fatal', message: 'The request is too long.' };
  const fail = (error: string, description: string): AuthorizeCheck => ({
    kind: 'redirect',
    url: withParams(redirectUri, { error, error_description: description, state, iss: cfg.issuer }),
  });
  if (p.response_type !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported.');
  if (p.code_challenge_method !== 'S256' || !p.code_challenge || !B64URL_43_128.test(p.code_challenge)) {
    return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required.');
  }
  if (p.scope) {
    const asked = p.scope.split(' ').filter(Boolean);
    if (asked.some((s) => s !== SCOPE)) return fail('invalid_scope', `The only scope is ${SCOPE}.`);
  }
  if (p.resource && p.resource.replace(/\/$/, '') !== cfg.resource) return fail('invalid_target', 'Unknown resource.');
  return { kind: 'ok', req: { client, redirectUri, codeChallenge: p.code_challenge, state, scope: SCOPE } };
}

/** After the account approves: store a single-use code and return where to send the browser. */
export async function approve(store: OAuthStore, cfg: ServerConfig, accountId: string, req: AuthorizeRequest, now: number, ip: string): Promise<string> {
  const code = randomToken(32);
  await store.insertCode({
    codeHash: sha256hex(code),
    accountId,
    clientId: req.client.id,
    redirectUri: req.redirectUri,
    codeChallenge: req.codeChallenge,
    scope: req.scope,
    expiresAt: now + CODE_TTL_SECONDS * 1000,
  });
  await store.audit('consent_given', { accountId, clientId: req.client.id, ip });
  return withParams(req.redirectUri, { code, state: req.state, iss: cfg.issuer });
}

export function deny(cfg: ServerConfig, req: AuthorizeRequest): string {
  return withParams(req.redirectUri, { error: 'access_denied', error_description: 'The account owner declined.', state: req.state, iss: cfg.issuer });
}

// ---------- Tokens ----------

export interface AccessClaims {
  sub: string;
  client_id: string;
  gid: string;
  scope: string;
}

export async function signAccessToken(keys: Keys, cfg: ServerConfig, c: AccessClaims, now: number): Promise<string> {
  const iat = Math.floor(now / 1000);
  return new SignJWT({ client_id: c.client_id, gid: c.gid, scope: c.scope })
    .setProtectedHeader({ alg: 'EdDSA', kid: keys.kid, typ: 'at+jwt' })
    .setIssuer(cfg.issuer)
    .setAudience(cfg.resource)
    .setSubject(c.sub)
    .setJti(randomToken(12))
    .setIssuedAt(iat)
    .setExpirationTime(iat + ACCESS_TTL_SECONDS)
    .sign(keys.privateKey);
}

/** Signature, issuer, audience, type and expiry. The grant is checked separately (it can be revoked). */
export async function verifyAccessToken(keys: Keys, cfg: ServerConfig, token: string, now: number): Promise<AccessClaims | null> {
  if (!token || token.length > 4000) return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, keys.publicKey, {
      issuer: cfg.issuer,
      audience: cfg.resource,
      algorithms: ['EdDSA'],
      typ: 'at+jwt',
      currentDate: new Date(now),
      clockTolerance: 5,
    });
    if (protectedHeader.kid !== keys.kid) return null;
    const { sub, client_id, gid, scope } = payload as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof client_id !== 'string' || typeof gid !== 'string' || typeof scope !== 'string') return null;
    return { sub, client_id, gid, scope };
  } catch {
    return null;
  }
}

async function issuePair(store: OAuthStore, keys: Keys, cfg: ServerConfig, g: GrantRecord, now: number): Promise<Result> {
  const access = await signAccessToken(keys, cfg, { sub: g.accountId, client_id: g.clientId, gid: g.id, scope: g.scope }, now);
  const refresh = randomToken(32);
  await store.insertRefresh(sha256hex(refresh), g.id, now + REFRESH_TTL_SECONDS * 1000);
  return {
    status: 200,
    body: { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL_SECONDS, refresh_token: refresh, scope: g.scope },
  };
}

export async function token(store: OAuthStore, keys: Keys, cfg: ServerConfig, p: Record<string, string | undefined>, now: number, ip: string): Promise<Result> {
  const clientId = p.client_id;
  if (!clientId) return err(401, 'invalid_client', 'client_id is required.');
  if (p.resource && p.resource.replace(/\/$/, '') !== cfg.resource) return err(400, 'invalid_target', 'Unknown resource.');

  if (p.grant_type === 'authorization_code') {
    if (!p.code) return err(400, 'invalid_request', 'code is required.');
    // Taken (deleted) before any check: one attempt per code, failed or not
    const code = await store.takeCode(sha256hex(p.code));
    const bad = async (why: string) => {
      await store.audit('code_rejected', { clientId, ip, accountId: code?.accountId ?? null, detail: { why } });
      return err(400, 'invalid_grant', 'The authorization code is invalid or expired.');
    };
    if (!code) return bad('unknown');
    if (code.clientId !== clientId) return bad('client_mismatch');
    if (code.expiresAt <= now) return bad('expired');
    if (p.redirect_uri !== code.redirectUri) return bad('redirect_mismatch');
    if (!p.code_verifier || !VERIFIER.test(p.code_verifier)) return bad('bad_verifier');
    const challenge = crypto.createHash('sha256').update(p.code_verifier).digest('base64url');
    const a = Buffer.from(challenge), b = Buffer.from(code.codeChallenge);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return bad('pkce_mismatch');
    const gid = await store.createGrant(code.accountId, clientId, code.scope);
    await store.audit('token_issued', { accountId: code.accountId, clientId, grantId: gid, ip });
    return issuePair(store, keys, cfg, { id: gid, accountId: code.accountId, clientId, scope: code.scope, revoked: false }, now);
  }

  if (p.grant_type === 'refresh_token') {
    if (!p.refresh_token) return err(400, 'invalid_request', 'refresh_token is required.');
    const use = await store.useRefresh(sha256hex(p.refresh_token), now);
    const invalid = err(400, 'invalid_grant', 'The refresh token is invalid or expired.');
    if (use.status === 'used') {
      // A rotated token came back: assume it leaked and end the whole grant
      await store.revokeGrant(use.grantId, 'refresh_reuse');
      await store.audit('refresh_reuse', { clientId, grantId: use.grantId, ip });
      return invalid;
    }
    if (use.status !== 'ok') return invalid;
    const g = await store.getGrant(use.grantId);
    if (!g || g.revoked || g.clientId !== clientId) return invalid;
    await store.audit('token_refreshed', { accountId: g.accountId, clientId, grantId: g.id, ip });
    return issuePair(store, keys, cfg, g, now);
  }

  return err(400, 'unsupported_grant_type');
}

/** RFC 7009. Always 200 for a well-formed request, whether or not the token was found. */
export async function revoke(store: OAuthStore, keys: Keys, cfg: ServerConfig, p: Record<string, string | undefined>, now: number, ip: string): Promise<Result> {
  if (!p.token) return err(400, 'invalid_request', 'token is required.');
  let gid: string | null = null;
  if (p.token.split('.').length === 3) {
    gid = (await verifyAccessToken(keys, cfg, p.token, now))?.gid ?? null;
  } else {
    // Read only: a revoke from the wrong client must not spend the real client's token
    gid = await store.refreshGrant(sha256hex(p.token));
  }
  if (gid) {
    const g = await store.getGrant(gid);
    if (g && !g.revoked && (!p.client_id || p.client_id === g.clientId)) {
      await store.revokeGrant(gid, 'client_revoked');
      await store.audit('grant_revoked', { accountId: g.accountId, clientId: g.clientId, grantId: gid, ip, detail: { by: 'client' } });
    }
  }
  return { status: 200, body: {} };
}

/** For the MCP endpoint, after the signature check: the token's grant is still active. */
export async function grantActive(store: OAuthStore, claims: AccessClaims): Promise<boolean> {
  const g = await store.getGrant(claims.gid);
  return !!g && !g.revoked && g.accountId === claims.sub && g.clientId === claims.client_id;
}
