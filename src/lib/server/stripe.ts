import 'server-only';
import Stripe from 'stripe';
import { db, logEvent } from './db';
import { motiv, type Plan } from './config';
import { accountForEmail } from './accounts';
import { sendEmail } from './email';
import { sendMotivProEmail } from './motiv-emails';
import { newSubscriptionId } from './lease';
import { REVOKE_LABELS, type RevokeCategory } from './revocation';

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(key);
  }
  return client;
}

export function priceId(plan: Plan): string | undefined {
  return {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
    lifetime: process.env.STRIPE_PRICE_LIFETIME,
  }[plan];
}

const toDate = (unix: number | null | undefined) => (unix ? new Date(unix * 1000) : null);

/**
 * End of paid access. Current period end lives on the subscription items in
 * current API versions. A subscription canceled immediately keeps its original
 * period end in Stripe, so use ended_at when it is earlier.
 */
function periodEnd(sub: Stripe.Subscription): Date | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean) as number[];
  const end = ends.length ? Math.max(...ends) : null;
  if (sub.ended_at && (!end || sub.ended_at < end)) return toDate(sub.ended_at);
  return toDate(end);
}

function mapStatus(s: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' {
  if (s === 'active' || s === 'trialing') return 'active';
  if (s === 'past_due' || s === 'unpaid' || s === 'incomplete') return 'past_due';
  return 'canceled';
}

const id = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id ?? null);

async function welcomeEmail(email: string, subscriptionId: string, plan: Plan) {
  try {
    await sendMotivProEmail(email, subscriptionId, `Thanks for buying Motiv Pro (${plan}).`);
  } catch (e) {
    console.error('welcome email failed', e);
  }
}

// --- webhook handlers ---------------------------------------------------------

export async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.product !== 'motiv') return;
  const plan = session.metadata.plan as Plan;
  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error(`Checkout ${session.id} has no email`);

  const accountId = session.client_reference_id || (await accountForEmail(email, session.customer_details?.name));
  let status: 'active' | 'past_due' | 'canceled' = 'active';
  let end: Date | null = null;
  const stripeSub = id(session.subscription);
  if (stripeSub) {
    const sub = await stripe().subscriptions.retrieve(stripeSub);
    status = mapStatus(sub.status);
    end = periodEnd(sub);
  }

  const subscriptionId = newSubscriptionId();
  const rows = await db()<{ id: string }[]>`
    insert into subscriptions (subscription_id, account_id, customer_email, plan, status, period_end, seats,
      stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id, stripe_checkout_session)
    values (${subscriptionId}, ${accountId}, ${email.toLowerCase()}, ${plan}, ${status}, ${end}, ${motiv.defaultSeats},
      ${id(session.customer)}, ${stripeSub}, ${stripeSub ? null : id(session.payment_intent)}, ${session.id})
    on conflict (stripe_checkout_session) do nothing
    returning id`;
  if (!rows.length) return; // already handled
  await logEvent('purchased', { plan, checkout: session.id }, { subscriptionId: rows[0].id, accountId, actor: 'stripe' });
  await welcomeEmail(email, subscriptionId, plan);
}

export async function onSubscriptionChanged(sub: Stripe.Subscription) {
  const status = mapStatus(sub.status);
  await db()`
    update subscriptions set
      status = case when status = 'revoked' then status else ${status} end,
      period_end = ${periodEnd(sub)},
      cancel_at_period_end = ${sub.cancel_at_period_end},
      past_due_since = case when ${status} = 'past_due' then coalesce(past_due_since, now()) else null end
    where stripe_subscription_id = ${sub.id}`;
}

export async function onInvoicePaid(inv: Stripe.Invoice) {
  const subId = id(inv.parent?.subscription_details?.subscription);
  if (!subId) return;
  await onSubscriptionChanged(await stripe().subscriptions.retrieve(subId));
}

export async function onInvoiceFailed(inv: Stripe.Invoice) {
  const subId = id(inv.parent?.subscription_details?.subscription);
  if (!subId) return;
  await db()`
    update subscriptions set status = 'past_due', past_due_since = coalesce(past_due_since, now())
    where stripe_subscription_id = ${subId} and status = 'active'`;
}

// --- revocation -----------------------------------------------------------------

export interface RevocableRow {
  id: string;
  customer_email: string;
  plan: Plan;
  stripe_subscription_id: string | null;
}

/** Stop billing for a subscription. Throws if Stripe refuses, so the caller leaves the licence unchanged. */
async function cancelStripeSubscription(stripeSubId: string) {
  const sub = await stripe().subscriptions.retrieve(stripeSubId);
  if (sub.status === 'canceled') return;
  await stripe().subscriptions.cancel(stripeSubId);
}

const REVOKED_TEXT: Record<RevokeCategory, string> = {
  refund: 'Your Motiv Pro has ended because your payment was refunded.',
  chargeback: 'Your Motiv Pro has ended because your payment was reversed.',
  eula_misuse: 'Your Motiv Pro has been ended for breach of the Motiv licence agreement (EULA). No refund is due.',
  admin_error: 'Your Motiv Pro has been ended. If you think this is a mistake, reply to this email.',
};

async function revokedEmail(row: RevocableRow, category: RevokeCategory) {
  const billing = row.plan === 'lifetime' ? '' : '\n\nYour subscription has been cancelled, so you will not be charged again.';
  try {
    await sendEmail(row.customer_email, 'Your Motiv Pro has ended', `${REVOKED_TEXT[category]}${billing}\n\nEmruz`);
  } catch (e) {
    // The licence is already revoked; record the failed notice so it is not missed
    console.error('revoke email failed', e);
    await logEvent('notice_failed', { kind: 'revoked', error: e instanceof Error ? e.message : String(e) }, { subscriptionId: row.id, actor: 'system' });
  }
}

/**
 * Revoke a licence. Cancels its Stripe subscription first, so no more charges are made.
 * If Stripe refuses the cancellation, this throws and the licence is not revoked.
 */
export async function revokeLicence(row: RevocableRow, category: RevokeCategory, note: string, actor: string) {
  if (row.stripe_subscription_id) await cancelStripeSubscription(row.stripe_subscription_id);
  const reason = note ? `${REVOKE_LABELS[category]}: ${note}` : REVOKE_LABELS[category];
  await db()`
    update subscriptions set status = 'revoked', revoked_at = now(), revoke_reason = ${reason}, revoke_category = ${category}
    where id = ${row.id}`;
  await logEvent('revoked', { category, reason }, { subscriptionId: row.id, actor });
  await revokedEmail(row, category);
}

/**
 * A refund or lost dispute on a charge: find the licence it paid for and revoke it.
 * `other` handles purchases outside Motiv (Emruz kits, #68) and returns how many it ended.
 */
export async function revokeForCharge(
  chargeId: string,
  category: 'refund' | 'chargeback',
  other?: (paymentIntent: string | null, subscriptionId: string | null) => Promise<number>,
) {
  const charge = await stripe().charges.retrieve(chargeId);
  const paymentIntent = id(charge.payment_intent);
  let rows: RevocableRow[] = [];
  let subId: string | null = null;
  if (paymentIntent) {
    // Lifetime purchases store the payment intent on the subscription row
    rows = await db()<RevocableRow[]>`
      select id, customer_email, plan, stripe_subscription_id from subscriptions
      where stripe_payment_intent_id = ${paymentIntent} and status <> 'revoked'`;
    if (!rows.length) {
      // Subscription charges: the payment belongs to an invoice, and the invoice names the subscription
      const payments = await stripe().invoicePayments.list({ payment: { type: 'payment_intent', payment_intent: paymentIntent }, limit: 1 });
      const invoiceId = id(payments.data[0]?.invoice);
      if (invoiceId) {
        const invoice = await stripe().invoices.retrieve(invoiceId);
        subId = id(invoice.parent?.subscription_details?.subscription);
        if (subId) {
          rows = await db()<RevocableRow[]>`
            select id, customer_email, plan, stripe_subscription_id from subscriptions
            where stripe_subscription_id = ${subId} and status <> 'revoked'`;
        }
      }
    }
  }
  if (!rows.length) {
    if (other && (await other(paymentIntent, subId)) > 0) return;
    await logEvent('payment_reversed_review', { charge: chargeId, category }, { actor: 'stripe' });
    return;
  }
  const note = category === 'refund' ? 'refunded in Stripe' : 'disputed and lost in Stripe';
  for (const row of rows) await revokeLicence(row, category, note, 'stripe');
}
