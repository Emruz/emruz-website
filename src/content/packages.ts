/**
 * Managed security Service Package Portfolio.
 *
 * Tier structure modeled on a stacked "each tier includes the one before"
 * portfolio. Capability inclusion per tier is DRAFT and must be confirmed
 * against the approved delivery mapping before launch (see
 * docs/content-verification.md). No pricing, SLAs or vendor names here.
 */

export type CapabilityCode =
  | 'EPP'
  | 'EDR'
  | 'SIEM'
  | 'SOC'
  | 'ESPM'
  | 'NSPM'
  | 'CIR'
  | 'CTEM'
  | 'CPT'
  | 'APP'
  | 'ITP'
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
  SIEM: { name: 'AI-driven SIEM', description: 'Central collection and correlation of security signals across your environment.' },
  SOC: { name: '24/7 Security Operations', description: 'Analysts monitor, investigate and respond around the clock.' },
  ESPM: { name: 'Endpoint Security Posture', description: 'Finds misconfigured and unpatched endpoints before attackers do.' },
  NSPM: { name: 'Network Security Posture', description: 'Continuous review of network exposure and segmentation.' },
  CIR: { name: 'Continuous Incident Response', description: 'Incident response is part of the service, not a separate retainer.' },
  CTEM: { name: 'Exposure Management', description: 'Continuous internal, external and dark web exposure management.' },
  CPT: { name: 'Continuous Pen Testing', description: 'Ongoing attack simulation instead of a once-a-year test.' },
  APP: { name: 'Advanced Phishing Protection', description: 'Stops phishing, impersonation and malicious links across email and collaboration tools.' },
  ITP: { name: 'Internet Threat Protection', description: 'DNS-layer protection that blocks malicious destinations for users anywhere.' },
  ATH: { name: 'Advanced Threat Hunting', description: 'Hypothesis-driven hunts for threats that evade automated detection.' },
  DSPM: { name: 'Data Security Posture', description: 'Discovers sensitive data and where it is exposed.' },
  ISPM: { name: 'Identity Security Posture', description: 'Finds risky accounts, permissions and identity misconfigurations.' },
  DNSSPM: { name: 'DNS Security Posture', description: 'Monitors domains and DNS configuration for hijack and spoofing risk.' },
  CFS: { name: 'Cloud File Security', description: 'Scans files in cloud storage and collaboration platforms for threats.' },
  ITDR: { name: 'Identity Threat Detection & Response', description: 'Detects and responds to account takeover and identity attacks.' },
  CRPT: { name: 'Compliance Reporting', description: 'Evidence and reporting mapped to the frameworks your auditors use.' },
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
    summary: 'Prevention plus detection, containment and rollback on laptops, desktops and servers.',
    bestFor: 'Organizations starting a security program or replacing legacy antivirus.',
  },
  {
    slug: 'MDR',
    path: 'mdr',
    label: 'MDR',
    name: 'Managed Detection & Response',
    tagline: 'Experts watching around the clock',
    summary:
      'A 24/7 security operations team monitors, investigates and responds for you, with incident response, exposure management and continuous pen testing included.',
    bestFor: 'Teams without their own 24/7 security operations center.',
  },
  {
    slug: 'XDR',
    path: 'xdr',
    label: 'XDR',
    name: 'Extended Detection & Response',
    tagline: 'Beyond the endpoint',
    summary:
      'Everything in MDR plus email, collaboration and internet threat protection, threat hunting and data security posture, in three tiers.',
    bestFor: 'Organizations where phishing, web threats and sensitive data are the main risks.',
  },
  {
    slug: 'DDR',
    path: 'ddr',
    label: 'ΔDR',
    name: 'Detect, Defend & Respond',
    tagline: 'Active defense with identity and data at the center',
    summary:
      'Everything in XDR plus identity and data risk and posture management, DNS and cloud file security, and compliance reporting, in four tiers.',
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

export interface ServicePackage {
  code: string;
  family: FamilySlug;
  name: string;
  tagline: string;
  summary: string;
  bestFor: string;
  /** Capabilities added at this tier */
  adds: CapabilityCode[];
  /** Outcomes the buyer gets */
  outcomes: string[];
}

export const packages: ServicePackage[] = [
  {
    code: 'EDR',
    family: 'EDR',
    name: 'Endpoint Detection & Response',
    tagline: 'Your first line of defense',
    summary: 'Protects every device with prevention plus detection and rollback when something gets through.',
    bestFor: 'Organizations starting their security program or replacing legacy antivirus.',
    adds: ['EPP', 'EDR'],
    outcomes: ['Modern protection on every endpoint', 'Visibility into what happened on a device', 'Fast containment of compromised machines'],
  },
  {
    code: 'MDR',
    family: 'MDR',
    name: 'Managed Detection & Response',
    tagline: 'Expert eyes on your environment',
    summary: 'Analysts watch your environment around the clock, investigate alerts and respond for you.',
    bestFor: 'Teams without a 24/7 SOC who need detection and response handled.',
    adds: ['SIEM', 'SOC', 'ESPM', 'NSPM', 'CIR', 'CTEM', 'CPT'],
    outcomes: ['24/7 monitoring and response', 'Incident response included', 'Continuous view of your exposures'],
  },
  {
    code: 'XDR-ST',
    family: 'XDR',
    name: 'Extended Detection & Response, Standard',
    tagline: 'Visibility beyond the endpoint',
    summary: 'Adds email, collaboration and internet threat protection so attacks are stopped before they reach a device.',
    bestFor: 'Organizations where phishing and web threats are the main risk.',
    adds: ['APP', 'ITP'],
    outcomes: ['Phishing and impersonation blocked', 'Protection for users on and off network', 'One correlated view across endpoint, email and web'],
  },
  {
    code: 'XDR-ES',
    family: 'XDR',
    name: 'Extended Detection & Response, Enterprise',
    tagline: 'Hunt what tools miss',
    summary: 'Adds proactive threat hunting by experienced analysts across your environment.',
    bestFor: 'Enterprises with valuable targets and sophisticated adversaries.',
    adds: ['ATH'],
    outcomes: ['Proactive hunts, not just alerts', 'Earlier detection of stealthy attacks', 'Findings that harden your controls'],
  },
  {
    code: 'XDR-PM',
    family: 'XDR',
    name: 'Extended Detection & Response, Premier',
    tagline: 'Know where your sensitive data is',
    summary: 'Adds data security posture management to find sensitive data and where it is exposed.',
    bestFor: 'Organizations with regulated or high-value data.',
    adds: ['DSPM'],
    outcomes: ['Map of sensitive data across systems', 'Exposed data found and prioritized', 'Better answers for auditors and boards'],
  },
  {
    code: 'DDR-ST',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Standard',
    tagline: 'Active defense for identity',
    summary: 'Moves from detection to active defense and adds identity security posture management.',
    bestFor: 'Organizations where identities are the new perimeter.',
    adds: ['ISPM'],
    outcomes: ['Risky accounts and permissions found', 'Threats blocked in real time', 'Identity hygiene tracked over time'],
  },
  {
    code: 'DDR-ES',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Enterprise',
    tagline: 'Defense coordinated across the estate',
    summary: 'Adds DNS security posture so domains and DNS are protected from hijack and spoofing.',
    bestFor: 'Enterprises with many domains, brands or business units.',
    adds: ['DNSSPM'],
    outcomes: ['Domain and DNS risks monitored', 'Brand spoofing exposure reduced', 'Defense coordinated across infrastructure'],
  },
  {
    code: 'DDR-PM',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Premier',
    tagline: 'Cloud files covered too',
    summary: 'Adds security for files stored and shared in cloud platforms.',
    bestFor: 'Organizations that collaborate heavily in cloud storage.',
    adds: ['CFS'],
    outcomes: ['Malicious files caught in cloud storage', 'Safer external sharing', 'Coverage where work actually happens'],
  },
  {
    code: 'DDR-CP',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Compliance Plus',
    tagline: 'Maximum protection with compliance built in',
    summary: 'Adds identity threat detection and response plus compliance reporting mapped to your frameworks.',
    bestFor: 'Regulated organizations that need protection and audit evidence together.',
    adds: ['ITDR', 'CRPT'],
    outcomes: ['Account takeover detected and stopped', 'Audit-ready evidence and reporting', 'The complete portfolio in one service'],
  },
];

/** All capabilities included in a package, cumulative through the tiers. */
export function includedCapabilities(code: string): CapabilityCode[] {
  const out: CapabilityCode[] = [];
  for (const p of packages) {
    out.push(...p.adds);
    if (p.code === code) break;
  }
  return out;
}
