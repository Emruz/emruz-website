import 'server-only';
import type Stripe from 'stripe';
import { db } from '../db';
import { accountForEmail } from '../accounts';
import { securityEvent } from '../alerts';
import { sendEmail } from '../email';
import { kits, SITE_URL } from '../config';
import { siteSettings } from '../settings';
import { stripe } from '../stripe';
import { packTitle } from './content';
import { isRef } from './content-core';
import { isPurchaseTrigger } from './launch-core';
import { oauthStore } from './store';
import { heldAtRelease, isKitPlan, isSubscriptionPlan, kindFor, lifetimeOpen, lookupKey, subscriptionEnded, subscriptionType, type KitPlan } from './sales-core';

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
  const until = (await siteSettings()).kitsLifetimeUntil;
  if (!until) return { open: false, sold: 0, cap, until };
  const [r] = await db()<{ n: number }[]>`select count(*)::int as n from kit_entitlements where kind = 'lifetime' and source = 'purchase'`;
  return { open: lifetimeOpen(until, r.n, cap, now), sold: r.n, cap, until };
}

/** Audit without letting a logging failure fail the webhook after the change is saved. */
async function audit(kind: string, accountId: string, detail: Record<string, unknown>) {
  try {
    await oauthStore.audit(kind, { accountId, detail });
  } catch (e) {
    console.error(`kits audit ${kind} failed`, e);
  }
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
  const startedBy = session.client_reference_id;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(pack) || !isKitPlan(plan) || !startedBy) throw new Error(`Kit checkout ${session.id} is missing its pack, plan or account`);
  // A delayed payment method: granted when checkout.session.async_payment_succeeded arrives
  if (session.payment_status === 'unpaid') return;

  const subscription = isSubscriptionPlan(plan);
  const throughRef = heldAtRelease(plan) ? m.ref : null;
  if (heldAtRelease(plan) && !isRef(throughRef)) throw new Error(`Kit checkout ${session.id} has no release`);
  const subId = sid(session.subscription);
  if (subscription && subId) {
    const sub = await stripe().subscriptions.retrieve(subId);
    if (subscriptionEnded(sub.status)) return;
  }

  // The account that started checkout may have been merged into another since (a delayed payment
  // confirms days later); the checkout email then leads to the account that kept it (#68 review edge-1)
  const email = session.customer_details?.email || session.customer_email;
  const [still] = await db()<{ id: string }[]>`select id from accounts where id = ${startedBy}`;
  if (!still && !email) throw new Error(`Kit checkout ${session.id}: account gone and no email`);
  const accountId = still ? startedBy : await accountForEmail(email!);
  // Checkouts started before #71 have no trigger
  const trigger = isPurchaseTrigger(m.trigger) ? m.trigger : null;

  const rows = await db()<{ id: string }[]>`
    insert into kit_entitlements (account_id, pack, through_ref, source, kind, granted_by,
      stripe_checkout_session, stripe_payment_intent_id, stripe_subscription_id, stripe_customer_id, purchase_trigger, subscription_type)
    values (${accountId}, ${pack}, ${throughRef ?? null}, 'purchase', ${kindFor(plan)}, 'stripe',
      ${session.id}, ${subscription ? null : sid(session.payment_intent)}, ${subId}, ${sid(session.customer)}, ${trigger},
      ${subscription ? subscriptionType(plan) : null})
    on conflict (stripe_checkout_session) where stripe_checkout_session is not null do nothing
    returning id`;
  if (!rows.length) return; // already handled
  await audit('kit_purchased', accountId, { pack, plan, ref: throughRef ?? null, trigger, checkout: session.id, ...(still ? {} : { startedBy }) });
  if (plan === 'lifetime') {
    // The cap is checked when checkout starts; tell staff if concurrent checkouts went past it
    const offer = await lifetimeOffer();
    if (offer.sold > offer.cap) void securityEvent('kits_lifetime_over_cap', { sold: offer.sold, cap: offer.cap });
  }
  if (email) await purchaseEmail(email, pack, plan, throughRef ?? null);
}

/**
 * A kit subscription changed: access ends when Stripe ends it, and comes back if an unpaid one is paid.
 * Reads the subscription from Stripe, so events that arrive out of order act on its current state.
 */
export async function onKitSubscriptionChanged(event: Stripe.Subscription) {
  const sub = await stripe().subscriptions.retrieve(event.id);
  // A plan switch to another kit's price moves the entitlement to that kit (#68 review sens-2)
  const key = sub.items.data[0]?.price?.lookup_key ?? '';
  const price = /^kits_([a-z0-9][a-z0-9-]{0,39})_(month|year)$/.exec(key);
  const switched = price?.[1];
  // A switch between monthly and annual is kept too (#71)
  if (price) {
    const type = subscriptionType(price[2] as KitPlan);
    await db()`update kit_entitlements set subscription_type = ${type} where stripe_subscription_id = ${sub.id} and subscription_type is distinct from ${type}`;
  }
  if (switched) {
    const moved = await db()<{ account_id: string; pack: string }[]>`
      update kit_entitlements set pack = ${switched}
      where stripe_subscription_id = ${sub.id} and pack <> ${switched} returning account_id, pack`;
    for (const r of moved) await audit('kit_plan_changed', r.account_id, { pack: switched, by: 'stripe' });
  }
  if (sub.status === 'active' || sub.status === 'trialing') {
    const back = await db()<{ account_id: string; pack: string }[]>`
      update kit_entitlements set revoked_at = null, revoked_by = null, revoked_reason = null
      where stripe_subscription_id = ${sub.id} and revoked_at is not null and revoked_by = 'stripe' and revoked_reason = 'subscription unpaid'
      returning account_id, pack`;
    for (const r of back) await audit('kit_restored', r.account_id, { pack: r.pack, reason: 'subscription paid', by: 'stripe' });
    return;
  }
  if (!subscriptionEnded(sub.status)) return;
  const ended = await db()<{ account_id: string; pack: string }[]>`
    update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${`subscription ${sub.status}`}
    where stripe_subscription_id = ${sub.id} and revoked_at is null returning account_id, pack`;
  for (const r of ended) await audit('kit_revoked', r.account_id, { pack: r.pack, reason: `subscription ${sub.status}`, by: 'stripe' });
}

/**
 * A refund or lost dispute: end the kit access it paid for. Subscriptions are
 * cancelled in Stripe first, so no more charges are made. Returns how many were ended.
 */
export async function revokeKitsForPayment(paymentIntent: string | null, subscriptionId: string | null, category: 'refund' | 'chargeback'): Promise<number> {
  if (!paymentIntent && !subscriptionId) return 0;
  const rows = await db()<{ id: string; account_id: string; pack: string; kind: string | null; stripe_subscription_id: string | null; granted_at: Date }[]>`
    select id, account_id, pack, kind, stripe_subscription_id, granted_at from kit_entitlements
    where (revoked_at is null or (revoked_by = 'stripe' and revoked_reason = 'subscription unpaid')) and (
      (${paymentIntent}::text is not null and stripe_payment_intent_id = ${paymentIntent})
      or (${subscriptionId}::text is not null and stripe_subscription_id = ${subscriptionId}))`;
  for (const r of rows) {
    if (r.stripe_subscription_id) {
      const sub = await stripe().subscriptions.retrieve(r.stripe_subscription_id);
      if (sub.status !== 'canceled') await stripe().subscriptions.cancel(r.stripe_subscription_id);
    }
    const reason = category === 'refund' ? 'refunded in Stripe' : 'disputed and lost in Stripe';
    // Overwrites an unpaid revocation too, so a later payment cannot restore a refunded kit
    await db()`update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${reason} where id = ${r.id}`;
    await audit('kit_revoked', r.account_id, { pack: r.pack, reason, by: 'stripe' });
    if (r.kind === 'once') {
      // An upgrade builds on the purchase it upgrades; refunding that purchase ends the upgrades bought after it,
      // unless another one-time purchase of the pack is still active
      const ups = await db()<{ id: string }[]>`
        update kit_entitlements set revoked_at = now(), revoked_by = 'stripe', revoked_reason = ${`${reason} (upgraded purchase)`}
        where account_id = ${r.account_id} and pack = ${r.pack} and kind = 'upgrade' and revoked_at is null
          and granted_at > ${r.granted_at}
          and not exists (select 1 from kit_entitlements o where o.account_id = ${r.account_id} and o.pack = ${r.pack}
            and o.kind = 'once' and o.revoked_at is null)
        returning id`;
      if (ups.length) await audit('kit_revoked', r.account_id, { pack: r.pack, reason: 'upgraded purchase reversed', count: ups.length, by: 'stripe' });
    }
  }
  return rows.length;
}
