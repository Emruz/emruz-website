import 'server-only';
import crypto from 'node:crypto';

// Mirrors scripts/license/lease-lib.mjs in the Motiv repo. Tokens must match
// docs/licensing/test-vectors.json byte for byte (see tests/lease.test.mjs).

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function crockford(n: number): string {
  let s = '';
  for (const b of crypto.randomBytes(n)) s += CROCKFORD[b % 32];
  return s;
}

/** MOTIV-XXXX-XXXX-XXXX-XXXX */
export function newSubscriptionId(): string {
  const b = crockford(16);
  return `MOTIV-${b.slice(0, 4)}-${b.slice(4, 8)}-${b.slice(8, 12)}-${b.slice(12)}`;
}

/** Canonical form of what a client sent (dashes optional, any case). */
export function normalizeSubscriptionId(input: unknown): string | null {
  const c = String(input ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!c.startsWith('MOTIV')) return null;
  const body = c.slice(5).replace(/O/g, '0').replace(/[IL]/g, '1');
  if (body.length !== 16 || [...body].some((ch) => !CROCKFORD.includes(ch))) return null;
  return `MOTIV-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12)}`;
}

/** XXXX-XXXX pairing code */
export function newUserCode(): string {
  const c = crockford(8);
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

export function normalizeUserCode(input: unknown): string | null {
  const c = String(input ?? '').replace(/[\s-]/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  if (c.length !== 8 || [...c].some((ch) => !CROCKFORD.includes(ch))) return null;
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

/** RFC 3339 UTC without fractional seconds. */
export const iso = (d: Date | number | string) => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');

export interface LeasePayload {
  v: 2;
  lease_id: string;
  sub: string;
  device: string;
  plan: string;
  status: string;
  features: string[];
  issued_at: string;
  lease_expires: string;
  period_end: string | null;
  server_time: string;
}

/** MOTIV2.<kid>.<base64url payload>.<base64url signature> */
export function signLease(privateKey: crypto.KeyObject, kid: string, payload: LeasePayload): string {
  const json = Buffer.from(JSON.stringify(payload));
  const sig = crypto.sign(null, json, privateKey);
  return `MOTIV2.${kid}.${json.toString('base64url')}.${sig.toString('base64url')}`;
}

let cachedKey: crypto.KeyObject | null = null;

/**
 * Production signing key from MOTIV_LICENSE_PRIVATE_KEY: the PKCS8 PEM, or just
 * its base64 body. Line breaks may be missing, escaped (\\n) or turned into
 * spaces by the hosting dashboard or CLI; the key is rebuilt either way.
 */
export function parseSigningKey(raw: string): crypto.KeyObject {
  const body = raw
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');
  if (!body) throw new Error('MOTIV_LICENSE_PRIVATE_KEY is empty');
  const key = crypto.createPrivateKey({ key: Buffer.from(body, 'base64'), format: 'der', type: 'pkcs8' });
  if (key.asymmetricKeyType !== 'ed25519') throw new Error(`Signing key is ${key.asymmetricKeyType}, expected ed25519`);
  return key;
}

export function signingKey(): { key: crypto.KeyObject; kid: string } {
  if (!cachedKey) {
    const raw = process.env.MOTIV_LICENSE_PRIVATE_KEY;
    if (!raw) throw new Error('MOTIV_LICENSE_PRIVATE_KEY is not set');
    cachedKey = parseSigningKey(raw);
  }
  return { key: cachedKey, kid: (process.env.MOTIV_LICENSE_KID || 'k1').trim() };
}

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
