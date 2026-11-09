import 'server-only';
import crypto from 'node:crypto';
import { db } from './db';
import { signingKey, signLease, iso } from './lease';
import { PROVIDERS, providerConfigured, providerLabel } from './oauth';

/** Public keys built into Motiv (frontend/src-tauri/license_public_keys.json). */
export const MOTIV_APP_PUBLIC_KEYS: Record<string, string> = {
  k1: '8umaoXT_X2zvms1KeD79I8c4aEgUGulF0G9bRSFfFI0',
};

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Configuration checks shown on the admin page. Never reveals secrets. */
export async function systemChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  try {
    const [r] = await db()<{ n: number }[]>`select count(*)::int as n from subscriptions`;
    checks.push({ name: 'Database', ok: true, detail: `Connected. ${r.n} subscriptions.` });
  } catch (e) {
    checks.push({ name: 'Database', ok: false, detail: msg(e) });
  }

  try {
    const { key, kid } = signingKey();
    const x = crypto.createPublicKey(key).export({ format: 'jwk' }).x as string;
    const expected = MOTIV_APP_PUBLIC_KEYS[kid];
    // Prove a lease can be signed and verified
    const token = signLease(key, kid, {
      v: 2, lease_id: 'selftest', sub: 'MOTIV-0000-0000-0000-0000', device: 'selftest', plan: 'annual', status: 'active',
      features: [], issued_at: iso(Date.now()), lease_expires: iso(Date.now()), period_end: null, server_time: iso(Date.now()),
    });
    const [, , p, s] = token.split('.');
    const verifies = crypto.verify(null, Buffer.from(p, 'base64url'), crypto.createPublicKey(key), Buffer.from(s, 'base64url'));
    if (!expected) checks.push({ name: 'Lease signing key', ok: false, detail: `Key loaded, but kid "${kid}" is not one the app knows (expected k1).` });
    else if (x !== expected) checks.push({ name: 'Lease signing key', ok: false, detail: `Key loaded, but it does not match the app's ${kid} public key. Wrong private key.` });
    else checks.push({ name: 'Lease signing key', ok: verifies, detail: verifies ? `Loaded, kid ${kid}, matches the app.` : 'Signing self-test failed.' });
  } catch (e) {
    checks.push({ name: 'Lease signing key', ok: false, detail: msg(e) });
  }

  const has = (k: string) => !!process.env[k];
  checks.push({ name: 'Email (Resend)', ok: has('RESEND_API_KEY'), detail: has('RESEND_API_KEY') ? `Sending as ${process.env.EMAIL_FROM || 'default sender'}` : 'RESEND_API_KEY not set' });
  const stripeVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_ANNUAL', 'STRIPE_PRICE_LIFETIME'];
  const missing = stripeVars.filter((k) => !has(k));
  checks.push({ name: 'Stripe', ok: missing.length === 0, detail: missing.length ? `Missing: ${missing.join(', ')}` : `Configured${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? ' (test mode)' : ''}` });
  checks.push({ name: 'Sales tax at checkout', ok: true, detail: process.env.STRIPE_AUTOMATIC_TAX === 'false' ? 'Off (STRIPE_AUTOMATIC_TAX=false; turn on before selling)' : 'On (Stripe Tax)' });
  checks.push({ name: 'Sales', ok: true, detail: process.env.MOTIV_SALES_OPEN === 'true' ? 'Buy buttons shown' : 'Closed (MOTIV_SALES_OPEN is not "true")' });
  for (const p of PROVIDERS) {
    checks.push({ name: `${providerLabel[p]} sign-in`, ok: providerConfigured(p), detail: providerConfigured(p) ? 'Configured' : 'Not configured (button hidden)' });
  }
  return checks;
}
