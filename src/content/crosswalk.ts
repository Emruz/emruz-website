/**
 * Crosswalk from the self-assessment questions to CIS Controls v8 safeguards, CMMC 2.0 Level 2,
 * ISO/IEC 27001:2022 Annex A, NIST CSF 2.0 and SOC 2 (2017 Trust Services
 * Criteria, revised 2022).
 *
 * Mapped per question, not per CIS control, so a partial answer only affects
 * the clauses it relates to. Titles are our own short descriptions; never
 * paste ISO or AICPA wording here (copyright).
 *
 * DRAFT: mappings follow the CIS v8.1 published mappings in spirit and must
 * be reviewed against the CIS and ComplianceForge crosswalks before launch.
 */
import { controls, inScope, type Answers, type IG, type Profile } from './cis-assessment';

export type FrameworkKey = 'cis' | 'cmmc' | 'iso' | 'csf' | 'soc2';

export interface Framework {
  key: FrameworkKey;
  name: string;
  short: string;
  /** What this assessment does not cover for this framework */
  notCovered: string;
  ids: Record<string, string>;
}

export const frameworks: Framework[] = [
  {
    key: 'cis',
    name: 'CIS Controls v8',
    short: 'CIS v8',
    notCovered:
      'This short assessment asks about the most important safeguards in each of the 18 controls, not all 153. A full CIS assessment scores every safeguard for your Implementation Group.',
    ids: {
      '1.1': 'Detailed enterprise asset inventory',
      '1.2': 'Address unauthorized assets',
      '1.3': 'Active asset discovery',
      '1.4': 'DHCP logging to update the inventory',
      '2.1': 'Software inventory',
      '2.2': 'Authorized software is supported',
      '2.3': 'Address unauthorized software',
      '2.5': 'Allowlist authorized software',
      '2.6': 'Allowlist authorized libraries',
      '2.7': 'Allowlist authorized scripts',
      '3.1': 'Data management process',
      '3.2': 'Data inventory',
      '3.3': 'Data access control lists',
      '3.6': 'Encrypt data on end-user devices',
      '3.7': 'Data classification scheme',
      '3.10': 'Encrypt sensitive data in transit',
      '3.11': 'Encrypt sensitive data at rest',
      '3.13': 'Data loss prevention',
      '4.1': 'Secure configuration process',
      '4.2': 'Secure configuration for network infrastructure',
      '4.3': 'Automatic session locking',
      '4.7': 'Manage default accounts',
      '5.1': 'Inventory of accounts',
      '5.2': 'Unique passwords',
      '5.3': 'Disable dormant accounts',
      '5.4': 'Dedicated administrator accounts',
      '5.5': 'Inventory of service accounts',
      '5.6': 'Centralized account management',
      '6.1': 'Access granting process',
      '6.2': 'Access revoking process',
      '6.3': 'MFA for externally exposed applications',
      '6.4': 'MFA for remote network access',
      '6.5': 'MFA for administrative access',
      '6.7': 'Centralized access control',
      '7.1': 'Vulnerability management process',
      '7.2': 'Remediation process',
      '7.3': 'Automated operating system patching',
      '7.4': 'Automated application patching',
      '7.5': 'Internal vulnerability scans',
      '7.6': 'External vulnerability scans',
      '7.7': 'Remediate detected vulnerabilities',
      '8.1': 'Audit log management process',
      '8.2': 'Collect audit logs',
      '8.3': 'Adequate log storage',
      '8.4': 'Time synchronization',
      '8.9': 'Centralized audit logs',
      '8.10': 'Retain audit logs',
      '8.11': 'Audit log reviews',
      '9.1': 'Supported browsers and email clients',
      '9.2': 'DNS filtering',
      '9.5': 'DMARC',
      '9.6': 'Block unnecessary file types',
      '10.1': 'Anti-malware software',
      '10.2': 'Automatic anti-malware updates',
      '10.3': 'Disable autorun for removable media',
      '10.4': 'Scan removable media',
      '10.6': 'Centrally managed anti-malware',
      '10.7': 'Behavior-based anti-malware',
      '11.1': 'Data recovery process',
      '11.2': 'Automated backups',
      '11.3': 'Protect recovery data',
      '11.4': 'Isolated copy of recovery data',
      '11.5': 'Test data recovery',
      '12.1': 'Network infrastructure up to date',
      '12.2': 'Secure network architecture',
      '12.3': 'Secure network infrastructure management',
      '12.4': 'Architecture diagrams',
      '12.7': 'Remote access through VPN with authentication',
      '13.1': 'Centralized security event alerting',
      '13.2': 'Host-based intrusion detection',
      '13.3': 'Network intrusion detection',
      '14.1': 'Security awareness program',
      '14.2': 'Recognize social engineering',
      '14.4': 'Data handling best practices',
      '14.6': 'Recognize and report incidents',
      '14.9': 'Role-specific training',
      '15.1': 'Inventory of service providers',
      '15.2': 'Service provider management policy',
      '15.3': 'Classify service providers',
      '15.4': 'Security requirements in provider contracts',
      '15.5': 'Assess service providers',
      '15.7': 'Securely decommission providers',
      '16.1': 'Secure application development process',
      '16.2': 'Process for software vulnerabilities',
      '16.4': 'Inventory of third-party components',
      '16.6': 'Severity rating for vulnerabilities',
      '16.12': 'Code-level security checks',
      '16.13': 'Application penetration testing',
      '17.1': 'Incident handling personnel',
      '17.2': 'Incident contact information',
      '17.3': 'Process for reporting incidents',
      '17.4': 'Incident response process',
      '17.7': 'Incident response exercises',
      '18.1': 'Penetration testing program',
      '18.2': 'External penetration tests',
      '18.3': 'Remediate penetration test findings',
      '18.5': 'Internal penetration tests',
    },
  },
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
      'The management system itself (scope, risk assessment and treatment, Statement of Applicability, internal audit, management review) and Annex A controls for policies, HR, physical security, legal and privacy. Certification needs an accredited audit.',
    ids: {
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
      '5.27': 'Learning from incidents',
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
      'Most of the Govern function (organizational context, risk strategy, policy, oversight), formal risk assessment, physical security, and recovery planning and communications.',
    ids: {
      'GV.RR-02': 'Security roles and responsibilities',
      'GV.SC-04': 'Suppliers known and prioritized',
      'GV.SC-05': 'Security requirements in supplier contracts',
      'GV.SC-07': 'Supplier risk monitored',
      'GV.SC-10': 'Supplier offboarding',
      'ID.AM-01': 'Hardware inventory',
      'ID.AM-02': 'Software and services inventory',
      'ID.AM-03': 'Network and data flows documented',
      'ID.AM-04': 'Supplier services inventory',
      'ID.AM-07': 'Data inventory',
      'ID.IM-02': 'Improvement from tests and exercises',
      'ID.IM-04': 'Incident response plans maintained',
      'ID.RA-01': 'Vulnerabilities identified',
      'ID.RA-06': 'Risk responses chosen and tracked',
      'ID.RA-08': 'Vulnerability handling process',
      'PR.AA-01': 'Identities and credentials managed',
      'PR.AA-03': 'Users and devices authenticated',
      'PR.AA-05': 'Access permissions and least privilege',
      'PR.AT-01': 'Awareness training',
      'PR.AT-02': 'Training for specialized roles',
      'PR.DS-01': 'Data at rest protected',
      'PR.DS-02': 'Data in transit protected',
      'PR.DS-11': 'Backups created, protected and tested',
      'PR.IR-01': 'Networks protected from unauthorized access',
      'PR.PS-01': 'Configuration management',
      'PR.PS-02': 'Software maintained, replaced and removed',
      'PR.PS-03': 'Hardware maintained, replaced and removed',
      'PR.PS-04': 'Log records generated',
      'PR.PS-05': 'Unauthorized software prevented',
      'PR.PS-06': 'Secure software development',
      'DE.AE-02': 'Events analyzed',
      'DE.AE-03': 'Information correlated from multiple sources',
      'DE.CM-01': 'Networks monitored',
      'DE.CM-09': 'Computing hardware and software monitored',
      'RS.CO-02': 'Stakeholders notified of incidents',
      'RS.CO-03': 'Incident information shared',
      'RC.RP-03': 'Backup integrity verified before restore',
    },
  },
  {
    key: 'soc2',
    name: 'SOC 2 (Trust Services Criteria)',
    short: 'SOC 2',
    notCovered:
      'Control environment and governance (CC1 to CC5), risk assessment, physical access, change approval, and the Processing Integrity and Privacy criteria. A SOC 2 report needs an independent CPA audit.',
    ids: {
      'CC1.4': 'Competence and training',
      'CC2.2': 'Internal security communication',
      'CC2.3': 'External communication',
      'CC4.1': 'Ongoing and separate evaluations',
      'CC4.2': 'Deficiencies communicated and fixed',
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

type Map = Partial<Record<FrameworkKey, string[]>>;

/** Question ID to related framework IDs. */
export const crosswalk: Record<string, Map> = {
  '1a': { cis: ['1.1'], cmmc: ['CM.L2-3.4.1'], iso: ['5.9'], csf: ['ID.AM-01'], soc2: ['CC6.1'] },
  '1b': { cis: ['1.2'], cmmc: ['AC.L2-3.1.1', 'IA.L2-3.5.1'], iso: ['5.9', '8.1'], csf: ['ID.AM-01', 'DE.CM-09'], soc2: ['CC6.1'] },
  '1c': { cis: ['1.3', '1.4'], cmmc: ['CM.L2-3.4.1'], iso: ['5.9'], csf: ['ID.AM-01', 'DE.CM-09'], soc2: ['CC6.1', 'CC7.1'] },
  '2a': { cis: ['2.1', '2.2'], cmmc: ['CM.L2-3.4.1'], iso: ['5.9'], csf: ['ID.AM-02'], soc2: ['CC6.1'] },
  '2b': { cis: ['2.2', '2.3'], cmmc: ['CM.L2-3.4.9'], iso: ['5.9', '8.19'], csf: ['ID.AM-02', 'PR.PS-02'], soc2: ['CC6.8'] },
  '2c': { cis: ['2.5', '2.6', '2.7'], cmmc: ['CM.L2-3.4.7', 'CM.L2-3.4.8'], iso: ['8.19'], csf: ['PR.PS-05'], soc2: ['CC6.8'] },
  '3a': { cis: ['3.1', '3.2'], iso: ['5.9', '5.12'], csf: ['ID.AM-07'], soc2: ['C1.1'] },
  '3b': { cis: ['3.3', '3.6'], cmmc: ['AC.L2-3.1.19', 'SC.L2-3.13.16'], iso: ['8.1', '8.3', '8.24'], csf: ['PR.AA-05', 'PR.DS-01'], soc2: ['CC6.1'] },
  '3c': { cis: ['3.7', '3.10', '3.11', '3.13'], cmmc: ['AC.L2-3.1.3', 'SC.L2-3.13.8'], iso: ['5.12', '8.12', '8.24'], csf: ['PR.DS-01', 'PR.DS-02'], soc2: ['CC6.7', 'C1.1'] },
  '4a': { cis: ['4.1', '4.2'], cmmc: ['CM.L2-3.4.1', 'CM.L2-3.4.2'], iso: ['8.9'], csf: ['PR.PS-01'], soc2: ['CC7.1'] },
  '4b': { cis: ['4.3', '4.7'], cmmc: ['AC.L2-3.1.10', 'CM.L2-3.4.6'], iso: ['8.5', '8.9'], csf: ['PR.PS-01', 'PR.AA-01'], soc2: ['CC6.1'] },
  '4c': { cis: ['4.1'], cmmc: ['CM.L2-3.4.3'], iso: ['8.9'], csf: ['PR.PS-01', 'DE.CM-09'], soc2: ['CC7.1', 'CC8.1'] },
  '5a': { cis: ['5.1', '5.5'], cmmc: ['AC.L2-3.1.1', 'IA.L2-3.5.1'], iso: ['5.16'], csf: ['PR.AA-01'], soc2: ['CC6.2'] },
  '5b': { cis: ['5.3', '6.2'], cmmc: ['IA.L2-3.5.6', 'PS.L2-3.9.2'], iso: ['5.18', '6.5'], csf: ['PR.AA-01', 'PR.AA-05'], soc2: ['CC6.2', 'CC6.3'] },
  '5c': { cis: ['5.2', '5.4'], cmmc: ['AC.L2-3.1.6', 'IA.L2-3.5.7'], iso: ['5.17', '8.2'], csf: ['PR.AA-01', 'PR.AA-05'], soc2: ['CC6.1', 'CC6.3'] },
  '6a': { cis: ['6.1', '6.2'], cmmc: ['AC.L2-3.1.1', 'AC.L2-3.1.5'], iso: ['5.15', '5.18'], csf: ['PR.AA-05'], soc2: ['CC6.2', 'CC6.3'] },
  '6b': { cis: ['6.3', '6.4', '6.5'], cmmc: ['IA.L2-3.5.3'], iso: ['8.5'], csf: ['PR.AA-03'], soc2: ['CC6.1', 'CC6.6'] },
  '6c': { cis: ['5.6', '6.7'], cmmc: ['AC.L2-3.1.5'], iso: ['5.16', '5.18'], csf: ['PR.AA-01', 'PR.AA-05'], soc2: ['CC6.2', 'CC6.3'] },
  '7a': { cis: ['7.3', '7.4'], cmmc: ['SI.L2-3.14.1'], iso: ['8.8'], csf: ['PR.PS-02'], soc2: ['CC7.1'] },
  '7b': { cis: ['7.5', '7.6'], cmmc: ['RA.L2-3.11.2'], iso: ['8.8'], csf: ['ID.RA-01'], soc2: ['CC7.1'] },
  '7c': { cis: ['7.1', '7.2', '7.7'], cmmc: ['RA.L2-3.11.3', 'SI.L2-3.14.1'], iso: ['8.8'], csf: ['ID.RA-01', 'ID.RA-06'], soc2: ['CC7.1'] },
  '8a': { cis: ['8.1', '8.2', '8.3', '8.10'], cmmc: ['AU.L2-3.3.1'], iso: ['8.15'], csf: ['PR.PS-04'], soc2: ['CC7.2'] },
  '8b': { cis: ['8.4', '8.9'], cmmc: ['AU.L2-3.3.1', 'AU.L2-3.3.7'], iso: ['8.15', '8.17'], csf: ['PR.PS-04'], soc2: ['CC7.2'] },
  '8c': { cis: ['8.11'], cmmc: ['AU.L2-3.3.5'], iso: ['8.15', '8.16'], csf: ['DE.AE-02', 'DE.AE-03'], soc2: ['CC7.2', 'CC7.3'] },
  '9a': { cis: ['9.1'], cmmc: ['CM.L2-3.4.9'], iso: ['8.19'], csf: ['PR.PS-02'], soc2: ['CC6.8'] },
  '9b': { cis: ['9.2'], cmmc: ['SC.L2-3.13.1'], iso: ['8.23'], csf: ['PR.IR-01', 'DE.CM-01'], soc2: ['CC6.6', 'CC6.8'] },
  '9c': { cis: ['9.5', '9.6'], cmmc: ['SI.L2-3.14.2'], iso: ['5.14', '8.7'], csf: ['DE.CM-09'], soc2: ['CC6.8'] },
  '10a': { cis: ['10.1', '10.2'], cmmc: ['SI.L2-3.14.2', 'SI.L2-3.14.4'], iso: ['8.7'], csf: ['DE.CM-09'], soc2: ['CC6.8'] },
  '10b': { cis: ['10.3', '10.4'], cmmc: ['MP.L2-3.8.7', 'SI.L2-3.14.5'], iso: ['7.10', '8.7'], csf: ['DE.CM-09'], soc2: ['CC6.7', 'CC6.8'] },
  '10c': { cis: ['10.6', '10.7'], cmmc: ['SI.L2-3.14.2', 'SI.L2-3.14.6'], iso: ['8.7', '8.16'], csf: ['DE.CM-09', 'DE.AE-02'], soc2: ['CC6.8', 'CC7.2'] },
  '11a': { cis: ['11.1', '11.2'], cmmc: ['MP.L2-3.8.9'], iso: ['8.13'], csf: ['PR.DS-11'], soc2: ['A1.2'] },
  '11b': { cis: ['11.3', '11.4'], cmmc: ['MP.L2-3.8.9'], iso: ['8.13'], csf: ['PR.DS-11'], soc2: ['A1.2'] },
  '11c': { cis: ['11.5'], iso: ['8.13'], csf: ['PR.DS-11', 'RC.RP-03'], soc2: ['A1.3'] },
  '12a': { cis: ['12.1'], cmmc: ['SI.L2-3.14.1'], iso: ['8.8', '8.20'], csf: ['PR.PS-02', 'PR.PS-03'], soc2: ['CC7.1'] },
  '12b': { cis: ['12.2', '12.3'], cmmc: ['SC.L2-3.13.1', 'SC.L2-3.13.5'], iso: ['8.20', '8.22'], csf: ['PR.IR-01'], soc2: ['CC6.1', 'CC6.6'] },
  '12c': { cis: ['12.4', '12.7'], cmmc: ['AC.L2-3.1.12', 'AC.L2-3.1.13'], iso: ['8.5', '8.20', '8.21'], csf: ['PR.AA-03', 'PR.IR-01', 'ID.AM-03'], soc2: ['CC6.6'] },
  '13a': { cis: ['13.1'], cmmc: ['AU.L2-3.3.5', 'SI.L2-3.14.6'], iso: ['8.16'], csf: ['DE.CM-01', 'DE.AE-03'], soc2: ['CC7.2', 'CC7.3'] },
  '13b': { cis: ['13.2', '13.3'], cmmc: ['SI.L2-3.14.6'], iso: ['8.16', '8.20'], csf: ['DE.CM-01'], soc2: ['CC7.2'] },
  '13c': { cis: ['13.1'], cmmc: ['SI.L2-3.14.7', 'IR.L2-3.6.1'], iso: ['5.25', '8.16'], csf: ['DE.CM-01', 'DE.AE-02'], soc2: ['CC7.3'] },
  '14a': { cis: ['14.1'], cmmc: ['AT.L2-3.2.1'], iso: ['6.3'], csf: ['PR.AT-01'], soc2: ['CC1.4', 'CC2.2'] },
  '14b': { cis: ['14.2', '14.4', '14.6'], cmmc: ['AT.L2-3.2.1', 'AT.L2-3.2.3'], iso: ['6.3', '6.8'], csf: ['PR.AT-01'], soc2: ['CC2.2'] },
  '14c': { cis: ['14.2', '14.9'], cmmc: ['AT.L2-3.2.2'], iso: ['6.3'], csf: ['PR.AT-01', 'PR.AT-02'], soc2: ['CC1.4', 'CC2.2'] },
  '15a': { cis: ['15.1'], iso: ['5.19'], csf: ['GV.SC-04', 'ID.AM-04'], soc2: ['CC9.2'] },
  '15b': { cis: ['15.2', '15.3', '15.4'], iso: ['5.19', '5.20'], csf: ['GV.SC-04', 'GV.SC-05'], soc2: ['CC9.2'] },
  '15c': { cis: ['15.5', '15.7'], iso: ['5.22'], csf: ['GV.SC-07', 'GV.SC-10'], soc2: ['CC9.2'] },
  '16a': { cis: ['16.1', '16.4'], cmmc: ['SC.L2-3.13.2'], iso: ['8.25', '8.28'], csf: ['PR.PS-06', 'ID.AM-02'], soc2: ['CC8.1'] },
  '16b': { cis: ['16.2', '16.6'], cmmc: ['SI.L2-3.14.1'], iso: ['8.8', '8.28'], csf: ['PR.PS-06', 'ID.RA-08'], soc2: ['CC7.1', 'CC8.1'] },
  '16c': { cis: ['16.12', '16.13'], cmmc: ['CA.L2-3.12.1'], iso: ['8.29'], csf: ['PR.PS-06', 'ID.IM-02'], soc2: ['CC4.1', 'CC8.1'] },
  '17a': { cis: ['17.1'], cmmc: ['IR.L2-3.6.1'], iso: ['5.24'], csf: ['GV.RR-02', 'ID.IM-04'], soc2: ['CC7.4'] },
  '17b': { cis: ['17.2', '17.3'], cmmc: ['IR.L2-3.6.2'], iso: ['5.5', '5.24', '6.8'], csf: ['RS.CO-02', 'RS.CO-03'], soc2: ['CC2.3', 'CC7.4'] },
  '17c': { cis: ['17.4', '17.7'], cmmc: ['IR.L2-3.6.1', 'IR.L2-3.6.3'], iso: ['5.24', '5.27'], csf: ['ID.IM-02', 'ID.IM-04'], soc2: ['CC7.4', 'CC7.5'] },
  '18a': { cis: ['18.1'], cmmc: ['CA.L2-3.12.1'], iso: ['8.8'], csf: ['ID.IM-02', 'ID.RA-01'], soc2: ['CC4.1'] },
  '18b': { cis: ['18.2'], cmmc: ['CA.L2-3.12.1', 'RA.L2-3.11.2'], iso: ['8.8'], csf: ['ID.IM-02', 'ID.RA-01'], soc2: ['CC4.1', 'CC7.1'] },
  '18c': { cis: ['18.3', '18.5'], cmmc: ['CA.L2-3.12.2', 'RA.L2-3.11.3'], iso: ['8.8'], csf: ['ID.IM-02'], soc2: ['CC4.1', 'CC4.2'] },
};

export type Status = 'met' | 'partial' | 'gap';

export interface CrosswalkItem {
  id: string;
  title: string;
  score: number;
  status: Status;
  /** CIS controls whose questions feed this item */
  cis: number[];
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
export function frameworkResult(key: FrameworkKey, answers: Answers, ig: IG, p: Profile = {}): FrameworkResult {
  const framework = frameworkByKey(key);
  const acc = new Map<string, { sum: number; n: number; cis: Set<number> }>();
  for (const c of controls) {
    for (const q of inScope(c, ig, p)) {
      for (const id of crosswalk[q.id]?.[key] ?? []) {
        const e = acc.get(id) ?? { sum: 0, n: 0, cis: new Set<number>() };
        e.sum += Math.max(0, answers[q.id] ?? 0);
        e.n += 1;
        e.cis.add(c.id);
        acc.set(id, e);
      }
    }
  }
  const items: CrosswalkItem[] = [...acc.entries()]
    .map(([id, e]) => {
      const score = Math.round((e.sum / (e.n * 4)) * 100);
      return { id, title: framework.ids[id] ?? id, score, status: statusOf(score), cis: [...e.cis].sort((a, b) => a - b) };
    })
    .sort((a, b) => idCompare(a.id, b.id));
  const counts = { met: 0, partial: 0, gap: 0 };
  for (const i of items) counts[i.status]++;
  const score = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length) : 0;
  return { framework, score, items, counts };
}

export const FRAMEWORK_KEYS = frameworks.map((f) => f.key);
