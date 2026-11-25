// Emruz kit pack sales (#68): plans, Stripe lookup keys and what an account may buy.
// Pure functions; tests load this file directly.
import 'server-only';

const REF = /^v(\d{4})\.(\d{1,2})\.(\d{1,4})$/;
/** Release tag order, as compareRefs in content-core. */
function compareRefs(a: string, b: string): number {
  const x = REF.exec(a)!.slice(1).map(Number);
  const y = REF.exec(b)!.slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export const KIT_PLANS = ['once', 'upgrade', 'month', 'year', 'lifetime'] as const;
export type KitPlan = (typeof KIT_PLANS)[number];
export type KitKind = 'once' | 'upgrade' | 'subscription' | 'lifetime';

export const isKitPlan = (v: unknown): v is KitPlan => typeof v === 'string' && (KIT_PLANS as readonly string[]).includes(v);
export const isSubscriptionPlan = (p: KitPlan) => p === 'month' || p === 'year';
export const kindFor = (p: KitPlan): KitKind => (isSubscriptionPlan(p) ? 'subscription' : p);
/** One-time purchases held at the release bought; lifetime and subscriptions follow new releases. */
export const heldAtRelease = (p: KitPlan) => p === 'once' || p === 'upgrade';
/** The founding lifetime offer is on the all-kits bundle only. */
export const LIFETIME_PACK = 'all';

/** Stripe price lookup key, for example kits_release_once. */
export const lookupKey = (pack: string, plan: KitPlan) => `kits_${pack}_${plan}`;

/** Packs that can be bought: every pack in the release, plus the "all" bundle. */
export const sellablePacks = (manifestPacks: string[]) => [...manifestPacks, 'all'];

export interface OwnedEntitlement {
  pack: string;
  /** null follows new releases (subscription, lifetime or staff grant). */
  throughRef: string | null;
  kind?: KitKind | null;
}

/** What an account has for one pack, counting the "all" bundle. */
export type Holding = { state: 'none' } | { state: 'latest' } | { state: 'held'; ref: string; upgradable: boolean };

/**
 * latest: always current (a subscription or open grant), or held at the latest release.
 * held: held at an older release; upgradable when an own entitlement for this pack
 * (or "all" for the bundle) is the one held, so the upgrade price applies.
 */
export function holding(pack: string, ents: OwnedEntitlement[], latest: string): Holding {
  const covering = ents.filter((e) => e.pack === pack || e.pack === 'all');
  if (!covering.length) return { state: 'none' };
  if (covering.some((e) => e.throughRef === null || compareRefs(e.throughRef, latest) >= 0)) return { state: 'latest' };
  const own = ents.filter((e) => e.pack === pack && e.throughRef !== null);
  const best = (list: OwnedEntitlement[]) => list.map((e) => e.throughRef!).sort((a, b) => compareRefs(b, a))[0];
  if (own.length) return { state: 'held', ref: best(own), upgradable: true };
  return { state: 'held', ref: best(covering), upgradable: false };
}

export type BuyCheck = { ok: true } | { ok: false; reason: 'unknown_pack' | 'owned' | 'use_upgrade' | 'no_upgrade' | 'lifetime_closed' };

/** The founding lifetime offer: open until the end of `until` (UTC) and while fewer than `cap` have bought. */
export function lifetimeOpen(until: string | null, sold: number, cap: number, now: Date): boolean {
  if (!until || !/^\d{4}-\d{2}-\d{2}$/.test(until)) return false;
  const end = Date.parse(`${until}T23:59:59.999Z`);
  return Number.isFinite(end) && now.getTime() <= end && sold < cap;
}

/**
 * Whether an account may start this checkout. `lifetimeOffer` says whether the
 * founding lifetime offer is open. A subscriber may move to lifetime.
 */
export function canBuy(pack: string, plan: KitPlan, ents: OwnedEntitlement[], latest: string, manifestPacks: string[], lifetimeOffer = false): BuyCheck {
  if (!sellablePacks(manifestPacks).includes(pack)) return { ok: false, reason: 'unknown_pack' };
  if (plan === 'lifetime') {
    if (pack !== LIFETIME_PACK) return { ok: false, reason: 'unknown_pack' };
    if (ents.some((e) => e.pack === LIFETIME_PACK && (e.kind === 'lifetime' || (e.throughRef === null && e.kind !== 'subscription')))) return { ok: false, reason: 'owned' };
    return lifetimeOffer ? { ok: true } : { ok: false, reason: 'lifetime_closed' };
  }
  const h = holding(pack, ents, latest);
  if (plan === 'upgrade') return h.state === 'held' && h.upgradable ? { ok: true } : { ok: false, reason: 'no_upgrade' };
  if (h.state === 'latest') return { ok: false, reason: 'owned' };
  if (plan === 'once' && h.state === 'held' && h.upgradable) return { ok: false, reason: 'use_upgrade' };
  return { ok: true };
}

/** Subscription statuses that end access. past_due keeps access while Stripe retries. */
export const subscriptionEnded = (status: string) => status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired';
