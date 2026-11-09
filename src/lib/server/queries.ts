import 'server-only';
import { db } from './db';
import { entitlementProblem, type SubscriptionRow } from './licensing';

export interface DeviceRow {
  device_id: string;
  device_name: string | null;
  os: string | null;
  app_version: string | null;
  last_checkin: Date | null;
}

export interface SubscriptionView extends SubscriptionRow {
  stripe_customer_id: string | null;
  complimentary: boolean;
  revoke_reason: string | null;
  created_at: Date;
  devices: DeviceRow[];
  usable: boolean;
}

export async function subscriptionsFor(where: { accountId?: string; search?: string }): Promise<SubscriptionView[]> {
  const sql = db();
  const q = where.search?.trim().toLowerCase();
  const subs = where.accountId
    ? await sql<SubscriptionView[]>`select * from subscriptions where account_id = ${where.accountId} order by created_at desc`
    : await sql<SubscriptionView[]>`
        select s.* from subscriptions s left join accounts a on a.id = s.account_id
        where ${q ?? ''} = ''
          or lower(s.customer_email) like ${'%' + (q ?? '') + '%'}
          or lower(coalesce(a.email, '')) like ${'%' + (q ?? '') + '%'}
          or lower(replace(s.subscription_id, '-', '')) like ${'%' + (q ?? '').replace(/-/g, '') + '%'}
        order by s.created_at desc limit 50`;
  if (!subs.length) return [];
  const devices = await sql<(DeviceRow & { subscription_id: string })[]>`
    select subscription_id, device_id, device_name, os, app_version, last_checkin from devices
    where subscription_id in ${sql(subs.map((s) => s.id))} and deactivated_at is null
    order by last_checkin desc nulls last`;
  return subs.map((s) => ({
    ...s,
    devices: devices.filter((d) => d.subscription_id === s.id),
    usable: entitlementProblem(s) === null,
  }));
}

export const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const planLabel = { monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' } as const;

export function statusLabel(s: SubscriptionView): string {
  if (s.status === 'revoked') return 'Revoked';
  if (s.status === 'past_due') return 'Payment overdue';
  if (s.status === 'canceled') return s.usable ? `Canceled, active until ${fmtDate(s.period_end)}` : 'Canceled';
  if (!s.usable) return 'Expired';
  if (s.plan === 'lifetime') return 'Active';
  return s.cancel_at_period_end ? `Ends ${fmtDate(s.period_end)}` : `Renews ${fmtDate(s.period_end)}`;
}
