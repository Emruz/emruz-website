import 'server-only';
import type Stripe from 'stripe';
import { db } from '../db';
import { sendEmail } from '../email';
import { kits, SITE_URL } from '../config';
import { stripe } from '../stripe';
import { packTitle } from './content';
import { isRef } from './content-core';
import { oauthStore } from './store';
import { heldAtRelease, isKitPlan, isSubscriptionPlan, kindFor, lifetimeOpen, lookupKey, subscriptionEnded, type KitPlan } from './sales-core';

/** Emruz kit pack sales (#68): Stripe prices, checkout results, subscription ends and refunds. */

const PRICE_TTL_MS = 10 * 60 * 1000;
const priceCache = new Map<string, { id: string | null; at: number }>();

/** Active Stripe price for a pack and plan, found by lookup key (kits_<pack>_<plan>). */
export async function kitPriceId(pack: string, plan: KitPlan): Promise<string | null> {
  const key = lookupKey(pack, plan);
  const hit = priceCache.get(key);
  if (hit && Date.now() - hit.at < PRICE_TTL_MS) return hit.id;
  const list = await stripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const id = list.data[0]?.id ?? null;
  priceCache.set(key, { id, at: Date.now() });
  return id;
}

/** Founding lifetime offer: sold so far (refunded ones count, so the cap is never exceeded by refunds) and whether it is open. */
export async function lifetimeOffer(now = new Date()): Promise<{ open: boolean; sold: number; cap: number; until: string | null }> {
  const cap = kits.lifetimeCap;
  const until = kits.lifetimeUntil;
  if (!until) return { open: false, sold: 0, cap, until };
  const [r] = await db()<{ n: number }[]>`select count(*)::int as n from kit_entitlements where kind = 'lifetime' and source = 'purchase'`;
  return { open: lifetimeOpen(until, r.n, cap, now), sold: r.n, cap, until };
}

const sid = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id ?? null);

const PLAN_TEXT: Record<KitPlan, string> = {
  once: 'one-time purchase',
  upgrade: 'upgrade',
  month: 'monthly subscription',
  year: 'annual subscription',
  lifetime: 'founding lifetime license',
};

async function purchaseEmail(email: string, pack: string, plan: KitPlan, ref: string | null) {
  const access = ref
    ? `It includes the kits as of release ${ref}. You can upgrade to newer releases later at a lower price.`
    : plan === 'lifetime'
      ? 'It includes every new release for as long as Emruz offers the kits. If you also have a kit subscription, you can cancel it from your account page.'
      : 'It includes every new release while your subscription is active.';
  const text = [
    `Thanks for buying ${packTitle(pack)} (${PLAN_TEXT[plan]}).`,
    access,
    `To use it, connect Claude or another MCP app to ${SITE_URL}/api/mcp and sign in with this email. Your kits and connected apps are at ${SITE_URL}/motiv/account#kits.`,
    'Emruz',
  ].join('\n\n');
  try {
    await sendEmail(email, `Your ${packTitle(pack)} is ready`, text);
  } catch (e) {
    console.error('kits purchase email failed', e);
  }
}

/** checkout.session.completed for a kit purchase. The account and release were fixed when checkout started. */
export async function onKitCheckoutCompleted(session: Stripe.Checkout.Session) {
  const m = session.metadata ?? {};
  const pack = String(m.pack || '');
  const plan = m.plan;
  const accountId = session.client_reference_id;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(pack) || !isKitPlan(plan) || !accountId) throw new Error(`Kit checkout ${session.id} is missing its pack, plan or account`);
  if (session.payment_status === 'unpaid') return; // delayed methods are not offered; nothing to grant yet

  const subscription = isSubscriptionPlan(plan);
  const throughRef = heldAtRelease(plan) ? m.ref : null;
  if (heldAtRelease(plan) && !isRef(throughRef)) throw new Error(`Kit checkout ${session.id} has no release`);
  const subId = sid(session.subscription);
  if (subscription && subId) {
    const sub = await stripe().subscriptions.retrieve(subId);
    if (subscriptionEnded(sub.status)) return;
  }

  const rows = await db()<{ id: string }[]>`
    insert into kit_entitlements (account_id, pack, through_ref, source, kind, granted_by,
      stripe_checkout_session, stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id)
    values (${accountId}, ${pack}, ${throughRef ?? null}, 'purchase', ${kindFor(plan)}, 'stripe',
      ${session.id}, ${subscription ? null : sid(session.payment_intent)}, ${subId}, ${sid(session.customer)})
    on conflict (stripe_checkout_session) where stripe_checkout_session is not null do nothing
    returning id`;
  if (!rows.length) return; // already handled
  await oauthStore.audit('kit_purchased', { accountId, detail: { pack, plan, ref: throughRef ?? null, checkout: session.id } });
  const email = session.customer_details?.email || session.customer_email;
  if (email) await purchaseEmail(email, pack, plan, throughRef ?? null);
}

/** A kit subscription changed: access ends when Stripe ends the subscription. */
export async function onKitSubscriptionChanged(sub: Stripe.Subscription) {
  if (!subscriptionEnded(sub.status)) return;
  const ended = await db()<{ account_id: string; pack: string }[]>`
    update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${`subscription ${sub.status}`}
    where stripe_subscription_id = ${sub.id} and revoked_at is null returning account_id, pack`;
  for (const r of ended) await oauthStore.audit('kit_revoked', { accountId: r.account_id, detail: { pack: r.pack, reason: `subscription ${sub.status}`, by: 'stripe' } });
}

/**
 * A refund or lost dispute: end the kit access it paid for. Subscriptions are
 * cancelled in Stripe first, so no more charges are made. Returns how many were ended.
 */
export async function revokeKitsForPayment(paymentIntent: string | null, subscriptionId: string | null, category: 'refund' | 'chargeback'): Promise<number> {
  if (!paymentIntent && !subscriptionId) return 0;
  const rows = await db()<{ id: string; account_id: string; pack: string; kind: string | null; stripe_subscription_id: string | null }[]>`
    select id, account_id, pack, kind, stripe_subscription_id from kit_entitlements
    where revoked_at is null and (
      (${paymentIntent}::text is not null and stripe_payment_intent_id = ${paymentIntent})
      or (${subscriptionId}::text is not null and stripe_subscription_id = ${subscriptionId}))`;
  for (const r of rows) {
    if (r.stripe_subscription_id) {
      const sub = await stripe().subscriptions.retrieve(r.stripe_subscription_id);
      if (sub.status !== 'canceled') await stripe().subscriptions.cancel(r.stripe_subscription_id);
    }
    const reason = category === 'refund' ? 'refunded in Stripe' : 'disputed and lost in Stripe';
    await db()`update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${reason} where id = ${r.id} and revoked_at is null`;
    await oauthStore.audit('kit_revoked', { accountId: r.account_id, detail: { pack: r.pack, reason, by: 'stripe' } });
    if (r.kind === 'once') {
      // An upgrade builds on the purchase it upgrades; refunding that purchase ends the upgrades too
      const ups = await db()<{ id: string }[]>`
        update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${`${reason} (upgraded purchase)`}
        where account_id = ${r.account_id} and pack = ${r.pack} and kind = 'upgrade' and revoked_at is null returning id`;
      if (ups.length) await oauthStore.audit('kit_revoked', { accountId: r.account_id, detail: { pack: r.pack, reason: 'upgraded purchase reversed', count: ups.length, by: 'stripe' } });
    }
  }
  return rows.length;
}
