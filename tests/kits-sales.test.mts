// Emruz kit pack sales (#68): lookup keys, holdings and what an account may buy.
// Run: node --conditions=react-server --experimental-strip-types tests/kits-sales.test.mts
import assert from 'node:assert/strict';
import {
  canBuy, heldAtRelease, holding, isKitPlan, kindFor, lifetimeOpen, lookupKey, sellablePacks, subscriptionEnded, type OwnedEntitlement,
} from '../src/lib/server/kits/sales-core.ts';
import { decide } from '../src/lib/server/kits/content-core.ts';
import { kitOffers } from '../src/content/kits.ts';

const packs = ['release', 'founder', 'marketing'];
const latest = 'v2026.11.5';
const old = 'v2026.11.3';

// ---------- Plans and keys ----------
assert.equal(lookupKey('marketing', 'month'), 'kits_marketing_month');
assert.equal(lookupKey('all', 'upgrade'), 'kits_all_upgrade');
assert.ok(isKitPlan('once') && isKitPlan('year'));
assert.ok(isKitPlan('lifetime'));
assert.ok(!isKitPlan('forever') && !isKitPlan(''));
assert.equal(kindFor('month'), 'subscription');
assert.equal(kindFor('year'), 'subscription');
assert.equal(kindFor('upgrade'), 'upgrade');
assert.deepEqual(sellablePacks(packs), ['release', 'founder', 'marketing', 'all']);

// ---------- Holdings ----------
assert.deepEqual(holding('release', [], latest), { state: 'none' });
assert.deepEqual(holding('release', [{ pack: 'release', throughRef: null }], latest), { state: 'latest' }, 'subscription');
assert.deepEqual(holding('release', [{ pack: 'release', throughRef: latest }], latest), { state: 'latest' }, 'bought at latest');
assert.deepEqual(holding('release', [{ pack: 'all', throughRef: null }], latest), { state: 'latest' }, 'bundle subscription covers a pack');
assert.deepEqual(holding('release', [{ pack: 'release', throughRef: old }], latest), { state: 'held', ref: old, upgradable: true });
assert.deepEqual(
  holding('release', [{ pack: 'all', throughRef: old }], latest),
  { state: 'held', ref: old, upgradable: false },
  'an old bundle does not make the single pack upgrade price apply',
);
assert.deepEqual(holding('all', [{ pack: 'all', throughRef: old }], latest), { state: 'held', ref: old, upgradable: true });
assert.deepEqual(holding('all', [{ pack: 'release', throughRef: null }], latest), { state: 'none' }, 'one pack is not the bundle');
assert.deepEqual(
  holding('release', [{ pack: 'release', throughRef: 'v2026.11.1' }, { pack: 'release', throughRef: old }], latest),
  { state: 'held', ref: old, upgradable: true },
  'newest held release wins',
);

// ---------- What may be bought ----------
const none: OwnedEntitlement[] = [];
for (const plan of ['once', 'month', 'year'] as const) assert.deepEqual(canBuy('marketing', plan, none, latest, packs), { ok: true });
assert.deepEqual(canBuy('all', 'once', none, latest, packs), { ok: true });
assert.deepEqual(canBuy('design', 'once', none, latest, packs), { ok: false, reason: 'unknown_pack' });
assert.deepEqual(canBuy('marketing', 'upgrade', none, latest, packs), { ok: false, reason: 'no_upgrade' }, 'nothing to upgrade');

const heldOld = [{ pack: 'release', throughRef: old }];
assert.deepEqual(canBuy('release', 'upgrade', heldOld, latest, packs), { ok: true });
assert.deepEqual(canBuy('release', 'once', heldOld, latest, packs), { ok: false, reason: 'use_upgrade' });
assert.deepEqual(canBuy('release', 'month', heldOld, latest, packs), { ok: true }, 'may switch to a subscription');

const sub = [{ pack: 'release', throughRef: null }];
for (const plan of ['once', 'upgrade', 'month', 'year'] as const) assert.equal(canBuy('release', plan, sub, latest, packs).ok, false);
assert.deepEqual(canBuy('founder', 'once', sub, latest, packs), { ok: true }, 'other packs still on sale');

const bundleOld = [{ pack: 'all', throughRef: old }];
assert.deepEqual(canBuy('all', 'upgrade', bundleOld, latest, packs), { ok: true });
assert.deepEqual(canBuy('release', 'upgrade', bundleOld, latest, packs), { ok: false, reason: 'no_upgrade' });
assert.deepEqual(canBuy('release', 'once', bundleOld, latest, packs), { ok: true }, 'may buy one pack at latest on top of an old bundle');

// ---------- Access follows purchases ----------
const skill = { pack: 'marketing', access: 'full' as const };
assert.deepEqual(decide(skill, [{ pack: 'marketing', throughRef: latest }], latest), { allowed: true, ref: latest });
assert.deepEqual(decide({ pack: 'release', access: 'full' }, [{ pack: 'marketing', throughRef: latest }], latest), { allowed: false, reason: 'paid' },
  'Marketing buyer gets nothing paid from other packs');
assert.deepEqual(decide({ pack: 'release', access: 'free' }, [{ pack: 'marketing', throughRef: latest }], latest), { allowed: true, ref: latest });
assert.deepEqual(decide(skill, [{ pack: 'all', throughRef: null }], latest), { allowed: true, ref: latest }, 'bundle gets everything');
assert.deepEqual(decide(skill, [{ pack: 'marketing', throughRef: old }, { pack: 'marketing', throughRef: latest }], latest), { allowed: true, ref: latest },
  'after an upgrade the newest release is served');

// ---------- Founding lifetime offer ----------
assert.equal(kindFor('lifetime'), 'lifetime');
assert.ok(heldAtRelease('once') && heldAtRelease('upgrade'));
assert.ok(!heldAtRelease('lifetime') && !heldAtRelease('month'), 'lifetime follows new releases');
const day = new Date('2026-12-01T10:00:00Z');
assert.ok(lifetimeOpen('2026-12-01', 0, 50, day), 'open through the last day');
assert.ok(!lifetimeOpen('2026-11-30', 0, 50, day), 'closed after the date');
assert.ok(!lifetimeOpen('2026-12-31', 50, 50, day), 'closed at the cap');
assert.ok(lifetimeOpen('2026-12-31', 49, 50, day));
assert.ok(!lifetimeOpen(null, 0, 50, day) && !lifetimeOpen('soon', 0, 50, day), 'no date, no offer');
assert.deepEqual(canBuy('all', 'lifetime', none, latest, packs, true), { ok: true });
assert.deepEqual(canBuy('all', 'lifetime', none, latest, packs, false), { ok: false, reason: 'lifetime_closed' });
assert.deepEqual(canBuy('release', 'lifetime', none, latest, packs, true), { ok: false, reason: 'unknown_pack' }, 'bundle only');
assert.deepEqual(canBuy('all', 'lifetime', [{ pack: 'all', throughRef: null, kind: 'subscription' }], latest, packs, true), { ok: true },
  'a subscriber may move to lifetime');
assert.deepEqual(canBuy('all', 'lifetime', [{ pack: 'all', throughRef: null, kind: 'lifetime' }], latest, packs, true), { ok: false, reason: 'owned' });
assert.deepEqual(canBuy('all', 'lifetime', [{ pack: 'all', throughRef: old, kind: 'once' }], latest, packs, true), { ok: true },
  'an old one-time bundle may move to lifetime');
assert.deepEqual(decide(skill, [{ pack: 'all', throughRef: null }], latest), { allowed: true, ref: latest }, 'lifetime gets the latest release');

// ---------- Subscription end ----------
assert.ok(subscriptionEnded('canceled') && subscriptionEnded('unpaid') && subscriptionEnded('incomplete_expired'));
assert.ok(!subscriptionEnded('active') && !subscriptionEnded('past_due') && !subscriptionEnded('trialing'));

// ---------- Page prices match the Stripe prices set up for #68 ----------
assert.deepEqual(
  Object.fromEntries(kitOffers.map((o) => [o.pack, o.prices])),
  {
    release: { once: 79, upgrade: 29, month: 10, year: 99 },
    founder: { once: 79, upgrade: 29, month: 10, year: 99 },
    marketing: { once: 49, upgrade: 19, month: 6, year: 59 },
    all: { once: 149, upgrade: 59, month: 19, year: 189, lifetime: 549 },
  },
);
for (const o of kitOffers) {
  assert.ok(o.prices.upgrade < o.prices.once, `${o.pack}: upgrade costs less than buying`);
  assert.ok(o.prices.year < o.prices.month * 12, `${o.pack}: annual is discounted`);
}

console.log('kits-sales ok');
