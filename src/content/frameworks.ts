/**
 * What each assessment type rates. Security uses NIST CSF 2.0; the other types
 * use Emruz question sets with the same shape (functions > categories > items),
 * so rating, evidence, flags and reports work the same for all of them.
 * Each item's examples are the evidence an assessor should look for.
 */
import { csfCategories, csfFunctions, csfSubcategories } from './csf';
import { assessmentType, type AssessmentType } from './engagement-types';

export interface FwFunction { id: string; title: string; text: string }
export interface FwCategory { id: string; fn: string; title: string; text: string }
export interface FwItem { id: string; category: string; fn: string; text: string; examples: string[] }

export interface Framework {
  type: AssessmentType;
  name: string;
  /** Word used for items in the UI and report. */
  itemLabel: string;
  /** Targets come from a target profile (Essential, Standard, Advanced) and ratings can be pre-filled from a self-assessment. */
  usesProfile: boolean;
  /** Has crosswalks to CMMC, ISO 27001 and SOC 2. */
  crosswalk: boolean;
  functions: FwFunction[];
  categories: FwCategory[];
  items: FwItem[];
  /** Labels for scores under 1.5, under 2.5, under 3.5, and the rest. */
  tiers: [string, string, string, string];
}

type Item = [string, string[]];
type Spec = { fn: [string, string, string]; cats: [string, string, string, Item[]][] }[];

function build(type: AssessmentType, name: string, spec: Spec): Framework {
  const functions: FwFunction[] = [];
  const categories: FwCategory[] = [];
  const items: FwItem[] = [];
  for (const f of spec) {
    const [fid, title, text] = f.fn;
    functions.push({ id: fid, title, text });
    for (const [cid, ctitle, ctext, its] of f.cats) {
      const catId = `${fid}.${cid}`;
      categories.push({ id: catId, fn: fid, title: ctitle, text: ctext });
      its.forEach(([t, ex], i) => items.push({ id: `${catId}-${String(i + 1).padStart(2, '0')}`, category: catId, fn: fid, text: t, examples: ex }));
    }
  }
  return {
    type,
    name,
    itemLabel: 'practice',
    usesProfile: false,
    crosswalk: false,
    functions,
    categories,
    items,
    tiers: ['Level 1: Initial', 'Level 2: Developing', 'Level 3: Defined', 'Level 4: Managed'],
  };
}

const security: Framework = {
  type: 'security',
  name: 'NIST CSF 2.0',
  itemLabel: 'subcategory',
  usesProfile: true,
  crosswalk: true,
  functions: csfFunctions,
  categories: csfCategories,
  items: csfSubcategories,
  tiers: ['Tier 1: Partial', 'Tier 2: Risk Informed', 'Tier 3: Repeatable', 'Tier 4: Adaptive'],
};

const vciso = build('vciso', 'Security Leadership', [
  { fn: ['SG', 'Strategy & Governance', 'Security strategy is tied to business goals and overseen by leadership'], cats: [
    ['ST', 'Security Strategy', 'A security strategy and roadmap support business objectives', [
      ['A documented security strategy is aligned to business objectives and risk appetite', ['Strategy document approved by executives', 'Link to the business plan']],
      ['A multi-year security roadmap is prioritized and funded', ['Roadmap with owners and dates', 'Budget tied to roadmap items']],
      ['Security budget is planned, tracked and benchmarked', ['Annual security budget', 'Spend vs plan reporting']],
    ]],
    ['GO', 'Governance & Oversight', 'Leadership and the board oversee security risk', [
      ['Security accountability sits with a named executive (CISO or equivalent)', ['Organization chart', 'Charter or job description']],
      ['A security steering committee meets regularly with business stakeholders', ['Committee charter', 'Meeting minutes']],
      ['Executives or the board receive regular security risk reporting', ['Board decks', 'Quarterly risk reports']],
    ]],
  ]},
  { fn: ['RM', 'Risk Management', 'Security risks are identified, assessed and treated'], cats: [
    ['RA', 'Risk Assessment', 'Security risk is assessed and recorded', [
      ['A security risk assessment is performed at least annually', ['Latest risk assessment report']],
      ['A risk register records owners, ratings and treatment decisions', ['Risk register', 'Risk acceptance records']],
      ['Risk appetite and tolerance are defined and approved', ['Risk appetite statement']],
    ]],
    ['TP', 'Third-Party Risk', 'Vendor and supplier risk is managed', [
      ['Vendors are tiered by risk and assessed before onboarding', ['Vendor inventory with tiers', 'Due diligence questionnaires']],
      ['Contracts include security and breach notification terms', ['Contract templates', 'Data processing agreements']],
    ]],
  ]},
  { fn: ['PP', 'Program & Policy', 'The security program has policies, architecture and controls'], cats: [
    ['PO', 'Policies & Standards', 'Policies are documented, approved and reviewed', [
      ['An information security policy set is approved and published', ['Policy library', 'Approval records']],
      ['Policies are reviewed at least annually and exceptions are tracked', ['Review log', 'Exception register']],
    ]],
    ['AR', 'Architecture & Controls', 'Security architecture and control coverage are planned', [
      ['A reference security architecture guides technology decisions', ['Architecture standards', 'Design review records']],
      ['Control coverage is mapped to a recognized framework', ['Control matrix', 'Framework mapping']],
      ['Security is part of project intake and change management', ['Security review step in project or change process']],
    ]],
  ]},
  { fn: ['PC', 'People & Culture', 'Roles, skills and awareness support security'], cats: [
    ['RR', 'Roles & Resourcing', 'Security roles are staffed and skilled', [
      ['Security roles and responsibilities are defined across IT and the business', ['RACI', 'Job descriptions']],
      ['Security staffing and outsourced services match program needs', ['Staffing plan', 'MSSP or MDR contracts']],
    ]],
    ['AW', 'Awareness & Culture', 'Staff understand and practice security', [
      ['Security awareness training runs for all staff with completion tracked', ['Training completion reports']],
      ['Phishing simulations and role-based training are run and measured', ['Simulation results', 'Role-based curricula']],
    ]],
  ]},
  { fn: ['OR', 'Operations & Resilience', 'Security operations and resilience are measured'], cats: [
    ['IR', 'Incident Readiness', 'The organization can respond to incidents', [
      ['An incident response plan is approved and assigns roles', ['Incident response plan', 'Contact and escalation list']],
      ['Tabletop exercises run at least annually and lessons are tracked', ['Exercise reports', 'Action items']],
    ]],
    ['BC', 'Continuity & Recovery', 'Critical services can be restored', [
      ['Business continuity and disaster recovery plans cover critical services', ['BCP and DR plans', 'Business impact analysis']],
      ['Recovery is tested against defined recovery objectives', ['Test results', 'RTO and RPO']],
    ]],
    ['MT', 'Metrics & Reporting', 'Security performance is measured', [
      ['Security KPIs and KRIs are defined and reported', ['Metrics dashboard', 'KRI thresholds']],
      ['Program maturity is reassessed and improvements are tracked', ['Maturity assessments', 'Improvement plan']],
    ]],
  ]},
]);

const compliance = build('compliance', 'Governance, Risk & Compliance', [
  { fn: ['OB', 'Obligations & Scope', 'Compliance obligations and scope are known'], cats: [
    ['IN', 'Obligations Inventory', 'Applicable laws, regulations and contracts are identified', [
      ['Applicable regulations, standards and contractual obligations are inventoried', ['Obligations register', 'Customer contract requirements']],
      ['Each obligation has an owner and is reviewed for changes', ['Owner assignments', 'Regulatory change log']],
    ]],
    ['SC', 'Scope', 'Systems, data and locations in scope are defined', [
      ['In-scope systems, data, locations and third parties are documented', ['Scope statement', 'System inventory']],
      ['Data flows for regulated data are mapped', ['Data flow diagrams']],
    ]],
  ]},
  { fn: ['PC', 'Policies & Controls', 'Policies and controls meet obligations'], cats: [
    ['PO', 'Policy Framework', 'Policies cover obligations and are maintained', [
      ['Policies and procedures address each applicable framework requirement', ['Policy-to-requirement mapping']],
      ['Policies are approved, communicated and acknowledged by staff', ['Approval records', 'Staff acknowledgements']],
    ]],
    ['CM', 'Control Mapping', 'Controls are mapped once and reused across frameworks', [
      ['A unified control set is mapped to all applicable frameworks', ['Common control framework', 'Crosswalk']],
      ['Each control has an owner, frequency and test procedure', ['Control matrix']],
      ['Control gaps are tracked to remediation with dates', ['Gap register', 'POA&M']],
    ]],
  ]},
  { fn: ['RK', 'Risk Management', 'Compliance and operational risks are managed'], cats: [
    ['RA', 'Risk Assessment', 'Risks are assessed and treated', [
      ['A formal risk assessment is performed at least annually', ['Risk assessment report']],
      ['Risk treatment and acceptance decisions are documented and approved', ['Risk register', 'Acceptance sign-offs']],
    ]],
    ['VR', 'Vendor Risk', 'Third parties meet compliance requirements', [
      ['Vendors handling regulated data are assessed and monitored', ['Vendor assessments', 'Reviewed SOC reports']],
      ['Required agreements (BAA, DPA, flow-down clauses) are in place', ['Executed agreements']],
    ]],
  ]},
  { fn: ['AU', 'Evidence & Audit', 'The organization is ready for audits'], cats: [
    ['EV', 'Evidence Management', 'Evidence is collected and retained', [
      ['Evidence for each control is collected on schedule and stored centrally', ['Evidence repository', 'Collection calendar']],
      ['Evidence collection is automated where practical', ['GRC tool integrations']],
    ]],
    ['AM', 'Audit Management', 'Audits and assessments are planned and closed out', [
      ['Internal audits or readiness assessments are performed before external audits', ['Internal audit reports']],
      ['Audit findings are tracked to closure with owners and dates', ['Findings tracker']],
    ]],
  ]},
  { fn: ['MP', 'Monitoring & Privacy', 'Compliance is monitored and personal data is protected'], cats: [
    ['CM', 'Continuous Monitoring', 'Control health is monitored between audits', [
      ['Key controls are monitored or tested periodically', ['Monitoring dashboards', 'Control test results']],
      ['Compliance status is reported to leadership', ['Compliance reports']],
    ]],
    ['PR', 'Privacy', 'Personal data is handled lawfully', [
      ['Personal data processing is inventoried with lawful basis and retention', ['Records of processing', 'Retention schedule']],
      ['Data subject requests and privacy incidents are handled within required timelines', ['Request log', 'Breach notification procedure']],
    ]],
  ]},
]);

const cloud = build('cloud', 'Cloud Readiness', [
  { fn: ['BU', 'Business', 'Cloud adoption is tied to business outcomes'], cats: [
    ['CS', 'Strategy & Business Case', 'Cloud goals and value are defined', [
      ['Cloud strategy and business drivers are documented and approved', ['Cloud strategy', 'Executive sponsor']],
      ['A business case quantifies cost, risk and benefit', ['TCO model', 'Business case']],
    ]],
    ['PF', 'Application Portfolio', 'Workloads are assessed for migration', [
      ['Applications and their dependencies are inventoried', ['CMDB', 'Dependency maps']],
      ['Each workload has a migration path (rehost, refactor, replace, retire or retain)', ['Disposition register']],
    ]],
  ]},
  { fn: ['PE', 'People', 'Teams have the skills and operating model for cloud'], cats: [
    ['SK', 'Skills', 'Staff can build and run cloud services', [
      ['Cloud skills gaps are assessed and a training plan exists', ['Skills matrix', 'Certifications']],
      ['Partners or managed services cover skills not in-house', ['Partner agreements']],
    ]],
    ['OM', 'Operating Model', 'Roles and processes support cloud', [
      ['A cloud center of excellence or platform team is defined', ['CCoE charter']],
      ['Roles for platform, security, finance and application teams are clear', ['RACI']],
    ]],
  ]},
  { fn: ['GO', 'Governance', 'Cloud use is governed for cost, risk and compliance'], cats: [
    ['FO', 'Cost Management', 'Cloud spend is visible and controlled', [
      ['Tagging and account structure allow cost allocation', ['Tagging standard', 'Cost reports by owner']],
      ['Budgets, alerts and optimization reviews are in place', ['Budget alerts', 'Rightsizing reviews']],
    ]],
    ['PL', 'Policy & Guardrails', 'Policies are enforced as guardrails', [
      ['Cloud policies are enforced with preventive guardrails', ['Policy as code', 'Azure Policy or AWS SCPs']],
      ['Compliance requirements for cloud workloads are mapped', ['Compliance mapping']],
    ]],
  ]},
  { fn: ['PL', 'Platform', 'The cloud foundation is ready for workloads'], cats: [
    ['LZ', 'Landing Zone', 'A secure, scalable foundation exists', [
      ['A landing zone defines accounts or subscriptions, networking and identity', ['Landing zone design', 'IaC repository']],
      ['Infrastructure is deployed as code through pipelines', ['Infrastructure as code', 'CI/CD pipelines']],
    ]],
    ['AR', 'Architecture', 'Workloads are designed for the cloud', [
      ['Reference architectures cover resilience, scale and performance', ['Architecture patterns', 'Well-Architected reviews']],
      ['Network connectivity and hybrid integration are designed', ['Network design', 'VPN or private connectivity']],
    ]],
  ]},
  { fn: ['SE', 'Security', 'Cloud workloads and data are protected'], cats: [
    ['ID', 'Identity & Access', 'Access to cloud is controlled', [
      ['Cloud access uses central identity with MFA and least privilege', ['SSO configuration', 'Role definitions']],
      ['Privileged access is time-bound and reviewed', ['Privileged identity management', 'Access reviews']],
    ]],
    ['DP', 'Data Protection & Detection', 'Data is protected and threats are detected', [
      ['Data is classified and encrypted at rest and in transit', ['Encryption settings', 'Key management']],
      ['Cloud posture and threats are monitored', ['CSPM findings', 'Cloud logs in the SIEM']],
    ]],
  ]},
  { fn: ['OP', 'Operations', 'Cloud services are run reliably'], cats: [
    ['MO', 'Monitoring & Management', 'Workloads are observed and managed', [
      ['Monitoring, logging and alerting cover cloud workloads', ['Observability tooling', 'Runbooks']],
      ['Patching, change and incident processes include cloud', ['Process documents', 'ITSM integration']],
    ]],
    ['BR', 'Backup & Recovery', 'Cloud workloads can be recovered', [
      ['Backups and disaster recovery are defined per workload and tested', ['Backup policies', 'DR test results']],
    ]],
  ]},
]);

const data = build('data', 'Data & Analytics', [
  { fn: ['SV', 'Strategy & Value', 'Data efforts are tied to business decisions'], cats: [
    ['OB', 'Objectives', 'Business questions and outcomes are defined', [
      ['Business objectives and the decisions data should support are documented', ['Data strategy', 'Stakeholder interviews']],
      ['An executive sponsor and data leadership are in place', ['Sponsor', 'Data leader role']],
    ]],
    ['UC', 'Use Cases', 'Analytics use cases are prioritized', [
      ['Analytics use cases are inventoried and prioritized by value and feasibility', ['Use case backlog']],
      ['Success measures are defined for analytics initiatives', ['KPIs', 'Value tracking']],
    ]],
  ]},
  { fn: ['SI', 'Sources & Integration', 'Data is available and connected'], cats: [
    ['IN', 'Source Inventory', 'Data sources are known', [
      ['Key data sources, owners and refresh rates are inventoried', ['Source catalog']],
      ['Critical data (customer, product, finance) has a system of record', ['Master data definitions']],
    ]],
    ['PI', 'Pipelines', 'Data moves reliably', [
      ['Data integration pipelines are automated and monitored', ['ETL or ELT jobs', 'Pipeline alerts']],
      ['Pipelines are version controlled and documented', ['Repository', 'Lineage']],
    ]],
  ]},
  { fn: ['QG', 'Quality & Governance', 'Data is trusted and controlled'], cats: [
    ['QU', 'Data Quality', 'Data quality is measured and managed', [
      ['Data quality rules are defined for critical data', ['Quality rules', 'Profiling results']],
      ['Quality issues are monitored and resolved by owners', ['Quality dashboard', 'Issue log']],
    ]],
    ['GO', 'Governance', 'Ownership, definitions and access are managed', [
      ['Data owners and stewards are assigned', ['Ownership matrix']],
      ['Business definitions are kept in a glossary or catalog', ['Business glossary', 'Data catalog']],
      ['Access to sensitive data is controlled and audited', ['Access policies', 'Classification']],
    ]],
  ]},
  { fn: ['AP', 'Architecture & Platform', 'The data platform supports current and future needs'], cats: [
    ['PL', 'Platform', 'Storage and compute fit the workload', [
      ['A central analytics platform (warehouse or lakehouse) is in place', ['Platform architecture']],
      ['The platform scales and its cost is monitored', ['Usage and cost reports']],
    ]],
  ]},
  { fn: ['AN', 'Analytics & Insight', 'Data is turned into decisions'], cats: [
    ['RP', 'Reporting & BI', 'Reporting is consistent and self-service', [
      ['Core business reporting is automated from governed data', ['Dashboards', 'Certified datasets']],
      ['Business users can explore data with self-service tools', ['BI tool adoption']],
    ]],
    ['AD', 'Advanced Analytics', 'Predictive and prescriptive analytics are used', [
      ['Statistical or predictive models support decisions', ['Models in use', 'Model documentation']],
      ['Model results are monitored and acted on', ['Model monitoring']],
    ]],
  ]},
  { fn: ['PL', 'People & Literacy', 'People can use data well'], cats: [
    ['SK', 'Skills & Literacy', 'Teams have data skills', [
      ['Data engineering and analytics roles are staffed', ['Team structure']],
      ['Data literacy training is offered to business users', ['Training program']],
    ]],
  ]},
]);

const ai = build('ai', 'AI Readiness', [
  { fn: ['SU', 'Strategy & Use Cases', 'AI efforts are tied to business value'], cats: [
    ['ST', 'Strategy', 'AI goals are defined and sponsored', [
      ['An AI strategy states goals, scope and executive sponsorship', ['AI strategy', 'Sponsor']],
      ['AI investment is prioritized and funded against business value', ['Funding model', 'Portfolio']],
    ]],
    ['UC', 'Use Cases', 'AI use cases are identified and prioritized', [
      ['AI use cases are inventoried and scored for value, feasibility and risk', ['Use case register']],
      ['Pilots have success criteria and a path to production', ['Pilot charters', 'Pilot results']],
    ]],
  ]},
  { fn: ['DR', 'Data Readiness', 'Data is fit for AI'], cats: [
    ['AV', 'Availability & Quality', 'The right data is accessible and trusted', [
      ['Data for priority use cases is identified, accessible and of known quality', ['Data assessments']],
      ['Documents and knowledge content are organized for retrieval', ['Content sources', 'Indexing']],
    ]],
    ['PR', 'Data Protection', 'Data used by AI is protected', [
      ['Sensitive data is classified and labeled before use with AI', ['Sensitivity labels', 'DLP policies']],
      ['Permissions are cleaned up so AI cannot surface overshared content', ['Access reviews', 'Oversharing reports']],
    ]],
  ]},
  { fn: ['TI', 'Technology & Infrastructure', 'Platforms support building and running AI'], cats: [
    ['PL', 'Platform', 'Approved AI platforms and tools exist', [
      ['Approved AI platforms, models and tools are selected and provisioned', ['Approved tools list', 'Platform architecture']],
      ['Integration with business systems is planned through APIs or connectors', ['Integration design']],
    ]],
    ['OP', 'Operations', 'AI systems are deployed and monitored', [
      ['AI systems are versioned, tested and deployed through a repeatable process', ['MLOps or LLMOps pipeline', 'Evaluation sets']],
      ['AI output quality, cost and usage are monitored in production', ['Monitoring dashboards']],
    ]],
  ]},
  { fn: ['PS', 'People & Skills', 'People are ready to adopt AI'], cats: [
    ['SK', 'Skills & Adoption', 'Staff can use and build AI', [
      ['AI skills are assessed and training is provided by role', ['Training plan', 'Completion records']],
      ['Change management supports adoption and measures usage', ['Adoption metrics', 'Champions network']],
    ]],
  ]},
  { fn: ['GR', 'Governance & Risk', 'AI is used responsibly and safely'], cats: [
    ['GV', 'Policy & Oversight', 'Policies and accountability for AI exist', [
      ['An AI acceptable use policy is approved and communicated', ['AI policy', 'Acknowledgements']],
      ['An AI governance group reviews and approves use cases', ['Charter', 'Approval records']],
    ]],
    ['RM', 'Risk Management', 'AI risks are identified and controlled', [
      ['AI systems are inventoried with risk ratings and owners', ['AI inventory']],
      ['Bias, accuracy, privacy, IP and security risks are assessed before deployment', ['Impact assessments', 'Red-team results']],
      ['Human oversight and incident handling are defined for AI systems', ['Oversight procedures', 'AI incident process']],
      ['AI vendors are assessed for data use and security', ['Vendor assessments', 'Contract terms']],
    ]],
  ]},
]);

export const frameworks: Record<AssessmentType, Framework> = { security, vciso, compliance, cloud, data, ai };

export function frameworkFor(type: string | null | undefined): Framework {
  return frameworks[assessmentType(type).id];
}

export function tierFor(fw: Framework, score: number | null) {
  if (score === null) return { tier: 0, label: 'Not rated' };
  const i = score < 1.5 ? 0 : score < 2.5 ? 1 : score < 3.5 ? 2 : 3;
  return { tier: i + 1, label: fw.tiers[i] };
}
