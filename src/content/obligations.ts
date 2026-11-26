/**
 * Obligation views: HIPAA Security Rule, NIST SP 800-171, ISO/IEC 27001:2022
 * Annex A and a cyber insurance checklist, derived from CSF 2.0 ratings.
 *
 * CSF 2.0 stays the score. Each obligation requirement is linked to CSF
 * Subcategories through the Secure Controls Framework (SCF) mappings, used
 * unmodified (see ./scf). A requirement's status comes from the ratings of the
 * Subcategories it maps to, and its evidence from the SCF Evidence Request List.
 *
 * What is ours (not SCF): requirement titles for HIPAA and 800-171 (public
 * domain U.S. government text, shortened), the HHS 405(d) HICP practice
 * references, the insurer checklist and its CSF mapping, and the SPRS weights
 * (DoD Assessment Methodology v1.2.1, Annex A, a U.S. government work).
 * ISO 27001 is shown by control number only (ISO text is copyrighted).
 */
import { csfSubcategories } from './csf';
import { erlFor, mapsFor, scfControls, type ScfControl, type ScfMapKey } from './scf/index';

export type ObligationKey = 'hipaa' | 'nist171' | 'iso27001' | 'insurance';
export const OBLIGATION_KEYS: ObligationKey[] = ['hipaa', 'nist171', 'iso27001', 'insurance'];

export const obligationInfo: Record<ObligationKey, { name: string; short: string; scoping: string; note: string }> = {
  hipaa: {
    name: 'HIPAA Security Rule',
    short: 'HIPAA',
    scoping: 'HIPAA (we create, receive or keep electronic protected health information)',
    note: '45 CFR Part 164 Subpart C, with HHS 405(d) Health Industry Cybersecurity Practices (HICP) references. Status is an estimate from the CSF ratings; it is not a HIPAA risk analysis.',
  },
  nist171: {
    name: 'NIST SP 800-171',
    short: '800-171',
    scoping: 'NIST SP 800-171 or CMMC Level 2 (we handle CUI for the DoD)',
    note: 'Rev. 2 requirements with an estimated SPRS score (DoD Assessment Methodology v1.2.1 weights) and a POA&M starter list; Rev. 3 status shown alongside. An estimate, not a score to submit to SPRS.',
  },
  iso27001: {
    name: 'ISO/IEC 27001:2022 Annex A',
    short: 'ISO 27001',
    scoping: 'ISO/IEC 27001 (we are certified or working toward it)',
    note: 'Annex A controls by number only; see your copy of the standard for the control text. Status is an estimate, not a certification audit.',
  },
  insurance: {
    name: 'Cyber insurance controls',
    short: 'Insurance',
    scoping: 'Cyber insurance (we renew or apply for a policy)',
    note: 'Controls cyber insurers commonly ask about on applications and renewals. Written by Emruz; your insurer’s questionnaire is the final word.',
  },
};

/** Ratings by CSF Subcategory on the 0 to 4 scale used for status (null when unrated or N/A). */
export type CsfRatings = Record<string, number | null | undefined>;

export type ReqStatus = 'met' | 'partial' | 'not_met' | 'unknown';
export const reqStatusLabel: Record<ReqStatus, string> = {
  met: 'Met',
  partial: 'Partly met',
  not_met: 'Not met',
  unknown: 'Not assessed',
};

/** Mean rating at or above MET is Met; at or above PARTIAL is Partly met. */
export const MET = 3;
export const PARTIAL = 1.5;

export interface Requirement {
  /** Requirement ID in the obligation (e.g. "3.5.3", "§ 164.308(a)(1)", "A.5.15", "INS-MFA"). */
  id: string;
  title: string;
  group: string;
  /** SCF controls that map to it (empty for the insurer checklist). */
  scf: string[];
  /** CSF Subcategories it is rated through. */
  csf: string[];
  /** SCF Evidence Request List items that support it. */
  erl: string[];
  /** Extra references shown with it (HICP practices, Rev. 3 IDs, implementation specifications). */
  refs?: string[];
  /** SPRS weight (800-171 Rev. 2 only). */
  weight?: number;
  /** The SCF has no CSF mapping for its controls, so csf comes from the Emruz bridge (ours, not SCF). */
  bridged?: boolean;
}

/* ---------- SCF to CSF ---------- */

const subIds = new Set(csfSubcategories.map((s) => s.id));
const subsByCategory = new Map<string, string[]>();
for (const s of csfSubcategories) subsByCategory.set(s.category, [...(subsByCategory.get(s.category) ?? []), s.id]);

/** CSF Subcategories for an SCF control: its Subcategory mappings, or its Category mappings expanded when it has none. Function-only mappings are too broad and are skipped. */
export function csfForControl(c: ScfControl): string[] {
  const ids = mapsFor(c, 'csf');
  const subs = ids.filter((id) => subIds.has(id));
  if (subs.length) return subs;
  return ids.flatMap((id) => subsByCategory.get(id) ?? []);
}

const byNum = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });
const uniq = (xs: string[]) => [...new Set(xs)].sort(byNum);

/** Requirements built from one SCF mapping column. key(token) returns the requirement ID, or null to skip the token. */
function fromScf(col: ScfMapKey, key: (token: string) => string | null) {
  const reqs = new Map<string, { scf: Set<string>; tokens: Set<string> }>();
  for (const c of scfControls) {
    for (const t of mapsFor(c, col)) {
      const id = key(t);
      if (!id) continue;
      const r = reqs.get(id) ?? { scf: new Set(), tokens: new Set() };
      r.scf.add(c.id);
      r.tokens.add(t);
      reqs.set(id, r);
    }
  }
  return reqs;
}

/**
 * Emruz bridge: CSF Subcategories for each SCF domain, used only when none of a
 * requirement's SCF controls map to CSF 2.0. Our own grouping, not an SCF mapping;
 * reports label requirements rated this way, and assessors can override them.
 */
export const BRIDGE: Record<string, string[]> = {
  GOV: ['GV.PO-01', 'GV.PO-02', 'GV.RR-02', 'GV.OV-01'],
  AAT: ['GV.OC-03', 'ID.AM-08'],
  AST: ['ID.AM-01', 'ID.AM-02', 'ID.AM-04', 'ID.AM-08'],
  BCD: ['PR.DS-11', 'RC.RP-01', 'RC.RP-03', 'PR.IR-03'],
  CAP: ['PR.IR-04'],
  CHG: ['PR.PS-01', 'ID.RA-07'],
  CLD: ['PR.IR-01', 'PR.PS-01', 'GV.SC-07'],
  CPL: ['GV.OC-03', 'ID.IM-01'],
  CFG: ['PR.PS-01', 'PR.PS-02'],
  MON: ['DE.CM-01', 'DE.CM-03', 'DE.CM-09', 'PR.PS-04'],
  CRY: ['PR.DS-01', 'PR.DS-02'],
  DCH: ['PR.DS-01', 'PR.DS-02', 'ID.AM-07', 'ID.AM-08'],
  END: ['DE.CM-09', 'PR.PS-02', 'PR.PS-05'],
  HRS: ['GV.RR-04'],
  IAC: ['PR.AA-01', 'PR.AA-02', 'PR.AA-03', 'PR.AA-05'],
  IRO: ['RS.MA-01', 'RS.MA-02', 'RS.CO-02', 'ID.IM-02'],
  IAO: ['ID.IM-01', 'ID.RA-01'],
  MNT: ['ID.AM-08', 'PR.PS-03'],
  MDM: ['PR.AA-05', 'PR.PS-01', 'DE.CM-09'],
  NET: ['PR.IR-01', 'DE.CM-01', 'PR.AA-05'],
  PES: ['PR.AA-06', 'DE.CM-02', 'PR.IR-02'],
  PRI: ['GV.OC-03', 'PR.DS-01'],
  PRM: ['GV.RR-03'],
  RSK: ['ID.RA-05', 'ID.RA-06', 'GV.RM-06'],
  SEA: ['PR.IR-01', 'PR.PS-06', 'PR.DS-02'],
  OPS: ['PR.PS-01'],
  SAT: ['PR.AT-01', 'PR.AT-02'],
  TDA: ['PR.PS-06', 'GV.SC-05'],
  TPM: ['GV.SC-04', 'GV.SC-05', 'GV.SC-07'],
  THR: ['ID.RA-02', 'ID.RA-03'],
  VPM: ['ID.RA-01', 'PR.PS-02'],
  WEB: ['PR.PS-06', 'PR.IR-01'],
};

const controlById = new Map(scfControls.map((c) => [c.id, c]));
function linkFields(scf: Set<string> | string[]) {
  const cs = [...scf].map((id) => controlById.get(id)!).filter(Boolean);
  const direct = uniq(cs.flatMap(csfForControl));
  const bridged = !direct.length && cs.length > 0;
  const csf = bridged ? uniq(cs.flatMap((c) => BRIDGE[c.id.split('-')[0]] ?? [])) : direct;
  return { scf: uniq(cs.map((c) => c.id)), csf, erl: uniq(cs.flatMap(erlFor)), ...(bridged ? { bridged: true } : {}) };
}

/* ---------- HIPAA Security Rule ---------- */

const hipaaSection: Record<string, string> = {
  '164.306': 'General rules',
  '164.308': 'Administrative safeguards',
  '164.310': 'Physical safeguards',
  '164.312': 'Technical safeguards',
  '164.314': 'Organizational requirements',
  '164.316': 'Policies, procedures and documentation',
};

const hipaaTitles: Record<string, string> = {
  '§ 164.306(a)': 'General requirements',
  '§ 164.306(b)': 'Flexibility of approach',
  '§ 164.306(c)': 'Standards',
  '§ 164.306(d)': 'Implementation specifications',
  '§ 164.306(e)': 'Maintenance',
  '§ 164.308(a)(1)': 'Security management process',
  '§ 164.308(a)(2)': 'Assigned security responsibility',
  '§ 164.308(a)(3)': 'Workforce security',
  '§ 164.308(a)(4)': 'Information access management',
  '§ 164.308(a)(5)': 'Security awareness and training',
  '§ 164.308(a)(6)': 'Security incident procedures',
  '§ 164.308(a)(7)': 'Contingency plan',
  '§ 164.308(a)(8)': 'Evaluation',
  '§ 164.308(b)(1)': 'Business associate contracts and other arrangements',
  '§ 164.308(b)(2)': 'Business associate contracts and other arrangements',
  '§ 164.308(b)(3)': 'Written contract or other arrangement',
  '§ 164.310(a)(1)': 'Facility access controls',
  '§ 164.310(a)(2)': 'Facility access controls',
  '§ 164.310(b)': 'Workstation use',
  '§ 164.310(c)': 'Workstation security',
  '§ 164.310(d)(1)': 'Device and media controls',
  '§ 164.310(d)(2)': 'Device and media controls',
  '§ 164.312(a)(1)': 'Access control',
  '§ 164.312(a)(2)': 'Access control',
  '§ 164.312(b)': 'Audit controls',
  '§ 164.312(c)(1)': 'Integrity',
  '§ 164.312(c)(2)': 'Integrity',
  '§ 164.312(d)': 'Person or entity authentication',
  '§ 164.312(e)(1)': 'Transmission security',
  '§ 164.312(e)(2)': 'Transmission security',
  '§ 164.314(a)(1)': 'Business associate contracts or other arrangements',
  '§ 164.314(a)(2)': 'Business associate contracts or other arrangements',
  '§ 164.314(b)(1)': 'Requirements for group health plans',
  '§ 164.314(b)(2)': 'Requirements for group health plans',
  '§ 164.316(a)': 'Policies and procedures',
  '§ 164.316(b)(1)': 'Documentation',
  '§ 164.316(b)(2)': 'Documentation',
};

/** Standard-level citation: section plus paragraph, plus the numbered paragraph when there is one. */
export function hipaaStandard(token: string): string | null {
  const m = token.match(/^§\s*(164\.3\d\d)(\([a-z]\))(\(\d+\))?/);
  if (!m) return null;
  return `§ ${m[1]}${m[2]}${m[3] ?? ''}`;
}

/**
 * HHS 405(d) HICP practices (public). The link from SCF domains to HICP
 * practices is our own grouping, not part of HICP or the SCF.
 */
export const hicpPractices: Record<number, string> = {
  1: 'Email protection systems',
  2: 'Endpoint protection systems',
  3: 'Access management',
  4: 'Data protection and loss prevention',
  5: 'Asset management',
  6: 'Network management',
  7: 'Vulnerability management',
  8: 'Security operations center and incident response',
  9: 'Network connected medical devices',
  10: 'Cybersecurity oversight and governance',
};
const hicpByScfPrefix: Record<string, number[]> = {
  GOV: [10], RSK: [10], CPL: [10], HRS: [10], SAT: [10], TPM: [10], PRM: [10],
  END: [2], CFG: [2],
  IAC: [3],
  DCH: [4], CRY: [4], BCD: [4], PRI: [4],
  AST: [5], EMB: [9],
  NET: [1, 6],
  VPM: [7], TDA: [7], CHG: [7],
  MON: [8], IRO: [8], THR: [8],
};
const hicpFor = (scf: string[]) =>
  uniq([...new Set(scf.flatMap((id) => hicpByScfPrefix[id.split('-')[0]] ?? []))].map((n) => `HICP ${n}: ${hicpPractices[n]}`));

function hipaaRequirements(): Requirement[] {
  return [...fromScf('hipaa', hipaaStandard).entries()]
    .sort(([a], [b]) => byNum(a, b))
    .map(([id, r]) => {
      const links = linkFields(r.scf);
      const section = id.match(/164\.3\d\d/)![0];
      const specs = [...r.tokens].filter((t) => t !== id).sort(byNum);
      return {
        id,
        title: hipaaTitles[id] ?? hipaaSection[section],
        group: `§ ${section} ${hipaaSection[section]}`,
        ...links,
        refs: [...specs, ...hicpFor(links.scf)],
      };
    });
}

/* ---------- NIST SP 800-171 ---------- */

const families171: Record<string, string> = {
  '1': 'Access Control', '2': 'Awareness and Training', '3': 'Audit and Accountability', '4': 'Configuration Management',
  '5': 'Identification and Authentication', '6': 'Incident Response', '7': 'Maintenance', '8': 'Media Protection',
  '9': 'Personnel Security', '10': 'Physical Protection', '11': 'Risk Assessment', '12': 'Security Assessment',
  '13': 'System and Communications Protection', '14': 'System and Information Integrity',
  '15': 'Planning', '16': 'System and Services Acquisition', '17': 'Supply Chain Risk Management',
};

/**
 * SPRS weights from the NIST SP 800-171 DoD Assessment Methodology v1.2.1, Annex A.
 * 3.5.3 and 3.13.11 are 5 when not implemented and 3 when partly implemented.
 * 3.12.4 (system security plan) has no value: without a plan, no score can be given.
 */
export const SPRS_WEIGHTS: Record<string, number> = {
  '3.1.1': 5, '3.1.2': 5, '3.1.3': 1, '3.1.4': 1, '3.1.5': 3, '3.1.6': 1, '3.1.7': 1, '3.1.8': 1, '3.1.9': 1, '3.1.10': 1, '3.1.11': 1,
  '3.1.12': 5, '3.1.13': 5, '3.1.14': 1, '3.1.15': 1, '3.1.16': 5, '3.1.17': 5, '3.1.18': 5, '3.1.19': 3, '3.1.20': 1, '3.1.21': 1, '3.1.22': 1,
  '3.2.1': 5, '3.2.2': 5, '3.2.3': 1,
  '3.3.1': 5, '3.3.2': 3, '3.3.3': 1, '3.3.4': 1, '3.3.5': 5, '3.3.6': 1, '3.3.7': 1, '3.3.8': 1, '3.3.9': 1,
  '3.4.1': 5, '3.4.2': 5, '3.4.3': 1, '3.4.4': 1, '3.4.5': 5, '3.4.6': 5, '3.4.7': 5, '3.4.8': 5, '3.4.9': 1,
  '3.5.1': 5, '3.5.2': 5, '3.5.3': 5, '3.5.4': 1, '3.5.5': 1, '3.5.6': 1, '3.5.7': 1, '3.5.8': 1, '3.5.9': 1, '3.5.10': 5, '3.5.11': 1,
  '3.6.1': 5, '3.6.2': 5, '3.6.3': 1,
  '3.7.1': 3, '3.7.2': 5, '3.7.3': 1, '3.7.4': 3, '3.7.5': 5, '3.7.6': 1,
  '3.8.1': 3, '3.8.2': 3, '3.8.3': 5, '3.8.4': 1, '3.8.5': 1, '3.8.6': 1, '3.8.7': 5, '3.8.8': 3, '3.8.9': 1,
  '3.9.1': 3, '3.9.2': 5,
  '3.10.1': 5, '3.10.2': 5, '3.10.3': 1, '3.10.4': 1, '3.10.5': 1, '3.10.6': 1,
  '3.11.1': 3, '3.11.2': 5, '3.11.3': 1,
  '3.12.1': 5, '3.12.2': 3, '3.12.3': 5, '3.12.4': 0,
  '3.13.1': 5, '3.13.2': 5, '3.13.3': 1, '3.13.4': 1, '3.13.5': 5, '3.13.6': 5, '3.13.7': 1, '3.13.8': 3, '3.13.9': 1, '3.13.10': 1,
  '3.13.11': 5, '3.13.12': 1, '3.13.13': 1, '3.13.14': 1, '3.13.15': 5, '3.13.16': 1,
  '3.14.1': 5, '3.14.2': 5, '3.14.3': 5, '3.14.4': 5, '3.14.5': 3, '3.14.6': 5, '3.14.7': 3,
};
/** Requirements worth 5 when not implemented and 3 when partly implemented. */
export const SPRS_PARTIAL: Record<string, number> = { '3.5.3': 3, '3.13.11': 3 };
export const SPRS_MAX = 110;

function nist171r2(): Requirement[] {
  const reqs = fromScf('nist171r2', (t) => (/^3\.\d+\.\d+$/.test(t) && t in SPRS_WEIGHTS ? t : null));
  const r3 = fromScf('nist171r3', (t) => t.match(/^03\.\d\d\.\d\d/)?.[0] ?? null);
  const r3ByScf = new Map<string, string[]>();
  for (const [id, r] of r3) for (const s of r.scf) r3ByScf.set(s, [...(r3ByScf.get(s) ?? []), id]);
  return Object.keys(SPRS_WEIGHTS)
    .sort(byNum)
    .map((id) => {
      const scf = reqs.get(id)?.scf ?? new Set<string>();
      const links = linkFields(scf);
      return {
        id,
        title: `${families171[id.split('.')[1]]} ${id}`,
        group: families171[id.split('.')[1]],
        ...links,
        refs: uniq(links.scf.flatMap((s) => r3ByScf.get(s) ?? [])).map((x) => `Rev. 3 ${x}`),
        weight: SPRS_WEIGHTS[id],
      };
    });
}

/** Rev. 3 requirements (status only, no SPRS). */
function nist171r3(): Requirement[] {
  return [...fromScf('nist171r3', (t) => t.match(/^03\.\d\d\.\d\d/)?.[0] ?? null).entries()]
    .sort(([a], [b]) => byNum(a, b))
    .map(([id, r]) => {
      const fam = String(Number(id.split('.')[1]));
      return { id, title: `${families171[fam]} ${id}`, group: families171[fam], ...linkFields(r.scf) };
    });
}

/* ---------- ISO/IEC 27001:2022 Annex A (numbers only) ---------- */

const isoThemes: Record<string, string> = { '5': 'Organizational controls', '6': 'People controls', '7': 'Physical controls', '8': 'Technological controls' };

function isoAnnexA(): Requirement[] {
  // SCF maps Annex A through ISO/IEC 27002:2022, which uses the same control numbers.
  return [...fromScf('iso27002', (t) => (/^[5-8]\.\d+$/.test(t) ? t : null)).entries()]
    .sort(([a], [b]) => byNum(a, b))
    .map(([n, r]) => ({ id: `A.${n}`, title: `Annex A ${n}`, group: isoThemes[n.split('.')[0]], ...linkFields(r.scf) }));
}

/* ---------- Cyber insurance checklist (ours) ---------- */

const insuranceItems: { id: string; title: string; csf: string[] }[] = [
  { id: 'INS-MFA-REMOTE', title: 'MFA on email, remote access and VPN', csf: ['PR.AA-03'] },
  { id: 'INS-MFA-ADMIN', title: 'MFA on administrator and privileged accounts', csf: ['PR.AA-03', 'PR.AA-05'] },
  { id: 'INS-EDR', title: 'Endpoint detection and response on servers and workstations', csf: ['DE.CM-01', 'DE.CM-09'] },
  { id: 'INS-MONITOR', title: 'Security alerts monitored around the clock (SOC or MDR)', csf: ['DE.CM-01', 'DE.AE-02', 'DE.AE-06'] },
  { id: 'INS-BACKUP', title: 'Backups kept offline or immutable, separate from the network', csf: ['PR.DS-11'] },
  { id: 'INS-RESTORE', title: 'Restores from backup tested at least once a year', csf: ['PR.DS-11', 'RC.RP-03'] },
  { id: 'INS-PATCH', title: 'Critical patches applied on a set timeline', csf: ['ID.RA-01', 'PR.PS-02'] },
  { id: 'INS-EOL', title: 'Unsupported (end of life) systems removed or isolated', csf: ['ID.AM-08', 'PR.PS-03'] },
  { id: 'INS-EMAIL', title: 'Email filtering for phishing and malicious attachments', csf: ['DE.CM-09', 'PR.PS-05'] },
  { id: 'INS-TRAINING', title: 'Phishing awareness training and simulations for staff', csf: ['PR.AT-01'] },
  { id: 'INS-PRIV', title: 'Privileged access limited and reviewed', csf: ['PR.AA-05'] },
  { id: 'INS-IRP', title: 'Written incident response plan, tested with an exercise', csf: ['RS.MA-01', 'ID.IM-02'] },
  { id: 'INS-ENCRYPT', title: 'Sensitive data encrypted at rest and in transit', csf: ['PR.DS-01', 'PR.DS-02'] },
  { id: 'INS-VENDOR', title: 'Vendor and third-party access controlled and reviewed', csf: ['GV.SC-07', 'PR.AA-05'] },
  { id: 'INS-PAYMENTS', title: 'Funds transfer requests verified out of band', csf: ['PR.AT-01', 'GV.PO-01'] },
  { id: 'INS-ASSETS', title: 'Inventory of hardware and software kept current', csf: ['ID.AM-01', 'ID.AM-02'] },
];

function insuranceRequirements(): Requirement[] {
  const erlByCsf = new Map<string, Set<string>>();
  for (const c of scfControls) for (const s of csfForControl(c)) for (const e of erlFor(c)) (erlByCsf.get(s) ?? erlByCsf.set(s, new Set()).get(s)!).add(e);
  return insuranceItems.map((i) => ({
    id: i.id,
    title: i.title,
    group: 'Insurer controls',
    scf: [],
    csf: i.csf,
    erl: uniq(i.csf.flatMap((s) => [...(erlByCsf.get(s) ?? [])])),
  }));
}

/* ---------- Requirements by obligation (built once) ---------- */

export const requirements: Record<ObligationKey, Requirement[]> = {
  hipaa: hipaaRequirements(),
  nist171: nist171r2(),
  iso27001: isoAnnexA(),
  insurance: insuranceRequirements(),
};
export const nist171Rev3: Requirement[] = nist171r3();

/* ---------- Status ---------- */

export function requirementRating(r: Requirement, ratings: CsfRatings): number | null {
  const vals = r.csf.map((id) => ratings[id]).filter((v): v is number => typeof v === 'number');
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export function requirementStatus(r: Requirement, ratings: CsfRatings): ReqStatus {
  const v = requirementRating(r, ratings);
  if (v === null) return 'unknown';
  if (v >= MET) return 'met';
  if (v >= PARTIAL) return 'partial';
  return 'not_met';
}

/** Evidence counts by link: evidence IDs per ERL item and per CSF Subcategory. */
export interface EvidenceIndex {
  byErl: Record<string, string[]>;
  byCsf: Record<string, string[]>;
}

/** Evidence items that support a requirement: linked to one of its ERL items or one of its Subcategories. */
export function evidenceFor(r: Requirement, ev: EvidenceIndex): string[] {
  const ids = new Set<string>();
  for (const e of r.erl) for (const id of ev.byErl[e] ?? []) ids.add(id);
  for (const s of r.csf) for (const id of ev.byCsf[s] ?? []) ids.add(id);
  return [...ids];
}

export interface RequirementResult extends Requirement {
  status: ReqStatus;
  rating: number | null;
  evidence: string[];
  /** Status set by the assessor instead of derived from CSF ratings. */
  overridden?: boolean;
  note?: string;
}

/** Assessor overrides by requirement ID. */
export type Overrides = Record<string, { status: ReqStatus; note?: string | null }>;

export interface ObligationView {
  key: ObligationKey;
  name: string;
  note: string;
  counts: Record<ReqStatus, number>;
  requirements: RequirementResult[];
  sprs?: SprsResult;
  rev3?: { counts: Record<ReqStatus, number>; requirements: RequirementResult[] };
}

export interface SprsResult {
  score: number;
  /** System security plan rated as not met: SPRS needs a plan before any score is valid. */
  noSsp: boolean;
  poam: { id: string; title: string; weight: number; status: ReqStatus; scf: string[]; erl: string[] }[];
}

const emptyCounts = (): Record<ReqStatus, number> => ({ met: 0, partial: 0, not_met: 0, unknown: 0 });

function results(reqs: Requirement[], ratings: CsfRatings, ev: EvidenceIndex, ov: Overrides = {}) {
  const counts = emptyCounts();
  const out = reqs.map((r): RequirementResult => {
    const o = ov[r.id];
    const status = o ? o.status : requirementStatus(r, ratings);
    counts[status]++;
    const res: RequirementResult = { ...r, status, rating: requirementRating(r, ratings), evidence: evidenceFor(r, ev) };
    if (o) {
      res.overridden = true;
      if (o.note) res.note = o.note;
    }
    return res;
  });
  return { counts, requirements: out };
}

/**
 * Estimated SPRS score: 110 less the weight of every requirement not met.
 * Partly met counts as not implemented (SPRS has no partial credit), except
 * 3.5.3 and 3.13.11, which take their lower partial deduction. Unassessed
 * requirements are deducted too, so the estimate never flatters.
 */
export function sprs(reqs: RequirementResult[]): SprsResult {
  let score = SPRS_MAX;
  const poam: SprsResult['poam'] = [];
  for (const r of reqs) {
    if (r.status === 'met' || r.weight === undefined) continue;
    const w = r.status === 'partial' && SPRS_PARTIAL[r.id] ? SPRS_PARTIAL[r.id] : r.weight;
    score -= w;
    poam.push({ id: r.id, title: r.title, weight: w, status: r.status, scf: r.scf, erl: r.erl });
  }
  poam.sort((a, b) => b.weight - a.weight || byNum(a.id, b.id));
  const ssp = reqs.find((r) => r.id === '3.12.4');
  return { score, noSsp: !!ssp && ssp.status !== 'met', poam };
}

export function obligationView(
  key: ObligationKey,
  ratings: CsfRatings,
  ev: EvidenceIndex = { byErl: {}, byCsf: {} },
  overrides: Overrides = {},
): ObligationView {
  const { counts, requirements: reqs } = results(requirements[key], ratings, ev, overrides);
  const view: ObligationView = { key, name: obligationInfo[key].name, note: obligationInfo[key].note, counts, requirements: reqs };
  if (key === 'nist171') {
    view.sprs = sprs(reqs);
    view.rev3 = results(nist171Rev3, ratings, ev);
  }
  return view;
}

/** POA&M starter list as CSV (RFC 4180 quoting). */
export function poamCsv(view: ObligationView): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['Requirement', 'Title', 'SPRS points', 'Status', 'SCF controls', 'Evidence requests (SCF ERL)', 'Planned action', 'Owner', 'Target date']];
  for (const p of view.sprs?.poam ?? []) {
    rows.push([p.id, p.title, String(p.weight), reqStatusLabel[p.status], p.scf.join(' '), p.erl.join(' '), '', '', '']);
  }
  return rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
}

/* ---------- Rating scales ---------- */

/** Workbench maturity (0 to 5) to the status scale. 3 (Defined) and up count as met. */
export const fromMaturity = (ratings: { subcategory: string; current_level: number | null; na: boolean }[]): CsfRatings =>
  Object.fromEntries(ratings.filter((r) => !r.na && r.current_level !== null).map((r) => [r.subcategory, Math.min(4, r.current_level!)]));

/** Clean a list of obligation keys from user input. */
export const cleanObligations = (v: unknown): ObligationKey[] =>
  Array.isArray(v) ? OBLIGATION_KEYS.filter((k) => v.includes(k)) : [];

/* ---------- Effort ---------- */

/**
 * Estimated client staff hours for a full assessment: interviews and walkthroughs
 * per CSF Category in scope, plus evidence gathering per evidence request and
 * per obligation view. Rounded to the nearest 5 hours.
 */
export function staffHours(opts: { categories: number; evidenceRequests: number; obligations: number }): number {
  const h = opts.categories * 1.5 + opts.evidenceRequests * 0.5 + opts.obligations * 4 + 4;
  return Math.max(10, Math.round(h / 5) * 5);
}

/* ---------- Evidence requests from the SCF Evidence Request List ---------- */

/** ERL items for an engagement: those supporting the CSF Categories assessed, plus every requirement of the chosen obligations. */
export function erlForScope(categories: string[], obligations: ObligationKey[]): string[] {
  const cats = new Set(categories);
  const ids = new Set<string>();
  for (const c of scfControls) {
    if (csfForControl(c).some((s) => cats.has(s.split('-')[0]))) for (const e of erlFor(c)) ids.add(e);
  }
  for (const k of obligations) for (const r of requirements[k]) for (const e of r.erl) ids.add(e);
  return uniq([...ids]);
}

/** Build the evidence index from evidence rows (ERL links and Subcategory links). */
export function evidenceIndex(rows: { id: string; subcategories: string[]; erl_ids?: string[] }[]): EvidenceIndex {
  const byErl: Record<string, string[]> = {};
  const byCsf: Record<string, string[]> = {};
  for (const r of rows) {
    for (const e of r.erl_ids ?? []) (byErl[e] ??= []).push(r.id);
    for (const s of r.subcategories) (byCsf[s] ??= []).push(r.id);
  }
  return { byErl, byCsf };
}

export const isReqStatus = (v: unknown): v is ReqStatus => v === 'met' || v === 'partial' || v === 'not_met' || v === 'unknown';
export const isObligation = (v: unknown): v is ObligationKey => OBLIGATION_KEYS.includes(v as ObligationKey);
