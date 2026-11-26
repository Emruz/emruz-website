// Review follow-ups (#76): kits revocation, release tags, self-assessment format,
// workbench evidence requests and report scope.
// Run: node --conditions=react-server --experimental-strip-types tests/review-followups.test.mts
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(spec)) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const flat = (s: string) => s.replace(/\s+/g, ' ');
const { ratedCategories } = await import('../src/content/frameworks.ts');

// ---------- Kits (#70, #71) ----------
{
  const revoke = flat(read('src/app/admin/kits/actions.ts'));
  // logicA-2: re-check Stripe before undoing, and undo only this action's revocation
  assert.match(revoke, /cancelled = await subscriptionCancelled\(/, 'a thrown cancel is re-checked with Stripe');
  assert.match(revoke, /if \(!cancelled\) \{/);
  assert.match(revoke, /where id = \$\{id\} and revoked_at = \$\{at\} and revoked_by = \$\{actor\} and revoked_reason = \$\{reason\}/, 'undo matches this revocation only');
  assert.match(revoke, /set revoked_at = \$\{at\}, revoked_by = \$\{actor\}/, 'revocation time set by the action so the undo can match it');

  const sales = flat(read('src/lib/server/kits/sales.ts'));
  // edgeA-4: the refund or dispute update re-checks state and skips the audit when nothing changed
  assert.match(sales, /where id = \$\{r\.id\} and \(revoked_at is null or \(revoked_by = 'stripe' and revoked_reason = 'subscription unpaid'\)\) returning id/);
  assert.match(sales, /if \(!changed\.length\) continue;/);
  assert.match(sales, /return ended;/);

  // edgeA-2: listing tags does not fill the bundle cache, and /admin/kits lists them once
  const content = flat(read('src/lib/server/kits/content.ts'));
  assert.match(content, /const ok = await Promise\.all\(refs\.map\(checkRef\)\)/);
  assert.doesNotMatch(content.slice(content.indexOf('async function checkRef')), /bundleFor\(r\)/);
  assert.match(content, /if \(checkedRefs\.has\(ref\) \|\| bundles\.has\(ref\)\) return true;/);
  assert.match(read('src/app/admin/kits/page.tsx'), /launchReport\(new Date\(\), tags\)/);
  assert.match(read('src/lib/server/kits/launch.ts'), /tags \?\? \(await releaseTags\(\)\)/);
  // sens-2: settings never read on this instance keep the last good release
  assert.match(content, /if \(!hold && settingsUnread\(\)\) \{ if \(lastGood\) return lastGood;/);
}

// ---------- Self-assessment format (#72, review logicB-2) ----------
{
  const a = flat(read('src/lib/server/assessments.ts'));
  for (const q of [
    /select \* from assessments where id = \$\{id\} and deleted_at is null and framework = \$\{SELF_FRAMEWORK\}/,
    /where account_id = \$\{accountId\} and deleted_at is null and framework = \$\{SELF_FRAMEWORK\} order by/,
    /status = 'in_progress' and deleted_at is null and framework = \$\{SELF_FRAMEWORK\}/,
    /framework <> \$\{SELF_FRAMEWORK\}/,
  ]) assert.match(a, q);
  assert.equal(a.match(/await dropLegacyDraft\(/g)?.length, 2, 'old-format drafts are removed before a new one is opened');
  assert.match(flat(read('src/app/workbench/self/data.ts')), /where s\.framework = \$\{SELF_FRAMEWORK\}/);
  assert.match(flat(read('src/app/workbench/new/page.tsx')), /s\.framework = \$\{SELF_FRAMEWORK\} and \(\$\{all\} or s\.assigned_to = \$\{account\.id\}\)/);
}

// ---------- Workbench and evidence (#73) ----------
const wb = flat(read('src/app/workbench/actions.ts'));
{
  // inj-2: the self-assessment picked for a new engagement is checked as selfOn does
  assert.match(wb, /selfId: await selfForEngagement\(\{ account, role \}, selfId\)/);
  assert.match(wb, /if \(!s \|\| \(!seesAll\(ctx\.role\) && s\.assigned_to !== ctx\.account\.id\)\) throw new Error\('Not found'\)/);
  assert.match(wb, /where id = \$\{o\.selfId\} and status = 'completed' and deleted_at is null and framework = \$\{SELF_FRAMEWORK\}/);

  // logicB-1, edgeB-4: requests reopen when nothing answers them, never those marked received by hand
  const reopen = wb.slice(wb.indexOf('async function reopenUnanswered'), wb.indexOf('export async function deleteEvidence'));
  assert.match(reopen, /r\.status = 'received' and r\.closed_at is null/);
  assert.match(reopen, /not exists \(select 1 from evidence v where v\.request_id = r\.id\)/);
  const del = wb.slice(wb.indexOf('export async function deleteEvidence'));
  assert.match(del, /await reopenUnanswered\(tx, e\.id, \{ requestIds: gone\.request_id \? \[gone\.request_id\] : \[\], erlIds \}\)/);
  assert.match(del, /select erl_id from evidence_erl_links where evidence_id = \$\{evId\}/, 'ERL links read before the delete cascades');
  assert.match(wb, /if \(removed\.length\) await reopenUnanswered\(tx, e\.id, \{ erlIds: \[erl\] \}\)/, 'unlink reopens only when a link was removed');
  // setRequestStatus marks received by hand with closed_at, which reopenUnanswered relies on
  assert.match(wb, /update evidence_requests set status = \$\{status\}, closed_at = \$\{status === 'open' \? null : new Date\(\)\}/);

  // logicB-3: staff add-link runs in one transaction
  const add = wb.slice(wb.indexOf('export async function addEvidenceLink'), wb.indexOf('export async function setEvidenceLink'));
  assert.match(add, /await db\(\)\.begin\(async \(tx\) =>/);
  assert.doesNotMatch(add, /await db\(\)`/, 'no write outside the transaction');
  assert.match(add, /linkEvidenceToRequestErl\(ev\.id, rid, e\.id, tx\)/);

  // logicB-5, edgeB-2: ERL scope and staff hours use the same rated categories, pre-filled excluded
  assert.equal(wb.match(/ratedCategories\(Object\.values\(ratings\)\)/g)?.length, 2);
  const r = (subcategory: string, current_level: number | null, o: { na?: boolean; prefilled?: boolean } = {}) =>
    ({ subcategory, current_level, na: !!o.na, prefilled: !!o.prefilled });
  assert.deepEqual(ratedCategories([r('GV.OC-01', 2), r('GV.OC-02', 3), r('ID.AM-01', 1, { prefilled: true }), r('PR.AA-01', 2, { na: true }), r('DE.CM-01', null)]), ['GV.OC']);
  assert.deepEqual(ratedCategories([r('ID.AM-01', 1, { prefilled: true })]), [], 'pre-filled only: not rated yet');

  // edgeB-1: request evidence counts grouped once per engagement
  const reqs = flat(read('src/lib/server/workbench.ts'));
  const get = reqs.slice(reqs.indexOf('export async function getRequests'), reqs.indexOf('export async function getObligationRatings'));
  assert.match(get, /counts as \(select request_id, count\(\*\)::int as n from answers group by request_id\)/);
  assert.match(get, /left join counts c on c\.request_id = r\.id/);
  assert.doesNotMatch(get, /\(select count\(\*\)/, 'no correlated count per request');
}

// ---------- Request picker, staff preview and report (#73) ----------
{
  const rg = flat(read('src/components/assessment/RequestGroup.tsx'));
  assert.match(rg, /const picked = chosen\.filter\(\(id\) => open\.some\(\(r\) => r\.id === id\)\)/, 'answered requests drop out of the selection');
  assert.match(rg, /\{r\.status !== 'open' \? \( <span className="mt-0\.5 text-emerald-700" aria-label="Received">/, 'the received tick only for answered requests');
  assert.match(rg, /aria-label="Open"/, 'the staff preview shows open requests as open');
  assert.match(read('src/components/assessment/ReportDocument.tsx'), /c\.assessors\.map\(\(a, i\) => \(\s*<li key=\{i\}>/);
}

console.log('review follow-up tests passed');
