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
