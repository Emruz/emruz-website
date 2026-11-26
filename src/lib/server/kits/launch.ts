import 'server-only';
import { db } from '../db';
import { adminEmails } from '../config';
import { releaseTags } from './content';
import { isInternalEmail, launchReview, releaseCyclesSince, salesMetrics, type LaunchReview, type SalesMetrics } from './launch-core';
import { lifetimeOffer } from './sales';

/** Kits launch conditions (#71): sales outside Emruz against the kill lines, for /admin/kits. */
export async function launchReport(now = new Date()): Promise<{
  metrics: SalesMetrics;
  review: LaunchReview | null;
  launchDate: string | null;
  lifetime: { sold: number; cap: number; open: boolean };
  excluded: { email: string; note: string | null; added_by: string; added_at: Date }[];
}> {
  // Left out of the metrics on /admin/kits: staff, family, test accounts
  const excluded = await db()<{ email: string; note: string | null; added_by: string; added_at: Date }[]>`
    select email, note, added_by, added_at from kit_excluded_emails order by email`;
  // Subscriptions store monthly or annual (#71); for older ones the plan is in the kit_purchased audit entry,
  // and kind is the last fallback once that is purged
  const purchases = await db()<{ account_id: string; email: string; pack: string; plan: string | null; purchase_trigger: string | null; active: boolean }[]>`
    with bought as (
      select distinct on (detail->>'checkout') detail->>'checkout' as checkout, detail->>'plan' as plan
      from mcp_audit where kind = 'kit_purchased' and detail ? 'checkout'
    )
    select e.account_id, a.email, e.pack, coalesce(e.subscription_type,
      case b.plan when 'month' then 'monthly' when 'year' then 'annual' else b.plan end, e.kind) as plan, e.purchase_trigger, (e.revoked_at is null) as active
    from kit_entitlements e join accounts a on a.id = e.account_id
    left join bought b on b.checkout = e.stripe_checkout_session
    where e.source = 'purchase'`;
  // Accounts that have ever connected an MCP app (signed in over OAuth)
  const mcp = await db()<{ account_id: string; email: string }[]>`
    select distinct g.account_id, a.email from oauth_grants g join accounts a on a.id = g.account_id`;

  const leftOut = [...adminEmails(), ...excluded.map((e) => e.email)];
  const metrics = salesMetrics(
    purchases.map((p) => ({ accountId: p.account_id, email: p.email, pack: p.pack, plan: p.plan, trigger: p.purchase_trigger, active: p.active })),
    mcp.map((m) => ({ accountId: m.account_id, email: m.email })),
    (email) => isInternalEmail(email, leftOut),
  );
  // Set on /admin/kits (#71)
  const [setting] = await db()<{ value: string }[]>`select value from kit_settings where key = 'launch_date'`;
  const launchDate = setting?.value ?? null;
  const cycles = launchDate ? releaseCyclesSince(launchDate, await releaseTags()) : 0;
  const offer = await lifetimeOffer(now);
  return {
    metrics,
    review: launchReview(launchDate, metrics.payingAccounts, cycles, now),
    launchDate,
    lifetime: { sold: offer.sold, cap: offer.cap, open: offer.open },
    excluded,
  };
}
