// Checks that the server's lease signing matches the Motiv app's shared test
// vectors byte for byte. Run: npm run test:lease
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { normalizeSubscriptionId, normalizeUserCode, signLease, type LeasePayload } from '../src/lib/server/lease.ts';

const vectors = JSON.parse(fs.readFileSync(new URL('./motiv-test-vectors.json', import.meta.url), 'utf8'));
const seed = Buffer.alloc(32, 0x2a);
const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
const key = crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
assert.equal(crypto.createPublicKey(key).export({ format: 'jwk' }).x, vectors.public_key, 'test key matches');

let n = 0;
for (const c of vectors.cases) {
  if (!c.token || !c.payload) continue;
  const kid = c.token.split('.')[1];
  if (kid !== vectors.kid) continue; // cases signed with other keys test rejection in the app
  assert.equal(signLease(key, kid, c.payload as LeasePayload), c.token, c.name);
  n++;
}
assert.ok(n > 0, 'at least one vector checked');

assert.equal(normalizeSubscriptionId('motiv7k2mqx9r4htpw3nd'), 'MOTIV-7K2M-QX9R-4HTP-W3ND');
assert.equal(normalizeSubscriptionId('MOTIV-7K2M-QX9R-4HTP-W3ND'), 'MOTIV-7K2M-QX9R-4HTP-W3ND');
assert.equal(normalizeSubscriptionId('MOTIV-7K2M-QX9R-4HTP'), null);
assert.equal(normalizeUserCode('k7qm 4xrt'), 'K7QM-4XRT');
console.log(`lease tests passed (${n} vectors)`);

// A newly issued lease for an active Premium subscription lists every Premium
// feature, including "import". issueLease is loaded with the test key; licensing.ts
// uses extensionless imports, so resolve those to .ts files here.
import module from 'node:module';
module.registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      try { return next(`${specifier}.ts`, context); } catch { /* fall through */ }
    }
    return next(specifier, context);
  },
});
process.env.MOTIV_LICENSE_PRIVATE_KEY = key.export({ format: 'der', type: 'pkcs8' }).toString('base64');
process.env.MOTIV_LICENSE_KID = 'ktest';
const { issueLease, entitlementProblem } = await import('../src/lib/server/licensing.ts');
const now = Date.parse('2026-11-14T12:00:00Z');
const terms = { leaseDays: 14, pastDueGraceDays: 7 };
const annual = {
    id: 'sub-row',
    subscription_id: 'MOTIV-7K2M-QX9R-4HTP-W3ND',
    account_id: null,
    customer_email: 'test@example.com',
    plan: 'annual',
    status: 'active',
    period_end: new Date('2027-11-14T12:00:00Z'),
    cancel_at_period_end: false,
    past_due_since: null,
    seats: 2,
  } as Parameters<typeof issueLease>[0];
const token = issueLease(annual, 'device-1', terms, now);
const [prefix, kid, body, sig] = token.split('.');
assert.equal(prefix, 'MOTIV2');
assert.equal(kid, 'ktest');
const json = Buffer.from(body, 'base64url');
assert.ok(crypto.verify(null, json, crypto.createPublicKey(key), Buffer.from(sig, 'base64url')), 'lease signature verifies');
const lease = JSON.parse(json.toString('utf8'));
assert.equal(lease.v, 2);
assert.equal(lease.status, 'active');
assert.ok(lease.features.includes('import'), 'new lease includes "import"');
for (const f of ['assistant', 'action_items', 'speakers', 'awareness', 'calendars', 'terms', 'cleanup', 'templates', 'trim']) {
  assert.ok(lease.features.includes(f), `new lease still includes "${f}"`);
}
console.log('issued lease includes "import"');

// Lease length and grace come from the site settings (#74); the lease format does not change
const DAY = 24 * 3600 * 1000;
const decode = (t: string) => JSON.parse(Buffer.from(t.split('.')[2], 'base64url').toString('utf8'));
assert.equal(Date.parse(decode(issueLease(annual, 'device-1', { leaseDays: 30, pastDueGraceDays: 7 }, now)).lease_expires), now + 30 * DAY);
assert.equal(Date.parse(lease.lease_expires), now + 14 * DAY);
assert.deepEqual(Object.keys(decode(issueLease(annual, 'device-1', { leaseDays: 30, pastDueGraceDays: 7 }, now))).sort(), Object.keys(lease).sort(), 'same lease fields');
// Near the end of the paid period the lease stops at period end plus grace
const ending = { ...annual, period_end: new Date(now + 2 * DAY) };
assert.equal(Date.parse(decode(issueLease(ending, 'device-1', { leaseDays: 30, pastDueGraceDays: 3 }, now)).lease_expires), now + 5 * DAY);
// Past due: grace from the setting
const pastDue = { ...annual, status: 'past_due' as const, past_due_since: new Date(now - 5 * DAY) };
assert.equal(entitlementProblem(pastDue, { leaseDays: 14, pastDueGraceDays: 7 }, now), null);
assert.equal(entitlementProblem(pastDue, { leaseDays: 14, pastDueGraceDays: 3 }, now), 'past_due');
console.log('lease terms from site settings');
