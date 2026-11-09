import { NextResponse } from 'next/server';
import { isUuid, sameOrigin } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { SITE_URL } from '@/lib/server/config';
import { currentAccount } from '@/lib/server/session';
import { stripe } from '@/lib/server/stripe';

// Opens the Stripe Customer Portal (billing, receipts, cancel) for one of the
// signed-in account's subscriptions.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const account = await currentAccount();
  if (!account) return NextResponse.redirect(new URL('/signin?next=/motiv/account', SITE_URL), 303);
  const subId = String((await req.formData()).get('subscription') || '');
  if (!isUuid(subId)) return NextResponse.redirect(new URL('/motiv/account', SITE_URL), 303);
  const [row] = await db()<{ stripe_customer_id: string | null }[]>`
    select stripe_customer_id from subscriptions where id = ${subId} and account_id = ${account.id}`;
  if (!row?.stripe_customer_id) return NextResponse.redirect(new URL('/motiv/account', SITE_URL), 303);
  const portal = await stripe().billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${SITE_URL}/motiv/account`,
  });
  return NextResponse.redirect(portal.url, 303);
}
