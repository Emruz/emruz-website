// Self-assessment on NIST CSF 2.0 (#72): question set, target profiles, scoring,
// recommendations, crosswalk, workbench pre-fill, and no CIS content in the site.
// Run: node --conditions=react-server --experimental-strip-types tests/self-assessment.test.mts
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// src uses extensionless relative imports; resolve them to .ts for Node.
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec)) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const sa = await import('../src/content/self-assessment.ts');
const { csfCategories, csfFunctions, csfSubcategories, subcategoryById } = await import('../src/content/csf.ts');
const { crosswalk, frameworks, frameworkResult, relatedIds } = await import('../src/content/crosswalk.ts');
const { prefillFromSelf, relatedFor, defaultTarget } = await import('../src/content/workbench.ts');
const {
  categories, allQuestions, functions, NOT_SURE, targetTier, tierOf, inScope, notApplicable, categoryScore,
  functionScore, overallScore, recommend, withPackage, cleanAnswers, cleanProfile, isComplete, GAP_THRESHOLD,
} = sa;
type Answers = Record<string, number>;
type Profile = Parameters<typeof targetTier>[0];

const all = (v: number): Answers => Object.fromEntries(allQuestions.map((q) => [q.id, v]));
const full: Profile = { size: 'mid', data: 'sensitive', team: 'small', dev: 'yes', network: 'onprem', providers: 'yes' };

// ---------- Question set ----------
assert.equal(categories.length, 22, 'one entry per CSF 2.0 Category');
assert.deepEqual(categories.map((c) => c.id).sort(), csfCategories.map((c) => c.id).sort());
for (const c of categories) {
  assert.equal(c.fn, csfCategories.find((x) => x.id === c.id)!.fn, `${c.id} function`);
  assert.ok(c.questions.length >= 1 && c.questions.length <= 4, `${c.id} has one to four questions`);
}
assert.ok(allQuestions.length >= 22 && allQuestions.length <= 30, 'about one question per Category');
assert.equal(new Set(allQuestions.map((q) => q.id)).size, allQuestions.length, 'question IDs are unique');
for (const q of allQuestions) {
  assert.ok(q.csf.length, `${q.id} maps to CSF`);
  for (const s of q.csf) assert.ok(subcategoryById.has(s), `${q.id}: ${s} is a CSF 2.0 Subcategory`);
}
assert.deepEqual(functions.map((f) => f.id), csfFunctions.map((f) => f.id), 'six Functions in CSF order');
for (const f of functions) {
  assert.ok(f.categories.some((c) => c.questions.some((q) => q.tier === 1)), `${f.id} has an Essential question`);
}

// ---------- Target profile ----------
assert.equal(targetTier({ size: 'small', data: 'basic', team: 'none' }), 1);
assert.equal(targetTier({ size: 'mid', data: 'sensitive', team: 'small' }), 2);
assert.equal(targetTier({ size: 'large', data: 'regulated', team: 'small' }), 3);
assert.equal(targetTier({ size: 'small', data: 'regulated', team: 'dedicated' }), 3);
assert.equal(tierOf(3, { size: 'small', data: 'basic', team: 'none' }), 3, 'stored target wins');
assert.equal(tierOf(null, { size: 'small', data: 'basic', team: 'none' }), 1);
assert.equal(tierOf(7, {}), 2, 'invalid stored target falls back to the profile');
assert.deepEqual([1, 2, 3].map((t) => defaultTarget(t as 1 | 2 | 3)), [2, 3, 4], 'engagement targets follow the profile');
const count = (t: 1 | 2 | 3) => categories.flatMap((c) => inScope(c, t, full)).length;
assert.ok(count(1) < count(2) && count(2) < count(3), 'each profile adds questions');
assert.equal(count(3), allQuestions.length);

// ---------- Scoping ----------
const devQ = allQuestions.find((q) => q.needs === 'dev')!;
assert.ok(devQ);
assert.ok(!categories.flatMap((c) => inScope(c, 3, { ...full, dev: 'no' })).includes(devQ));
const gvsc = categories.find((c) => c.id === 'GV.SC')!;
assert.ok(notApplicable(gvsc, 3, { ...full, providers: 'no' }));
assert.equal(categoryScore(gvsc, all(4), 3, { ...full, providers: 'no' }), null);
assert.equal(categoryScore(gvsc, all(4), 1, full), null, 'not in scope for Essential');
assert.ok(!notApplicable(gvsc, 1, full), 'out of scope is not the same as not applicable');

// ---------- Scoring ----------
for (const t of [1, 2, 3] as const) {
  assert.equal(overallScore(all(4), t, full), 100);
  assert.equal(overallScore(all(0), t, full), 0);
  assert.equal(overallScore(all(NOT_SURE), t, full), 0, 'Not sure scores as not in place');
  assert.equal(overallScore(all(2), t, full), 50);
}
// Only in-scope questions count: Advanced-only questions at 0 don't move an Essential score
const essentialOnly: Answers = Object.fromEntries(allQuestions.map((q) => [q.id, q.tier === 1 ? 4 : 0]));
assert.equal(overallScore(essentialOnly, 1, full), 100);
assert.ok(overallScore(essentialOnly, 3, full) < 100);
const prAA = categories.find((c) => c.id === 'PR.AA')!;
assert.equal(categoryScore(prAA, { 'PR.AA-a': 4, 'PR.AA-b': 2 }, 1, full), 75);
assert.equal(functionScore('RC', all(4), 1, full), 100);
assert.equal(functionScore('RC', all(4), 1, full), functionScore('RC', all(4), 3, full));
assert.ok(isComplete(full, all(3)));
assert.ok(!isComplete(full, {}));
assert.ok(!isComplete({}, all(3)), 'profile must be answered');

// ---------- Recommendations ----------
const strong = recommend(all(4), 2, full);
assert.equal(strong.gaps.length, 0);
assert.equal(strong.pkg, null);
assert.equal(strong.addOns.length, 0);
assert.equal(strong.services.length, 0);

const weak = recommend(all(0), 2, full);
assert.equal(weak.gaps.length, categories.filter((c) => inScope(c, 2, full).length).length, 'every in-scope category is a gap');
assert.ok(weak.gaps.every((g) => g.score < GAP_THRESHOLD));
assert.ok(weak.pkg, 'an edition is suggested');
assert.ok(weak.covered.length > 0 && weak.covered.every((c) => weak.pkg!.includes.includes(c)));
assert.ok(weak.services.some((s) => s.href === '/services/vciso'), 'low scores get leadership help');
const sorted = weak.gaps.map((g) => g.score);
assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b), 'weakest first');

// Identity gaps: the edition that covers identity posture wins, so no identity add-on
const idOnly = { ...all(4), 'PR.AA-a': 0, 'PR.AA-b': 0 };
const idRec = recommend(idOnly, 2, full);
assert.deepEqual(idRec.gaps.map((g) => g.category.id), ['PR.AA']);
assert.ok(idRec.pkg?.includes.includes('ISPM'));
assert.ok(!idRec.addOns.some((a) => a.code === 'ZTI'));

// Backups: no edition delivers them, so the backup add-on is suggested
const backup = recommend({ ...all(4), 'PR.DS-b': 0 }, 2, full);
assert.deepEqual(backup.gaps.map((g) => g.category.id), ['PR.DS']);
assert.ok(backup.addOns.some((a) => a.code === 'DSB'));

// Training: the awareness add-on
assert.ok(recommend({ ...all(4), 'PR.AT-a': 1 }, 1, full).addOns.some((a) => a.code === 'PSA'));

// ---------- With / Plus columns ----------
const lifted = withPackage(all(0), { includes: ['VM', 'NSPM'] });
assert.equal(lifted['PR.PS-a'], 4, 'closes makes it Fully');
assert.equal(lifted['PR.PS-c'], 3, 'raises makes it at least Mostly');
assert.equal(lifted['GV.PO-a'], 0, 'process questions are untouched');
const ones = all(1);
assert.equal(withPackage(ones, null), ones, 'nothing in place leaves the answers alone');
assert.ok(overallScore(withPackage(all(0), weak.pkg, ...weak.addOns), 2, full) > overallScore(withPackage(all(0), weak.pkg), 2, full));

// ---------- Cleaning stored input ----------
assert.deepEqual(cleanAnswers({ '1a': 4, '17c': 2, 'PR.AA-a': 3, 'PR.AA-b': 9, 'GV.PO-a': NOT_SURE }), { 'PR.AA-a': 3, 'GV.PO-a': NOT_SURE });
assert.deepEqual(cleanProfile({ size: 'mid', data: 'x', frameworks: ['cis', 'iso', 'csf'] }), { size: 'mid', frameworks: ['iso', 'csf'] });

// ---------- Crosswalk ----------
assert.deepEqual(frameworks.map((f) => f.key).sort(), ['cmmc', 'csf', 'iso', 'soc2']);
assert.deepEqual(Object.keys(crosswalk).sort(), allQuestions.map((q) => q.id).sort(), 'every question has a crosswalk entry');
for (const q of allQuestions) {
  for (const f of frameworks) {
    for (const id of relatedIds(q.id, f.key)) assert.ok(f.ids[id], `${f.short} ${id} (from ${q.id}) has a title`);
  }
}
for (const f of frameworks) {
  assert.equal(frameworkResult(f.key, all(4), 3, full).score, 100);
  assert.equal(frameworkResult(f.key, all(0), 3, full).counts.met, 0);
  for (const i of frameworkResult(f.key, all(2), 3, full).items) {
    for (const c of i.categories) assert.ok(categories.some((x) => x.id === c));
  }
}
assert.deepEqual(Object.keys(relatedFor('PR.AA-03')).sort(), ['cmmc', 'iso', 'soc2']);

// ---------- Workbench pre-fill ----------
const pre = prefillFromSelf(all(3), full, 3);
assert.equal(Object.keys(pre).length, csfSubcategories.length, 'every subcategory of the full CSF engagement is pre-filled');
assert.ok(Object.values(pre).every((v) => v === 3));
assert.equal(Object.keys(prefillFromSelf(all(NOT_SURE), full, 3)).length, 0, 'Not sure is never pre-filled');
const mixed = prefillFromSelf({ ...all(3), 'PR.AA-a': 3, 'PR.AA-b': 1 }, full, 3);
assert.equal(mixed['PR.AA-03'], 1, 'a subcategory takes the question that rates it');
assert.equal(mixed['PR.AA-01'], 3);
assert.equal(mixed['PR.AA-02'], 2, 'others take the mean of their Category');
assert.equal(prefillFromSelf(all(3), full, 1)['GV.OV-01'], undefined, 'questions outside the target are not used');
assert.ok(Object.values(prefillFromSelf(all(4), full, 3)).every((v) => v <= 4), 'Optimized is never pre-filled');

// ---------- No CIS content (licensing) ----------
// The CIS Controls need a paid license for commercial use. Nothing on the site,
// in emails or in reports may name them or use their structure.
const banned: [RegExp, string][] = [
  [/\bCIS\b/, 'CIS'],
  [/Center for Internet Security/i, 'Center for Internet Security'],
  [/\bIG\s?[123]\b/, 'Implementation Group ID'],
  [/Implementation Groups?\b/i, 'Implementation Group'],
  [/Critical Security Controls/i, 'Critical Security Controls'],
  [/\bcis-v8\b/i, 'cis-v8'],
  [/\bsafeguards?\s+\d{1,2}\.\d{1,2}\b/i, 'safeguard ID'],
];
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|mts|mjs|js|json|md|css|txt|xml|html|svg)$/.test(p)) files.push(p);
  }
};
walk('src');
walk('public');
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const [re, what] of banned) assert.doesNotMatch(text, re, `${f} contains ${what}`);
}
// CIS safeguard IDs would show up as crosswalk IDs without a known framework title (checked above);
// ISO Annex A IDs are the only bare n.n IDs left, all in clauses 5 to 8.
const iso = frameworks.find((f) => f.key === 'iso')!;
for (const id of Object.keys(iso.ids)) assert.match(id, /^[5-8]\.\d{1,2}$/, `ISO ${id}`);
