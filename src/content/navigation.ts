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
  /** First link in the panel, for the group's own page */
  overview?: NavLink;
}

export const mainNav: NavGroup[] = [
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'vCISO & Leadership', href: '/services/vciso', description: 'Fractional security leadership and board reporting' },
      { label: 'GRC Program', href: '/services/grc', description: 'Compliance grounded in NIST, ISO, SOC 2 and CMMC' },
      { label: 'Security & Compliance', href: '/services/security', description: 'Security programs and operations' },
      { label: 'Cloud Strategy & Security', href: '/services/cloud', description: 'Secure, cost-effective cloud architecture' },
      { label: 'Data Science & Analytics', href: '/services/data-science', description: 'Threat hunting, anomaly detection, risk models' },
      { label: 'AI Advisory & Enablement', href: '/services/ai', description: 'AI strategy, governance and team enablement' },
      {
        label: 'Managed Security',
        href: '/products/compare',
        description: 'EDR, MDR, XDR, ΔDR and individual services. Powered by WhiteDog Cyber.',
        divider: true,
      },
    ],
    overview: { label: 'All services', href: '/services' },
  },
  { label: 'Motiv', href: '/motiv' },
  { label: 'Kits', href: '/kits' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
