import { NextResponse } from 'next/server';
import { isUuid, sameOrigin } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { SITE_URL } from '@/lib/server/config';
import { currentAccount } from '@/lib/server/session';
import { stripe } from '@/lib/server/stripe';

// Opens the Stripe Customer Portal (billing, receipts, cancel) for one of the
// signed-in account's kit subscriptions (#68).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse('Forbidden', { status: 403 });
  const account = await currentAccount();
  if (!account) return NextResponse.redirect(new URL('/signin?next=%2Fmotiv%2Faccount%23kits', SITE_URL), 303);
  const id = String((await req.formData()).get('entitlement') || '');
  const home = NextResponse.redirect(new URL('/motiv/account#kits', SITE_URL), 303);
  if (!isUuid(id) || account.impersonatedBy) return home;
  const [row] = await db()<{ stripe_customer_id: string | null }[]>`
    select stripe_customer_id from kit_entitlements where id = ${id} and account_id = ${account.id}`;
  if (!row?.stripe_customer_id) return home;
  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${SITE_URL}/motiv/account#kits`,
    });
    return NextResponse.redirect(portal.url, 303);
  } catch (e) {
    console.error('kits billing portal failed', e);
    return home;
  }
}
