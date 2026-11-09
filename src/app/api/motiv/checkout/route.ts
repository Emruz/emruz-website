import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/server/api';
import { motiv, PLANS, SITE_URL, type Plan } from '@/lib/server/config';
import { currentAccount } from '@/lib/server/session';
import { priceId, stripe } from '@/lib/server/stripe';

// Buy button on /motiv posts { plan } here; we redirect to Stripe Checkout.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const plan = String((await req.formData()).get('plan')) as Plan;
  const price = PLANS.includes(plan) ? priceId(plan) : undefined;
  if (!motiv.salesOpen || !price) return NextResponse.redirect(new URL('/motiv#plans', req.url), 303);

  const account = await currentAccount();
  const lifetime = plan === 'lifetime';
  const session = await stripe().checkout.sessions.create({
    mode: lifetime ? 'payment' : 'subscription',
    line_items: [{ price, quantity: 1 }],
    automatic_tax: { enabled: true },
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    ...(lifetime ? { customer_creation: 'always' as const } : {}),
    ...(account ? { client_reference_id: account.id, customer_email: account.email } : {}),
    metadata: { product: 'motiv', plan },
    ...(lifetime ? {} : { subscription_data: { metadata: { product: 'motiv', plan } } }),
    success_url: `${SITE_URL}/motiv/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/motiv#plans`,
  });
  return NextResponse.redirect(session.url!, 303);
}
