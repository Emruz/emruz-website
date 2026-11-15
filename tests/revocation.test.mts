// Checks the Motiv revocation rules. Run: node --experimental-strip-types tests/revocation.test.mts
import assert from 'node:assert/strict';
import { PERPETUAL_LEASE_EXPIRES, canArchive, canDelete, isRevokeCategory, revocationProblem } from '../src/lib/server/revocation.ts';

const DAY = 24 * 3600 * 1000;
const now = Date.UTC(2030, 0, 1);
const supportEnds = new Date(now + 30 * DAY);
const supportEnded = new Date(now - 30 * DAY);

// Monthly and annual subscriptions can always be revoked
for (const plan of ['monthly', 'annual'] as const) {
  for (const category of ['refund', 'chargeback', 'eula_misuse', 'admin_error'] as const) {
    assert.equal(revocationProblem(plan, category, supportEnded, now), null, `${plan} ${category} after support end`);
  }
}

// Refunds and chargebacks always end a Lifetime licence, even after support ends
assert.equal(revocationProblem('lifetime', 'refund', supportEnded, now), null);
assert.equal(revocationProblem('lifetime', 'chargeback', supportEnded, now), null);

// Misuse and admin error end a Lifetime licence only while support runs
assert.equal(revocationProblem('lifetime', 'eula_misuse', null, now), null, 'no end date set means supported');
assert.equal(revocationProblem('lifetime', 'eula_misuse', supportEnds, now), null, 'before end date');
assert.equal(revocationProblem('lifetime', 'admin_error', supportEnds, now), null, 'admin error before end date');
assert.match(revocationProblem('lifetime', 'eula_misuse', supportEnded, now) ?? '', /support has ended/i);
assert.match(revocationProblem('lifetime', 'admin_error', supportEnded, now) ?? '', /support has ended/i);
// On the end date itself, support is over
assert.match(revocationProblem('lifetime', 'eula_misuse', new Date(now), now) ?? '', /support has ended/i);

// Lifetime leases never expire
assert.equal(PERPETUAL_LEASE_EXPIRES, Date.UTC(2099, 11, 31, 23, 59, 59));

// Only the four known categories are accepted from the form
assert.equal(isRevokeCategory('eula_misuse'), true);
assert.equal(isRevokeCategory('refund'), true);
assert.equal(isRevokeCategory('Refund'), false);
assert.equal(isRevokeCategory(''), false);
assert.equal(isRevokeCategory(null), false);

// Archive: revoked, or cancelled with the period over
assert.equal(canArchive('revoked', false), true);
assert.equal(canArchive('canceled', true), true);
assert.equal(canArchive('canceled', false), false, 'still in its paid period');
assert.equal(canArchive('active', true), false);

// Delete: complimentary only, and only once revoked or cancelled
assert.equal(canDelete(true, 'revoked', false), true);
assert.equal(canDelete(true, 'canceled', true), true);
assert.equal(canDelete(true, 'active', false), false, 'still active');
assert.equal(canDelete(false, 'revoked', false), false, 'paid licences are never deleted');
assert.equal(canDelete(false, 'canceled', true), false, 'paid licences are never deleted');

console.log('revocation rules passed');
