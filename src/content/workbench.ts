/**
 * Assessment workbench rules: intake structure, NIST CSF 2.0 scoring,
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
import { csfCategories, csfFunctions, csfSubcategories, type FunctionId } from './csf';
import { controls, inScope, NOT_SURE, type Answers, type IG, type Profile } from './cis-assessment';
import { crosswalk, type FrameworkKey } from './crosswalk';

export const maturityLevels = [
  { value: 0, label: 'Not performed', help: 'Nothing in place.' },
  { value: 1, label: 'Initial', help: 'Ad hoc, depends on individuals.' },
  { value: 2, label: 'Repeatable', help: 'Done regularly but not documented.' },
  { value: 3, label: 'Defined', help: 'Documented, approved and consistently applied.' },
  { value: 4, label: 'Managed', help: 'Measured and monitored, exceptions handled.' },
  { value: 5, label: 'Optimized', help: 'Continuously improved, automated where it makes sense.' },
] as const;

export const EVIDENCE_REQUIRED_AT = 3;

export const defaultTarget = (ig: IG) => ({ 1: 2, 2: 3, 3: 4 })[ig];

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
  functions: { id: FunctionId; title: string; current: number | null; target: number | null }[];
  categories: { id: string; fn: FunctionId; title: string; current: number | null; target: number | null }[];
  rated: number;
  na: number;
  total: number;
}

export function rollup(ratings: Record<string, Rating>): Rollup {
  const categories = csfCategories.map((c) => {
    const rs = csfSubcategories
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
  const functions = csfFunctions.map((f) => {
    const cs = categories.filter((c) => c.fn === f.id);
    return {
      id: f.id,
      title: f.title,
      current: round1(mean(cs.filter((c) => c.current !== null).map((c) => c.current!))),
      target: round1(mean(cs.filter((c) => c.target !== null).map((c) => c.target!))),
    };
  });
  const all = Object.values(ratings);
  return {
    overall: {
      current: round1(mean(functions.filter((f) => f.current !== null).map((f) => f.current!))),
      target: round1(mean(functions.filter((f) => f.target !== null).map((f) => f.target!))),
    },
    functions,
    categories,
    rated: all.filter((r) => r.na || r.current_level !== null).length,
    na: all.filter((r) => r.na).length,
    total: csfSubcategories.length,
  };
}

/* ---------- Crosswalk from CSF back to the other frameworks ---------- */

/** Self-assessment questions that map to each CSF subcategory. */
const questionsForCsf = (() => {
  const m = new Map<string, string[]>();
  for (const [qid, map] of Object.entries(crosswalk)) {
    for (const id of map.csf ?? []) m.set(id, [...(m.get(id) ?? []), qid]);
  }
  return m;
})();

/** Related IDs in CIS, CMMC, ISO and SOC 2, through the shared questions. */
export function relatedFor(csfId: string): Partial<Record<Exclude<FrameworkKey, 'csf'>, string[]>> {
  const out: Partial<Record<Exclude<FrameworkKey, 'csf'>, Set<string>>> = {};
  for (const qid of questionsForCsf.get(csfId) ?? []) {
    for (const k of ['cis', 'cmmc', 'iso', 'soc2'] as const) {
      for (const id of crosswalk[qid]?.[k] ?? []) (out[k] ??= new Set()).add(id);
    }
  }
  const sorted: Partial<Record<Exclude<FrameworkKey, 'csf'>, string[]>> = {};
  for (const [k, v] of Object.entries(out)) {
    sorted[k as Exclude<FrameworkKey, 'csf'>] = [...v].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }
  return sorted;
}

/**
 * Starting ratings from a completed self-assessment: the average answer
 * (0 to 4) of the questions mapped to each subcategory, marked pre-filled so
 * the assessor must confirm each one. Capped at 4; Optimized is never pre-filled.
 */
export function prefillFromSelf(answers: Answers, profile: Profile, ig: IG): Record<string, number> {
  const asked = new Set(controls.flatMap((c) => inScope(c, ig, profile)).map((q) => q.id));
  const out: Record<string, number> = {};
  for (const [csfId, qids] of questionsForCsf) {
    const vals = qids.filter((q) => asked.has(q) && answers[q] !== undefined && answers[q] !== NOT_SURE).map((q) => answers[q]);
    if (vals.length) out[csfId] = Math.min(4, Math.round(mean(vals)!));
  }
  return out;
}

/* ---------- Intake ---------- */

export interface IntakeField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  required?: boolean;
  help?: string;
  options?: string[];
}

export const intakeSections: { title: string; fields: IntakeField[] }[] = [
  {
    title: 'Organization',
    fields: [
      { key: 'overview', label: 'What the organization does', type: 'textarea', required: true },
      { key: 'employees', label: 'Employees', type: 'number', required: true },
      { key: 'locations', label: 'Locations', type: 'textarea', help: 'Offices, data centers, countries.' },
      { key: 'industry', label: 'Industry', type: 'text', required: true },
    ],
  },
  {
    title: 'Scope',
    fields: [
      { key: 'in_scope', label: 'In scope', type: 'textarea', required: true, help: 'Business units, systems, environments.' },
      { key: 'out_of_scope', label: 'Out of scope', type: 'textarea', required: true },
      { key: 'crown_jewels', label: 'Most critical systems and data', type: 'textarea', required: true },
    ],
  },
  {
    title: 'Environment',
    fields: [
      { key: 'identity', label: 'Identity provider', type: 'text', help: 'Entra ID, Okta, Google...' },
      { key: 'cloud', label: 'Cloud and SaaS platforms', type: 'textarea' },
      { key: 'endpoints', label: 'Endpoints (approx.)', type: 'number' },
      { key: 'servers', label: 'Servers (approx.)', type: 'number' },
      { key: 'security_tools', label: 'Security tools in place', type: 'textarea', help: 'EDR, SIEM, email security, MFA, backups...' },
      { key: 'it_model', label: 'IT operating model', type: 'select', options: ['In-house', 'Outsourced (MSP)', 'Hybrid'] },
    ],
  },
  {
    title: 'Obligations and history',
    fields: [
      { key: 'regulations', label: 'Regulations and frameworks', type: 'textarea', required: true, help: 'HIPAA, PCI DSS, CMMC, SOC 2, ISO 27001, state privacy laws...' },
      { key: 'prior_assessments', label: 'Prior assessments or audits', type: 'textarea' },
      { key: 'incidents', label: 'Security incidents in the last 24 months', type: 'textarea' },
      { key: 'insurance', label: 'Cyber insurance requirements', type: 'textarea' },
    ],
  },
  {
    title: 'Engagement',
    fields: [
      { key: 'sponsor', label: 'Executive sponsor', type: 'text', required: true },
      { key: 'interviewees', label: 'People to interview', type: 'textarea', required: true },
      { key: 'method', label: 'Method', type: 'select', required: true, options: ['Remote', 'On-site', 'Hybrid'] },
      { key: 'constraints', label: 'Constraints and assumptions', type: 'textarea' },
    ],
  },
];

export const intakeFields = intakeSections.flatMap((s) => s.fields);

export function intakeCompleteness(intake: Record<string, string>) {
  const req = intakeFields.filter((f) => f.required);
  const missing = req.filter((f) => !String(intake[f.key] ?? '').trim());
  return { done: req.length - missing.length, total: req.length, missing };
}

export function cleanIntake(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === 'object') {
    for (const f of intakeFields) {
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
