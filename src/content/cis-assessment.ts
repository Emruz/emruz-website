/**
 * Self-paced security assessment based on the CIS Critical Security Controls v8.
 *
 * Three questions per control, each tagged with the lowest Implementation
 * Group (IG) it belongs to. A short profile sets the target IG, and only
 * questions at or below it are scored. Everything runs in the browser;
 * answers are never sent to the server.
 */
import { addOns, packages, type AddOn, type CapabilityCode, type ServicePackage } from './packages';
import type { FrameworkKey } from './crosswalk';

const FRAMEWORK_KEYS: FrameworkKey[] = ['cis', 'cmmc', 'iso', 'csf', 'soc2'];

export type IG = 1 | 2 | 3;

/** Scoping condition: the question is skipped when the profile says it doesn't apply */
export type Needs = 'dev' | 'network' | 'providers';

export interface Question {
  id: string;
  ig: IG;
  text: string;
  needs?: Needs;
  /** Managed capabilities that fully deliver this question when included in a package */
  closes?: CapabilityCode[];
}

export interface Control {
  id: number;
  title: string;
  summary: string;
  questions: Question[];
  /** Managed capabilities that close gaps in this control */
  capabilities: CapabilityCode[];
  /** Advisory service that helps with this control */
  service?: { label: string; href: string };
}

const grc = { label: 'GRC Program', href: '/services/grc' };
const security = { label: 'Security & Compliance', href: '/services/security' };
const vciso = { label: 'vCISO & Leadership', href: '/services/vciso' };
const cloud = { label: 'Cloud Strategy & Security', href: '/services/cloud' };

export const controls: Control[] = [
  {
    id: 1,
    title: 'Inventory and Control of Enterprise Assets',
    summary: 'Know every device that connects to your environment, so you can protect it.',
    capabilities: ['ESPM', 'CTEM'],
    questions: [
      { id: '1a', ig: 1, closes: ['ESPM', 'CTEM'], text: 'We keep an accurate, current inventory of every device that connects to our environment, including remote and cloud devices.' },
      { id: '1b', ig: 1, closes: ['ESPM'], text: 'Unknown or unauthorized devices are found and removed or quarantined within a week.' },
      { id: '1c', ig: 2, closes: ['ESPM', 'CTEM'], text: 'Asset discovery runs automatically and keeps the inventory up to date.' },
    ],
  },
  {
    id: 2,
    title: 'Inventory and Control of Software Assets',
    summary: 'Only authorized, supported software is installed and allowed to run.',
    capabilities: ['ESPM', 'EDR'],
    questions: [
      { id: '2a', ig: 1, closes: ['ESPM'], text: 'We keep an inventory of authorized software and review it at least twice a year.' },
      { id: '2b', ig: 1, closes: ['ESPM', 'EDR'], text: 'Unsupported or unauthorized software is removed or recorded as an approved exception.' },
      { id: '2c', ig: 2, closes: ['EDR'], text: 'Allowlisting stops unauthorized software, libraries and scripts from running.' },
    ],
  },
  {
    id: 3,
    title: 'Data Protection',
    summary: 'Know where sensitive data lives and protect it from exposure and loss.',
    capabilities: ['DSPM', 'CFS', 'MDE'],
    service: grc,
    questions: [
      { id: '3a', ig: 1, closes: ['DSPM'], text: 'We have a data management process and know where our sensitive data is stored.' },
      { id: '3b', ig: 1, closes: ['MDE'], text: 'Access to sensitive data is restricted, and data on laptops and mobile devices is encrypted.' },
      { id: '3c', ig: 2, closes: ['DSPM'], text: 'Sensitive data is classified, encrypted in transit and at rest, and monitored for leaks.' },
    ],
  },
  {
    id: 4,
    title: 'Secure Configuration of Enterprise Assets and Software',
    summary: 'Systems start from a hardened baseline and stay that way.',
    capabilities: ['ESPM', 'NSPM'],
    questions: [
      { id: '4a', ig: 1, closes: ['ESPM', 'NSPM'], text: 'We have documented secure configuration standards for endpoints, servers, network devices and cloud services.' },
      { id: '4b', ig: 1, closes: ['ESPM'], text: 'Default accounts and passwords are changed or disabled, and devices lock automatically when idle.' },
      { id: '4c', ig: 2, closes: ['ESPM', 'NSPM'], text: 'Configuration drift is detected and corrected automatically.' },
    ],
  },
  {
    id: 5,
    title: 'Account Management',
    summary: 'Every account is known, needed and owned by someone.',
    capabilities: ['ISPM'],
    questions: [
      { id: '5a', ig: 1, closes: ['ISPM'], text: 'We keep an inventory of all user, administrator and service accounts.' },
      { id: '5b', ig: 1, closes: ['ISPM'], text: 'Accounts are disabled promptly when people leave, and unused accounts are disabled after 45 days.' },
      { id: '5c', ig: 1, closes: ['ISPM'], text: 'Administrators use separate accounts for privileged work, and every account has a unique password.' },
    ],
  },
  {
    id: 6,
    title: 'Access Control Management',
    summary: 'People get the access they need, protected by strong authentication.',
    capabilities: ['ISPM', 'ITDR'],
    questions: [
      { id: '6a', ig: 1, text: 'Access is granted and removed through a defined process based on role.' },
      { id: '6b', ig: 1, closes: ['ISPM'], text: 'MFA is required for email, remote access, internet-facing applications and all administrator access.' },
      { id: '6c', ig: 2, closes: ['ISPM'], text: 'Access is managed centrally (single sign-on) and reviewed at least quarterly.' },
    ],
  },
  {
    id: 7,
    title: 'Continuous Vulnerability Management',
    summary: 'Find and fix weaknesses before attackers use them.',
    capabilities: ['CTEM', 'ESPM'],
    questions: [
      { id: '7a', ig: 1, text: 'Operating systems and applications are patched automatically, at least monthly.' },
      { id: '7b', ig: 2, closes: ['CTEM', 'ESPM'], text: 'Internal assets are scanned for vulnerabilities at least quarterly and external assets at least monthly.' },
      { id: '7c', ig: 2, closes: ['CTEM'], text: 'Findings are prioritized by risk and fixed within defined timeframes.' },
    ],
  },
  {
    id: 8,
    title: 'Audit Log Management',
    summary: 'Collect and review the logs you need to detect and investigate attacks.',
    capabilities: ['SIEM'],
    questions: [
      { id: '8a', ig: 1, closes: ['SIEM'], text: 'Audit logging is enabled on key systems and logs are kept for at least 90 days.' },
      { id: '8b', ig: 2, closes: ['SIEM'], text: 'Logs are collected in one central place with synchronized time.' },
      { id: '8c', ig: 2, closes: ['SIEM'], text: 'Logs are reviewed for threats at least weekly, by people or automated analytics.' },
    ],
  },
  {
    id: 9,
    title: 'Email and Web Browser Protections',
    summary: 'Block the most common ways attackers reach your people.',
    capabilities: ['APP', 'ITP'],
    questions: [
      { id: '9a', ig: 1, closes: ['ESPM'], text: 'Only supported, up-to-date browsers and email clients are allowed.' },
      { id: '9b', ig: 1, closes: ['ITP'], text: 'DNS filtering blocks access to known malicious sites for all users, wherever they work.' },
      { id: '9c', ig: 2, closes: ['APP'], text: 'Email is protected with DMARC, and attachments and links are scanned or sandboxed.' },
    ],
  },
  {
    id: 10,
    title: 'Malware Defenses',
    summary: 'Prevent, detect and contain malicious code on every device.',
    capabilities: ['EPP', 'EDR'],
    questions: [
      { id: '10a', ig: 1, closes: ['EPP', 'EDR'], text: 'Anti-malware runs on every endpoint and updates automatically.' },
      { id: '10b', ig: 1, closes: ['EPP', 'EDR'], text: 'Autorun is disabled and removable media is scanned automatically.' },
      { id: '10c', ig: 2, closes: ['EDR'], text: 'Centrally managed, behavior-based detection (EDR) is in place on every endpoint.' },
    ],
  },
  {
    id: 11,
    title: 'Data Recovery',
    summary: 'Restore systems and data quickly after an incident.',
    capabilities: ['DSB'],
    service: cloud,
    questions: [
      { id: '11a', ig: 1, closes: ['DSB'], text: 'Critical systems and data are backed up automatically at least weekly.' },
      { id: '11b', ig: 1, closes: ['DSB'], text: 'At least one backup copy is isolated from the network (offline, immutable or off-site).' },
      { id: '11c', ig: 2, text: 'Restores are tested at least quarterly.' },
    ],
  },
  {
    id: 12,
    title: 'Network Infrastructure Management',
    summary: 'Keep network devices current, segmented and securely managed.',
    capabilities: ['NSPM'],
    questions: [
      { id: '12a', ig: 1, closes: ['NSPM'], needs: 'network', text: 'Firewalls, routers and switches run supported, up-to-date firmware.' },
      { id: '12b', ig: 2, closes: ['NSPM'], needs: 'network', text: 'The network is segmented, and admin interfaces are reachable only from management networks.' },
      { id: '12c', ig: 2, text: 'Remote access uses VPN or zero-trust access with MFA, and the network architecture is documented.' },
    ],
  },
  {
    id: 13,
    title: 'Network Monitoring and Defense',
    summary: 'Watch the environment and respond to threats as they happen.',
    capabilities: ['SIEM', 'ITP', 'BTH'],
    questions: [
      { id: '13a', ig: 2, closes: ['SIEM'], text: 'Security events are correlated and alerted on from a central platform.' },
      { id: '13b', ig: 2, closes: ['SIEM'], text: 'Intrusion detection, or equivalent monitoring for cloud environments, is in place.' },
      { id: '13c', ig: 2, closes: ['SIEM'], text: 'Alerts are triaged by analysts around the clock.' },
    ],
  },
  {
    id: 14,
    title: 'Security Awareness and Skills Training',
    summary: 'Help people recognize and report attacks.',
    capabilities: ['PSA'],
    service: grc,
    questions: [
      { id: '14a', ig: 1, closes: ['PSA'], text: 'All staff complete security awareness training at least once a year.' },
      { id: '14b', ig: 1, closes: ['PSA'], text: 'Training covers phishing, social engineering, data handling and how to report incidents.' },
      { id: '14c', ig: 2, closes: ['PSA'], text: 'Phishing simulations and role-specific training run regularly.' },
    ],
  },
  {
    id: 15,
    title: 'Service Provider Management',
    summary: 'Make sure the providers you rely on protect your data.',
    capabilities: ['CRPT'],
    service: grc,
    questions: [
      { id: '15a', ig: 1, needs: 'providers', text: 'We keep an inventory of service providers that handle our data or systems.' },
      { id: '15b', ig: 2, needs: 'providers', text: 'Providers are classified by risk, and contracts include security requirements.' },
      { id: '15c', ig: 2, needs: 'providers', text: 'High-risk providers are reviewed at least annually and offboarded securely.' },
    ],
  },
  {
    id: 16,
    title: 'Application Software Security',
    summary: 'Build and buy software that is secure by design.',
    capabilities: ['CPT'],
    service: security,
    questions: [
      { id: '16a', ig: 2, needs: 'dev', text: 'We follow a secure development process and track the third-party components we use.' },
      { id: '16b', ig: 2, needs: 'dev', text: 'Application vulnerabilities are tracked and fixed through a defined process.' },
      { id: '16c', ig: 3, closes: ['CPT'], needs: 'dev', text: 'Applications are tested with code analysis and penetration testing before and after release.' },
    ],
  },
  {
    id: 17,
    title: 'Incident Response Management',
    summary: 'Be ready to respond quickly and recover when something happens.',
    capabilities: ['CIR'],
    service: vciso,
    questions: [
      { id: '17a', ig: 1, closes: ['CIR'], text: 'A named person manages incidents, with a backup.' },
      { id: '17b', ig: 1, closes: ['CIR'], text: 'Contacts for reporting incidents (staff, insurer, authorities, partners) are current and known.' },
      { id: '17c', ig: 2, closes: ['CIR'], text: 'A written incident response plan exists and is exercised at least once a year.' },
    ],
  },
  {
    id: 18,
    title: 'Penetration Testing',
    summary: 'Test your defenses the way an attacker would.',
    capabilities: ['CPT', 'CTEM'],
    questions: [
      { id: '18a', ig: 2, closes: ['CPT'], text: 'A penetration testing program defines scope, frequency and rules of engagement.' },
      { id: '18b', ig: 2, closes: ['CPT'], text: 'External penetration tests run at least once a year.' },
      { id: '18c', ig: 3, closes: ['CPT'], text: 'Internal tests run regularly, and findings are fixed and retested.' },
    ],
  },
];

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

export const igInfo: Record<IG, { name: string; description: string }> = {
  1: { name: 'IG1: Essential cyber hygiene', description: 'The minimum every organization should have in place.' },
  2: { name: 'IG2: Managed', description: 'For organizations with sensitive data, several departments and IT staff to support them.' },
  3: { name: 'IG3: Advanced', description: 'For organizations with regulated data and attackers that target them specifically.' },
};

/** Target Implementation Group from the profile. */
export function targetIG(p: Profile): IG {
  const big = p.size === 'large' || p.size === 'xl';
  if (p.data === 'regulated' && (big || p.team === 'dedicated')) return 3;
  if (p.size === 'small' && p.data === 'basic' && p.team === 'none') return 1;
  return 2;
}

export const inScope = (c: Control, ig: IG, p: Profile = {}) => c.questions.filter((q) => q.ig <= ig && applies(q, p));

/** True when a control has questions at this IG but none apply to this organization. */
export const notApplicable = (c: Control, ig: IG, p: Profile) =>
  c.questions.some((q) => q.ig <= ig) && inScope(c, ig, p).length === 0;

/** 0 to 100 for one control, or null if it has no questions in scope. */
export function controlScore(c: Control, answers: Answers, ig: IG, p: Profile = {}): number | null {
  const qs = inScope(c, ig, p);
  if (!qs.length) return null;
  const sum = qs.reduce((s, q) => s + Math.max(0, answers[q.id] ?? 0), 0);
  return Math.round((sum / (qs.length * 4)) * 100);
}

/** Score across every question in scope, 0 to 100. */
export function overallScore(answers: Answers, ig: IG, p: Profile = {}): number {
  const qs = controls.flatMap((c) => inScope(c, ig, p));
  const sum = qs.reduce((s, q) => s + Math.max(0, answers[q.id] ?? 0), 0);
  return Math.round((sum / (qs.length * 4)) * 100);
}

export function maturity(score: number) {
  if (score >= 90) return { label: 'Optimized', color: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 75) return { label: 'Managed', color: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 50) return { label: 'Defined', color: 'text-amber-700', bar: 'bg-amber-500' };
  if (score >= 25) return { label: 'Developing', color: 'text-orange-700', bar: 'bg-orange-500' };
  return { label: 'Initial', color: 'text-red-700', bar: 'bg-red-500' };
}

/** A control is a gap when its in-scope score is below this. */
export const GAP_THRESHOLD = 60;

export interface Recommendation {
  gaps: { control: Control; score: number }[];
  needed: CapabilityCode[];
  pkg: ServicePackage | null;
  covered: CapabilityCode[];
  /** Add-on services that close gaps the edition does not */
  addOns: AddOn[];
  services: { label: string; href: string }[];
}

export function recommend(answers: Answers, ig: IG, p: Profile = {}): Recommendation {
  const gaps = controls
    .map((control) => ({ control, score: controlScore(control, answers, ig, p) }))
    .filter((g): g is { control: Control; score: number } => g.score !== null && g.score < GAP_THRESHOLD)
    .sort((a, b) => a.score - b.score);

  // Aim at the five weakest controls so the suggestion stays focused
  const needed = [...new Set(gaps.slice(0, 5).flatMap((g) => g.control.capabilities))];

  // Most needed capabilities covered wins; ties go to the smaller package.
  let pkg: ServicePackage | null = null;
  let best = -1;
  for (const p of packages) {
    const n = needed.filter((c) => p.includes.includes(c)).length;
    if (n > best || (n === best && pkg && p.includes.length < pkg.includes.length)) {
      best = n;
      pkg = p;
    }
  }
  if (!needed.length || best <= 0) pkg = null;
  const covered = pkg ? needed.filter((c) => pkg!.includes.includes(c)) : [];

  const services = new Map<string, { label: string; href: string }>();
  for (const g of gaps) if (g.control.service) services.set(g.control.service.href, g.control.service);
  if (overallScore(answers, ig, p) < 50) services.set(vciso.href, vciso);

  // Add-ons: recommend one when it would deliver an in-scope question answered Partly or lower
  // that the edition doesn't already deliver.
  const weak = controls
    .flatMap((c) => inScope(c, ig, p))
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

  return { gaps, needed, pkg, covered, addOns: chosen, services: [...services.values()] };
}


/** Shown on the registration form and stored with each registration. */
export const CONSENT_VERSION = '2026-11-10';
export const CONSENT_TEXT =
  'I agree that Emruz may store my registration details and my assessment answers and results, and may contact me by email or phone about this self-assessment. I can withdraw consent or ask for my data to be deleted at any time.';

const questionIds = new Set(controls.flatMap((c) => c.questions.map((q) => q.id)));
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
  }
  return out as Profile;
}

export const isComplete = (p: Profile, a: Answers) =>
  profileDone(p) && controls.flatMap((c) => inScope(c, targetIG(p), p)).every((q) => q.id in a);

/** Answers as they would be with a package in place: questions it delivers become Fully. */
export function withPackage(answers: Answers, ...services: ({ includes: CapabilityCode[] } | null)[]): Answers {
  const caps = new Set(services.flatMap((x) => x?.includes ?? []));
  if (!caps.size) return answers;
  const out: Answers = { ...answers };
  for (const c of controls) {
    for (const q of c.questions) {
      if (q.closes?.some((cap) => caps.has(cap))) out[q.id] = 4;
    }
  }
  return out;
}
