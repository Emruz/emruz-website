/**
 * Self-paced security assessment based on the NIST Cybersecurity Framework 2.0
 * (a U.S. government work in the public domain). Question wording is our own.
 *
 * About one question per CSF Category, grouped by Function. Each question is
 * tagged with the lowest target profile it belongs to (Essential, Standard,
 * Advanced). A short scoping profile sets the target, and only questions at or
 * below it are scored. Everything runs in the browser; answers are only sent
 * to the server when saved.
 */
import { addOns, packages, type AddOn, type CapabilityCode, type ServicePackage } from './packages';
import { csfFunctions, type FunctionId } from './csf';
import { cleanObligations, type ObligationKey } from './obligations';

/** Keys of the frameworks in the readiness crosswalk (kept here to avoid an import cycle). */
export type FrameworkKey = 'cmmc' | 'iso' | 'csf' | 'soc2';
const FRAMEWORK_KEYS: FrameworkKey[] = ['cmmc', 'iso', 'csf', 'soc2'];

/** Stored in assessments.framework for every self-assessment. */
export const SELF_FRAMEWORK = 'csf-2.0';

/** Target profile: 1 Essential, 2 Standard, 3 Advanced. Stored in assessments.target_ig. */
export type Tier = 1 | 2 | 3;

/** Scoping condition: the question is skipped when the profile says it doesn't apply */
export type Needs = 'dev' | 'network' | 'providers';

export interface Question {
  id: string;
  tier: Tier;
  text: string;
  /** CSF 2.0 Subcategories this question rates (used for the workbench pre-fill and crosswalk) */
  csf: string[];
  needs?: Needs;
  /** Managed capabilities that fully deliver this question when included in a package */
  closes?: CapabilityCode[];
  /** Capabilities that cover most of it: the answer rises to at least Mostly */
  raises?: CapabilityCode[];
}

/** One CSF 2.0 Category with its questions. */
export interface Category {
  id: string;
  fn: FunctionId;
  title: string;
  summary: string;
  questions: Question[];
  /** Managed capabilities that close gaps in this category */
  capabilities: CapabilityCode[];
  /** Advisory service that helps with this category */
  service?: { label: string; href: string };
}

const grc = { label: 'GRC Program', href: '/services/grc' };
const security = { label: 'Security & Compliance', href: '/services/security' };
const vciso = { label: 'vCISO & Leadership', href: '/services/vciso' };
const cloud = { label: 'Cloud Strategy & Security', href: '/services/cloud' };

export const categories: Category[] = [
  /* ---------- Govern ---------- */
  {
    id: 'GV.OC',
    fn: 'GV',
    title: 'Organizational Context',
    summary: 'Security decisions reflect the business, its obligations and its stakeholders.',
    capabilities: [],
    service: grc,
    questions: [
      { id: 'GV.OC-a', tier: 2, csf: ['GV.OC-01', 'GV.OC-03'], text: 'We know which laws, regulations and contracts set security requirements for us, and leadership understands how security supports the business.' },
    ],
  },
  {
    id: 'GV.RM',
    fn: 'GV',
    title: 'Risk Management Strategy',
    summary: 'Leadership agrees how much risk to accept and acts on it.',
    capabilities: [],
    service: vciso,
    questions: [
      { id: 'GV.RM-a', tier: 2, csf: ['GV.RM-01', 'GV.RM-02', 'GV.RM-06'], text: 'Leadership has agreed how much security risk the business will accept, and risk decisions follow that agreement.' },
    ],
  },
  {
    id: 'GV.RR',
    fn: 'GV',
    title: 'Roles, Responsibilities, and Authorities',
    summary: 'Someone owns security, with the authority and resources to do the job.',
    capabilities: [],
    service: vciso,
    questions: [
      { id: 'GV.RR-a', tier: 1, csf: ['GV.RR-01', 'GV.RR-02', 'GV.RR-03'], text: 'A named person is accountable for security, with the time, authority and budget to do the job.' },
    ],
  },
  {
    id: 'GV.PO',
    fn: 'GV',
    title: 'Policy',
    summary: 'Clear, approved security policies that people know and follow.',
    capabilities: [],
    service: grc,
    questions: [
      { id: 'GV.PO-a', tier: 1, csf: ['GV.PO-01', 'GV.PO-02'], text: 'Written security policies are approved by leadership, shared with staff and reviewed at least once a year.' },
    ],
  },
  {
    id: 'GV.OV',
    fn: 'GV',
    title: 'Oversight',
    summary: 'Leadership reviews results and adjusts the strategy.',
    capabilities: [],
    service: vciso,
    questions: [
      { id: 'GV.OV-a', tier: 3, csf: ['GV.OV-01', 'GV.OV-02', 'GV.OV-03'], text: 'Leadership reviews security results, metrics and risks at least quarterly and adjusts the strategy when needed.' },
    ],
  },
  {
    id: 'GV.SC',
    fn: 'GV',
    title: 'Supply Chain Risk Management',
    summary: 'Make sure the suppliers and providers you rely on protect your data.',
    capabilities: ['CRPT'],
    service: grc,
    questions: [
      { id: 'GV.SC-a', tier: 2, needs: 'providers', csf: ['GV.SC-04', 'GV.SC-05', 'GV.SC-07', 'GV.SC-10'], text: 'We know which suppliers and providers handle our data or systems, rank them by risk, put security requirements in their contracts and review the riskiest each year.' },
    ],
  },
  /* ---------- Identify ---------- */
  {
    id: 'ID.AM',
    fn: 'ID',
    title: 'Asset Management',
    summary: 'Know every device, application and service you need to protect.',
    capabilities: ['NSPM', 'CTEM'],
    questions: [
      { id: 'ID.AM-a', tier: 1, closes: ['NSPM', 'CTEM'], csf: ['ID.AM-01', 'ID.AM-02'], text: 'We keep a current inventory of devices, software and cloud services, and unknown devices are found and dealt with within a week.' },
    ],
  },
  {
    id: 'ID.RA',
    fn: 'ID',
    title: 'Risk Assessment',
    summary: 'Find weaknesses and fix the riskiest first.',
    capabilities: ['CTEM', 'VM', 'AVM', 'ESPM', 'NSPM'],
    questions: [
      { id: 'ID.RA-a', tier: 1, closes: ['CTEM', 'ESPM', 'NSPM', 'VM'], raises: ['AVM'], csf: ['ID.RA-01', 'ID.RA-06', 'ID.RA-08'], text: 'Internal and external systems are scanned for vulnerabilities at least monthly, and findings are prioritized by risk and fixed within set timeframes.' },
    ],
  },
  {
    id: 'ID.IM',
    fn: 'ID',
    title: 'Improvement',
    summary: 'Test your defenses and learn from the results.',
    capabilities: ['CPT', 'CTEM'],
    service: security,
    questions: [
      { id: 'ID.IM-a', tier: 3, closes: ['CPT'], csf: ['ID.IM-01', 'ID.IM-02', 'ID.IM-03'], text: 'Penetration tests and exercises run at least once a year, and their findings and lessons from incidents are tracked to closure.' },
    ],
  },
  /* ---------- Protect ---------- */
  {
    id: 'PR.AA',
    fn: 'PR',
    title: 'Identity Management, Authentication, and Access Control',
    summary: 'Every account is known and needed, protected by strong authentication.',
    capabilities: ['ISPM', 'ITDR'],
    questions: [
      { id: 'PR.AA-a', tier: 1, closes: ['ISPM'], csf: ['PR.AA-01', 'PR.AA-05'], text: 'Every user, administrator and service account is known and owned, access follows role, and accounts are removed promptly when people leave.' },
      { id: 'PR.AA-b', tier: 1, closes: ['ISPM'], csf: ['PR.AA-03'], text: 'MFA is required for email, remote access, internet-facing applications and all administrator access.' },
    ],
  },
  {
    id: 'PR.AT',
    fn: 'PR',
    title: 'Awareness and Training',
    summary: 'Help people recognize and report attacks.',
    capabilities: ['PSA'],
    service: grc,
    questions: [
      { id: 'PR.AT-a', tier: 1, closes: ['PSA'], csf: ['PR.AT-01', 'PR.AT-02'], text: 'All staff complete security awareness training at least once a year, and phishing simulations run regularly.' },
    ],
  },
  {
    id: 'PR.DS',
    fn: 'PR',
    title: 'Data Security',
    summary: 'Know where sensitive data lives, protect it and keep a safe copy.',
    capabilities: ['DSPM', 'CFS', 'MDE', 'DSB'],
    service: grc,
    questions: [
      { id: 'PR.DS-a', tier: 2, closes: ['DSPM'], raises: ['MDE'], csf: ['PR.DS-01', 'PR.DS-02', 'PR.DS-10'], text: 'We know where sensitive data is stored, restrict access to it, encrypt it on laptops, in transit and at rest, and watch for leaks.' },
      { id: 'PR.DS-b', tier: 1, closes: ['DSB'], csf: ['PR.DS-11'], text: 'Critical systems and data are backed up automatically, with at least one copy isolated from the network (offline, immutable or off-site).' },
    ],
  },
  {
    id: 'PR.PS',
    fn: 'PR',
    title: 'Platform Security',
    summary: 'Systems start hardened, stay patched and run only approved software.',
    capabilities: ['EPP', 'EDR', 'VM', 'AVM', 'NSPM'],
    questions: [
      { id: 'PR.PS-a', tier: 1, closes: ['VM'], raises: ['AVM'], csf: ['PR.PS-02', 'PR.PS-03'], text: 'Operating systems, applications and browsers are patched automatically, at least monthly, and kept on supported versions.' },
      { id: 'PR.PS-b', tier: 1, closes: ['EPP', 'EDR'], csf: ['PR.PS-05'], text: 'Anti-malware runs on every endpoint, and unauthorized software is blocked or removed.' },
      { id: 'PR.PS-c', tier: 2, raises: ['NSPM'], csf: ['PR.PS-01'], text: 'Systems are built from documented secure configurations, default passwords are changed, and drift is detected.' },
      { id: 'PR.PS-d', tier: 2, needs: 'dev', csf: ['PR.PS-06'], text: 'We follow a secure development process, track the third-party components we use and fix application vulnerabilities through a defined process.' },
    ],
  },
  {
    id: 'PR.IR',
    fn: 'PR',
    title: 'Technology Infrastructure Resilience',
    summary: 'Networks are segmented and remote access is controlled.',
    capabilities: ['NSPM', 'ZTNA'],
    service: cloud,
    questions: [
      { id: 'PR.IR-a', tier: 2, closes: ['ZTNA'], raises: ['NSPM'], csf: ['PR.IR-01'], text: 'Networks and cloud environments are segmented, admin interfaces are not exposed, and remote access uses zero-trust access or VPN with MFA.' },
    ],
  },
  /* ---------- Detect ---------- */
  {
    id: 'DE.CM',
    fn: 'DE',
    title: 'Continuous Monitoring',
    summary: 'Watch systems, email and web traffic for signs of attack.',
    capabilities: ['SIEM', 'EDR', 'APP', 'ITP'],
    questions: [
      { id: 'DE.CM-a', tier: 1, closes: ['SIEM'], csf: ['PR.PS-04', 'DE.CM-01', 'DE.CM-03', 'DE.CM-09'], text: 'Logs from key systems, cloud services and endpoints are collected in one place and kept for at least 90 days.' },
      { id: 'DE.CM-b', tier: 1, closes: ['APP', 'ITP'], csf: ['DE.CM-01', 'DE.CM-09'], text: 'Email is protected against phishing (DMARC, link and attachment scanning), and DNS filtering blocks malicious sites wherever people work.' },
    ],
  },
  {
    id: 'DE.AE',
    fn: 'DE',
    title: 'Adverse Event Analysis',
    summary: 'Turn alerts into decisions, quickly and around the clock.',
    capabilities: ['SIEM', 'BTH', 'ATH'],
    questions: [
      { id: 'DE.AE-a', tier: 2, closes: ['SIEM'], csf: ['DE.AE-02', 'DE.AE-03', 'DE.AE-06'], text: 'Security events are correlated on a central platform and triaged by analysts around the clock.' },
    ],
  },
  /* ---------- Respond ---------- */
  {
    id: 'RS.MA',
    fn: 'RS',
    title: 'Incident Management',
    summary: 'Be ready to act the moment something happens.',
    capabilities: ['CIR'],
    service: vciso,
    questions: [
      { id: 'RS.MA-a', tier: 1, closes: ['CIR'], csf: ['RS.MA-01', 'RS.MA-02', 'ID.IM-04'], text: 'A written incident response plan names who leads and who backs them up, and it is exercised at least once a year.' },
    ],
  },
  {
    id: 'RS.AN',
    fn: 'RS',
    title: 'Incident Analysis',
    summary: 'Work out what happened, how far it went and what was affected.',
    capabilities: ['CIR', 'EDR', 'SIEM'],
    questions: [
      { id: 'RS.AN-a', tier: 2, closes: ['CIR'], csf: ['RS.AN-03', 'RS.AN-06', 'RS.AN-07'], text: 'When an incident happens, we can investigate what happened, how far it spread and what data was affected, and preserve evidence.' },
    ],
  },
  {
    id: 'RS.CO',
    fn: 'RS',
    title: 'Incident Response Reporting and Communication',
    summary: 'Tell the right people at the right time.',
    capabilities: ['CIR'],
    service: vciso,
    questions: [
      { id: 'RS.CO-a', tier: 1, raises: ['CIR'], csf: ['RS.CO-02', 'RS.CO-03'], text: 'Contacts for reporting incidents (leadership, insurer, authorities, customers) are current, and our notification duties are known.' },
    ],
  },
  {
    id: 'RS.MI',
    fn: 'RS',
    title: 'Incident Mitigation',
    summary: 'Contain an incident before it spreads.',
    capabilities: ['EDR', 'CIR', 'ITDR'],
    questions: [
      { id: 'RS.MI-a', tier: 2, closes: ['EDR', 'CIR'], csf: ['RS.MI-01', 'RS.MI-02'], text: 'Affected devices and accounts can be isolated within minutes to contain an incident.' },
    ],
  },
  /* ---------- Recover ---------- */
  {
    id: 'RC.RP',
    fn: 'RC',
    title: 'Incident Recovery Plan Execution',
    summary: 'Restore systems and data quickly and in the right order.',
    capabilities: ['DSB'],
    service: cloud,
    questions: [
      { id: 'RC.RP-a', tier: 1, raises: ['DSB'], csf: ['RC.RP-01', 'RC.RP-03', 'RC.RP-04'], text: 'Restores are tested at least quarterly, and we know the order in which to bring critical systems back.' },
    ],
  },
  {
    id: 'RC.CO',
    fn: 'RC',
    title: 'Incident Recovery Communication',
    summary: 'Keep people informed while you recover.',
    capabilities: [],
    service: vciso,
    questions: [
      { id: 'RC.CO-a', tier: 3, csf: ['RC.CO-03', 'RC.CO-04'], text: 'Recovery progress is shared with staff, customers and partners through agreed channels and approved messages.' },
    ],
  },
];

export const allQuestions = categories.flatMap((c) => c.questions);

/** CSF Functions in order, with their categories. */
export const functions = csfFunctions.map((f) => ({ ...f, categories: categories.filter((c) => c.fn === f.id) }));

export const scale = [
  { value: 0, label: 'Not in place' },
  { value: 1, label: 'Started' },
  { value: 2, label: 'Partly' },
  { value: 3, label: 'Mostly' },
  { value: 4, label: 'Fully' },
] as const;

/** "Not sure" is stored as -1 and scored as not in place */
export const NOT_SURE = -1;

export type Answers = Record<string, number>;

export interface Profile {
  size?: 'small' | 'mid' | 'large' | 'xl';
  data?: 'basic' | 'sensitive' | 'regulated';
  team?: 'none' | 'small' | 'dedicated';
  dev?: 'yes' | 'no';
  network?: 'onprem' | 'cloud';
  providers?: 'yes' | 'no';
  /** Frameworks the organization cares about (optional) */
  frameworks?: FrameworkKey[];
  /** Obligations the organization answers to; each adds a view to the report (optional) */
  obligations?: ObligationKey[];
}

export const profileQuestions = [
  {
    key: 'size' as const,
    text: 'How many employees does your organization have?',
    options: [
      { value: 'small', label: 'Under 100' },
      { value: 'mid', label: '100 to 999' },
      { value: 'large', label: '1,000 to 4,999' },
      { value: 'xl', label: '5,000 or more' },
    ],
  },
  {
    key: 'data' as const,
    text: 'What kind of data do you handle?',
    options: [
      { value: 'basic', label: 'Mostly business data' },
      { value: 'sensitive', label: 'Sensitive customer or employee data' },
      { value: 'regulated', label: 'Regulated data (HIPAA, PCI, CMMC, financial)' },
    ],
  },
  {
    key: 'team' as const,
    text: 'Who looks after security?',
    options: [
      { value: 'none', label: 'IT staff, part time' },
      { value: 'small', label: 'One or two security people' },
      { value: 'dedicated', label: 'A dedicated security team' },
    ],
  },
  {
    key: 'dev' as const,
    text: 'Do you develop software in-house?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    key: 'network' as const,
    text: 'Do you run your own office or data center network?',
    options: [
      { value: 'onprem', label: 'Yes, we have our own network' },
      { value: 'cloud', label: 'No, we are cloud and SaaS only' },
    ],
  },
  {
    key: 'providers' as const,
    text: 'Do outside providers handle your data or systems (MSP, cloud, SaaS, payroll)?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

/** One-line description of the profile for reports. */
export function profileSummary(p: Profile): string {
  const parts = (['size', 'data', 'team'] as const).map((k) =>
    profileQuestions.find((q) => q.key === k)!.options.find((o) => o.value === p[k])?.label,
  );
  parts.push(p.dev === 'yes' ? 'In-house development' : p.dev === 'no' ? 'No in-house development' : undefined);
  parts.push(p.network === 'onprem' ? 'Own network' : p.network === 'cloud' ? 'Cloud and SaaS only' : undefined);
  parts.push(p.providers === 'yes' ? 'Uses outside providers' : p.providers === 'no' ? 'No outside providers' : undefined);
  return parts.filter(Boolean).join(' · ');
}

/** All required profile questions answered. */
export const profileDone = (p: Profile) => profileQuestions.every((q) => !!p[q.key]);

/** Whether a question applies, given the scoping answers. Unanswered means it applies. */
export function applies(q: Question, p: Profile): boolean {
  if (q.needs === 'dev') return p.dev !== 'no';
  if (q.needs === 'network') return p.network !== 'cloud';
  if (q.needs === 'providers') return p.providers !== 'no';
  return true;
}

/** Target profiles, aligned to the CSF Implementation Tiers. */
export const tierInfo: Record<Tier, { name: string; short: string; csfTier: string; description: string }> = {
  1: {
    name: 'Essential',
    short: 'Essential',
    csfTier: 'CSF Tier 2 (Risk Informed)',
    description: 'The practices every organization should have in place.',
  },
  2: {
    name: 'Standard',
    short: 'Standard',
    csfTier: 'CSF Tier 3 (Repeatable)',
    description: 'For organizations with sensitive data, several departments and IT staff to support them.',
  },
  3: {
    name: 'Advanced',
    short: 'Advanced',
    csfTier: 'CSF Tier 4 (Adaptive)',
    description: 'For organizations with regulated data and attackers that target them specifically.',
  },
};

/** Target profile from the scoping answers. */
export function targetTier(p: Profile): Tier {
  const big = p.size === 'large' || p.size === 'xl';
  if (p.data === 'regulated' && (big || p.team === 'dedicated')) return 3;
  if (p.size === 'small' && p.data === 'basic' && p.team === 'none') return 1;
  return 2;
}

/** Valid stored target, or the one from the profile. */
export const tierOf = (stored: number | null | undefined, p: Profile): Tier =>
  stored === 1 || stored === 2 || stored === 3 ? stored : targetTier(p);

export const inScope = (c: Category, tier: Tier, p: Profile = {}) => c.questions.filter((q) => q.tier <= tier && applies(q, p));

/** True when a category has questions at this target but none apply to this organization. */
export const notApplicable = (c: Category, tier: Tier, p: Profile) =>
  c.questions.some((q) => q.tier <= tier) && inScope(c, tier, p).length === 0;

const sumOf = (qs: Question[], answers: Answers) => qs.reduce((s, q) => s + Math.max(0, answers[q.id] ?? 0), 0);

/** 0 to 100 for one category, or null if it has no questions in scope. */
export function categoryScore(c: Category, answers: Answers, tier: Tier, p: Profile = {}): number | null {
  const qs = inScope(c, tier, p);
  if (!qs.length) return null;
  return Math.round((sumOf(qs, answers) / (qs.length * 4)) * 100);
}

/** 0 to 100 for one CSF Function, or null if nothing in it is in scope. */
export function functionScore(fn: FunctionId, answers: Answers, tier: Tier, p: Profile = {}): number | null {
  const qs = categories.filter((c) => c.fn === fn).flatMap((c) => inScope(c, tier, p));
  if (!qs.length) return null;
  return Math.round((sumOf(qs, answers) / (qs.length * 4)) * 100);
}

/** Score across every question in scope, 0 to 100. */
export function overallScore(answers: Answers, tier: Tier, p: Profile = {}): number {
  const qs = categories.flatMap((c) => inScope(c, tier, p));
  if (!qs.length) return 0;
  return Math.round((sumOf(qs, answers) / (qs.length * 4)) * 100);
}

export function maturity(score: number) {
  if (score >= 90) return { label: 'Optimized', color: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 75) return { label: 'Managed', color: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 50) return { label: 'Defined', color: 'text-amber-700', bar: 'bg-amber-500' };
  if (score >= 25) return { label: 'Developing', color: 'text-orange-700', bar: 'bg-orange-500' };
  return { label: 'Initial', color: 'text-red-700', bar: 'bg-red-500' };
}

/** A category is a gap when its in-scope score is below this. */
export const GAP_THRESHOLD = 60;

export interface Recommendation {
  gaps: { category: Category; score: number }[];
  needed: CapabilityCode[];
  pkg: ServicePackage | null;
  covered: CapabilityCode[];
  /** Add-on services that close gaps the edition does not */
  addOns: AddOn[];
  services: { label: string; href: string }[];
}

export function recommend(answers: Answers, tier: Tier, p: Profile = {}): Recommendation {
  const gaps = categories
    .map((category) => ({ category, score: categoryScore(category, answers, tier, p) }))
    .filter((g): g is { category: Category; score: number } => g.score !== null && g.score < GAP_THRESHOLD)
    .sort((a, b) => a.score - b.score);

  // Aim at the five weakest categories so the suggestion stays focused
  const needed = [...new Set(gaps.slice(0, 5).flatMap((g) => g.category.capabilities))];

  // Most needed capabilities covered wins; ties go to the smaller package.
  let pkg: ServicePackage | null = null;
  let best = -1;
  for (const x of packages) {
    const n = needed.filter((c) => x.includes.includes(c)).length;
    if (n > best || (n === best && pkg && x.includes.length < pkg.includes.length)) {
      best = n;
      pkg = x;
    }
  }
  if (!needed.length || best <= 0) pkg = null;
  const covered = pkg ? needed.filter((c) => pkg!.includes.includes(c)) : [];

  const services = new Map<string, { label: string; href: string }>();
  for (const g of gaps) if (g.category.service) services.set(g.category.service.href, g.category.service);
  if (overallScore(answers, tier, p) < 50) services.set(vciso.href, vciso);

  // Add-ons: recommend one when it would deliver an in-scope question answered Partly or lower
  // that the edition doesn't already deliver.
  const weak = categories
    .flatMap((c) => inScope(c, tier, p))
    .filter((q) => (answers[q.id] ?? 0) < 3 && q.closes?.length && !q.closes.some((cap) => pkg?.includes.includes(cap)));
  const helps = (a: AddOn) => weak.some((q) => q.closes!.some((cap) => a.includes.includes(cap)));
  const chosen: AddOn[] = [];
  const psa = addOns.find((a) => a.code === 'PSA')!;
  if (helps(psa)) chosen.push(psa);
  const drm = addOns.find((a) => a.code === 'DRM-CP')!;
  const mde = addOns.find((a) => a.code === 'MDE-PM')!;
  const needsDspm = weak.some((q) => q.closes!.includes('DSPM'));
  if (needsDspm) chosen.push(drm);
  else if (helps(mde)) chosen.push(mde);
  const dsb = addOns.find((a) => a.code === 'DSB')!;
  if (helps(dsb)) chosen.push(dsb);
  const zti = addOns.find((a) => a.code === 'ZTI')!;
  if (helps(zti)) chosen.unshift(zti);
  const ztna = addOns.find((a) => a.code === 'ZTA-PM')!;
  if (helps(ztna)) chosen.push(ztna);
  // Posture management: network first (internal assets), external when external scanning is the gap
  const nwk = addOns.find((a) => a.code === 'SPM-NWK')!;
  const ext = addOns.find((a) => a.code === 'SPM-EXT')!;
  if (helps(nwk)) chosen.unshift(nwk);
  else if (helps(ext)) chosen.unshift(ext);

  return { gaps, needed, pkg, covered, addOns: chosen, services: [...services.values()] };
}

/** Shown on the registration form and stored with each registration. */
export const CONSENT_VERSION = '2026-11-10';
export const CONSENT_TEXT =
  'I agree that Emruz may store my registration details and my assessment answers and results, and may contact me by email or phone about this self-assessment. I can withdraw consent or ask for my data to be deleted at any time.';

const questionIds = new Set(allQuestions.map((q) => q.id));
const validValues = new Set<number>([NOT_SURE, ...scale.map((s) => s.value)]);

/** Keep only known question IDs with allowed values. */
export function cleanAnswers(input: unknown): Answers {
  const out: Answers = {};
  if (input && typeof input === 'object') {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (questionIds.has(k) && typeof v === 'number' && validValues.has(v)) out[k] = v;
    }
  }
  return out;
}

/** Keep only known profile keys with allowed values. */
export function cleanProfile(input: unknown): Profile {
  const out: Record<string, unknown> = {};
  if (input && typeof input === 'object') {
    const src = input as Record<string, unknown>;
    for (const q of profileQuestions) {
      const v = src[q.key];
      if (typeof v === 'string' && q.options.some((o) => o.value === v)) out[q.key] = v;
    }
    if (Array.isArray(src.frameworks)) {
      out.frameworks = FRAMEWORK_KEYS.filter((k) => (src.frameworks as unknown[]).includes(k));
    }
    if (Array.isArray(src.obligations)) out.obligations = cleanObligations(src.obligations);
  }
  return out as Profile;
}

export const isComplete = (p: Profile, a: Answers) =>
  profileDone(p) && categories.flatMap((c) => inScope(c, targetTier(p), p)).every((q) => q.id in a);

/** Answers as they would be with a package in place: questions it delivers become Fully. */
export function withPackage(answers: Answers, ...services: ({ includes: CapabilityCode[] } | null)[]): Answers {
  const caps = new Set(services.flatMap((x) => x?.includes ?? []));
  if (!caps.size) return answers;
  const out: Answers = { ...answers };
  for (const q of allQuestions) {
    if (q.closes?.some((cap) => caps.has(cap))) out[q.id] = 4;
    else if (q.raises?.some((cap) => caps.has(cap))) out[q.id] = Math.max(out[q.id] ?? 0, 3);
  }
  return out;
}
