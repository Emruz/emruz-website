import 'server-only';
import { Apple, Google, MicrosoftEntraId, generateCodeVerifier, generateState } from 'arctic';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
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

function microsoft() {
  return new MicrosoftEntraId('common', process.env.MICROSOFT_CLIENT_ID!, process.env.MICROSOFT_CLIENT_SECRET!, redirectUri('microsoft'));
}
function google() {
  return new Google(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!, redirectUri('google'));
}
function apple() {
  const pem = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const der = Buffer.from(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''), 'base64');
  return new Apple(process.env.APPLE_CLIENT_ID!, process.env.APPLE_TEAM_ID!, process.env.APPLE_KEY_ID!, new Uint8Array(der), redirectUri('apple'));
}

export interface AuthStart {
  url: URL;
  state: string;
  codeVerifier: string | null;
  nonce: string;
}

export function startAuth(p: Provider): AuthStart {
  const state = generateState();
  const nonce = generateState();
  let url: URL;
  let codeVerifier: string | null = null;
  if (p === 'microsoft') {
    codeVerifier = generateCodeVerifier();
    url = microsoft().createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);
    url.searchParams.set('prompt', 'select_account');
  } else if (p === 'google') {
    codeVerifier = generateCodeVerifier();
    url = google().createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);
    url.searchParams.set('prompt', 'select_account');
  } else {
    url = apple().createAuthorizationURL(state, ['name', 'email']);
    url.searchParams.set('response_mode', 'form_post'); // required by Apple when asking for name/email
  }
  url.searchParams.set('nonce', nonce);
  return { url, state, codeVerifier, nonce };
}

const jwks = {
  microsoft: createRemoteJWKSet(new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys')),
  google: createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),
  apple: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
};

function audience(p: Provider) {
  return p === 'microsoft' ? process.env.MICROSOFT_CLIENT_ID! : p === 'google' ? process.env.GOOGLE_CLIENT_ID! : process.env.APPLE_CLIENT_ID!;
}

async function verifyIdToken(p: Provider, idToken: string, nonce: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(idToken, jwks[p], { audience: audience(p) });
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
  const tokens =
    p === 'microsoft'
      ? await microsoft().validateAuthorizationCode(code, codeVerifier!)
      : p === 'google'
        ? await google().validateAuthorizationCode(code, codeVerifier!)
        : await apple().validateAuthorizationCode(code);
  const claims = await verifyIdToken(p, tokens.idToken(), nonce);

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
