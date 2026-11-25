import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { rateLimitCheck } from '@/lib/server/db';
import { kits, SITE_URL } from '@/lib/server/config';
import { currentBundle } from '@/lib/server/kits/content';
import { canBuy, isKitPlan, isSubscriptionPlan } from '@/lib/server/kits/sales-core';
import { kitPriceId, lifetimeOffer } from '@/lib/server/kits/sales';
import { entitlementsFor } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';
import { stripe } from '@/lib/server/stripe';

const back = (q = '') => NextResponse.redirect(new URL(`/kits${q}#pricing`, SITE_URL), 303);

// Buy buttons on /kits post { pack, plan } here; we redirect to Stripe Checkout (#68).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  if (!kits.salesOpen) return back();
  const form = await req.formData();
  const pack = String(form.get('pack') || '');
  const plan = String(form.get('plan') || '');
  if (!isKitPlan(plan)) return back();

  // Kits are used through the account's MCP sign-in, so a purchase belongs to an account
  const account = await currentAccount();
  if (!account) return NextResponse.redirect(new URL('/signin?next=%2Fkits%23pricing', SITE_URL), 303);
  // Each attempt creates a Stripe Checkout session
  if (!(await rateLimitCheck(`kits-checkout:${account.id}`, 20, 3600)).ok) return back('?notice=unavailable');

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
    // Stripe Tax can't be activated in a sandbox; set STRIPE_AUTOMATIC_TAX=false there
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX !== 'false' },
    billing_address_collection: 'auto',
    allow_promotion_codes: plan !== 'upgrade' && plan !== 'lifetime',
    ...(subscription ? { subscription_data: { metadata } } : { customer_creation: 'always' as const }),
    // The lifetime cap is checked when checkout starts; a short session keeps late completions few
    ...(plan === 'lifetime' ? { expires_at: Math.floor(Date.now() / 1000) + 30 * 60 } : {}),
    client_reference_id: account.id,
    customer_email: account.email,
    metadata,
    success_url: `${SITE_URL}/kits/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/kits#pricing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
