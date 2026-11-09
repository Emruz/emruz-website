/**
 * Managed security Service Package Portfolio.
 *
 * Product families (EDR, MDR, XDR, ΔDR), each in one or more editions. Each
 * edition lists exactly what it includes; editions are not strictly cumulative. Capability inclusion per tier is DRAFT and must be confirmed
 * against the approved delivery mapping before launch (see
 * docs/content-verification.md). No pricing, SLAs or vendor names here.
 */

export type CapabilityCode =
  | 'EPP'
  | 'EDR'
  | 'SIEM'
  | 'ESPM'
  | 'NSPM'
  | 'CIR'
  | 'CTEM'
  | 'CPT'
  | 'APP'
  | 'ITP'
  | 'BTH'
  | 'ATH'
  | 'DSPM'
  | 'ISPM'
  | 'DNSSPM'
  | 'CFS'
  | 'ITDR'
  | 'CRPT';

export const capabilities: Record<CapabilityCode, { name: string; description: string }> = {
  EPP: { name: 'Endpoint Protection', description: 'Prevents known and unknown malware on laptops, desktops and servers.' },
  EDR: { name: 'Endpoint Detection & Response', description: 'Records endpoint activity to detect, contain and roll back attacks.' },
  BTH: { name: 'Basic Threat Hunting', description: 'Regular hunts across your environment for common attacker techniques.' },
  ATH: { name: 'Advanced Threat Hunting', description: 'Hypothesis-driven hunts for threats that evade automated detection.' },
  SIEM: { name: 'AI-driven SIEM', description: 'Central collection and correlation of security signals across your environment.' },
  ESPM: { name: 'Endpoint Security Posture', description: 'Finds misconfigured and unpatched endpoints before attackers do.' },
  NSPM: { name: 'Network Security Posture', description: 'Continuous review of network exposure and segmentation.' },
  CIR: { name: 'Continuous Incident Response', description: 'Incident response is part of the service, not a separate retainer.' },
  CTEM: { name: 'Exposure Management', description: 'Continuous internal, external and dark web exposure management.' },
  CPT: { name: 'Continuous Pen Testing', description: 'Ongoing attack simulation instead of a once-a-year test.' },
  APP: { name: 'Advanced Phishing Protection', description: 'Stops phishing, impersonation and malicious links across email and collaboration tools.' },
  ITP: { name: 'Internet Threat Protection', description: 'DNS-layer protection that blocks malicious destinations for users anywhere.' },
  DSPM: { name: 'Data Security Posture', description: 'Discovers sensitive data and where it is exposed.' },
  ISPM: { name: 'Identity Security Posture', description: 'Finds risky accounts, permissions and identity misconfigurations.' },
  DNSSPM: { name: 'DNS Security Posture', description: 'Monitors domains and DNS configuration for hijack and spoofing risk.' },
  CFS: { name: 'Cloud File Security', description: 'Scans files in cloud storage and collaboration platforms for threats.' },
  ITDR: { name: 'Identity Threat Detection & Response', description: 'Detects and responds to account takeover and identity attacks.' },
  CRPT: { name: 'Compliance Reporting', description: 'Evidence and reporting mapped to the frameworks your auditors use, such as NIST CSF, ISO 27001, SOC 2 and CMMC.' },
};

export type FamilySlug = 'EDR' | 'MDR' | 'XDR' | 'DDR';

export interface ProductFamily {
  slug: FamilySlug;
  /** URL segment under /products */
  path: string;
  /** Display name; DDR is shown as ΔDR */
  label: string;
  name: string;
  tagline: string;
  summary: string;
  bestFor: string;
}

/** Managed security product families. Delivered with WhiteDog Cyber. */
export const families: ProductFamily[] = [
  {
    slug: 'EDR',
    path: 'edr',
    label: 'EDR',
    name: 'Endpoint Detection & Response',
    tagline: 'Modern protection on every device',
    summary: 'Endpoint protection, detection and response, and threat hunting for laptops, desktops and servers, in three editions.',
    bestFor: 'Organizations starting a security program or replacing legacy antivirus.',
  },
  {
    slug: 'MDR',
    path: 'mdr',
    label: 'MDR',
    name: 'Managed Detection & Response',
    tagline: 'Experts watching around the clock',
    summary:
      'Endpoint detection and response with a 24/7 security operations team that monitors, investigates and responds for you, with incident response, exposure management and continuous pen testing included.',
    bestFor: 'Teams without their own 24/7 security operations center.',
  },
  {
    slug: 'XDR',
    path: 'xdr',
    label: 'XDR',
    name: 'Extended Detection & Response',
    tagline: 'Beyond the endpoint',
    summary:
      'Managed detection and response with email, collaboration and internet threat protection and threat hunting, in three editions.',
    bestFor: 'Organizations where phishing, web threats and sensitive data are the main risks.',
  },
  {
    slug: 'DDR',
    path: 'ddr',
    label: 'ΔDR',
    name: 'Detect, Defend & Respond',
    tagline: 'Active defense with identity and data at the center',
    summary:
      'Active defense with data and identity risk and posture management, compliance reporting, DNS and cloud file security, and identity threat response, in four editions.',
    bestFor: 'Enterprises and regulated organizations that need the complete portfolio.',
  },
];

export const familyBySlug = (slug: FamilySlug) => families.find((f) => f.slug === slug)!;
export const familyByPath = (path: string) => families.find((f) => f.path === path);

/** Package code as shown to people: DDR codes display as ΔDR. */
export const displayCode = (code: string) => code.replace(/^DDR/, 'ΔDR');

/** Where a package's details live: its family page, opened to that package. */
export const packageHref = (pkg: { code: string; family: FamilySlug }) =>
  `/products/${familyBySlug(pkg.family).path}#${pkg.code}`;

export const POWERED_BY = 'Powered by WhiteDog Cyber';
/** Shown on every edition instead of a SOC capability brick */
export const SOC_LINE = 'Monitored and managed by our 24x7 SOC';

export interface ServicePackage {
  code: string;
  family: FamilySlug;
  name: string;
  tagline: string;
  summary: string;
  bestFor: string;
  /** Every capability in this edition (editions are not strictly cumulative) */
  includes: CapabilityCode[];
  /** Outcomes the buyer gets */
  outcomes: string[];
}

// Capabilities shared by MDR and above (every edition is also run by the 24x7 SOC)
const SOC_CORE: CapabilityCode[] = ['SIEM', 'ESPM', 'NSPM', 'CIR', 'CTEM', 'CPT'];
const XDR_CORE: CapabilityCode[] = [...SOC_CORE, 'APP', 'ITP'];

export const packages: ServicePackage[] = [
  {
    code: 'EDR-ST',
    family: 'EDR',
    name: 'Endpoint Detection & Response, Standard',
    tagline: 'Essential endpoint protection',
    summary: 'Next-generation protection that stops known and unknown malware on every device.',
    bestFor: 'Organizations replacing legacy antivirus.',
    includes: ['EPP'],
    outcomes: ['Modern malware protection on every endpoint', 'One console for all devices', 'Lightweight agent, no signature updates to manage'],
  },
  {
    code: 'EDR-ES',
    family: 'EDR',
    name: 'Endpoint Detection & Response, Enterprise',
    tagline: 'See and stop what gets through',
    summary: 'Full endpoint detection and response: records activity so attacks can be detected, contained and rolled back.',
    bestFor: 'Organizations that need visibility into what happened on a device, not just prevention.',
    includes: ['EDR'],
    outcomes: ['Visibility into what happened on a device', 'Fast containment of compromised machines', 'Rollback of malicious changes'],
  },
  {
    code: 'EDR-PM',
    family: 'EDR',
    name: 'Endpoint Detection & Response, Premier',
    tagline: 'Endpoint defense with expert hunting',
    summary: 'Endpoint detection and response plus proactive threat hunting by experienced analysts.',
    bestFor: 'Organizations with valuable endpoints and capable adversaries.',
    includes: ['EDR', 'ATH'],
    outcomes: ['Threats found before they trigger alerts', 'Containment and rollback on every endpoint', 'Hunt findings that harden your controls'],
  },
  {
    code: 'MDR',
    family: 'MDR',
    name: 'Managed Detection & Response',
    tagline: 'Expert eyes on your environment',
    summary: 'Analysts watch your environment around the clock, investigate alerts and respond for you.',
    bestFor: 'Teams without a 24/7 SOC who need detection and response handled.',
    includes: ['EDR', 'ATH', ...SOC_CORE],
    outcomes: ['24/7 monitoring and response', 'Incident response included', 'Continuous view of your exposures'],
  },
  {
    code: 'XDR-ST',
    family: 'XDR',
    name: 'Extended Detection & Response, Standard',
    tagline: 'Visibility beyond the endpoint',
    summary: 'Managed detection and response with email, collaboration and internet threat protection, so attacks are stopped before they reach a device.',
    bestFor: 'Organizations where phishing and web threats are the main risk.',
    includes: ['EPP', ...XDR_CORE],
    outcomes: ['Phishing and impersonation blocked', 'Protection for users on and off network', 'One correlated view across endpoint, email and web'],
  },
  {
    code: 'XDR-ES',
    family: 'XDR',
    name: 'Extended Detection & Response, Enterprise',
    tagline: 'Full endpoint detection and response',
    summary: 'Upgrades endpoint protection to full detection and response, alongside email, collaboration and internet threat protection.',
    bestFor: 'Organizations that need to investigate and contain attacks on endpoints, not just block them.',
    includes: ['EDR', ...XDR_CORE],
    outcomes: ['Containment and rollback on every endpoint', 'Phishing and web threats blocked', 'One correlated view across endpoint, email and web'],
  },
  {
    code: 'XDR-PM',
    family: 'XDR',
    name: 'Extended Detection & Response, Premier',
    tagline: 'Add threat hunting',
    summary: 'Adds basic threat hunting: regular hunts across your environment for common attacker techniques.',
    bestFor: 'Organizations that want full endpoint response alongside email and web protection.',
    includes: ['EDR', 'BTH', ...XDR_CORE],
    outcomes: ['Threats found before they trigger alerts', 'Containment and rollback on every endpoint', 'Phishing and web threats blocked'],
  },
  {
    code: 'DDR-ST',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Standard',
    tagline: 'Active defense with data and compliance in view',
    summary: 'Moves from detection to active defense, and adds data security posture management and compliance reporting.',
    bestFor: 'Organizations with sensitive data and audit obligations.',
    includes: ['EDR', 'ATH', ...XDR_CORE, 'DSPM', 'CRPT'],
    outcomes: ['Sensitive data found and exposure prioritized', 'Audit-ready evidence and reporting', 'Threats blocked in real time'],
  },
  {
    code: 'DDR-ES',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Enterprise',
    tagline: 'Identity and DNS covered',
    summary: 'Adds identity security posture management and DNS security posture, protecting accounts, domains and DNS.',
    bestFor: 'Enterprises where identities and domains are prime targets.',
    includes: ['EDR', 'ATH', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CRPT'],
    outcomes: ['Risky accounts and permissions found', 'Domain and DNS risks monitored', 'Brand spoofing exposure reduced'],
  },
  {
    code: 'DDR-PM',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Premier',
    tagline: 'Cloud files covered too',
    summary: 'Adds security for files stored and shared in cloud platforms.',
    bestFor: 'Organizations that collaborate heavily in cloud storage.',
    includes: ['EDR', 'ATH', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CFS', 'CRPT'],
    outcomes: ['Malicious files caught in cloud storage', 'Safer external sharing', 'Coverage where work actually happens'],
  },
  {
    code: 'DDR-CP',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Compliance Plus',
    tagline: 'Maximum protection, identity attacks stopped',
    summary: 'Adds identity threat detection and response to stop account takeover as it happens.',
    bestFor: 'Regulated organizations that need the complete portfolio.',
    includes: ['EDR', 'ATH', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CFS', 'ITDR', 'CRPT'],
    outcomes: ['Account takeover detected and stopped', 'Audit-ready evidence and reporting', 'The complete portfolio in one service'],
  },
];

/** Capabilities in a package, in glossary order. */
export function includedCapabilities(code: string): CapabilityCode[] {
  const pkg = packages.find((p) => p.code === code);
  if (!pkg) return [];
  const order = Object.keys(capabilities) as CapabilityCode[];
  return order.filter((c) => pkg.includes.includes(c));
}

/** Capabilities this edition has that the previous edition in its family doesn't. */
export function newInEdition(code: string): CapabilityCode[] {
  const pkg = packages.find((p) => p.code === code);
  if (!pkg) return [];
  const sameFamily = packages.filter((p) => p.family === pkg.family);
  const prev = sameFamily[sameFamily.indexOf(pkg) - 1];
  return prev ? pkg.includes.filter((c) => !prev.includes.includes(c)) : [];
}

/** Every capability any edition of a family includes, in glossary order. */
export function familyCapabilities(slug: FamilySlug): CapabilityCode[] {
  const all = new Set(packages.filter((p) => p.family === slug).flatMap((p) => p.includes));
  return (Object.keys(capabilities) as CapabilityCode[]).filter((c) => all.has(c));
}
