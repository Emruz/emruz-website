import 'server-only';

/** Public base URL of the site, no trailing slash. */
export const SITE_URL = (process.env.SITE_URL || process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const IS_PROD = process.env.NODE_ENV === 'production' && SITE_URL.startsWith('https://');

export const motiv = {
  leaseDays: Number(process.env.MOTIV_LEASE_DAYS || 14),
  pastDueGraceDays: Number(process.env.MOTIV_PAST_DUE_GRACE_DAYS || 7),
  defaultSeats: Number(process.env.MOTIV_DEFAULT_SEATS || 2),
  pairingMinutes: 10,
  pollIntervalSeconds: 5,
  features: ['assistant', 'action_items', 'speakers', 'awareness', 'calendars', 'terms', 'cleanup', 'templates', 'trim'],
  manageUrl: `${SITE_URL}/motiv/account`,
  /** Checkout buttons show only when this is "true". */
  salesOpen: process.env.MOTIV_SALES_OPEN === 'true',
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
