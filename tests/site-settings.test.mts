// Site settings (#74): the registry, checks per setting, defaults, Stripe price rules,
// the migration, and that the moved variables are no longer read from the environment.
// Run: node --conditions=react-server --experimental-strip-types tests/site-settings.test.mts
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  checkSetting, displayValue, isDay, KITS_LAUNCH_DATE, priceProblem, resolveSettings, settingDef, SETTINGS,
} from '../src/lib/server/settings-core.ts';

const MOVED = [
  'KITS_SALES_OPEN', 'KITS_LIFETIME_UNTIL', 'SKILLS_REF', 'MOTIV_SALES_OPEN', 'MOTIV_DEFAULT_SEATS', 'MOTIV_LEASE_DAYS',
  'MOTIV_PAST_DUE_GRACE_DAYS', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_ANNUAL', 'STRIPE_PRICE_LIFETIME', 'STRIPE_AUTOMATIC_TAX',
  'CONTACT_TO', 'ASSESSMENT_NOTIFY_TO', 'ALERT_EMAILS', 'EMAIL_REPLY_TO',
];

// ---------- Registry ----------
assert.deepEqual(SETTINGS.map((s) => s.env).sort(), [...MOVED].sort(), 'every moved variable has a setting');
assert.equal(new Set(SETTINGS.map((s) => s.key)).size, SETTINGS.length, 'keys are unique');
for (const s of [...SETTINGS.map((d) => d.key), KITS_LAUNCH_DATE]) assert.match(s, /^[a-z_]{1,40}$/, `${s} fits the migration 027 check`);
for (const s of SETTINGS) {
  if (s.fallback !== null) assert.deepEqual(checkSetting(s, s.fallback), { ok: true, value: s.fallback }, `${s.key} default passes its own check`);
  if (s.kind === 'number') assert.ok(s.min !== undefined && s.max !== undefined, `${s.key} has a range`);
  if (s.kind === 'price') assert.ok(s.plan, `${s.key} names its plan`);
}
assert.equal(settingDef('__proto__'), undefined);
assert.equal(settingDef('nope'), undefined);

// ---------- Defaults ----------
const d = resolveSettings({});
assert.equal(d.kitsSalesOpen, false);
assert.equal(d.motivSalesOpen, false);
assert.equal(d.kitsLifetimeUntil, '2027-12-31');
assert.equal(d.skillsRef, null);
assert.equal(d.motivDefaultSeats, 2);
assert.equal(d.motivLeaseDays, 14);
assert.equal(d.motivPastDueGraceDays, 7);
assert.deepEqual(d.stripePrices, { monthly: null, annual: null, lifetime: null });
assert.equal(d.stripeAutomaticTax, true, 'sales tax on unless turned off');
assert.equal(d.contactTo, 'info@emruz.com');
assert.equal(d.assessmentNotifyTo, 'sales@emruz.com');
assert.deepEqual(d.alertEmails, []);
assert.equal(d.emailReplyTo, 'info@emruz.com');
assert.equal(d.kitsLaunchDate, null);

// ---------- Stored values ----------
const s = resolveSettings({
  kits_sales_open: 'true', motiv_sales_open: 'true', motiv_lease_days: '30', stripe_automatic_tax: 'false',
  stripe_price_monthly: 'price_1AbCdEf', alert_emails: 'a@emruz.com, b@emruz.com', skills_ref: 'v2026.11.5',
  kits_launch_date: '2026-12-01',
});
assert.equal(s.kitsSalesOpen, true);
assert.equal(s.motivSalesOpen, true);
assert.equal(s.motivLeaseDays, 30);
assert.equal(s.stripeAutomaticTax, false);
assert.equal(s.stripePrices.monthly, 'price_1AbCdEf');
assert.deepEqual(s.alertEmails, ['a@emruz.com', 'b@emruz.com']);
assert.equal(s.skillsRef, 'v2026.11.5');
assert.equal(s.kitsLaunchDate, '2026-12-01');
// A stored value that no longer passes falls back to the default rather than breaking the site
const bad = resolveSettings({ motiv_lease_days: '0', motiv_default_seats: 'lots', kits_lifetime_until: '2027-02-30', contact_to: 'nope', skills_ref: 'main', kits_launch_date: 'soon' });
assert.equal(bad.motivLeaseDays, 14);
assert.equal(bad.motivDefaultSeats, 2);
assert.equal(bad.kitsLifetimeUntil, '2027-12-31');
assert.equal(bad.contactTo, 'info@emruz.com');
assert.equal(bad.skillsRef, null);
assert.equal(bad.kitsLaunchDate, null);

// ---------- Checks ----------
const def = (k: string) => settingDef(k)!;
const ok = (k: string, v: unknown) => checkSetting(def(k), v);
assert.deepEqual(ok('kits_sales_open', ''), { ok: true, value: null }, 'empty resets to default');
assert.deepEqual(ok('kits_sales_open', '  '), { ok: true, value: null });
assert.deepEqual(ok('kits_sales_open', null), { ok: true, value: null });
assert.deepEqual(ok('kits_sales_open', 'true'), { ok: true, value: 'true' });
assert.equal(ok('kits_sales_open', 'yes').ok, false);
assert.equal(ok('kits_sales_open', 'TRUE').ok, false);
assert.deepEqual(ok('kits_lifetime_until', '2026-11-30'), { ok: true, value: '2026-11-30' });
assert.equal(ok('kits_lifetime_until', '2026-02-29').ok, false, 'not a real day');
assert.equal(ok('kits_lifetime_until', '30/11/2026').ok, false);
assert.ok(isDay('2028-02-29'));
assert.deepEqual(ok('motiv_default_seats', '50'), { ok: true, value: '50' });
assert.deepEqual(ok('motiv_default_seats', '007'), { ok: true, value: '7' }, 'stored as a plain number');
assert.equal(ok('motiv_default_seats', '51').ok, false);
assert.equal(ok('motiv_default_seats', '0').ok, false);
assert.equal(ok('motiv_lease_days', '1.5').ok, false);
assert.equal(ok('motiv_lease_days', '-3').ok, false);
assert.equal(ok('motiv_lease_days', '1e2').ok, false);
assert.deepEqual(ok('motiv_past_due_grace_days', '0'), { ok: true, value: '0' }, 'zero grace allowed');
assert.deepEqual(ok('contact_to', ' Info@Emruz.com '), { ok: true, value: 'info@emruz.com' });
assert.equal(ok('contact_to', 'a@emruz.com, b@emruz.com').ok, false, 'one address only');
assert.equal(ok('contact_to', 'Name <a@emruz.com>').ok, false);
assert.equal(ok('email_reply_to', 'a@emruz').ok, false);
assert.deepEqual(ok('alert_emails', 'A@emruz.com,b@emruz.com , a@emruz.com,'), { ok: true, value: 'a@emruz.com, b@emruz.com' }, 'trimmed, deduplicated');
assert.deepEqual(ok('alert_emails', ' , '), { ok: true, value: null });
const wrong = ok('alert_emails', 'a@emruz.com, not-an-email');
assert.ok(!wrong.ok && wrong.error.includes('not-an-email'));
assert.equal(ok('alert_emails', Array.from({ length: 20 }, (_, i) => `${'x'.repeat(50)}${i}@emruz.com`).join(',')).ok, false, 'fits the column');
assert.equal(ok('alert_emails', Array.from({ length: 21 }, (_, i) => `a${i}@emruz.com`).join(',')).ok, false);
assert.deepEqual(ok('stripe_price_annual', 'price_1QxYz123abc'), { ok: true, value: 'price_1QxYz123abc' });
for (const v of ['prod_1QxYz123abc', 'price_', 'price_abc', 'price_1QxYz-123abc', 'sk_test_123456789']) assert.equal(ok('stripe_price_annual', v).ok, false, v);
assert.deepEqual(ok('skills_ref', 'v2026.11.5'), { ok: true, value: 'v2026.11.5' });
for (const v of ['main', '2026.11.5', 'v2026.11', '../v2026.11.5']) assert.equal(ok('skills_ref', v).ok, false, v);
const err = ok('motiv_lease_days', '999');
assert.ok(!err.ok && err.error.startsWith('Lease length (days):'), 'errors name the setting');

// ---------- Stripe prices ----------
const rec = (interval: string, n = 1) => ({ active: true, type: 'recurring', recurring: { interval, interval_count: n } });
const once = { active: true, type: 'one_time', recurring: null };
assert.equal(priceProblem('monthly', rec('month')), null);
assert.equal(priceProblem('annual', rec('year')), null);
assert.equal(priceProblem('lifetime', once), null);
assert.ok(priceProblem('monthly', rec('year')));
assert.ok(priceProblem('monthly', rec('month', 3)), 'every month, not every 3 months');
assert.ok(priceProblem('annual', once));
assert.ok(priceProblem('lifetime', rec('year')));
assert.ok(priceProblem('lifetime', { ...once, active: false }), 'archived price');

// ---------- Display ----------
assert.equal(displayValue(def('stripe_automatic_tax'), 'true'), 'On');
assert.equal(displayValue(def('stripe_automatic_tax'), 'false'), 'Off');
assert.equal(displayValue(def('alert_emails'), null), 'Not set (admins)');
assert.equal(displayValue(def('motiv_lease_days'), '14'), '14');

// ---------- Migration ----------
const migration = readFileSync('netlify/database/migrations/027_site_settings.sql', 'utf8');
assert.match(migration, /create table if not exists site_settings/);
assert.match(migration, /char_length\(value\) <= 1000/);
assert.match(migration, /'kits_launch_date'/, 'copies the kits launch date');
assert.doesNotMatch(migration, /drop|alter table kit_settings|rename/i, 'kit_settings stays for a rollback');

// ---------- Not read from the environment any more ----------
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mts|mjs)$/.test(f) ? [p] : [];
  });
}
const readers: string[] = [];
for (const f of files('src')) {
  const text = readFileSync(f, 'utf8');
  for (const v of MOVED) if (new RegExp(`process\\.env\\.${v}\\b|process\\.env\\[['"]${v}['"]\\]`).test(text)) readers.push(`${f}: ${v}`);
}
assert.deepEqual(readers, [], 'moved variables are read from site settings only');
const example = readFileSync('.env.example', 'utf8');
for (const v of MOVED) assert.doesNotMatch(example, new RegExp(`^#?\\s*${v}=`, 'm'), `${v} is gone from .env.example`);

console.log('site settings tests passed');

// Until saved, the Netlify variable a setting replaced carries over (review logic-A1); a saved value wins; a bad variable is ignored.
{
  const env = { SKILLS_REF: 'v2026.11.2', KITS_LIFETIME_UNTIL: '2026-12-01', STRIPE_AUTOMATIC_TAX: 'false', MOTIV_LEASE_DAYS: '999', KITS_SALES_OPEN: 'true' };
  const r = resolveSettings({}, env);
  assert.equal(r.skillsRef, 'v2026.11.2');
  assert.equal(r.kitsLifetimeUntil, '2026-12-01');
  assert.equal(r.stripeAutomaticTax, false);
  assert.equal(r.kitsSalesOpen, true);
  assert.equal(r.motivLeaseDays, 14, 'out-of-range variable falls back to the default');
  assert.equal(resolveSettings({ kits_sales_open: 'false' }, env).kitsSalesOpen, false, 'saved value wins');
  assert.equal(resolveSettings({}, {}).skillsRef, null);
}
console.log('site settings env fallback passed');
