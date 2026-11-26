// Emruz kit packs and prices (#68). Prices must match the Stripe prices with
// lookup keys kits_<pack>_<plan> (see docs/emruz-kits-mcp.md).

export interface KitOffer {
  pack: string;
  name: string;
  summary: string;
  covers: string[];
  /** USD, whole dollars. lifetime: the founding lifetime offer (all-kits bundle only). */
  prices: { once: number; upgrade: number; month: number; year: number; lifetime?: number };
}

export const kitOffers: KitOffer[] = [
  {
    pack: 'release',
    name: 'Release Kit',
    summary: 'Check every release before it ships: tests, security, compliance and launch steps.',
    covers: ['Testing for web and desktop apps', 'Security reviews against industry frameworks', 'Legal, privacy and AI disclosure checks', 'Repo protections and launch readiness'],
    prices: { once: 79, upgrade: 29, month: 10, year: 99 },
  },
  {
    pack: 'founder',
    name: 'Founder Kit',
    summary: 'Validate a B2B business and price it, from a short survey to a business plan with a verdict.',
    covers: ['Ideal customer and buying committee', 'Competitor map with sources', 'Pricing, offer and pilot design', 'Unit economics and business plan'],
    prices: { once: 79, upgrade: 29, month: 10, year: 99 },
  },
  {
    pack: 'marketing',
    name: 'Marketing Kit',
    summary: "Build on-brand customer decks from a customer's own website, checked before they go out.",
    covers: ['Brand colors, fonts and logo from a website', 'Facts gathered into a claims register', 'Storyline, template and slides', 'Rendered QA before delivery'],
    prices: { once: 49, upgrade: 19, month: 6, year: 59 },
  },
  {
    pack: 'all',
    name: 'All kits',
    summary: 'Every Emruz kit in one purchase.',
    covers: ['Release, Founder and Marketing Kits', 'Less than buying each kit on its own'],
    prices: { once: 149, upgrade: 59, month: 19, year: 189, lifetime: 549 },
  },
];

/** The Release Kit leads /kits; the others are sold as add-ons, with the all-kits bundle after (#71). */
export const LEAD_PACK = 'release';
export const BUNDLE_PACK = 'all';

/**
 * Published results from customers outside Emruz (#71). The results section on /kits stays
 * hidden while this is empty. Add a result only once the customer has published it or
 * approved it in writing, with a link to where it is published. No placeholder claims.
 */
export interface KitResult {
  customer: string;
  pack: string;
  /** What changed for them, in their words or approved by them. */
  outcome: string;
  /** Where the customer published or approved it (https). */
  source: string;
}

export const kitResults: KitResult[] = [];
