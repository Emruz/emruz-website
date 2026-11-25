import 'server-only';

/**
 * Public base URL of the site, no trailing slash. Redirects are built from this,
 * never from the request URL: on Netlify the request URL is an internal deploy
 * address, and redirecting there loses the session cookie set for emruz.com.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  // Set in next.config.ts at build time (correct for deploy previews)
  process.env.EMRUZ_BUILD_SITE_URL ||
  (process.env.CONTEXT && process.env.CONTEXT !== 'production' ? process.env.DEPLOY_PRIME_URL : undefined) ||
  process.env.URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

export const IS_PROD = process.env.NODE_ENV === 'production' && SITE_URL.startsWith('https://');

export const motiv = {
  leaseDays: Number(process.env.MOTIV_LEASE_DAYS || 14),
  pastDueGraceDays: Number(process.env.MOTIV_PAST_DUE_GRACE_DAYS || 7),
  defaultSeats: Number(process.env.MOTIV_DEFAULT_SEATS || 2),
  pairingMinutes: 10,
  pollIntervalSeconds: 5,
  features: ['assistant', 'action_items', 'speakers', 'awareness', 'calendars', 'terms', 'cleanup', 'templates', 'trim', 'import'],
  manageUrl: `${SITE_URL}/motiv/account`,
  /** Checkout buttons show only when this is "true". */
  salesOpen: process.env.MOTIV_SALES_OPEN === 'true',
};

/** Emruz kit pack sales (#68). Buy buttons show only when this is "true". */
export const kits = {
  salesOpen: process.env.KITS_SALES_OPEN === 'true',
  /** Founding lifetime offer on the all-kits bundle: last day (YYYY-MM-DD, inclusive). KITS_LIFETIME_UNTIL overrides, for example to end it early. */
  lifetimeUntil: process.env.KITS_LIFETIME_UNTIL?.trim() || '2027-12-31',
  /** Founding lifetime offer: most buyers. */
  lifetimeCap: 152,
};

export const PLANS = ['monthly', 'annual', 'lifetime'] as const;
export type Plan = (typeof PLANS)[number];

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}
