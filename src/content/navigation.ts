import { POWERED_BY } from './packages';

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  /** Small print under the description */
  note?: string;
}

export interface NavGroup {
  label: string;
  href: string;
  children?: NavLink[];
  footer?: NavLink;
}

export const mainNav: NavGroup[] = [
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'vCISO & Leadership', href: '/services/vciso', description: 'Fractional security leadership and board reporting' },
      { label: 'GRC Program', href: '/services/grc', description: 'Compliance grounded in NIST, CIS, ISO and CMMC' },
      { label: 'Security & Compliance', href: '/services/security', description: 'Security programs and operations' },
      { label: 'Cloud Strategy & Security', href: '/services/cloud', description: 'Secure, cost-effective cloud architecture' },
      { label: 'Data Science & Analytics', href: '/services/data-science', description: 'Threat hunting, anomaly detection, risk models' },
      { label: 'AI Advisory & Enablement', href: '/services/ai', description: 'AI strategy, governance and team enablement' },
    ],
    footer: { label: 'All services', href: '/services' },
  },
  {
    label: 'Products',
    href: '/products',
    children: [
      { label: 'EDR', href: '/products/edr', description: 'Endpoint detection & response, 3 editions', note: POWERED_BY },
      { label: 'MDR', href: '/products/mdr', description: 'Managed detection & response, 24/7', note: POWERED_BY },
      { label: 'XDR', href: '/products/xdr', description: 'Extended detection & response, 3 editions', note: POWERED_BY },
      { label: 'ΔDR', href: '/products/ddr', description: 'Detect, defend & respond, 4 editions', note: POWERED_BY },
      { label: 'Compare managed security', href: '/products/compare', description: 'All eleven editions side by side' },
      { label: 'Motiv', href: '/motiv', description: 'Private AI meeting assistant for Mac and Windows' },
    ],
    footer: { label: 'All products', href: '/products' },
  },
  { label: 'Assessments', href: '/assessments' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
