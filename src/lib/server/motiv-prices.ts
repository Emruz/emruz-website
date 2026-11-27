// Motiv Pro prices (#87): found in Stripe by lookup key, like the kits prices.
// Pure functions; tests load this file directly.
import type { Plan } from './config';

/** Currency of every price on the site. */
export const CURRENCY = 'usd';

/** Stripe lookup key for a Motiv plan. Tag the price with it in each Stripe account. */
export const motivLookupKey = (plan: Plan) => `motiv_${plan}`;

/** The parts of a Stripe price the Motiv checks need. */
export interface PriceFacts {
  active: boolean;
  type: string;
  recurring: { interval: string; interval_count?: number } | null;
  currency: string;
  lookup_key?: string | null;
}

/**
 * What a Stripe price must be for a Motiv plan: active, in US dollars, not a kits price, and
 * recurring monthly or yearly or one time. Each plan may be its own Stripe product (#83):
 * Motiv purchases are recognised by checkout metadata, not by product.
 */
export function priceProblem(plan: Plan, p: PriceFacts): string | null {
  if (!p.active) return 'that price is archived in Stripe.';
  if (p.currency !== CURRENCY) return `the price must be in ${CURRENCY.toUpperCase()}, not ${p.currency.toUpperCase()}.`;
  if (p.lookup_key?.startsWith('kits_')) return 'that is an Emruz kits price, not a Motiv price.';
  if (plan === 'lifetime') return p.type === 'one_time' ? null : 'the lifetime price must be one time.';
  const want = plan === 'monthly' ? 'month' : 'year';
  if (p.type !== 'recurring' || p.recurring?.interval !== want || (p.recurring.interval_count ?? 1) !== 1) {
    return `the ${plan} price must recur every ${want}.`;
  }
  return null;
}
