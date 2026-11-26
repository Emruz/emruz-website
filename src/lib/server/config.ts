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

/** Fixed Motiv values. Seats, lease length, grace and the sales switch are site settings (#74). */
export const motiv = {
  pairingMinutes: 10,
  pollIntervalSeconds: 5,
  features: ['assistant', 'action_items', 'speakers', 'awareness', 'calendars', 'terms', 'cleanup', 'templates', 'trim', 'import'],
  manageUrl: `${SITE_URL}/motiv/account`,
};

/** Emruz kit pack sales (#68). The sales switch and the offer's last day are site settings (#74). */
export const kits = {
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
