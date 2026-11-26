// Obligation views (#73): SCF content unmodified and attributed, HIPAA, NIST 800-171
// (SPRS, POA&M), ISO 27001 Annex A and insurer requirements, evidence collected once.
// Run: node --conditions=react-server --experimental-strip-types tests/obligations.test.mts
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// src uses extensionless relative imports; resolve them to .ts (or ./dir/index.ts) for Node.
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if ((spec.startsWith('.') || spec.startsWith('@/')) && !/\.[cm]?[jt]sx?$|\.json$/.test(spec)) {
        const s = spec.startsWith('@/') ? new URL(`../src/${spec.slice(2)}`, import.meta.url).href : spec;
        try {
          return next(`${s}.ts`, ctx);
        } catch {
          return next(`${s}/index.ts`, ctx);
        }
      }
      throw e;
    }
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const scf = await import('../src/content/scf/index.ts');
const ob = await import('../src/content/obligations.ts');
const { csfSubcategories } = await import('../src/content/csf.ts');
const sa = await import('../src/content/self-assessment.ts');
const csfIds = new Set(csfSubcategories.map((s) => s.id));
const all = (v: number) => Object.fromEntries(csfSubcategories.map((s) => [s.id, v]));

// ---------- SCF content is the imported release, unchanged ----------
{
  const data = JSON.parse(read('src/content/scf/scf.json'));
  // Same checksum as scripts/scf-import.py (Python str(): None for null).
  const py = (v: unknown) => (v === null || v === undefined ? 'None' : String(v));
  const h = createHash('sha256');
  for (const c of data.controls) {
    for (const k of ['id', 'domain', 'name', 'description', 'erl', 'question', 'weight']) h.update(`${k}=${py(c[k])}\n`);
    for (const k of Object.keys(c.maps).sort()) h.update(`map.${k}=${py(c.maps[k])}\n`);
  }
  for (const e of data.erl) for (const k of ['id', 'area', 'artifact', 'description', 'controls']) h.update(`${k}=${py(e[k])}\n`);
  assert.equal(h.digest('hex'), read('src/content/scf/scf.sha256').trim(), 'scf.json differs from the imported SCF release; re-run scripts/scf-import.py');
  assert.equal(data.license, 'CC BY-ND 4.0');
  assert.match(scf.SCF_ATTRIBUTION, /Secure Controls Framework/);
  assert.match(scf.SCF_ATTRIBUTION, /CC BY-ND 4\.0/);
  assert.match(scf.SCF_ATTRIBUTION, new RegExp(scf.SCF_VERSION.replace('.', '\\.')));
  assert.ok(scf.scfControls.length > 500 && scf.scfEvidence.length > 200, 'controls and ERL imported');
  // The app reads SCF strings as they are (splitting multi-value cells on line breaks only).
  assert.deepEqual(scf.splitCell('A-01\nB-02\n'), ['A-01', 'B-02']);
}

// SCF content is attributed wherever it appears.
for (const f of [
  'src/components/assessment/ObligationViews.tsx',
  'src/app/workbench/e/[id]/evidence/page.tsx',
  'src/app/workbench/e/[id]/obligations/page.tsx',
]) {
  assert.match(read(f), /SCF_ATTRIBUTION/, `${f} shows the SCF attribution`);
}

// ---------- Requirement sets ----------
const { requirements, SPRS_WEIGHTS, OBLIGATION_KEYS, BRIDGE } = ob;
assert.equal(requirements.nist171.length, 110, '800-171 Rev. 2 has 110 requirements');
assert.equal(Object.values(SPRS_WEIGHTS).reduce((a: number, b: number) => a + b, 0), 313, 'weights total 313 (110 to -203)');
assert.equal(ob.nist171Rev3.length, 97, 'Rev. 3 has 97 requirements');
assert.equal(requirements.iso27001.length, 93, 'ISO 27001:2022 Annex A has 93 controls');
for (const r of requirements.iso27001) {
  assert.match(r.id, /^A\.[5-8]\.\d+$/);
  assert.equal(r.title, `Annex A ${r.id.slice(2)}`, 'ISO controls by number only');
}
for (const r of requirements.hipaa) assert.match(r.id, /^§ 164\.3\d\d\([a-z]\)(\(\d+\))?$/);
assert.ok(requirements.hipaa.length >= 30);
assert.ok(requirements.insurance.some((r) => r.id === 'INS-MFA-REMOTE') && requirements.insurance.some((r) => r.id === 'INS-EDR'));
for (const k of OBLIGATION_KEYS) {
  for (const r of requirements[k]) {
    assert.ok(r.csf.length > 0, `${k} ${r.id} is rated through CSF`);
    for (const id of r.csf) assert.ok(csfIds.has(id), `${k} ${r.id}: ${id} is a CSF 2.0 Subcategory`);
    for (const e of r.erl) assert.ok(scf.scfEvidenceById.has(e), `${k} ${r.id}: ${e} is an ERL item`);
    for (const c of r.scf) assert.ok(scf.scfControlById.has(c), `${k} ${r.id}: ${c} is an SCF control`);
  }
}
for (const ids of Object.values(BRIDGE) as string[][]) for (const id of ids) assert.ok(csfIds.has(id), `bridge ${id}`);
// SCF mappings come first; the Emruz bridge only fills gaps and is labelled.
assert.ok(requirements.hipaa.every((r) => !r.bridged), 'HIPAA uses SCF mappings only');
assert.ok(requirements.nist171.some((r) => r.bridged) && requirements.nist171.some((r) => !r.bridged));

// ---------- Status and SPRS ----------
{
  const met = ob.obligationView('nist171', all(4));
  assert.equal(met.counts.met, 110);
  assert.equal(met.sprs!.score, 110);
  assert.equal(met.sprs!.poam.length, 0);
  assert.equal(met.sprs!.noSsp, false);

  const none = ob.obligationView('nist171', {});
  assert.equal(none.counts.unknown, 110, 'unrated is not assessed');
  assert.equal(none.sprs!.score, -203, 'unassessed requirements are deducted');
  assert.equal(none.sprs!.noSsp, true);

  const low = ob.obligationView('nist171', all(0));
  assert.equal(low.sprs!.score, -203);
  assert.equal(low.sprs!.poam[0].weight, 5, 'POA&M sorted by points');

  // Partial credit only for 3.5.3 and 3.13.11
  const partial = ob.obligationView('nist171', all(4), undefined, { '3.5.3': { status: 'partial' }, '3.1.1': { status: 'partial' } });
  assert.equal(partial.sprs!.score, 110 - 3 - 5);
  assert.ok(partial.requirements.find((r) => r.id === '3.5.3')!.overridden);

  const csv = ob.poamCsv(low);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 1 + low.sprs!.poam.length);
  assert.match(lines[0], /^"Requirement","Title","SPRS points"/);
  assert.equal(ob.poamCsv({ ...low, sprs: { ...low.sprs!, poam: [{ id: '3.1.1', title: 'A "quoted" title', weight: 5, status: 'not_met', scf: [], erl: [] }] } }).split('\r\n')[1].split(',')[1], '"A ""quoted"" title"');

  // Thresholds: mean of mapped ratings, 3 and up met, 1.5 and up partly
  const r = requirements.insurance.find((x) => x.id === 'INS-MFA-REMOTE')!;
  assert.equal(ob.requirementStatus(r, { 'PR.AA-03': 3 }), 'met');
  assert.equal(ob.requirementStatus(r, { 'PR.AA-03': 2 }), 'partial');
  assert.equal(ob.requirementStatus(r, { 'PR.AA-03': 1 }), 'not_met');
  assert.equal(ob.requirementStatus(r, { 'PR.AA-03': null }), 'unknown');

  // Workbench maturity 0 to 5: N/A and unrated skipped, Optimized capped to 4
  assert.deepEqual(
    ob.fromMaturity([
      { subcategory: 'PR.AA-03', current_level: 5, na: false },
      { subcategory: 'PR.AA-01', current_level: 2, na: true },
      { subcategory: 'PR.AA-02', current_level: null, na: false },
    ]),
    { 'PR.AA-03': 4 },
  );
}

// ---------- Evidence collected once ----------
{
  // An ERL item that supports requirements in more than one obligation.
  const counts = new Map<string, Set<string>>();
  for (const k of OBLIGATION_KEYS) for (const r of requirements[k]) for (const e of r.erl) (counts.get(e) ?? counts.set(e, new Set()).get(e)!).add(k);
  const [erl] = [...counts.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  const ev = ob.evidenceIndex([{ id: 'ev1', subcategories: [], erl_ids: [erl] }]);
  let marked = 0;
  for (const k of OBLIGATION_KEYS) {
    const v = ob.obligationView(k, {}, ev);
    for (const r of v.requirements) {
      assert.equal(r.evidence.includes('ev1'), r.erl.includes(erl), `${k} ${r.id}`);
      if (r.evidence.includes('ev1')) marked++;
    }
  }
  assert.ok(counts.get(erl)!.size >= 3 && marked > 3, `one upload (${erl}) marks ${marked} requirements across views`);

  // Evidence linked to a CSF Subcategory counts too.
  const bySub = ob.evidenceIndex([{ id: 'ev2', subcategories: ['PR.AA-03'] }]);
  assert.ok(ob.obligationView('insurance', {}, bySub).requirements.find((r) => r.id === 'INS-MFA-REMOTE')!.evidence.includes('ev2'));

  const scope = ob.erlForScope(['PR.AA'], ['hipaa']);
  assert.ok(scope.length > 10 && scope.every((e) => scf.scfEvidenceById.has(e)));
  assert.ok(ob.erlForScope([], []).length === 0);
}

// ---------- Scoping and profile ----------
assert.deepEqual(ob.cleanObligations(['hipaa', 'x', 'nist171', 5]), ['hipaa', 'nist171']);
assert.deepEqual(ob.cleanObligations('hipaa'), []);
assert.deepEqual(sa.cleanProfile({ size: 'mid', obligations: ['insurance', 'bogus'] }).obligations, ['insurance']);
assert.ok(ob.isReqStatus('met') && !ob.isReqStatus('auto'));
assert.equal(ob.staffHours({ categories: 22, evidenceRequests: 60, obligations: 2 }), 75);
assert.equal(ob.staffHours({ categories: 0, evidenceRequests: 0, obligations: 0 }), 10);

// ---------- Sample report for sales ----------
{
  const { sampleReport, SAMPLE_OBLIGATIONS } = await import('../src/content/sample-report.ts');
  const c = sampleReport();
  assert.equal(c.obligations!.length, SAMPLE_OBLIGATIONS.length);
  assert.match(c.client, /█/, 'client name redacted');
  assert.ok(c.assessors!.every((a) => !/@/.test(a.name)), 'no real people or emails');
  assert.deepEqual(sampleReport(), sampleReport(), 'stable between builds');
}

// ---------- Migration 029 is additive ----------
{
  const sql = read('netlify/database/migrations/029_obligation_views.sql').toLowerCase().replace(/--.*$/gm, '');
  assert.doesNotMatch(sql, /\bdrop\b|\brename\b|\bdelete from\b|\btruncate\b|alter column/, 'rollback-safe');
}

console.log('obligations: ok');
