export interface NavLink {
  label: string;
  href: string;
  description?: string;
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
      { label: 'GRC Program', href: '/services/grc', description: 'Compliance grounded in NIST, CIS and ISO' },
      { label: 'Security & Compliance', href: '/services/security', description: 'Security programs and operations' },
      { label: 'Cloud Strategy & Security', href: '/services/cloud', description: 'Secure, cost-effective cloud architecture' },
      { label: 'Data Science & Analytics', href: '/services/data-science', description: 'Threat hunting, anomaly detection, risk models' },
      { label: 'AI Advisory & Enablement', href: '/services/ai', description: 'AI strategy, governance and team enablement' },
      { label: 'Service Package Portfolio', href: '/services/packages', description: 'Managed security packages, EDR to DDR' },
    ],
    footer: { label: 'All services', href: '/services' },
  },
  {
    label: 'Products',
    href: '/products',
    children: [
      { label: 'Motiv', href: '/motiv', description: 'Private AI meeting assistant for Mac and Windows' },
    ],
    footer: { label: 'All products', href: '/products' },
  },
  { label: 'Assessments', href: '/assessments' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
