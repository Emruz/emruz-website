/**
 * Workbench rules: intake structure, maturity scoring (NIST CSF 2.0 for security,
 * Emruz question sets for the other assessment types),
 * evidence flags and rollups. Shared by the browser and the server.
 *
 * Scoring rules (shown to assessors and in every report's methodology):
 * - Each CSF subcategory gets a current and a target maturity from 0 to 5.
 * - A current level of 3 or more needs at least one piece of linked evidence.
 *   Without it the rating is flagged and the report marks it "unverified".
 * - Not applicable needs a reason. N/A and unrated items are left out of averages.
 * - Category = mean of its subcategories; function = mean of its categories;
 *   overall = mean of the six functions.
 * - CSF tier from the score: under 1.5 Partial, under 2.5 Risk Informed,
 *   under 3.5 Repeatable, otherwise Adaptive.
 * - Gap = target minus current. 2 or more is High priority, 1 is Medium.
 */
import { frameworkFor, type Framework } from './frameworks';
import { allIntakeFields, intakeSectionsFor, type IntakeField } from './engagement-types';
import { categories, inScope, NOT_SURE, type Answers, type Profile, type Tier } from './self-assessment';
import { relatedIds, type FrameworkKey } from './crosswalk';
import { csfSubcategories } from './csf';

export const maturityLevels = [
  { value: 0, label: 'Not performed', help: 'Nothing in place.' },
  { value: 1, label: 'Initial', help: 'Ad hoc, depends on individuals.' },
  { value: 2, label: 'Repeatable', help: 'Done regularly but not documented.' },
  { value: 3, label: 'Defined', help: 'Documented, approved and consistently applied.' },
  { value: 4, label: 'Managed', help: 'Measured and monitored, exceptions handled.' },
  { value: 5, label: 'Optimized', help: 'Continuously improved, automated where it makes sense.' },
] as const;

export const EVIDENCE_REQUIRED_AT = 3;

/** Default target maturity for a self-assessment target profile (Essential, Standard, Advanced). */
export const defaultTarget = (tier: Tier) => ({ 1: 2, 2: 3, 3: 4 })[tier];

export function tierFor(score: number | null) {
  if (score === null) return { tier: 0, label: 'Not rated' };
  if (score < 1.5) return { tier: 1, label: 'Tier 1: Partial' };
  if (score < 2.5) return { tier: 2, label: 'Tier 2: Risk Informed' };
  if (score < 3.5) return { tier: 3, label: 'Tier 3: Repeatable' };
  return { tier: 4, label: 'Tier 4: Adaptive' };
}

export interface Rating {
  subcategory: string;
  current_level: number | null;
  target_level: number | null;
  na: boolean;
  na_reason: string | null;
  notes: string | null;
  recommendation: string | null;
  override_reason: string | null;
  prefilled: boolean;
}

export type Flag = 'unrated' | 'missing_evidence' | 'na_reason' | 'prefilled' | 'no_recommendation';

export const flagInfo: Record<Flag, { label: string; tone: 'red' | 'amber' | 'gray'; blocks: boolean }> = {
  unrated: { label: 'Not rated', tone: 'gray', blocks: true },
  missing_evidence: { label: 'Missing evidence', tone: 'red', blocks: true },
  na_reason: { label: 'N/A needs a reason', tone: 'red', blocks: true },
  prefilled: { label: 'Pre-filled, confirm', tone: 'amber', blocks: true },
  no_recommendation: { label: 'Gap without recommendation', tone: 'amber', blocks: false },
};

/** Problems with one rating. evidenceCount = evidence items linked to it. */
export function flagsFor(r: Rating | undefined, evidenceCount: number): Flag[] {
  if (!r || (!r.na && r.current_level === null)) return ['unrated'];
  if (r.na) return r.na_reason?.trim() ? [] : ['na_reason'];
  const f: Flag[] = [];
  if (r.prefilled) f.push('prefilled');
  if ((r.current_level ?? 0) >= EVIDENCE_REQUIRED_AT && evidenceCount === 0 && !r.override_reason?.trim()) f.push('missing_evidence');
  if ((r.target_level ?? 0) - (r.current_level ?? 0) >= 1 && !r.recommendation?.trim()) f.push('no_recommendation');
  return f;
}

export const priorityFor = (current: number | null, target: number | null) => {
  if (current === null || target === null) return null;
  const gap = target - current;
  return gap >= 2 ? 'High' : gap === 1 ? 'Medium' : null;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);

export interface Rollup {
  overall: { current: number | null; target: number | null };
  functions: { id: string; title: string; current: number | null; target: number | null }[];
  categories: { id: string; fn: string; title: string; current: number | null; target: number | null }[];
  rated: number;
  na: number;
  total: number;
}

export function rollup(ratings: Record<string, Rating>, fw: Framework = frameworkFor('security')): Rollup {
  const categories = fw.categories.map((c) => {
    const rs = fw.items
      .filter((s) => s.category === c.id)
      .map((s) => ratings[s.id])
      .filter((r): r is Rating => !!r && !r.na && r.current_level !== null);
    return {
      id: c.id,
      fn: c.fn,
      title: c.title,
      current: round1(mean(rs.map((r) => r.current_level!))),
      target: round1(mean(rs.filter((r) => r.target_level !== null).map((r) => r.target_level!))),
    };
  });
  const functions = fw.functions.map((f) => {
    const cs = categories.filter((c) => c.fn === f.id);
    return {
      id: f.id,
      title: f.title,
      current: round1(mean(cs.filter((c) => c.current !== null).map((c) => c.current!))),
      target: round1(mean(cs.filter((c) => c.target !== null).map((c) => c.target!))),
    };
  });
  const ids = new Set(fw.items.map((s) => s.id));
  const all = Object.values(ratings).filter((r) => ids.has(r.subcategory));
  return {
    overall: {
      current: round1(mean(functions.filter((f) => f.current !== null).map((f) => f.current!))),
      target: round1(mean(functions.filter((f) => f.target !== null).map((f) => f.target!))),
    },
    functions,
    categories,
    rated: all.filter((r) => r.na || r.current_level !== null).length,
    na: all.filter((r) => r.na).length,
    total: fw.items.length,
  };
}

/* ---------- Crosswalk from CSF back to the other frameworks ---------- */

/** Self-assessment questions that rate each CSF subcategory. */
const questionsForCsf = (() => {
  const m = new Map<string, string[]>();
  for (const c of categories) for (const q of c.questions) for (const id of q.csf) m.set(id, [...(m.get(id) ?? []), q.id]);
  return m;
})();

/** Related IDs in CMMC, ISO and SOC 2, through the shared questions. */
export function relatedFor(csfId: string): Partial<Record<Exclude<FrameworkKey, 'csf'>, string[]>> {
  const out: Partial<Record<Exclude<FrameworkKey, 'csf'>, Set<string>>> = {};
  for (const qid of questionsForCsf.get(csfId) ?? []) {
    for (const k of ['cmmc', 'iso', 'soc2'] as const) {
      for (const id of relatedIds(qid, k)) (out[k] ??= new Set()).add(id);
    }
  }
  const sorted: Partial<Record<Exclude<FrameworkKey, 'csf'>, string[]>> = {};
  for (const [k, v] of Object.entries(out)) {
    sorted[k as Exclude<FrameworkKey, 'csf'>] = [...v].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }
  return sorted;
}

/**
 * Starting ratings for the full CSF 2.0 engagement from a completed
 * self-assessment, marked pre-filled so the assessor must confirm each one.
 * The self-assessment is built on CSF Categories, so every subcategory gets a
 * rating: the mean answer (0 to 4) of the questions that rate it, or else of
 * its Category's questions. Not sure and out-of-scope answers are skipped.
 * Capped at 4; Optimized is never pre-filled.
 */
export function prefillFromSelf(answers: Answers, profile: Profile, tier: Tier): Record<string, number> {
  const asked = new Set(categories.flatMap((c) => inScope(c, tier, profile)).map((q) => q.id));
  const usable = (qids: string[]) =>
    qids.filter((q) => asked.has(q) && answers[q] !== undefined && answers[q] !== NOT_SURE).map((q) => answers[q]);
  const byCategory = new Map(categories.map((c) => [c.id, usable(c.questions.map((q) => q.id))]));
  const out: Record<string, number> = {};
  for (const s of csfSubcategories) {
    const direct = usable(questionsForCsf.get(s.id) ?? []);
    const vals = direct.length ? direct : (byCategory.get(s.category) ?? []);
    if (vals.length) out[s.id] = Math.min(4, Math.round(mean(vals)!));
  }
  return out;
}

/* ---------- Intake ---------- */

export type { IntakeField };

/** Intake sections for an assessment type (security when not given). */
export const intakeSections = intakeSectionsFor('security');
export { intakeSectionsFor };

/** All intake fields, for labels. */
export const intakeFields = allIntakeFields;

export function intakeCompleteness(intake: Record<string, string>, type?: string | null) {
  const req = intakeSectionsFor(type).flatMap((s) => s.fields).filter((f) => f.required);
  const missing = req.filter((f) => !String(intake[f.key] ?? '').trim());
  return { done: req.length - missing.length, total: req.length, missing };
}

export function cleanIntake(input: unknown, type?: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === 'object') {
    for (const f of intakeSectionsFor(type).flatMap((s) => s.fields)) {
      const v = (input as Record<string, unknown>)[f.key];
      if (typeof v === 'string' || typeof v === 'number') out[f.key] = String(v).slice(0, 5000);
    }
  }
  return out;
}

/* ---------- Workflow ---------- */

export const engagementStatuses = ['intake', 'fieldwork', 'review', 'delivered', 'closed'] as const;
export type EngagementStatus = (typeof engagementStatuses)[number];
export const statusLabel: Record<EngagementStatus, string> = {
  intake: 'Intake',
  fieldwork: 'Fieldwork',
  review: 'In review',
  delivered: 'Delivered',
  closed: 'Closed',
};

export type ReportStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'sent';
export const reportStatusLabel: Record<ReportStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  sent: 'Sent to client',
};

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
