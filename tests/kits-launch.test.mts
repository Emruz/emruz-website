// Kits launch conditions (#71): purchase triggers, accounts outside Emruz, sales metrics,
// the 90-day review against the kill lines, and the /kits page structure.
// Run: node --conditions=react-server --experimental-strip-types tests/kits-launch.test.mts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isDay, isInternalEmail, isPurchaseTrigger, KILL_LINES, launchReview, parseOffer, PURCHASE_TRIGGERS, releaseCyclesSince, salesMetrics,
  triggerLabel, type PurchaseRow,
} from '../src/lib/server/kits/launch-core.ts';
import { subscriptionType } from '../src/lib/server/kits/sales-core.ts';
import { BUNDLE_PACK, kitOffers, kitResults, LEAD_PACK } from '../src/content/kits.ts';

// ---------- Triggers ----------
assert.deepEqual(PURCHASE_TRIGGERS.map((t) => t.id), ['launch', 'customer_request', 'pricing_fundraise', 'incident', 'other']);
for (const t of PURCHASE_TRIGGERS) {
  assert.ok(isPurchaseTrigger(t.id));
  assert.match(t.id, /^[a-z_]{1,40}$/, 'fits the migration 024 check');
}
assert.ok(!isPurchaseTrigger('') && !isPurchaseTrigger('Launch') && !isPurchaseTrigger(undefined) && !isPurchaseTrigger('__proto__'));
assert.equal(triggerLabel(null), 'Not recorded');
assert.equal(triggerLabel('gone'), 'Not recorded');

// ---------- Offers from the buy form ----------
assert.deepEqual(parseOffer('release:once', '', ''), { pack: 'release', plan: 'once' });
assert.deepEqual(parseOffer('all:lifetime', '', ''), { pack: 'all', plan: 'lifetime' });
assert.deepEqual(parseOffer('', 'founder', 'month'), { pack: 'founder', plan: 'month' }, 'pack and plan fields still work');
assert.deepEqual(parseOffer('Release:once', 'x', 'y'), { pack: 'x', plan: 'y' }, 'malformed offer is ignored');
assert.deepEqual(parseOffer('release:once:extra', 'x', 'y'), { pack: 'x', plan: 'y' });

// ---------- Subscription type ----------
assert.equal(subscriptionType('month'), 'monthly');
assert.equal(subscriptionType('year'), 'annual');
assert.equal(subscriptionType('once'), null);
assert.equal(subscriptionType('lifetime'), null);

// ---------- Outside Emruz ----------
const admins = ['owner@gmail.com'];
assert.ok(isInternalEmail('shahin@emruz.com', admins));
assert.ok(isInternalEmail(' Team@Emruz.com ', admins));
assert.ok(isInternalEmail('a@mail.emruz.com', admins), 'subdomain');
assert.ok(isInternalEmail('Owner@Gmail.com', admins), 'admin');
assert.ok(!isInternalEmail('buyer@notemruz.com', admins), 'look-alike domain is a customer');
assert.ok(!isInternalEmail('emruz.com@acme.io', admins));
assert.ok(!isInternalEmail('buyer@acme.io', admins));

// ---------- Sales metrics ----------
const internal = (e: string) => isInternalEmail(e, admins);
const row = (accountId: string, email: string, pack: string, plan: string | null, trigger: string | null, active = true): PurchaseRow => ({ accountId, email, pack, plan, trigger, active });
const purchases = [
  row('a', 'a@acme.io', 'release', 'once', 'launch'),
  row('a', 'a@acme.io', 'founder', 'monthly', 'customer_request'), // one account, two kits: counted once as paying
  row('b', 'b@beta.io', 'release', 'once', 'launch'),
  row('c', 'c@gamma.io', 'all', 'lifetime', null),
  row('d', 'd@delta.io', 'release', 'annual', 'incident', false), // refunded: not paying, trigger still counts
  row('e', 'e@emruz.com', 'release', 'once', 'launch'), // staff test purchase
  row('f', 'owner@gmail.com', 'all', 'annual', 'other'), // admin
  row('g', 'g@eps.io', 'marketing', 'once', 'bogus'),
];
const mcp = [
  { accountId: 'a', email: 'a@acme.io' },
  { accountId: 'b', email: 'b@beta.io' },
  { accountId: 'x', email: 'x@free.io' },
  { accountId: 'y', email: 'y@free.io' },
  { accountId: 'e', email: 'e@emruz.com' },
];
const m = salesMetrics(purchases, mcp, internal);
assert.equal(m.payingAccounts, 4, 'a, b, c, g');
assert.deepEqual(m.byKit, [
  { pack: 'release', plan: 'once', accounts: 2 },
  { pack: 'all', plan: 'lifetime', accounts: 1 },
  { pack: 'founder', plan: 'monthly', accounts: 1 },
  { pack: 'marketing', plan: 'once', accounts: 1 },
]);
assert.equal(m.mcpAccounts, 4, 'staff MCP account left out');
assert.equal(m.mcpPaying, 2);
assert.equal(m.conversion, 50);
assert.deepEqual(m.triggers, [
  { id: 'launch', count: 2 },
  { id: null, count: 2 }, // none recorded, and an unknown value
  { id: 'customer_request', count: 1 },
  { id: 'incident', count: 1 },
]);
const empty = salesMetrics([], [], internal);
assert.equal(empty.payingAccounts, 0);
assert.equal(empty.conversion, null);
assert.deepEqual(empty.triggers, []);

// ---------- Release cycles ----------
assert.equal(releaseCyclesSince('2026-12-01', ['v2026.12.1', 'v2026.12.2']), 0, 'the launch month is not a cycle');
assert.equal(releaseCyclesSince('2026-12-01', ['v2027.01.1', 'v2027.01.3', 'v2026.12.1']), 1, 'one month with releases');
assert.equal(releaseCyclesSince('2026-12-15', ['v2027.2.1', 'v2027.01.1', 'v2026.11.9']), 2);
assert.equal(releaseCyclesSince('2026-12-15', ['junk', 'v2027.03']), 0);
assert.equal(releaseCyclesSince('soon', ['v2027.01.1']), 0);

// ---------- Launch date, set on /admin/kits ----------
assert.ok(isDay('2026-12-01') && isDay('2028-02-29'));
for (const bad of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-12-1', '12/01/2026', '', null, 20261201]) assert.ok(!isDay(bad), String(bad));
assert.match(actions0(), /export async function setLaunchDate\(form: FormData\) \{\n  const actor = await admin\(\);/, 'admin only');
assert.match(actions0(), /if \(!isDay\(day\)\) back\(/);
assert.doesNotMatch(readFileSync('src/lib/server/config.ts', 'utf8'), /KITS_LAUNCH_DATE/, 'no environment variable');
assert.match(readFileSync('netlify/database/migrations/026_kit_settings.sql', 'utf8'), /create table if not exists kit_settings/);
function actions0() { return readFileSync('src/app/admin/kits/actions.ts', 'utf8'); }

// ---------- 90-day review ----------
const launch = '2026-12-01';
assert.equal(launchReview(null, 0, 0, new Date()), null);
assert.equal(launchReview('12/01/2026', 0, 0, new Date()), null);
assert.equal(launchReview('2026-02-30x', 0, 0, new Date()), null);
{
  const r = launchReview(launch, 5, 0, new Date('2026-12-11T12:00:00Z'))!;
  assert.equal(r.reviewOn, '2027-03-01');
  assert.equal(r.daysLeft, 80);
  assert.equal(r.review, 'pending');
  assert.equal(r.cycleLine, 'pending');
}
{
  const r = launchReview(launch, KILL_LINES.review - 1, 1, new Date('2027-03-01T00:00:00Z'))!;
  assert.equal(r.daysLeft, 0);
  assert.equal(r.review, 'missed', 'under 20 at 90 days');
  assert.equal(r.cycleLine, 'pending', 'only one release cycle');
}
assert.equal(launchReview(launch, KILL_LINES.review, 0, new Date('2027-04-01'))!.review, 'met');
assert.equal(launchReview(launch, KILL_LINES.review, 0, new Date('2026-12-02'))!.review, 'met', 'met early');
assert.equal(launchReview(launch, KILL_LINES.cycles - 1, 2, new Date('2027-04-01'))!.cycleLine, 'missed', 'under 25 after two cycles');
assert.equal(launchReview(launch, KILL_LINES.cycles, 2, new Date('2027-04-01'))!.cycleLine, 'met');

// ---------- /kits leads with the Release Kit ----------
assert.equal(LEAD_PACK, 'release');
assert.ok(kitOffers.some((o) => o.pack === LEAD_PACK));
assert.ok(kitOffers.some((o) => o.pack === BUNDLE_PACK), 'the all-kits bundle stays');
assert.deepEqual(kitOffers.map((o) => o.pack), ['release', 'founder', 'marketing', 'product', 'all'], 'Product Kit is an add-on after Founder and Marketing (#81)');
assert.ok(kitOffers.find((o) => o.pack === BUNDLE_PACK)!.covers.includes('Release, Founder, Marketing and Product Kits'), 'bundle names all four kits');
// Every pack and the bundle has its logo from emruz-kits assets/packs, with nothing active in it (#81)
for (const o of kitOffers) {
  const svg = readFileSync(`public/kits/${o.pack}.svg`, 'utf8');
  assert.match(svg, /^<svg[\s>]/, `${o.pack} logo is an SVG`);
  assert.doesNotMatch(svg, /<script|<foreignObject|\son[a-z]+=|(?:xlink:)?href=["'](?!#)/i, `${o.pack} logo has no scripts or external references`);
  assert.doesNotMatch(svg, /c2pa|<metadata/i, `${o.pack} logo carries no embedded metadata or provenance record`);
}
const page = readFileSync('src/app/kits/page.tsx', 'utf8');
assert.match(page, /card\(lead, true\)[\s\S]*Add-ons[\s\S]*card\(bundle, false, true\)/, 'Release Kit, then add-ons, then the bundle at full width');
assert.match(page, /<select name="trigger" required/, 'buyers must say what made them buy');
assert.match(page, /ask={canBuyAny}/, 'no question when there is nothing to buy');
assert.match(page, /name="offer"/);
assert.match(page, /href="\/kits\/security"/);
assert.match(page, /id="overview"/, 'overview band like the Motiv page');
assert.match(page, /skills in the Release Kit are free to use/, 'Free to start says which skills are free');
assert.match(page, /kitResults\.length > 0 &&/, 'results hidden until there are published results');

// Results: no placeholder claims. Each one links to where the customer published it.
for (const r of kitResults) {
  assert.ok(r.customer.trim() && r.outcome.trim(), 'customer and outcome');
  assert.ok(kitOffers.some((o) => o.pack === r.pack), `${r.customer}: known kit`);
  assert.equal(new URL(r.source).protocol, 'https:', `${r.customer}: published source`);
  assert.doesNotMatch(`${r.customer} ${r.outcome}`, /lorem|placeholder|tbd|example|acme/i, `${r.customer}: not a placeholder`);
}

// ---------- Security statement ----------
const security = readFileSync('src/app/kits/security/page.tsx', 'utf8');
for (const topic of ['OAuth 2.1', 'PKCE', 'read-only', 'ACCESS_TTL_SECONDS', 'REFRESH_TTL_SECONDS', 'What is stored', 'Audit log', 'LIMITS.', 'Hosting']) {
  assert.ok(security.includes(topic), `security statement covers ${topic}`);
}
assert.match(readFileSync('src/app/oauth/authorize/Consent.tsx', 'utf8'), /href="\/kits\/security"/, 'linked from the consent page');
assert.match(readFileSync('src/app/sitemap.ts', 'utf8'), /\/kits\/security`/);

// ---------- Excluded emails, managed on /admin/kits ----------
const actions = readFileSync('src/app/admin/kits/actions.ts', 'utf8');
for (const fn of ['excludeEmail', 'includeEmail']) {
  assert.match(actions, new RegExp(`export async function ${fn}\\(form: FormData\\) \\{\\n  const actor = await admin\\(\\);`), `${fn} checks for an admin first`);
}
assert.match(actions, /insert into kit_excluded_emails/);
assert.match(actions, /delete from kit_excluded_emails where email = \$\{email\}/);
assert.match(readFileSync('src/lib/server/kits/launch.ts', 'utf8'), /\[\.\.\.adminEmails\(\), \.\.\.excluded\.map/, 'excluded emails are left out with admins');
assert.ok(isInternalEmail('Family@Gmail.com', ['family@gmail.com']), 'an excluded email is left out whatever its case');
assert.match(readFileSync('netlify/database/migrations/025_kit_excluded_emails.sql', 'utf8'), /create table if not exists kit_excluded_emails/);

// ---------- Checkout and webhook keep the trigger ----------
const checkout = readFileSync('src/app/api/kits/checkout/route.ts', 'utf8');
assert.match(checkout, /isPurchaseTrigger\(trigger\)\) return back\('\?notice=trigger'\)/);
assert.match(checkout, /metadata = \{[^}]*trigger/);
const sales = readFileSync('src/lib/server/kits/sales.ts', 'utf8');
assert.match(sales, /purchase_trigger, subscription_type\)/);
assert.match(sales, /\$\{subscription \? subscriptionType\(plan\) : null\}\)/, 'subscriptions store monthly or annual');
assert.match(sales, /set subscription_type = \$\{type\}/, 'a monthly/annual switch is kept');
assert.match(readFileSync('src/lib/server/kits/launch.ts', 'utf8'), /coalesce\(e\.subscription_type,/);
assert.match(sales, /isPurchaseTrigger\(m\.trigger\) \? m\.trigger : null/);
assert.match(readFileSync('netlify/database/migrations/024_kit_purchase_trigger.sql', 'utf8'), /add column if not exists purchase_trigger text/);
assert.match(readFileSync('netlify/database/migrations/024_kit_purchase_trigger.sql', 'utf8'), /subscription_type text check \(subscription_type in \('monthly', 'annual'\)\)/);

console.log('kits-launch: ok');
