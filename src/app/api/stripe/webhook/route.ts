import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db } from '@/lib/server/db';
import {
  stripe,
  onCheckoutCompleted,
  onInvoiceFailed,
  onInvoicePaid,
  onSubscriptionChanged,
  revokeForCharge,
} from '@/lib/server/stripe';
import { securityEvent } from '@/lib/server/alerts';
import { onKitCheckoutCompleted, onKitSubscriptionChanged, revokeKitsForPayment } from '@/lib/server/kits/sales';

const pi = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id ?? null);

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse('Webhook not configured', { status: 500 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get('stripe-signature') || '', secret);
  } catch {
    await securityEvent('webhook_bad_signature', {});
    return new NextResponse('Bad signature', { status: 400 });
  }

  // Each event is handled once
  const fresh = await db()`insert into stripe_events (id, type) values (${event.id}, ${event.type}) on conflict do nothing returning id`;
  if (!fresh.length) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (event.data.object.metadata?.product === 'kits') await onKitCheckoutCompleted(event.data.object);
        else await onCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await onInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await onInvoiceFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        if (event.data.object.metadata?.product === 'kits') await onKitSubscriptionChanged(event.data.object);
        else await onSubscriptionChanged(event.data.object);
        break;
      case 'charge.refunded': {
        const charge = event.data.object;
        if (charge.refunded) await revokeForCharge(charge.id, 'refund', (p, s) => revokeKitsForPayment(p, s, 'refund'));
        break;
      }
      case 'charge.dispute.closed': {
        const dispute = event.data.object;
        if (dispute.status === 'lost') {
          const chargeId = pi(dispute.charge);
          if (!chargeId) throw new Error(`Dispute ${dispute.id} has no charge`);
          await revokeForCharge(chargeId, 'chargeback', (p, s) => revokeKitsForPayment(p, s, 'chargeback'));
        }
        break;
      }
    }
  } catch (e) {
    // Let Stripe retry
    await db()`delete from stripe_events where id = ${event.id}`;
    console.error(`stripe ${event.type} failed`, e);
    await securityEvent('webhook_failure', { type: event.type, id: event.id, error: e instanceof Error ? e.message : String(e) });
    return new NextResponse('Handler failed', { status: 500 });
  }
  return NextResponse.json({ received: true });
}
