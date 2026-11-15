export interface NavLink {
  label: string;
  href: string;
  description?: string;
  /** Small print under the description */
  note?: string;
  /** Draw a divider line above this item */
  divider?: boolean;
  /** Show as a sub-item of the entry above */
  indent?: boolean;
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
      { label: 'Motiv', href: '/motiv', description: 'Private AI meeting assistant for Mac and Windows' },
      { label: 'Managed Security', href: '/products', description: 'EDR, MDR, XDR, ΔDR and add-on services. Powered by WhiteDog Cyber.' },
    ],
    footer: { label: 'All products', href: '/products' },
  },
  { label: 'Assessments', href: '/assessments' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
