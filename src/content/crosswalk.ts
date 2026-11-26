/**
 * Crosswalk from the self-assessment questions to CMMC 2.0 Level 2, ISO/IEC
 * 27001:2022 Annex A, NIST CSF 2.0 Subcategories and SOC 2 (2017 Trust
 * Services Criteria, revised 2022).
 *
 * Mapped per question, so a partial answer only affects the requirements it
 * relates to. CSF Subcategories come from each question; titles for the other
 * frameworks are our own short descriptions. Never paste ISO or AICPA wording
 * here (copyright).
 *
 * DRAFT: mappings must be reviewed against the NIST OLIR informative
 * references before launch.
 */
import { categories, inScope, type Answers, type FrameworkKey, type Profile, type Tier } from './self-assessment';
import { csfSubcategories } from './csf';

export type { FrameworkKey };

export interface Framework {
  key: FrameworkKey;
  name: string;
  short: string;
  /** What this assessment does not cover for this framework */
  notCovered: string;
  ids: Record<string, string>;
}

const usedCsf = new Set(categories.flatMap((c) => c.questions.flatMap((q) => q.csf)));

export const frameworks: Framework[] = [
  {
    key: 'cmmc',
    name: 'CMMC 2.0 Level 2',
    short: 'CMMC',
    notCovered:
      'Physical protection, personnel screening, media sanitization, maintenance, FIPS-validated encryption, the system security plan and plans of action. Most Level 2 organizations also need a third-party (C3PAO) assessment.',
    ids: {
      'AC.L2-3.1.1': 'Limit system access to authorized users and devices',
      'AC.L2-3.1.3': 'Control the flow of controlled information',
      'AC.L2-3.1.5': 'Least privilege',
      'AC.L2-3.1.6': 'Non-privileged accounts for everyday work',
      'AC.L2-3.1.10': 'Session lock after inactivity',
      'AC.L2-3.1.12': 'Monitor and control remote access',
      'AC.L2-3.1.13': 'Encrypt remote access sessions',
      'AC.L2-3.1.19': 'Encrypt controlled information on mobile devices',
      'AT.L2-3.2.1': 'Security awareness for all users',
      'AT.L2-3.2.2': 'Role-based security training',
      'AT.L2-3.2.3': 'Insider threat awareness',
      'AU.L2-3.3.1': 'Create and keep audit logs',
      'AU.L2-3.3.5': 'Correlate log review and analysis',
      'AU.L2-3.3.7': 'Synchronize system clocks',
      'CA.L2-3.12.1': 'Periodically assess security controls',
      'CA.L2-3.12.2': 'Plan and track fixes for deficiencies',
      'CM.L2-3.4.1': 'Baseline configurations and asset inventories',
      'CM.L2-3.4.2': 'Enforce secure configuration settings',
      'CM.L2-3.4.3': 'Track and control configuration changes',
      'CM.L2-3.4.6': 'Least functionality',
      'CM.L2-3.4.7': 'Restrict nonessential programs and services',
      'CM.L2-3.4.8': 'Allowlist or blocklist software',
      'CM.L2-3.4.9': 'Control user-installed software',
      'IA.L2-3.5.1': 'Identify users and devices',
      'IA.L2-3.5.3': 'Multifactor authentication',
      'IA.L2-3.5.6': 'Disable inactive identifiers',
      'IA.L2-3.5.7': 'Password strength',
      'IR.L2-3.6.1': 'Incident handling capability',
      'IR.L2-3.6.2': 'Track, document and report incidents',
      'IR.L2-3.6.3': 'Test incident response',
      'MP.L2-3.8.7': 'Control removable media',
      'MP.L2-3.8.9': 'Protect backups',
      'PS.L2-3.9.2': 'Protect systems when people leave or move',
      'RA.L2-3.11.1': 'Periodically assess risk',
      'RA.L2-3.11.2': 'Scan for vulnerabilities',
      'RA.L2-3.11.3': 'Remediate vulnerabilities',
      'SC.L2-3.13.1': 'Monitor and protect network boundaries',
      'SC.L2-3.13.2': 'Secure architecture and development',
      'SC.L2-3.13.5': 'Separate public-facing systems',
      'SC.L2-3.13.8': 'Encrypt data in transit',
      'SC.L2-3.13.16': 'Protect data at rest',
      'SI.L2-3.14.1': 'Fix system flaws promptly',
      'SI.L2-3.14.2': 'Malicious code protection',
      'SI.L2-3.14.4': 'Update malicious code protection',
      'SI.L2-3.14.5': 'Scan systems and files',
      'SI.L2-3.14.6': 'Monitor for attacks',
      'SI.L2-3.14.7': 'Identify unauthorized use',
    },
  },
  {
    key: 'iso',
    name: 'ISO/IEC 27001:2022',
    short: 'ISO 27001',
    notCovered:
      'The management system itself (scope, risk assessment and treatment, Statement of Applicability, internal audit, management review) and Annex A controls for HR, physical security, legal and privacy. Certification needs an accredited audit.',
    ids: {
      '5.1': 'Information security policies',
      '5.2': 'Security roles and responsibilities',
      '5.5': 'Contact with authorities',
      '5.9': 'Inventory of information and assets',
      '5.12': 'Classification of information',
      '5.14': 'Information transfer',
      '5.15': 'Access control',
      '5.16': 'Identity management',
      '5.17': 'Authentication information',
      '5.18': 'Access rights',
      '5.19': 'Supplier security',
      '5.20': 'Security in supplier agreements',
      '5.22': 'Monitoring supplier services',
      '5.24': 'Incident management planning',
      '5.25': 'Assessing security events',
      '5.26': 'Response to incidents',
      '5.27': 'Learning from incidents',
      '5.28': 'Collection of evidence',
      '5.29': 'Security during disruption',
      '5.31': 'Legal, regulatory and contractual requirements',
      '5.35': 'Independent review of security',
      '6.3': 'Awareness, education and training',
      '6.5': 'Responsibilities after leaving',
      '6.8': 'Reporting security events',
      '7.10': 'Storage media',
      '8.1': 'User endpoint devices',
      '8.2': 'Privileged access',
      '8.3': 'Restricting information access',
      '8.5': 'Secure authentication',
      '8.7': 'Protection against malware',
      '8.8': 'Technical vulnerability management',
      '8.9': 'Configuration management',
      '8.12': 'Data leakage prevention',
      '8.13': 'Backup',
      '8.15': 'Logging',
      '8.16': 'Monitoring activities',
      '8.17': 'Clock synchronization',
      '8.19': 'Software on operational systems',
      '8.20': 'Network security',
      '8.21': 'Security of network services',
      '8.22': 'Network segregation',
      '8.23': 'Web filtering',
      '8.24': 'Use of cryptography',
      '8.25': 'Secure development lifecycle',
      '8.28': 'Secure coding',
      '8.29': 'Security testing in development',
    },
  },
  {
    key: 'csf',
    name: 'NIST CSF 2.0',
    short: 'NIST CSF',
    notCovered:
      'This short assessment asks one or two questions per Category, not every Subcategory. A full CSF assessment rates every Subcategory against a target profile.',
    // NIST CSF 2.0 text is a U.S. government work in the public domain.
    ids: Object.fromEntries(csfSubcategories.filter((s) => usedCsf.has(s.id)).map((s) => [s.id, s.text])),
  },
  {
    key: 'soc2',
    name: 'SOC 2 (Trust Services Criteria)',
    short: 'SOC 2',
    notCovered:
      'Most of the control environment (CC1), physical access, change approval, and the Processing Integrity and Privacy criteria. A SOC 2 report needs an independent CPA audit.',
    ids: {
      'CC1.3': 'Structures, reporting lines and authority',
      'CC1.4': 'Competence and training',
      'CC2.2': 'Internal security communication',
      'CC2.3': 'External communication',
      'CC3.1': 'Objectives specified to identify risks',
      'CC3.2': 'Risks identified and analyzed',
      'CC4.1': 'Ongoing and separate evaluations',
      'CC4.2': 'Deficiencies communicated and fixed',
      'CC5.3': 'Policies and procedures deployed',
      'CC6.1': 'Logical access security',
      'CC6.2': 'User registration and authorization',
      'CC6.3': 'Role-based access and removal',
      'CC6.6': 'Protection against external threats',
      'CC6.7': 'Restricting data movement',
      'CC6.8': 'Preventing unauthorized or malicious software',
      'CC7.1': 'Detecting configuration changes and vulnerabilities',
      'CC7.2': 'Monitoring for anomalies',
      'CC7.3': 'Evaluating security events',
      'CC7.4': 'Incident response',
      'CC7.5': 'Recovery from incidents',
      'CC8.1': 'Change and development management',
      'CC9.2': 'Vendor and partner risk',
      'A1.2': 'Backup and recovery infrastructure',
      'A1.3': 'Recovery testing',
      'C1.1': 'Identifying and protecting confidential information',
    },
  },
];

export const frameworkByKey = (k: FrameworkKey) => frameworks.find((f) => f.key === k)!;

type Map = Partial<Record<Exclude<FrameworkKey, 'csf'>, string[]>>;

/** Question ID to related CMMC, ISO and SOC 2 IDs. CSF Subcategories come from the question itself. */
export const crosswalk: Record<string, Map> = {
  'GV.OC-a': { iso: ['5.31'], soc2: ['CC3.1'] },
  'GV.RM-a': { cmmc: ['RA.L2-3.11.1'], soc2: ['CC3.1', 'CC3.2'] },
  'GV.RR-a': { iso: ['5.2'], soc2: ['CC1.3'] },
  'GV.PO-a': { iso: ['5.1'], soc2: ['CC5.3'] },
  'GV.OV-a': { cmmc: ['CA.L2-3.12.1'], iso: ['5.35'], soc2: ['CC4.1', 'CC4.2'] },
  'GV.SC-a': { iso: ['5.19', '5.20', '5.22'], soc2: ['CC9.2'] },
  'ID.AM-a': { cmmc: ['AC.L2-3.1.1', 'CM.L2-3.4.1', 'IA.L2-3.5.1'], iso: ['5.9'], soc2: ['CC6.1'] },
  'ID.RA-a': { cmmc: ['RA.L2-3.11.2', 'RA.L2-3.11.3'], iso: ['8.8'], soc2: ['CC7.1'] },
  'ID.IM-a': { cmmc: ['CA.L2-3.12.1', 'CA.L2-3.12.2', 'IR.L2-3.6.3'], iso: ['5.27', '8.8'], soc2: ['CC4.1', 'CC4.2'] },
  'PR.AA-a': { cmmc: ['AC.L2-3.1.1', 'AC.L2-3.1.5', 'AC.L2-3.1.6', 'IA.L2-3.5.6', 'PS.L2-3.9.2'], iso: ['5.15', '5.16', '5.18', '6.5', '8.2'], soc2: ['CC6.1', 'CC6.2', 'CC6.3'] },
  'PR.AA-b': { cmmc: ['IA.L2-3.5.3', 'IA.L2-3.5.7'], iso: ['5.17', '8.5'], soc2: ['CC6.1', 'CC6.6'] },
  'PR.AT-a': { cmmc: ['AT.L2-3.2.1', 'AT.L2-3.2.2', 'AT.L2-3.2.3'], iso: ['6.3'], soc2: ['CC1.4', 'CC2.2'] },
  'PR.DS-a': { cmmc: ['AC.L2-3.1.3', 'AC.L2-3.1.19', 'SC.L2-3.13.8', 'SC.L2-3.13.16'], iso: ['5.12', '8.3', '8.12', '8.24'], soc2: ['C1.1', 'CC6.1', 'CC6.7'] },
  'PR.DS-b': { cmmc: ['MP.L2-3.8.9'], iso: ['8.13'], soc2: ['A1.2'] },
  'PR.PS-a': { cmmc: ['SI.L2-3.14.1'], iso: ['8.8', '8.19'], soc2: ['CC7.1'] },
  'PR.PS-b': { cmmc: ['CM.L2-3.4.7', 'CM.L2-3.4.8', 'CM.L2-3.4.9', 'SI.L2-3.14.2', 'SI.L2-3.14.4', 'SI.L2-3.14.5'], iso: ['8.7', '8.19'], soc2: ['CC6.8'] },
  'PR.PS-c': { cmmc: ['AC.L2-3.1.10', 'CM.L2-3.4.1', 'CM.L2-3.4.2', 'CM.L2-3.4.3', 'CM.L2-3.4.6'], iso: ['8.9'], soc2: ['CC7.1', 'CC8.1'] },
  'PR.PS-d': { cmmc: ['SC.L2-3.13.2'], iso: ['8.25', '8.28', '8.29'], soc2: ['CC8.1'] },
  'PR.IR-a': { cmmc: ['AC.L2-3.1.12', 'AC.L2-3.1.13', 'SC.L2-3.13.1', 'SC.L2-3.13.5'], iso: ['8.20', '8.21', '8.22'], soc2: ['CC6.6'] },
  'DE.CM-a': { cmmc: ['AU.L2-3.3.1', 'AU.L2-3.3.7'], iso: ['8.15', '8.17'], soc2: ['CC7.2'] },
  'DE.CM-b': { cmmc: ['SC.L2-3.13.1', 'SI.L2-3.14.2'], iso: ['8.7', '8.23'], soc2: ['CC6.6', 'CC6.8'] },
  'DE.AE-a': { cmmc: ['AU.L2-3.3.5', 'SI.L2-3.14.6', 'SI.L2-3.14.7'], iso: ['5.25', '8.16'], soc2: ['CC7.2', 'CC7.3'] },
  'RS.MA-a': { cmmc: ['IR.L2-3.6.1', 'IR.L2-3.6.3'], iso: ['5.24', '5.26'], soc2: ['CC7.4'] },
  'RS.AN-a': { cmmc: ['IR.L2-3.6.1', 'IR.L2-3.6.2'], iso: ['5.25', '5.28'], soc2: ['CC7.3', 'CC7.4'] },
  'RS.CO-a': { cmmc: ['IR.L2-3.6.2'], iso: ['5.5', '6.8'], soc2: ['CC2.3', 'CC7.4'] },
  'RS.MI-a': { cmmc: ['IR.L2-3.6.1'], iso: ['5.26'], soc2: ['CC7.4'] },
  'RC.RP-a': { cmmc: ['MP.L2-3.8.9'], iso: ['5.29', '8.13'], soc2: ['A1.3', 'CC7.5'] },
  'RC.CO-a': { iso: ['5.26'], soc2: ['CC7.5'] },
};

const questionCsf = new Map(categories.flatMap((c) => c.questions.map((q) => [q.id, q.csf] as const)));

/** Related IDs for a question in one framework. */
export const relatedIds = (qid: string, key: FrameworkKey): string[] =>
  key === 'csf' ? (questionCsf.get(qid) ?? []) : (crosswalk[qid]?.[key] ?? []);

export type Status = 'met' | 'partial' | 'gap';

export interface CrosswalkItem {
  id: string;
  title: string;
  score: number;
  status: Status;
  /** CSF Categories whose questions feed this item */
  categories: string[];
}

export interface FrameworkResult {
  framework: Framework;
  score: number;
  items: CrosswalkItem[];
  counts: Record<Status, number>;
}

export const statusOf = (score: number): Status => (score >= 75 ? 'met' : score >= 40 ? 'partial' : 'gap');

/** Natural sort for IDs like 5.9 < 5.12 and CC6.1 < CC6.10 */
const idCompare = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

/** Readiness for one framework, from the in-scope answers. */
export function frameworkResult(key: FrameworkKey, answers: Answers, tier: Tier, p: Profile = {}): FrameworkResult {
  const framework = frameworkByKey(key);
  const acc = new Map<string, { sum: number; n: number; cats: Set<string> }>();
  for (const c of categories) {
    for (const q of inScope(c, tier, p)) {
      for (const id of relatedIds(q.id, key)) {
        const e = acc.get(id) ?? { sum: 0, n: 0, cats: new Set<string>() };
        e.sum += Math.max(0, answers[q.id] ?? 0);
        e.n += 1;
        e.cats.add(c.id);
        acc.set(id, e);
      }
    }
  }
  const items: CrosswalkItem[] = [...acc.entries()]
    .map(([id, e]) => {
      const score = Math.round((e.sum / (e.n * 4)) * 100);
      return { id, title: framework.ids[id] ?? id, score, status: statusOf(score), categories: [...e.cats] };
    })
    .sort((a, b) => idCompare(a.id, b.id));
  const counts = { met: 0, partial: 0, gap: 0 };
  for (const i of items) counts[i.status]++;
  const score = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0;
  return { framework, score, items, counts };
}

export const FRAMEWORK_KEYS = frameworks.map((f) => f.key);
