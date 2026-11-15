// Revocation rules for Motiv licences. Pure functions with no database or Stripe
// imports, so they can be tested directly (tests/revocation.test.mts).

export const REVOKE_CATEGORIES = ['refund', 'chargeback', 'eula_misuse', 'admin_error'] as const;
export type RevokeCategory = (typeof REVOKE_CATEGORIES)[number];

export const REVOKE_LABELS: Record<RevokeCategory, string> = {
  refund: 'Refund issued',
  chargeback: 'Chargeback or payment reversed',
  eula_misuse: 'EULA misuse',
  admin_error: 'Admin error',
};

/** What a buyer sees on their account when a licence has ended. The admin note is never shown. */
export const REVOKE_CUSTOMER_TEXT: Record<RevokeCategory, string> = {
  refund: 'Ended because the payment was refunded.',
  chargeback: 'Ended because the payment was reversed.',
  eula_misuse: 'Ended for breach of the Motiv licence agreement (EULA).',
  admin_error: 'Ended in error. Contact us if you think this is a mistake.',
};

/** Lifetime leases never expire. This is the lease end date sent to the app. */
export const PERPETUAL_LEASE_EXPIRES = Date.UTC(2099, 11, 31, 23, 59, 59);

/**
 * Why a revocation is not allowed, or null if it is.
 *
 * - Monthly and annual subscriptions can always be revoked.
 * - A payment reversal (refund or chargeback) always ends a Lifetime licence.
 * - Misuse or admin error ends a Lifetime licence only while Motiv is supported.
 */
export function revocationProblem(
  plan: 'monthly' | 'annual' | 'lifetime',
  category: RevokeCategory,
  supportEndsAt: Date | null,
  now = Date.now(),
): string | null {
  if (plan !== 'lifetime') return null;
  if (category === 'refund' || category === 'chargeback') return null;
  const supported = !supportEndsAt || now < supportEndsAt.getTime();
  if (!supported) {
    return 'Motiv support has ended. A Lifetime licence can no longer be revoked for misuse or admin error.';
  }
  return null;
}

/**
 * A licence can be archived once it is no longer active: revoked, or cancelled with the paid period over.
 * Paid licences are archived, not deleted, so billing records are kept.
 */
export function canArchive(status: string, periodEnded: boolean): boolean {
  if (status === 'revoked') return true;
  return status === 'canceled' && periodEnded;
}

/** Complimentary licences can be deleted once revoked or cancelled. Paid licences are never deleted. */
export function canDelete(complimentary: boolean, status: string, periodEnded: boolean): boolean {
  return complimentary && canArchive(status, periodEnded);
}

/** Whether a stored revocation reason is one of the allowed categories. */
export function isRevokeCategory(value: unknown): value is RevokeCategory {
  return typeof value === 'string' && (REVOKE_CATEGORIES as readonly string[]).includes(value);
}
