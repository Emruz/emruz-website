import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify, type JWTPayload } from 'jose';
import { SITE_URL } from './config';
import type { IdentityClaims } from './accounts';

export type Provider = 'microsoft' | 'google' | 'apple';
export const PROVIDERS: Provider[] = ['microsoft', 'google', 'apple'];

export const providerLabel: Record<Provider, string> = {
  microsoft: 'Microsoft',
  google: 'Google',
  apple: 'Apple',
};

const redirectUri = (p: Provider) => `${SITE_URL}/auth/callback/${p}`;

export function providerConfigured(p: Provider): boolean {
  if (p === 'microsoft') return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  if (p === 'google') return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
}

/** Authorization and token endpoints (OAuth 2.0 authorization code flow, with PKCE for Microsoft and Google). */
const endpoints: Record<Provider, { authorize: string; token: string }> = {
  microsoft: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
  },
  apple: {
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
  },
};

const clientId = (p: Provider) =>
  p === 'microsoft' ? process.env.MICROSOFT_CLIENT_ID! : p === 'google' ? process.env.GOOGLE_CLIENT_ID! : process.env.APPLE_CLIENT_ID!;

/** Random URL-safe value for state, nonce and the PKCE verifier. */
export const randomValue = () => randomBytes(32).toString('base64url');
const pkceChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

/** Apple's client secret is a short-lived ES256 JWT signed with the Sign in with Apple key. */
async function appleClientSecret(): Promise<string> {
  let pem = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n').trim();
  // Accept the key with or without its PEM header lines
  if (!pem.startsWith('-----BEGIN')) pem = `-----BEGIN PRIVATE KEY-----\n${pem.replace(/\s/g, '')}\n-----END PRIVATE KEY-----`;
  const key = await importPKCS8(pem, 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

async function clientSecret(p: Provider): Promise<string> {
  if (p === 'microsoft') return process.env.MICROSOFT_CLIENT_SECRET!;
  if (p === 'google') return process.env.GOOGLE_CLIENT_SECRET!;
  return appleClientSecret();
}

/** Exchange the authorization code for tokens; returns the ID token. */
async function exchangeCode(p: Provider, code: string, codeVerifier: string | null): Promise<string> {
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(p) });
  const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' };
  if (p === 'apple') {
    // Apple takes the client credentials in the body
    body.set('client_id', clientId(p));
    body.set('client_secret', await clientSecret(p));
  } else {
    // Microsoft and Google: HTTP Basic client authentication
    headers.authorization = `Basic ${Buffer.from(`${clientId(p)}:${await clientSecret(p)}`).toString('base64')}`;
  }
  if (codeVerifier) body.set('code_verifier', codeVerifier);
  const res = await fetch(endpoints[p].token, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.id_token) {
    throw new Error(`Token exchange failed (${res.status}): ${data.error ?? 'no id_token'} ${data.error_description ?? ''}`.trim());
  }
  return data.id_token;
}

export interface AuthStart {
  url: URL;
  state: string;
  codeVerifier: string | null;
  nonce: string;
}

export function startAuth(p: Provider): AuthStart {
  const state = randomValue();
  const nonce = randomValue();
  const url = new URL(endpoints[p].authorize);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId(p));
  url.searchParams.set('redirect_uri', redirectUri(p));
  url.searchParams.set('state', state);
  let codeVerifier: string | null = null;
  if (p === 'apple') {
    url.searchParams.set('scope', 'name email');
    url.searchParams.set('response_mode', 'form_post'); // required by Apple when asking for name/email
  } else {
    codeVerifier = randomValue();
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('code_challenge', pkceChallenge(codeVerifier));
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('prompt', 'select_account');
  }
  url.searchParams.set('nonce', nonce);
  return { url, state, codeVerifier, nonce };
}

const jwks = {
  microsoft: createRemoteJWKSet(new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys')),
  google: createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),
  apple: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
};

async function verifyIdToken(p: Provider, idToken: string, nonce: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(idToken, jwks[p], { audience: clientId(p) });
  const iss = String(payload.iss ?? '');
  const issOk =
    p === 'google'
      ? iss === 'https://accounts.google.com' || iss === 'accounts.google.com'
      : p === 'apple'
        ? iss === 'https://appleid.apple.com'
        : // Multi-tenant: issuer carries the user's tenant id
          payload.tid !== undefined && iss === `https://login.microsoftonline.com/${payload.tid}/v2.0`;
  if (!issOk) throw new Error(`Unexpected issuer ${iss}`);
  if (payload.nonce !== nonce) throw new Error('Nonce mismatch');
  return payload;
}

const truthy = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

/** Exchange the code and return verified identity claims. */
export async function finishAuth(
  p: Provider,
  code: string,
  codeVerifier: string | null,
  nonce: string,
  appleUser?: string | null,
): Promise<IdentityClaims> {
  if (p !== 'apple' && !codeVerifier) throw new Error('Missing PKCE verifier');
  const idToken = await exchangeCode(p, code, codeVerifier);
  const claims = await verifyIdToken(p, idToken, nonce);

  let email = (claims.email as string | undefined) ?? null;
  let emailVerified = truthy(claims.email_verified);
  let name = (claims.name as string | undefined) ?? null;

  if (p === 'microsoft') {
    // Microsoft's email claim is only trusted when the domain owner verified it
    // (optional claim xms_edov, configured on the app registration).
    email = email ?? ((claims.preferred_username as string | undefined) ?? null);
    emailVerified = truthy(claims.xms_edov) && !!claims.email;
  }
  if (p === 'apple' && appleUser) {
    // Apple sends the name only on first sign-in, in the form post
    try {
      const u = JSON.parse(appleUser) as { name?: { firstName?: string; lastName?: string } };
      name = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(' ') || null;
    } catch {
      /* ignore */
    }
  }
  return { provider: p, subject: String(claims.sub), email, emailVerified, name };
}
