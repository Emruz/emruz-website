// Site settings (#74): the business settings staff change on /admin/settings, each with a
// default when unset. Pure functions; tests load this file directly.
import 'server-only';

export type SettingKind = 'switch' | 'day' | 'number' | 'email' | 'emails' | 'release';

export interface SettingDef {
  key: string;
  /** The Netlify environment variable this replaced. */
  env: string;
  group: 'Emruz kits' | 'Motiv' | 'Stripe' | 'Email';
  label: string;
  help: string;
  kind: SettingKind;
  /** Stored form of the default; null means "not set" (described by `unsetText`). */
  fallback: string | null;
  unsetText?: string;
  min?: number;
  max?: number;
}

export const SETTINGS: readonly SettingDef[] = [
  { key: 'kits_sales_open', env: 'KITS_SALES_OPEN', group: 'Emruz kits', label: 'Kits sales open', help: 'Shows buy buttons on /kits.', kind: 'switch', fallback: 'false' },
  { key: 'kits_lifetime_until', env: 'KITS_LIFETIME_UNTIL', group: 'Emruz kits', label: 'Founding lifetime offer ends', help: 'Last day of the offer. A past day ends it now.', kind: 'day', fallback: '2027-12-31' },
  { key: 'skills_ref', env: 'SKILLS_REF', group: 'Emruz kits', label: 'Hold kits at release', help: 'Serve this release instead of the newest, for example to back out a bad release. Clear it to follow releases again.', kind: 'release', fallback: null, unsetText: 'Not held (newest release)' },
  { key: 'motiv_sales_open', env: 'MOTIV_SALES_OPEN', group: 'Motiv', label: 'Motiv sales open', help: 'Shows Get Pro buttons on /motiv.', kind: 'switch', fallback: 'false' },
  { key: 'motiv_default_seats', env: 'MOTIV_DEFAULT_SEATS', group: 'Motiv', label: 'Computers per new licence', help: 'Seats on each new Motiv Pro subscription.', kind: 'number', fallback: '2', min: 1, max: 50 },
  { key: 'motiv_lease_days', env: 'MOTIV_LEASE_DAYS', group: 'Motiv', label: 'Lease length (days)', help: 'How long a monthly or annual lease lasts between check-ins.', kind: 'number', fallback: '14', min: 1, max: 60 },
  { key: 'motiv_past_due_grace_days', env: 'MOTIV_PAST_DUE_GRACE_DAYS', group: 'Motiv', label: 'Past-due grace (days)', help: 'Days Pro keeps working after a failed payment or the end of the paid period.', kind: 'number', fallback: '7', min: 0, max: 30 },
  { key: 'stripe_automatic_tax', env: 'STRIPE_AUTOMATIC_TAX', group: 'Stripe', label: 'Sales tax at checkout', help: 'Stripe Tax on Motiv and kits checkouts. Off only for a sandbox, where Stripe Tax cannot be turned on.', kind: 'switch', fallback: 'true' },
  { key: 'contact_to', env: 'CONTACT_TO', group: 'Email', label: 'Contact form to', help: 'Where contact form messages are sent.', kind: 'email', fallback: 'info@emruz.com' },
  { key: 'assessment_notify_to', env: 'ASSESSMENT_NOTIFY_TO', group: 'Email', label: 'Assessment notices to', help: 'Where new assessment notices are sent.', kind: 'email', fallback: 'sales@emruz.com' },
  { key: 'alert_emails', env: 'ALERT_EMAILS', group: 'Email', label: 'Security alerts to', help: 'Comma-separated addresses for security alerts.', kind: 'emails', fallback: null, unsetText: 'Not set (admins)' },
  { key: 'email_reply_to', env: 'EMAIL_REPLY_TO', group: 'Email', label: 'Reply-to address', help: 'Reply-to on email the site sends.', kind: 'email', fallback: 'info@emruz.com' },
];

/** Kept with the site settings but changed on /admin/kits (#71). */
export const KITS_LAUNCH_DATE = 'kits_launch_date';

export const settingDef = (key: unknown): SettingDef | undefined => SETTINGS.find((s) => s.key === key);

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const REF = /^v(\d{4})\.(\d{1,2})\.(\d{1,4})$/;
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const MAX_EMAILS = 20;
/** site_settings.value limit (migration 027). */
const MAX_VALUE = 1000;

export function isDay(v: unknown): v is string {
  if (typeof v !== 'string' || !DAY.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}
export const isEmail = (v: string) => v.length <= 254 && EMAIL.test(v);

export type Checked = { ok: true; value: string | null } | { ok: false; error: string };

/**
 * Check a value from the form and return the stored form. Empty means unset (the default).
 * Release tags are also checked against GitHub by the caller.
 */
export function checkSetting(def: SettingDef, raw: unknown): Checked {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return { ok: true, value: null };
  const bad = (error: string): Checked => ({ ok: false, error: `${def.label}: ${error}` });
  switch (def.kind) {
    case 'switch':
      return v === 'true' || v === 'false' ? { ok: true, value: v } : bad('choose on or off.');
    case 'day':
      return isDay(v) ? { ok: true, value: v } : bad('enter a day as YYYY-MM-DD, for example 2027-12-31.');
    case 'number': {
      const n = Number(v);
      if (!/^\d{1,4}$/.test(v) || n < def.min! || n > def.max!) return bad(`enter a whole number from ${def.min} to ${def.max}.`);
      return { ok: true, value: String(n) };
    }
    case 'email':
      return isEmail(v.toLowerCase()) ? { ok: true, value: v.toLowerCase() } : bad('enter one email address.');
    case 'emails': {
      const list = [...new Set(v.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))];
      if (!list.length) return { ok: true, value: null };
      if (list.length > MAX_EMAILS) return bad(`at most ${MAX_EMAILS} addresses.`);
      const wrong = list.find((e) => !isEmail(e));
      if (wrong) return bad(`"${wrong.slice(0, 60)}" is not an email address.`);
      const value = list.join(', ');
      return value.length <= MAX_VALUE ? { ok: true, value } : bad(`the list is too long (${MAX_VALUE} characters at most).`);
    }
    case 'release':
      return REF.test(v) ? { ok: true, value: v } : bad('enter a release tag like v2026.11.5.');
  }
}

export interface SiteSettings {
  kitsSalesOpen: boolean;
  kitsLifetimeUntil: string;
  skillsRef: string | null;
  motivSalesOpen: boolean;
  motivDefaultSeats: number;
  motivLeaseDays: number;
  motivPastDueGraceDays: number;
  stripeAutomaticTax: boolean;
  contactTo: string;
  assessmentNotifyTo: string;
  /** Empty means send to ADMIN_EMAILS. */
  alertEmails: string[];
  emailReplyTo: string;
  kitsLaunchDate: string | null;
}

export type SettingSource = 'saved' | 'netlify' | 'default' | 'cleared';

/**
 * The value in effect for one setting and where it comes from. A stored row wins: an empty
 * row is an explicit clear (the default), stored while the Netlify variable is still set so
 * the variable no longer applies. With no row, the Netlify variable the setting replaced is
 * used if it is set and passes the check (so values carry over until saved on
 * /admin/settings), then the default. A stored value that no longer passes its check falls
 * back to the default.
 */
export function effectiveSetting(
  def: SettingDef,
  stored: Record<string, string | undefined>,
  env: Record<string, string | undefined> = process.env,
): { value: string | null; source: SettingSource } {
  const raw = Object.hasOwn(stored, def.key) ? stored[def.key] : undefined;
  if (raw === undefined) {
    const fromEnv = env[def.env]?.trim();
    if (fromEnv) {
      const c = checkSetting(def, fromEnv);
      if (c.ok && c.value !== null) return { value: c.value, source: 'netlify' };
    }
    return { value: def.fallback, source: 'default' };
  }
  if (raw === '') return { value: def.fallback, source: 'cleared' };
  const c = checkSetting(def, raw);
  return c.ok && c.value !== null ? { value: c.value, source: 'saved' } : { value: def.fallback, source: 'default' };
}

/**
 * The stored form of a value saved from /admin/settings. Default or blank is kept as an
 * empty row while the Netlify variable is still set, so clearing works as the page shows;
 * otherwise the row is removed (null).
 */
export function storedForm(def: SettingDef, value: string | null, env: Record<string, string | undefined> = process.env): string | null {
  if (value !== null) return value;
  return env[def.env]?.trim() ? '' : null;
}

/** Typed settings from stored rows; see effectiveSetting. */
export function resolveSettings(
  stored: Record<string, string | undefined>,
  env: Record<string, string | undefined> = process.env,
): SiteSettings {
  const get = (key: string): string | null => effectiveSetting(settingDef(key)!, stored, env).value;
  const num = (key: string) => Number(get(key));
  const launch = Object.hasOwn(stored, KITS_LAUNCH_DATE) ? stored[KITS_LAUNCH_DATE] : undefined;
  return {
    kitsSalesOpen: get('kits_sales_open') === 'true',
    kitsLifetimeUntil: get('kits_lifetime_until')!,
    skillsRef: get('skills_ref'),
    motivSalesOpen: get('motiv_sales_open') === 'true',
    motivDefaultSeats: num('motiv_default_seats'),
    motivLeaseDays: num('motiv_lease_days'),
    motivPastDueGraceDays: num('motiv_past_due_grace_days'),
    stripeAutomaticTax: get('stripe_automatic_tax') !== 'false',
    contactTo: get('contact_to')!,
    assessmentNotifyTo: get('assessment_notify_to')!,
    alertEmails: (get('alert_emails') ?? '').split(',').map((e) => e.trim()).filter(Boolean),
    emailReplyTo: get('email_reply_to')!,
    kitsLaunchDate: isDay(launch) ? launch : null,
  };
}

/** How a value reads on /admin/settings. */
export function displayValue(def: SettingDef, value: string | null): string {
  if (value === null) return def.unsetText ?? 'Not set';
  if (def.kind === 'switch') return value === 'true' ? 'On' : 'Off';
  return value;
}
