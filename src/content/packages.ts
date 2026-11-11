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
  | 'CRPT'
  | 'MDE'
  | 'PSA'
  | 'DSB'
  | 'AVM'
  | 'VM';

export const capabilities: Record<CapabilityCode, { name: string; description: string }> = {
  EPP: { name: 'Endpoint Protection', description: 'Prevents known and unknown malware on laptops, desktops and servers.' },
  EDR: { name: 'Endpoint Detection & Response', description: 'Records endpoint activity to detect, contain and roll back attacks, and allows or blocks applications on each system (allowlisting and blocklisting).' },
  BTH: { name: 'Basic Threat Hunting', description: 'Regular hunts across your environment for common attacker techniques.' },
  ATH: { name: 'Advanced Threat Hunting', description: 'Hypothesis-driven hunts for threats that evade automated detection.' },
  SIEM: { name: 'AI-driven SIEM', description: 'Central collection and correlation of security signals across your environment.' },
  ESPM: { name: 'External Security Posture', description: 'Continuously discovers and tests internet-facing assets: open ports, vulnerabilities, technology stack and dark web exposure.' },
  NSPM: { name: 'Network Security Posture', description: 'Continuously discovers and tests assets on your internal network: open ports, vulnerabilities and remediation priorities.' },
  CIR: { name: 'Continuous Incident Response', description: 'Incident response is part of the service, not a separate retainer.' },
  AVM: { name: 'Application Vulnerability Management', description: 'Finds vulnerable third-party applications on every endpoint through the EDR agent.' },
  VM: { name: 'Vulnerability Management', description: 'Finds vulnerable operating systems and third-party applications on every endpoint through the EDR agent.' },
  CTEM: { name: 'Exposure Management', description: 'Continuous internal, external and dark web exposure management.' },
  CPT: { name: 'Continuous Pen Testing', description: 'Ongoing attack simulation instead of a once-a-year test.' },
  APP: { name: 'Advanced Phishing Protection', description: 'Stops phishing, impersonation and malicious links across email and collaboration tools.' },
  ITP: { name: 'Internet Threat Protection', description: 'DNS-layer protection that blocks malicious destinations for users anywhere.' },
  DSPM: { name: 'Data Security Posture', description: 'Discovers sensitive data and where it is exposed.' },
  ISPM: { name: 'Identity Security Posture', description: 'Finds risky accounts, permissions and identity misconfigurations.' },
  DNSSPM: { name: 'DNS Security Posture', description: 'Monitors domains and DNS configuration for hijack and spoofing risk.' },
  CFS: { name: 'Cloud File Security', description: 'Scans files in cloud storage and collaboration platforms for threats.' },
  ITDR: { name: 'Identity Threat Detection & Response', description: 'Detects and responds to account takeover and identity attacks.' },
  MDE: { name: 'Managed Data Encryption', description: 'Policy-driven AES-256 file-level encryption of sensitive data, deployed and managed for you. Add-on.' },
  PSA: { name: 'Phishing Simulation & Security Awareness', description: 'Monthly end-user training with advanced phishing and threat simulations. Add-on.' },
  DSB: { name: 'Distributed SaaS Backup', description: 'Automated daily backup of Microsoft 365 or Google Workspace to an independent location, with granular restore. Add-on.' },
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
    includes: ['EDR', 'ATH', 'AVM', ...SOC_CORE],
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
    includes: ['EDR', 'AVM', ...XDR_CORE],
    outcomes: ['Containment and rollback on every endpoint', 'Phishing and web threats blocked', 'One correlated view across endpoint, email and web'],
  },
  {
    code: 'XDR-PM',
    family: 'XDR',
    name: 'Extended Detection & Response, Premier',
    tagline: 'Add threat hunting',
    summary: 'Adds basic threat hunting: regular hunts across your environment for common attacker techniques.',
    bestFor: 'Organizations that want full endpoint response alongside email and web protection.',
    includes: ['EDR', 'BTH', 'AVM', ...XDR_CORE],
    outcomes: ['Threats found before they trigger alerts', 'Containment and rollback on every endpoint', 'Phishing and web threats blocked'],
  },
  {
    code: 'DDR-ST',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Standard',
    tagline: 'Active defense with data and compliance in view',
    summary: 'Moves from detection to active defense, and adds data security posture management and compliance reporting.',
    bestFor: 'Organizations with sensitive data and audit obligations.',
    includes: ['EDR', 'ATH', 'VM', ...XDR_CORE, 'DSPM', 'CRPT'],
    outcomes: ['Sensitive data found and exposure prioritized', 'Audit-ready evidence and reporting', 'Threats blocked in real time'],
  },
  {
    code: 'DDR-ES',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Enterprise',
    tagline: 'Identity and DNS covered',
    summary: 'Adds identity security posture management and DNS security posture, protecting accounts, domains and DNS.',
    bestFor: 'Enterprises where identities and domains are prime targets.',
    includes: ['EDR', 'ATH', 'VM', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CRPT'],
    outcomes: ['Risky accounts and permissions found', 'Domain and DNS risks monitored', 'Brand spoofing exposure reduced'],
  },
  {
    code: 'DDR-PM',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Premier',
    tagline: 'Cloud files covered too',
    summary: 'Adds security for files stored and shared in cloud platforms.',
    bestFor: 'Organizations that collaborate heavily in cloud storage.',
    includes: ['EDR', 'ATH', 'VM', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CFS', 'CRPT'],
    outcomes: ['Malicious files caught in cloud storage', 'Safer external sharing', 'Coverage where work actually happens'],
  },
  {
    code: 'DDR-CP',
    family: 'DDR',
    name: 'Detect, Defend & Respond, Compliance Plus',
    tagline: 'Maximum protection, identity attacks stopped',
    summary: 'Adds identity threat detection and response to stop account takeover as it happens.',
    bestFor: 'Regulated organizations that need the complete portfolio.',
    includes: ['EDR', 'ATH', 'VM', ...XDR_CORE, 'DSPM', 'ISPM', 'DNSSPM', 'CFS', 'ITDR', 'CRPT'],
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

/* ---------- Add-on services ---------- */

export type AddOnFamily = 'PSA' | 'DRM' | 'DSB' | 'ZTI' | 'SPM';

export interface AddOn {
  code: string;
  /** WhiteDog product code */
  sku: string;
  family: AddOnFamily;
  name: string;
  summary: string;
  includes: CapabilityCode[];
  features: string[];
}

/** Services that can be added to any edition to close specific gaps. */
export const addOns: AddOn[] = [
  {
    code: 'ZTI',
    sku: 'WD-ZTI-CP-01',
    family: 'ZTI',
    name: 'Zero Trust Identity',
    summary: 'Hardens Entra ID and Active Directory, watches for credential theft and identity attacks, and responds automatically.',
    includes: ['ISPM', 'ITDR'],
    features: [
      'Identity posture: Entra ID, Active Directory, privileged accounts, stale and risky accounts',
      'Dark-web credential exposure monitoring',
      'Detection of credential theft, privilege escalation, Kerberoasting and lateral movement',
      'Active deception for identity reconnaissance',
      'Automated response: disable accounts, force password resets, block sessions, isolate endpoints',
    ],
  },
  {
    code: 'SPM-EXT',
    sku: 'WD-SPM-EXT-01',
    family: 'SPM',
    name: 'External Security Posture Management',
    summary: 'Finds and tests everything you expose to the internet, continuously, with dark web monitoring.',
    includes: ['ESPM', 'CTEM', 'CPT'],
    features: [
      'Continuous threat exposure management for internet-facing assets',
      'Automated asset discovery, open port detection and technology stack identification',
      'Vulnerability scanning and exploitation, with continuous automated pen testing',
      'Web asset screenshots and dark web monitoring',
      'Remediation recommendations',
    ],
  },
  {
    code: 'SPM-NWK',
    sku: 'WD-SPM-NWK-01',
    family: 'SPM',
    name: 'Network Security Posture Management',
    summary: 'Finds and tests every asset on your internal network, continuously.',
    includes: ['NSPM', 'CTEM', 'CPT'],
    features: [
      'Continuous threat exposure management for the internal network',
      'Automated asset discovery, open port detection and technology stack identification',
      'Vulnerability scanning and exploitation, with continuous automated pen testing',
      'Remediation recommendations',
    ],
  },
  {
    code: 'PSA',
    sku: 'WD-PSA-CP-02',
    family: 'PSA',
    name: 'Phishing Simulation & Security Awareness Training',
    summary: 'Keeps people alert with monthly training and realistic phishing and threat simulations.',
    includes: ['PSA'],
    features: ['Monthly end-user training', 'Advanced phishing simulation', 'Advanced threat simulation', 'AI-optimized training and targeting'],
  },
  {
    code: 'DRM-CP',
    sku: 'WD-DRM-CP-01',
    family: 'DRM',
    name: 'Data Risk Management, Complete',
    summary: 'Finds and classifies sensitive data everywhere it lives, values the risk, and encrypts it automatically.',
    includes: ['DSPM', 'MDE'],
    features: [
      'Data security posture management: discovery, classification (PII, PCI, PHI), continuous risk monitoring',
      'Endpoints, file servers, NAS, Microsoft 365 and Google Workspace',
      'Risk valuation using the FAIR framework',
      'Managed AES-256 file-level encryption',
    ],
  },
  {
    code: 'MDE-PM',
    sku: 'WD-MDE-PM-01',
    family: 'DRM',
    name: 'Managed Data Encryption, Premium',
    summary: 'Automated, policy-driven encryption of sensitive data with a seamless experience for users.',
    includes: ['MDE'],
    features: ['Automated encryption of sensitive data', 'Policy-driven deployment', 'AES-256 file-level encryption', 'Seamless decryption'],
  },
  {
    code: 'DSB',
    sku: 'WD-DSB-365-01 / WD-DSB-GWS-01',
    family: 'DSB',
    name: 'Distributed SaaS Backup & Recovery',
    summary: 'Daily backup of Microsoft 365 or Google Workspace to an independent location, with search and granular restore.',
    includes: ['DSB'],
    features: [
      'Automated daily backup to an independent location',
      'Microsoft 365: mailboxes, archives, OneDrive, SharePoint, Teams, Groups',
      'Google Workspace: Gmail, Drive, Shared Drives, Sites, Calendar',
      'Granular restore with multiple target options',
    ],
  },
];

/* ---------- Add-on product lines (pages under /products) ---------- */

export interface AddOnLine {
  slug: AddOnFamily;
  /** URL segment under /products */
  path: string;
  label: string;
  name: string;
  tagline: string;
  summary: string;
  bestFor: string;
  outcomes: string[];
  /** Columns of the feature table: one per edition or platform */
  columns: { code: string; label: string }[];
  groups: { title: string; rows: { label: string; in: string[] }[] }[];
}

export const addOnLines: AddOnLine[] = [
  {
    slug: 'SPM',
    path: 'spm',
    label: 'SPM',
    name: 'Security Posture Management',
    tagline: 'See your environment the way an attacker does',
    summary:
      'Continuous threat exposure management for your internet-facing assets, your internal network, or both: automated discovery, vulnerability scanning and exploitation, and continuous automated pen testing.',
    bestFor: 'Organizations that need to know what they expose and which weaknesses are exploitable, without waiting for an annual pen test.',
    outcomes: [
      'An always-current inventory of internet-facing and internal assets',
      'Exploitable weaknesses found and prioritized continuously',
      'Clear remediation recommendations for your team',
    ],
    columns: [
      { code: 'SPM-EXT', label: 'External' },
      { code: 'SPM-NWK', label: 'Network' },
    ],
    groups: [
      {
        title: 'Continuous threat exposure management',
        rows: [
          { label: 'Automated asset discovery', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Vulnerability scanning and exploitation', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Open port detection', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Continuous automated pen testing', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Technology stack identification', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Remediation recommendations', in: ['SPM-EXT', 'SPM-NWK'] },
          { label: 'Web asset screenshots', in: ['SPM-EXT'] },
          { label: 'Dark web monitoring', in: ['SPM-EXT'] },
        ],
      },
    ],
  },
  {
    slug: 'ZTI',
    path: 'zti',
    label: 'ZTI',
    name: 'Zero Trust Identity',
    tagline: 'Identity is the new perimeter. Protect it.',
    summary:
      'Continuous identity posture management for Entra ID and Active Directory, deception and threat detection for identity attacks, and automated response that shuts compromised accounts down fast.',
    bestFor: 'Organizations running Active Directory or Entra ID where stolen credentials and excessive privileges are the easiest way in.',
    outcomes: [
      'Risky accounts, excessive permissions and attack paths found and fixed',
      'Identity attacks detected as they happen, including Kerberoasting and lateral movement',
      'Compromised accounts disabled and sessions blocked automatically',
    ],
    columns: [{ code: 'ZTI', label: 'Complete' }],
    groups: [
      {
        title: 'Security posture management',
        rows: [
          { label: 'Entra ID and cloud identity provider posture assessment', in: ['ZTI'] },
          { label: 'Dark-web credential exposure monitoring', in: ['ZTI'] },
          { label: 'Continuous identity posture assessment', in: ['ZTI'] },
          { label: 'Active Directory configuration assessment', in: ['ZTI'] },
          { label: 'Misconfiguration detection and prioritization', in: ['ZTI'] },
          { label: 'Identity exposure and attack-path reduction', in: ['ZTI'] },
          { label: 'Privileged-account hygiene assessment', in: ['ZTI'] },
          { label: 'Excessive permissions and delegation analysis', in: ['ZTI'] },
          { label: 'Stale, inactive or risky account discovery', in: ['ZTI'] },
          { label: 'Identity asset and privilege discovery', in: ['ZTI'] },
        ],
      },
      {
        title: 'Active Directory posture and deception',
        rows: [
          { label: 'Active Directory change monitoring', in: ['ZTI'] },
          { label: 'AD reconnaissance detection', in: ['ZTI'] },
          { label: 'Credential theft detection', in: ['ZTI'] },
          { label: 'Credential abuse and account compromise detection', in: ['ZTI'] },
          { label: 'Privilege-escalation detection', in: ['ZTI'] },
          { label: 'Kerberoasting and AD attack technique detection', in: ['ZTI'] },
          { label: 'Lateral-movement detection', in: ['ZTI'] },
          { label: 'Real-time identity threat detection', in: ['ZTI'] },
          { label: 'Identity-focused behavioral analytics', in: ['ZTI'] },
          { label: 'Identity threat investigation and evidence', in: ['ZTI'] },
          { label: 'Active deception for identity reconnaissance', in: ['ZTI'] },
        ],
      },
      {
        title: 'Identity detection and response',
        rows: [
          { label: 'Suspicious authentication and logon detection', in: ['ZTI'] },
          { label: 'Endpoint and identity telemetry correlation', in: ['ZTI'] },
          { label: 'Automated incident response workflows', in: ['ZTI'] },
          { label: 'Disable compromised identities and force password resets', in: ['ZTI'] },
          { label: 'Session blocking and conditional access response', in: ['ZTI'] },
          { label: 'Endpoint isolation tied to identity incidents', in: ['ZTI'] },
        ],
      },
    ],
  },
  {
    slug: 'PSA',
    path: 'psa',
    label: 'PSA',
    name: 'Phishing Simulation & Security Awareness Training',
    tagline: 'Turn people into your first line of defense',
    summary:
      'Monthly security awareness training with advanced phishing and threat simulations, targeted to each person by AI, so your people recognize and report attacks.',
    bestFor: 'Any organization where phishing and social engineering are a real risk, and anyone who needs training records for compliance or insurance.',
    outcomes: ['Fewer people clicking on phishing', 'More attacks reported early', 'Training records for auditors and insurers'],
    columns: [{ code: 'PSA', label: 'Complete' }],
    groups: [
      {
        title: 'Security awareness training',
        rows: [
          { label: 'Monthly end-user training', in: ['PSA'] },
          { label: 'Advanced phishing simulation', in: ['PSA'] },
          { label: 'Advanced threat simulation', in: ['PSA'] },
          { label: 'AI-optimized training and targeting', in: ['PSA'] },
        ],
      },
    ],
  },
  {
    slug: 'DRM',
    path: 'drm',
    label: 'DRM',
    name: 'Data Risk Management',
    tagline: 'Know where sensitive data lives, and keep it protected',
    summary:
      'Data security posture management that finds, classifies and values sensitive data across endpoints, file servers and cloud, plus managed encryption that protects it automatically.',
    bestFor: 'Organizations holding PII, PCI or PHI that need to prove where it is, what it is worth and that it is encrypted.',
    outcomes: ['An inventory of sensitive data and where it is exposed', 'Data risk expressed in dollars using FAIR', 'Sensitive files encrypted automatically'],
    columns: [
      { code: 'DRM-CP', label: 'Complete' },
      { code: 'MDE-PM', label: 'Encryption only' },
    ],
    groups: [
      {
        title: 'Data security posture management',
        rows: [
          { label: 'Automated asset discovery', in: ['DRM-CP'] },
          { label: 'Vulnerability scan and exploitation', in: ['DRM-CP'] },
          { label: 'Continuous data risk monitoring', in: ['DRM-CP'] },
          { label: 'Real-time tracking of file changes', in: ['DRM-CP'] },
          { label: 'Windows and Mac endpoints', in: ['DRM-CP'] },
          { label: 'File servers, NAS and terminal servers', in: ['DRM-CP'] },
          { label: 'Microsoft 365 and Google Workspace', in: ['DRM-CP'] },
          { label: 'Data classification (PII, PCI, PHI and more)', in: ['DRM-CP'] },
          { label: 'Risk valuation using the FAIR framework', in: ['DRM-CP'] },
        ],
      },
      {
        title: 'Managed encryption',
        rows: [
          { label: 'Automated encryption of sensitive data', in: ['DRM-CP', 'MDE-PM'] },
          { label: 'Policy-driven encryption deployment', in: ['DRM-CP', 'MDE-PM'] },
          { label: 'AES-256 file-level encryption', in: ['DRM-CP', 'MDE-PM'] },
          { label: 'Seamless decryption for authorized users', in: ['DRM-CP', 'MDE-PM'] },
          { label: 'Encryption wizard', in: ['DRM-CP', 'MDE-PM'] },
        ],
      },
    ],
  },
  {
    slug: 'DSB',
    path: 'dsb',
    label: 'DSB',
    name: 'Distributed SaaS Backup & Recovery',
    tagline: 'Your cloud data, backed up somewhere else',
    summary:
      'Automated daily backup of Microsoft 365 or Google Workspace to an independent location, with search across users and data types and granular restore.',
    bestFor: 'Organizations that rely on Microsoft 365 or Google Workspace and need to recover from ransomware, deletion or a departing employee.',
    outcomes: ['A copy of SaaS data outside the provider', 'Restore a single item or a whole account', 'Backups that support GDPR, HIPAA and other obligations'],
    columns: [
      { code: 'DSB-365', label: 'Microsoft 365' },
      { code: 'DSB-GWS', label: 'Google Workspace' },
    ],
    groups: [
      {
        title: 'Backup and recovery',
        rows: [
          { label: 'Automated daily backup to an independent location', in: ['DSB-365', 'DSB-GWS'] },
          { label: 'Search across users and data types', in: ['DSB-365', 'DSB-GWS'] },
          { label: 'Backup, search and restore in one solution', in: ['DSB-365', 'DSB-GWS'] },
          { label: 'Granular restore with multiple target options', in: ['DSB-365', 'DSB-GWS'] },
          { label: 'Supports GDPR, HIPAA and other compliance needs', in: ['DSB-365', 'DSB-GWS'] },
        ],
      },
      {
        title: 'Microsoft 365 coverage',
        rows: [
          { label: 'Mailboxes (all types)', in: ['DSB-365'] },
          { label: 'In-place archives', in: ['DSB-365'] },
          { label: 'Calendar, tasks and contacts', in: ['DSB-365'] },
          { label: 'SharePoint sites, including lists and permissions', in: ['DSB-365'] },
          { label: 'OneDrive', in: ['DSB-365'] },
          { label: 'Groups (conversations, plans, files, sites, calendar)', in: ['DSB-365'] },
          { label: 'Teams, including chat and wiki', in: ['DSB-365'] },
        ],
      },
      {
        title: 'Google Workspace coverage',
        rows: [
          { label: 'Gmail', in: ['DSB-GWS'] },
          { label: 'Google Drive', in: ['DSB-GWS'] },
          { label: 'Shared drives', in: ['DSB-GWS'] },
          { label: 'Google Sites', in: ['DSB-GWS'] },
          { label: 'Calendar', in: ['DSB-GWS'] },
          { label: 'Tasks', in: ['DSB-GWS'] },
        ],
      },
    ],
  },
];

export const addOnLineByPath = (path: string) => addOnLines.find((l) => l.path === path);
export const addOnHref = (a: { family: AddOnFamily }) => `/products/${addOnLines.find((l) => l.slug === a.family)!.path}`;
