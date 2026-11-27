// Kits launch conditions (#71): purchase triggers, accounts outside Emruz and the
// 90-day review against the kill lines. Pure functions; tests load this file directly.
import 'server-only';

/** What made a buyer buy now, asked on the Stripe Checkout page (#86). Stored on the entitlement. */
export const PURCHASE_TRIGGERS = [
  { id: 'launch', label: 'A launch or release coming up' },
  { id: 'customer_request', label: 'A customer asked about security or compliance' },
  { id: 'pricing_fundraise', label: 'Pricing work or a fundraise' },
  { id: 'incident', label: 'An incident or near miss' },
  { id: 'technical_decision', label: 'A big technical or architecture decision' },
  { id: 'other', label: 'Something else' },
] as const;
export type PurchaseTrigger = (typeof PURCHASE_TRIGGERS)[number]['id'];

export const isPurchaseTrigger = (v: unknown): v is PurchaseTrigger =>
  typeof v === 'string' && PURCHASE_TRIGGERS.some((t) => t.id === v);

/** Stripe Checkout custom field that asks the question (#86). Stripe keys and values are alphanumeric only. */
export const TRIGGER_FIELD_KEY = 'purchasetrigger';
export const stripeTriggerValue = (id: PurchaseTrigger) => id.replace(/_/g, '');

/** The required dropdown on the kits checkout page. */
export function triggerField() {
  return {
    key: TRIGGER_FIELD_KEY,
    label: { type: 'custom' as const, custom: 'What made you buy now?' },
    type: 'dropdown' as const,
    optional: false,
    dropdown: { options: PURCHASE_TRIGGERS.map((t) => ({ label: t.label, value: stripeTriggerValue(t.id) })) },
  };
}

interface SessionTriggerSource {
  custom_fields?: { key: string; dropdown?: { value?: string | null } | null }[] | null;
  metadata?: Record<string, string> | null;
}

/** The buyer's answer: the Stripe checkout field, or metadata.trigger for checkouts started before #86. */
export function triggerFromSession(session: SessionTriggerSource): PurchaseTrigger | null {
  const value = session.custom_fields?.find((f) => f.key === TRIGGER_FIELD_KEY)?.dropdown?.value;
  if (value) return PURCHASE_TRIGGERS.find((t) => stripeTriggerValue(t.id) === value)?.id ?? null;
  const old = session.metadata?.trigger;
  return isPurchaseTrigger(old) ? old : null;
}

export const triggerLabel = (id: string | null) =>
  PURCHASE_TRIGGERS.find((t) => t.id === id)?.label ?? 'Not recorded';

/** Emruz's own domain; its accounts (and any subdomain), admins and the excluded emails are not customers. */
export const INTERNAL_DOMAINS = ['emruz.com'];

export function isInternalEmail(email: string, excluded: string[], domains = INTERNAL_DOMAINS): boolean {
  const e = email.trim().toLowerCase();
  if (excluded.includes(e)) return true;
  const domain = e.slice(e.lastIndexOf('@') + 1);
  return domains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** Buy buttons send offer=<pack>:<plan>; older forms send pack and plan. */
export function parseOffer(offer: string, pack: string, plan: string): { pack: string; plan: string } {
  const m = /^([a-z0-9][a-z0-9-]{0,39}):([a-z]{1,20})$/.exec(offer);
  return m ? { pack: m[1], plan: m[2] } : { pack, plan };
}

export interface PurchaseRow {
  accountId: string;
  email: string;
  pack: string;
  /** once, upgrade, monthly, annual or lifetime; subscription when it is no longer known. */
  plan: string | null;
  trigger: string | null;
  active: boolean;
}

export interface SalesMetrics {
  payingAccounts: number;
  byKit: { pack: string; plan: string; accounts: number }[];
  mcpAccounts: number;
  mcpPaying: number;
  /** Whole percent of signed-in MCP accounts that pay, or null with none signed in. */
  conversion: number | null;
  triggers: { id: string | null; count: number }[];
}

/**
 * Sales against the launch conditions, outside Emruz only. Paying: an account with an
 * active purchased kit. Triggers count every purchase, active or not.
 */
export function salesMetrics(purchases: PurchaseRow[], mcp: { accountId: string; email: string }[], internal: (email: string) => boolean): SalesMetrics {
  const outside = purchases.filter((p) => !internal(p.email));
  const paying = new Set(outside.filter((p) => p.active).map((p) => p.accountId));

  const kits = new Map<string, Set<string>>();
  for (const p of outside) {
    if (!p.active) continue;
    const key = `${p.pack}\u0000${p.plan ?? 'unknown'}`;
    (kits.get(key) ?? kits.set(key, new Set()).get(key)!).add(p.accountId);
  }
  const byKit = [...kits].map(([k, s]) => {
    const [pack, plan] = k.split('\u0000');
    return { pack, plan, accounts: s.size };
  }).sort((a, b) => b.accounts - a.accounts || a.pack.localeCompare(b.pack) || a.plan.localeCompare(b.plan));

  const signedIn = new Set(mcp.filter((m) => !internal(m.email)).map((m) => m.accountId));
  const mcpPaying = [...signedIn].filter((id) => paying.has(id)).length;

  const counts = new Map<string | null, number>();
  for (const p of outside) {
    const id = isPurchaseTrigger(p.trigger) ? p.trigger : null;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const order = (id: string | null) => (id === null ? PURCHASE_TRIGGERS.length : PURCHASE_TRIGGERS.findIndex((t) => t.id === id));
  const triggers = [...counts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || order(a.id) - order(b.id));

  return {
    payingAccounts: paying.size,
    byKit,
    mcpAccounts: signedIn.size,
    mcpPaying,
    conversion: signedIn.size ? Math.round((mcpPaying / signedIn.size) * 100) : null,
    triggers,
  };
}

export const REVIEW_DAYS = 90;
export const KILL_LINES = {
  /** Under this many paying accounts at the 90-day review: reprice or narrow. */
  review: 20,
  /** Under this many after two release cycles: stop new kit development. */
  cycles: 25,
  releaseCycles: 2,
} as const;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar day as YYYY-MM-DD (not 2026-02-30). */
export function isDay(v: unknown): v is string {
  if (typeof v !== 'string' || !DAY.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}
const TAG = /^v(\d{4})\.(\d{1,2})\.\d{1,4}$/;

/**
 * Release cycles since launch: calendar months after the launch month that have a
 * kits release. Releases are tagged vYYYY.MM.N, so the month comes from the tag.
 */
export function releaseCyclesSince(launch: string, tags: string[]): number {
  const l = DAY.exec(launch);
  if (!l) return 0;
  const start = Number(l[1]) * 12 + Number(l[2]);
  const months = new Set<number>();
  for (const t of tags) {
    const m = TAG.exec(t);
    if (m && Number(m[1]) * 12 + Number(m[2]) > start) months.add(Number(m[1]) * 12 + Number(m[2]));
  }
  return months.size;
}

export type LineState = 'pending' | 'met' | 'missed';

export interface LaunchReview {
  launch: string;
  /** YYYY-MM-DD, launch + 90 days. */
  reviewOn: string;
  daysLeft: number;
  review: LineState;
  cycles: number;
  cycleLine: LineState;
}

/** Where sales stand against the kill lines. null when no launch date is set on /admin/kits. */
export function launchReview(launch: string | null, paying: number, cycles: number, now: Date): LaunchReview | null {
  if (!isDay(launch)) return null;
  const start = Date.parse(`${launch}T00:00:00Z`);
  if (!Number.isFinite(start)) return null;
  const reviewAt = start + REVIEW_DAYS * 86_400_000;
  const daysLeft = Math.ceil((reviewAt - now.getTime()) / 86_400_000);
  const state = (due: boolean, line: number): LineState => (paying >= line ? 'met' : due ? 'missed' : 'pending');
  return {
    launch,
    reviewOn: new Date(reviewAt).toISOString().slice(0, 10),
    daysLeft,
    review: state(daysLeft <= 0, KILL_LINES.review),
    cycles,
    cycleLine: state(cycles >= KILL_LINES.releaseCycles, KILL_LINES.cycles),
  };
}
