/**
 * Engagement kinds and assessment types. Each assessment type matches a card on
 * /assessments and sets the questions (see frameworks.ts), intake, starting
 * document requests and report wording for its engagements.
 */

export const engagementKinds = [{ id: 'assessment', name: 'Assessment' }] as const;
export type EngagementKind = (typeof engagementKinds)[number]['id'];

export interface IntakeField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  required?: boolean;
  help?: string;
  options?: string[];
}

export interface AssessmentTypeInfo {
  id: 'security' | 'vciso' | 'compliance' | 'cloud' | 'data' | 'ai';
  name: string;
  service: string;
  /** Default engagement title. */
  title: string;
  /** Report eyebrow, e.g. "Emruz · Cloud Readiness Assessment". */
  reportLabel: string;
  /** Sentence used in the report's scoring method, after "We rated each of the N". */
  ratedItems: string;
  limitations: string;
  /** Type-specific intake section. */
  intake: { title: string; fields: IntakeField[] };
  /** Documents requested from the client when the engagement is created. */
  documents: string[];
}

export const assessmentTypes: AssessmentTypeInfo[] = [
  {
    id: 'security',
    name: 'Security Assessment',
    service: 'Security & Compliance',
    title: 'Security Assessment (NIST CSF 2.0)',
    reportLabel: 'Security Assessment · NIST CSF 2.0',
    ratedItems: 'NIST CSF 2.0 subcategories',
    limitations:
      'It is not an audit or certification, and it does not guarantee that the organization is secure. Mappings to CIS, CMMC, ISO 27001 and SOC 2 are indicative.',
    intake: {
      title: 'Security environment',
      fields: [
        { key: 'identity', label: 'Identity provider', type: 'text', help: 'Entra ID, Okta, Google...' },
        { key: 'cloud', label: 'Cloud and SaaS platforms', type: 'textarea' },
        { key: 'endpoints', label: 'Endpoints (approx.)', type: 'number' },
        { key: 'servers', label: 'Servers (approx.)', type: 'number' },
        { key: 'security_tools', label: 'Security tools in place', type: 'textarea', help: 'EDR, SIEM, email security, MFA, backups...' },
        { key: 'it_model', label: 'IT operating model', type: 'select', options: ['In-house', 'Outsourced (MSP)', 'Hybrid'] },
        { key: 'incidents', label: 'Security incidents in the last 24 months', type: 'textarea' },
        { key: 'insurance', label: 'Cyber insurance requirements', type: 'textarea' },
      ],
    },
    documents: [
      'Information security policies and standards',
      'Network diagram and asset inventory (hardware, software, cloud)',
      'Identity and access management configuration (MFA, privileged accounts, access reviews)',
      'Endpoint, email and network security tool reports (EDR, SIEM, firewall)',
      'Vulnerability scan and penetration test reports from the last 12 months',
      'Backup configuration and the most recent restore test',
      'Incident response plan and any exercise reports',
      'Security awareness training completion records',
      'Vendor or third-party security assessments',
    ],
  },
  {
    id: 'vciso',
    name: 'vCISO Assessment',
    service: 'vCISO & Leadership',
    title: 'vCISO Assessment',
    reportLabel: 'vCISO Assessment · Security Leadership',
    ratedItems: 'security leadership practices',
    limitations:
      'It assesses how the security program is led and governed, not the technical effectiveness of individual controls.',
    intake: {
      title: 'Security program',
      fields: [
        { key: 'security_leader', label: 'Who leads security today', type: 'text', required: true, help: 'Name, title and reporting line.' },
        { key: 'security_team', label: 'Security team and outsourced services', type: 'textarea' },
        { key: 'security_budget', label: 'Annual security budget (approx.)', type: 'text' },
        { key: 'board_reporting', label: 'How security is reported to executives or the board', type: 'textarea' },
        { key: 'priorities', label: 'Leadership priorities for the next 12 months', type: 'textarea', required: true },
        { key: 'incidents', label: 'Security incidents in the last 24 months', type: 'textarea' },
      ],
    },
    documents: [
      'Security strategy and roadmap',
      'Organization chart showing security roles and reporting lines',
      'Security budget for the current and previous year',
      'Board or executive security reports from the last 12 months',
      'Risk register and risk appetite statement',
      'Information security policy set with approval dates',
      'Vendor risk management procedure and vendor inventory',
      'Incident response, business continuity and disaster recovery plans',
      'Security metrics or KPI reports',
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Assessment',
    service: 'GRC',
    title: 'Compliance Assessment',
    reportLabel: 'Compliance Assessment · GRC',
    ratedItems: 'governance, risk and compliance practices',
    limitations:
      'It is a readiness assessment, not an audit opinion or certification. Regulators, auditors and certification bodies make their own determinations.',
    intake: {
      title: 'Compliance program',
      fields: [
        { key: 'target_frameworks', label: 'Frameworks and regulations to assess against', type: 'textarea', required: true, help: 'SOC 2, ISO 27001, HIPAA, PCI DSS, CMMC, GDPR...' },
        { key: 'audit_dates', label: 'Upcoming audits or deadlines', type: 'textarea' },
        { key: 'grc_tools', label: 'GRC or compliance tools in use', type: 'text' },
        { key: 'compliance_owner', label: 'Compliance owner', type: 'text' },
        { key: 'regulated_data', label: 'Regulated data handled', type: 'textarea', help: 'PHI, cardholder data, CUI, personal data...' },
      ],
    },
    documents: [
      'Inventory of applicable regulations, standards and customer contract requirements',
      'Scope statement and system inventory for regulated data',
      'Policy and procedure library with approval dates',
      'Control matrix or framework mapping',
      'Most recent risk assessment and risk register',
      'Prior audit reports, findings and remediation status',
      'Vendor agreements for regulated data (BAA, DPA) and vendor assessments',
      'Records of processing and data retention schedule',
      'Sample evidence for key controls (access reviews, change tickets, training records)',
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud Readiness Assessment',
    service: 'Cloud',
    title: 'Cloud Readiness Assessment',
    reportLabel: 'Cloud Readiness Assessment',
    ratedItems: 'cloud readiness practices',
    limitations:
      'Cost and migration estimates are indicative and depend on final architecture, licensing and provider pricing.',
    intake: {
      title: 'Cloud environment',
      fields: [
        { key: 'cloud_goals', label: 'Business goals for cloud', type: 'textarea', required: true, help: 'Cost, agility, data center exit, resilience...' },
        { key: 'cloud_providers', label: 'Current and target cloud providers', type: 'text', help: 'Azure, AWS, Google Cloud...' },
        { key: 'workloads', label: 'Applications and workloads in scope', type: 'textarea', required: true },
        { key: 'data_centers', label: 'Data centers and hosting today', type: 'textarea' },
        { key: 'cloud_spend', label: 'Current cloud and hosting spend (approx.)', type: 'text' },
        { key: 'timeline', label: 'Target timeline', type: 'text' },
      ],
    },
    documents: [
      'Application and infrastructure inventory with dependencies',
      'Current architecture and network diagrams',
      'Cloud strategy or business case, if any',
      'Current hosting, licensing and cloud cost reports',
      'Cloud account or subscription structure and tagging standard',
      'Identity and access setup for cloud (SSO, roles, privileged access)',
      'Backup and disaster recovery plans with recovery objectives',
      'IT team structure and cloud skills or certifications',
    ],
  },
  {
    id: 'data',
    name: 'Data Analytics Discovery',
    service: 'Data Science',
    title: 'Data Analytics Discovery',
    reportLabel: 'Data Analytics Discovery',
    ratedItems: 'data and analytics practices',
    limitations:
      'Use case value estimates are indicative and depend on data quality and adoption confirmed during delivery.',
    intake: {
      title: 'Data landscape',
      fields: [
        { key: 'business_questions', label: 'Key business questions data should answer', type: 'textarea', required: true },
        { key: 'data_sources', label: 'Main data sources', type: 'textarea', required: true, help: 'ERP, CRM, finance, operations, spreadsheets...' },
        { key: 'data_platform', label: 'Data platform and BI tools', type: 'text', help: 'Warehouse, lakehouse, Power BI, Tableau...' },
        { key: 'data_team', label: 'Data and analytics team', type: 'textarea' },
        { key: 'pain_points', label: 'Current reporting pain points', type: 'textarea' },
      ],
    },
    documents: [
      'List of data sources with owners and refresh frequency',
      'Data platform and integration architecture diagram',
      'Sample of key reports and dashboards',
      'Data dictionary, business glossary or catalog',
      'Data quality issues log or known problems',
      'Data governance roles and policies (ownership, access, classification)',
      'Analytics use case backlog or wish list',
      'Data and analytics team structure',
    ],
  },
  {
    id: 'ai',
    name: 'AI Readiness Assessment',
    service: 'AI Advisory',
    title: 'AI Readiness Assessment',
    reportLabel: 'AI Readiness Assessment',
    ratedItems: 'AI readiness practices',
    limitations:
      'It assesses readiness to adopt AI and the controls around it. It does not test the accuracy or safety of specific AI models.',
    intake: {
      title: 'AI landscape',
      fields: [
        { key: 'ai_goals', label: 'Business goals for AI', type: 'textarea', required: true },
        { key: 'ai_in_use', label: 'AI tools and pilots in use today', type: 'textarea', help: 'Copilot, ChatGPT, custom models, vendor AI features...' },
        { key: 'ai_use_cases', label: 'Candidate use cases', type: 'textarea', required: true },
        { key: 'data_platform', label: 'Data platforms and content stores', type: 'text', help: 'Microsoft 365, SharePoint, data warehouse...' },
        { key: 'ai_policy', label: 'AI policy or governance in place', type: 'textarea' },
      ],
    },
    documents: [
      'AI strategy or goals, if any',
      'Inventory of AI tools, pilots and vendor AI features in use',
      'AI acceptable use policy',
      'Candidate AI use case list',
      'Data classification policy and sensitivity labels',
      'Permissions or oversharing reports for content stores (SharePoint, OneDrive, file shares)',
      'Data platform and integration architecture',
      'Vendor contracts or terms covering AI data use',
      'Training or adoption materials for AI tools',
    ],
  },
];

export type AssessmentType = AssessmentTypeInfo['id'];
export const assessmentTypeIds = assessmentTypes.map((t) => t.id);

export function isAssessmentType(v: unknown): v is AssessmentType {
  return typeof v === 'string' && (assessmentTypeIds as string[]).includes(v);
}

export function assessmentType(id: string | null | undefined): AssessmentTypeInfo {
  return assessmentTypes.find((t) => t.id === id) ?? assessmentTypes[0];
}

/* ---------- Intake ---------- */

const orgSection = {
  title: 'Organization',
  fields: [
    { key: 'overview', label: 'What the organization does', type: 'textarea', required: true },
    { key: 'employees', label: 'Employees', type: 'number', required: true },
    { key: 'locations', label: 'Locations', type: 'textarea', help: 'Offices, data centers, countries.' },
    { key: 'industry', label: 'Industry', type: 'text', required: true },
  ],
} satisfies { title: string; fields: IntakeField[] };

const scopeSection = {
  title: 'Scope',
  fields: [
    { key: 'in_scope', label: 'In scope', type: 'textarea', required: true, help: 'Business units, systems, environments.' },
    { key: 'out_of_scope', label: 'Out of scope', type: 'textarea', required: true },
    { key: 'crown_jewels', label: 'Most critical systems and data', type: 'textarea', required: true },
  ],
} satisfies { title: string; fields: IntakeField[] };

const historySection = {
  title: 'Obligations and history',
  fields: [
    { key: 'regulations', label: 'Regulations and frameworks', type: 'textarea', required: true, help: 'HIPAA, PCI DSS, CMMC, SOC 2, ISO 27001, state privacy laws...' },
    { key: 'prior_assessments', label: 'Prior assessments or audits', type: 'textarea' },
  ],
} satisfies { title: string; fields: IntakeField[] };

const engagementSection = {
  title: 'Engagement',
  fields: [
    { key: 'sponsor', label: 'Executive sponsor', type: 'text', required: true },
    { key: 'interviewees', label: 'People to interview', type: 'textarea', required: true },
    { key: 'method', label: 'Method', type: 'select', required: true, options: ['Remote', 'On-site', 'Hybrid'] },
    { key: 'constraints', label: 'Constraints and assumptions', type: 'textarea' },
  ],
} satisfies { title: string; fields: IntakeField[] };

export function intakeSectionsFor(type: string | null | undefined): { title: string; fields: IntakeField[] }[] {
  return [orgSection, scopeSection, assessmentType(type).intake, historySection, engagementSection];
}

/** Every intake field across all types, for labels on older reports. */
export const allIntakeFields: IntakeField[] = (() => {
  const m = new Map<string, IntakeField>();
  for (const t of assessmentTypes) for (const s of intakeSectionsFor(t.id)) for (const f of s.fields) if (!m.has(f.key)) m.set(f.key, f);
  return [...m.values()];
})();
