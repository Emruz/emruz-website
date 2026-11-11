import { POWERED_BY } from './packages';

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
      { label: 'Managed Services', href: '/products/compare', description: 'All eleven editions side by side', divider: true },
      { label: 'EDR', href: '/products/edr', description: 'Endpoint detection & response, 3 editions', note: POWERED_BY, indent: true },
      { label: 'MDR', href: '/products/mdr', description: 'Managed detection & response, 24/7', note: POWERED_BY, indent: true },
      { label: 'XDR', href: '/products/xdr', description: 'Extended detection & response, 3 editions', note: POWERED_BY, indent: true },
      { label: 'ΔDR', href: '/products/ddr', description: 'Detect, defend & respond, 4 editions', note: POWERED_BY, indent: true },
      { label: 'Add-on services', href: '/products#add-ons', description: 'Close specific gaps on any edition', divider: true },
      { label: 'ZTI', href: '/products/zti', description: 'Identity posture, threat detection & response', note: POWERED_BY, indent: true },
      { label: 'PSA', href: '/products/psa', description: 'Phishing simulation & awareness training', note: POWERED_BY, indent: true },
      { label: 'DRM', href: '/products/drm', description: 'Data risk management & encryption', note: POWERED_BY, indent: true },
      { label: 'DSB', href: '/products/dsb', description: 'Microsoft 365 & Google Workspace backup', note: POWERED_BY, indent: true },
    ],
    footer: { label: 'All products', href: '/products' },
  },
  { label: 'Assessments', href: '/assessments' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
