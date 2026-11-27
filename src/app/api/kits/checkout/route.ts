import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { rateLimitCheck } from '@/lib/server/db';
import { SITE_URL } from '@/lib/server/config';
import { currentBundle } from '@/lib/server/kits/content';
import { canBuy, isKitPlan, isSubscriptionPlan, type KitPlan } from '@/lib/server/kits/sales-core';
import { parseOffer, triggerField } from '@/lib/server/kits/launch-core';
import { kitPriceId, lifetimeOffer } from '@/lib/server/kits/sales';
import { entitlementsFor } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';
import { siteSettings } from '@/lib/server/settings';
import { stripe } from '@/lib/server/stripe';

const back = (q = '') => NextResponse.redirect(new URL(`/kits${q}#pricing`, SITE_URL), 303);

// Buy buttons on /kits post { offer: pack:plan } here; we redirect to Stripe Checkout (#68, #71).
// Stripe Checkout asks what made them buy now (#86).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  if (!(await siteSettings()).kitsSalesOpen) return back();
  const form = await req.formData();
  const { pack, plan } = parseOffer(String(form.get('offer') || ''), String(form.get('pack') || ''), String(form.get('plan') || ''));
  if (!isKitPlan(plan)) return back();

  // Kits are used through the account's MCP sign-in, so a purchase belongs to an account
  const account = await currentAccount();
  if (!account) return NextResponse.redirect(new URL('/signin?next=%2Fkits%23pricing', SITE_URL), 303);
  // Staff viewing as a customer cannot buy for them
  if (account.impersonatedBy) return back('?notice=impersonating');
  // Each attempt creates a Stripe Checkout session
  if (!(await rateLimitCheck(`kits-checkout:${account.id}`, 20, 3600)).ok) return back('?notice=unavailable');

  try {
    return await startCheckout(account, pack, plan);
  } catch (e) {
    console.error('kits checkout failed', e);
    return back('?notice=unavailable');
  }
}

async function startCheckout(account: { id: string; email: string }, pack: string, plan: KitPlan) {
  const bundle = await currentBundle();
  const lifetime = plan === 'lifetime' && (await lifetimeOffer()).open;
  const check = canBuy(pack, plan, await entitlementsFor(account.id), bundle.ref, bundle.manifest.packs, lifetime);
  if (!check.ok) return back(`?notice=${check.reason}`);
  const price = await kitPriceId(pack, plan);
  if (!price) return back('?notice=unavailable');

  const subscription = isSubscriptionPlan(plan);
  // The release is fixed here, so the buyer gets the release shown when they paid
  const metadata = { product: 'kits', pack, plan, ref: bundle.ref };
  const session = await stripe().checkout.sessions.create({
    mode: subscription ? 'subscription' : 'payment',
    line_items: [{ price, quantity: 1 }],
    // Stripe Tax can't be activated in a sandbox; turn sales tax off on /admin/settings there
    automatic_tax: { enabled: (await siteSettings()).stripeAutomaticTax },
    billing_address_collection: 'auto',
    // Required: what made them buy now (#86)
    custom_fields: [triggerField()],
    allow_promotion_codes: plan !== 'upgrade' && plan !== 'lifetime',
    ...(subscription ? { subscription_data: { metadata } } : { customer_creation: 'always' as const }),
    // Eligibility and the lifetime cap are checked when checkout starts; a short session keeps
    // late completions few. Stripe needs at least 30 minutes, measured when it receives the request
    expires_at: Math.floor(Date.now() / 1000) + (plan === 'lifetime' ? 35 : 60) * 60,
    client_reference_id: account.id,
    customer_email: account.email,
    metadata,
    success_url: `${SITE_URL}/kits/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/kits#pricing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
