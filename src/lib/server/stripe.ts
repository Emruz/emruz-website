import 'server-only';
import { MOTIV_DOWNLOAD_URL } from '@/content/products';
import Stripe from 'stripe';
import { db, logEvent } from './db';
import { motiv, SITE_URL, type Plan } from './config';
import { accountForEmail } from './accounts';
import { sendEmail } from './email';
import { newSubscriptionId } from './lease';

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

/** Current period end lives on the subscription items in current API versions. */
function periodEnd(sub: Stripe.Subscription): Date | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean) as number[];
  return ends.length ? toDate(Math.max(...ends)) : null;
}

function mapStatus(s: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' {
  if (s === 'active' || s === 'trialing') return 'active';
  if (s === 'past_due' || s === 'unpaid' || s === 'incomplete') return 'past_due';
  return 'canceled';
}

const id = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id ?? null);

async function welcomeEmail(email: string, subscriptionId: string, plan: Plan) {
  const text = `Thanks for buying Motiv Premium (${plan}).

Your subscription ID: ${subscriptionId}

Download Motiv: ${MOTIV_DOWNLOAD_URL}

To unlock Premium, open Motiv > Settings > Premium and choose "Register this computer", then sign in at ${SITE_URL}/activate with this email address and enter the code Motiv shows. You can also paste the subscription ID instead.

Manage your subscription, computers and receipts at ${SITE_URL}/motiv/account

Emruz`;
  try {
    await sendEmail(email, 'Your Motiv Premium subscription', text);
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

/** Full refunds and lost disputes revoke a lifetime purchase. Subscription refunds are reviewed in admin. */
export async function onPaymentReversed(paymentIntent: string | null, reason: string) {
  if (!paymentIntent) return;
  const rows = await db()<{ id: string }[]>`
    update subscriptions set status = 'revoked', revoked_at = now(), revoke_reason = ${reason}
    where stripe_payment_intent_id = ${paymentIntent} and status <> 'revoked'
    returning id`;
  for (const r of rows) await logEvent('revoked', { reason }, { subscriptionId: r.id, actor: 'stripe' });
  if (!rows.length) await logEvent('payment_reversed_review', { payment_intent: paymentIntent, reason }, { actor: 'stripe' });
}
