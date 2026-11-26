/**
 * Redacted sample of a full NIST CSF 2.0 assessment report, for sales. Every
 * name, finding and rating here is invented; ratings are fixed so the page
 * never changes between builds.
 */
import type { ReportContent } from '@/lib/server/workbench';
import { frameworkFor } from './frameworks';
import { obligationView, fromMaturity, staffHours, type ObligationKey } from './obligations';
import { SCF_VERSION } from './scf/index';
import { priorityFor, rollup, type Rating } from './workbench';

/** Stable pseudo-random level 1 to 4 per Subcategory, lower in Detect and Respond. */
function level(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = id.startsWith('DE') || id.startsWith('RS') ? 1 : 2;
  return Math.min(4, base + (h % 3));
}

export const SAMPLE_OBLIGATIONS: ObligationKey[] = ['hipaa', 'insurance'];

export function sampleReport(): ReportContent {
  const fw = frameworkFor('security');
  const ratings: Record<string, Rating> = {};
  for (const s of fw.items) {
    const cur = level(s.id);
    ratings[s.id] = {
      subcategory: s.id,
      current_level: cur,
      target_level: 3,
      na: false,
      na_reason: null,
      notes: null,
      recommendation: cur < 3 ? 'Redacted in this sample.' : null,
      override_reason: null,
      prefilled: false,
    };
  }
  const csf = fromMaturity(Object.values(ratings));
  return {
    generatedAt: '2026-11-01T17:00:00.000Z',
    assessmentType: 'security',
    client: '██████ Health Partners',
    title: 'NIST CSF 2.0 Security Assessment (sample)',
    assessor: 'Lead Assessor',
    period: { start: '2026-10-01', end: '2026-10-24' },
    targetIg: 2,
    summary:
      'This is a redacted sample. Client details, findings and recommendations are replaced or removed; the structure, scoring and obligation views are what a client receives.\n\n██████ has sound governance and asset management. Detection and response depend on a few people and are not yet documented or tested.',
    intake: {
      overview: 'Regional outpatient provider, ██ clinics, ███ staff. Microsoft 365, cloud EHR, managed network.',
      in_scope: 'Corporate IT, cloud EHR tenant, clinic networks.',
      method: 'Interviews with IT, compliance and clinic managers; document review; configuration walkthroughs.',
    },
    rollup: rollup(ratings, fw),
    findings: fw.items.map((s) => {
      const r = ratings[s.id];
      return {
        id: s.id,
        category: s.category,
        text: s.text,
        current: r.current_level,
        target: r.target_level,
        na: false,
        naReason: null,
        priority: priorityFor(r.current_level, r.target_level),
        notes: null,
        recommendation: r.recommendation,
        unverified: false,
        overrideReason: null,
        evidence: [],
        related: {},
      };
    }),
    flags: [],
    evidenceIndex: [],
    obligations: SAMPLE_OBLIGATIONS.map((k) => obligationView(k, csf)),
    scfVersion: SCF_VERSION,
    assessors: [
      { name: 'Lead Assessor', title: 'Principal, Security & Compliance', credentials: 'CISSP, CISA' },
      { name: 'Assessor', title: 'Security Consultant', credentials: 'Security+' },
    ],
    staffHours: staffHours({ categories: fw.categories.length, evidenceRequests: 60, obligations: SAMPLE_OBLIGATIONS.length }),
  };
}
