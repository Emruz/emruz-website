// Privacy controls (#77): consent, Global Privacy Control and request rules.
// Pure functions with no server imports, so tests and the purge function can use them.

export const CONSENT_COOKIE = 'emruz_consent';
export const CONSENT_VERSION = 1;
/** The consent choice is kept for a year, then asked again. */
export const CONSENT_MAX_AGE = 365 * 24 * 3600;

/** Activity logs (events) are kept this many months. */
export const LOG_RETENTION_MONTHS = 13;
/** Closed privacy requests are kept two years as a record of how they were handled. */
export const REQUEST_RETENTION_DAYS = 730;
/** Unconfirmed requests are dropped after this many days. */
export const UNCONFIRMED_DAYS = 7;

export interface ConsentChoice {
  improve: boolean;
}

export interface ConsentState {
  /** What the visitor chose, or null when they haven't chosen yet */
  choice: ConsentChoice | null;
  /** The browser sends Global Privacy Control */
  gpc: boolean;
  /** Improvement (analytics) cookies and linking may be used */
  improve: boolean;
  /** Show the banner: no choice yet and no GPC signal */
  showBanner: boolean;
}

/** Cookie value: "v1.i1" (improvement on) or "v1.i0" (necessary only). */
export function serializeConsent(c: ConsentChoice): string {
  return `v${CONSENT_VERSION}.i${c.improve ? 1 : 0}`;
}

export function parseConsent(value: string | null | undefined): ConsentChoice | null {
  const m = /^v(\d+)\.i([01])$/.exec(value ?? '');
  if (!m || Number(m[1]) !== CONSENT_VERSION) return null;
  return { improve: m[2] === '1' };
}

/** Sec-GPC: 1 means the visitor opts out of sale, sharing and non-necessary tracking. */
export function gpcEnabled(header: string | null | undefined): boolean {
  return (header ?? '').trim() === '1';
}

export function consentState(cookieValue: string | null | undefined, gpcHeader: string | null | undefined): ConsentState {
  const choice = parseConsent(cookieValue);
  const gpc = gpcEnabled(gpcHeader);
  return { choice, gpc, improve: !gpc && !!choice?.improve, showBanner: !choice && !gpc };
}

export const REQUEST_KINDS = ['access', 'correct', 'delete', 'opt_out'] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];
export const REQUEST_KIND_LABELS: Record<RequestKind, string> = {
  access: 'Get a copy of my data',
  correct: 'Correct my data',
  delete: 'Delete my data',
  opt_out: 'Opt out of emails and non-necessary cookies',
};

export const REQUEST_STATUSES = ['unconfirmed', 'open', 'in_progress', 'completed', 'rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** 30 days to respond, 45 for California residents (CCPA). */
export function responseDays(california: boolean): number {
  return california ? 45 : 30;
}

export function dueDate(confirmedAt: Date, california: boolean): Date {
  return new Date(confirmedAt.getTime() + responseDays(california) * 86_400_000);
}

/** Whole days until the due date; negative when overdue. */
export function daysLeft(due: Date, now: Date = new Date()): number {
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validation messages parseRequest can return (the form only shows these, never arbitrary text). */
export const REQUEST_ERRORS = [
  'Choose what you would like us to do.',
  'Enter a valid email address.',
  'Tell us what needs to be corrected.',
] as const;

export interface RequestInput {
  kind: RequestKind;
  email: string;
  name: string | null;
  details: string | null;
  california: boolean;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validate the public request form. Returns the request or an error message. */
export function parseRequest(f: Record<string, unknown>): RequestInput | string {
  const kind = text(f.kind, 20) as RequestKind;
  if (!REQUEST_KINDS.includes(kind)) return REQUEST_ERRORS[0];
  const email = text(f.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return REQUEST_ERRORS[1];
  const details = text(f.details, 4000) || null;
  if (kind === 'correct' && !details) return REQUEST_ERRORS[2];
  return { kind, email, name: text(f.name, 120) || null, details, california: f.california === 'on' || f.california === true };
}
