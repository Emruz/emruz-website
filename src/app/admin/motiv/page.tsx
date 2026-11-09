import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { systemChecks } from '@/lib/server/health';
import { fmtDate, planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { adminRemoveDevice, grant, reinstate, revoke, setSeats } from './actions';

export const metadata = { title: 'Motiv admin', robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; msg?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv');
  if (!isAdmin(account)) notFound();
  const q = sp.q?.trim() || '';
  const subs = await subscriptionsFor({ search: q });
  const events = subs.length
    ? await db()<{ subscription_id: string; at: Date; kind: string; actor: string | null; detail: Record<string, unknown> }[]>`
        select subscription_id, at, kind, actor, detail from events
        where subscription_id in ${db()(subs.map((s) => s.id))} order by at desc limit 200`
    : [];
  const [totals] = await db()<{ active: number; devices: number }[]>`
    select (select count(*)::int from subscriptions where status in ('active','past_due')) as active,
           (select count(*)::int from devices where deactivated_at is null) as devices`;

  const checks = await systemChecks();

  const input = 'px-3 py-2 border border-gray-300 rounded-md text-sm';
  const btn = 'px-3 py-2 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50';

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv' }]}
        title="Motiv admin"
        summary={`${totals.active} active subscriptions · ${totals.devices} registered computers`}
        secondaryCta={{ label: 'Switch user', href: '/admin/users' }}
      />
      <section className="py-8">
        <Container>
          {sp.msg && <p className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-900 text-sm">{sp.msg}</p>}

          <details className="mb-6 rounded-lg border border-gray-200" open={checks.some((c) => !c.ok && !c.name.includes('sign-in'))}>
            <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-900">
              System check {checks.every((c) => c.ok) ? '· all good' : `· ${checks.filter((c) => !c.ok).length} to fix`}
            </summary>
            <ul className="px-4 pb-4 space-y-1 text-sm">
              {checks.map((c) => (
                <li key={c.name} className="flex gap-2">
                  <span className={c.ok ? 'text-green-700' : 'text-red-700'}>{c.ok ? '✓' : '✗'}</span>
                  <span className="font-semibold text-gray-900 w-44 flex-shrink-0">{c.name}</span>
                  <span className="text-gray-600 break-all">{c.detail}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <form method="get" className="flex gap-2">
              <label htmlFor="q" className="sr-only">Search</label>
              <input id="q" name="q" defaultValue={q} placeholder="Email or subscription ID" className={`${input} flex-1`} />
              <button className={btn}>Search</button>
            </form>
            <form action={grant} className="flex flex-wrap gap-2 items-center">
              <input name="email" type="email" required placeholder="Email for a free subscription" className={`${input} flex-1 min-w-48`} />
              <select name="plan" className={input} defaultValue="annual">
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="lifetime">Lifetime</option>
              </select>
              <input name="months" type="number" min={1} max={60} defaultValue={12} className={`${input} w-20`} aria-label="Months" />
              <label className="text-sm flex items-center gap-1"><input type="checkbox" name="notify" defaultChecked /> Email it</label>
              <button className={btn}>Grant</button>
            </form>
          </div>

          {subs.length === 0 && <p className="text-gray-600">No subscriptions found.</p>}
          <div className="space-y-4">
            {subs.map((s) => (
              <article key={s.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    <span className="font-mono">{s.subscription_id}</span> · {planLabel[s.plan]}
                    {s.complimentary && ' · complimentary'}
                  </p>
                  <p className={`text-sm ${s.usable ? 'text-gray-600' : 'text-red-700'}`}>
                    {statusLabel(s)}
                    {s.revoke_reason && ` (${s.revoke_reason})`}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {s.customer_email} · bought {fmtDate(s.created_at)} · {s.devices.length}/{s.seats} computers
                  {s.stripe_customer_id && (
                    <>
                      {' · '}
                      <a className="text-indigo-700" href={`https://dashboard.stripe.com/customers/${s.stripe_customer_id}`} target="_blank" rel="noreferrer">
                        Stripe
                      </a>
                    </>
                  )}
                </p>

                {s.devices.length > 0 && (
                  <ul className="mt-2 text-sm">
                    {s.devices.map((d) => (
                      <li key={d.device_id} className="flex items-center gap-3 py-1">
                        <span className="text-gray-800">{d.device_name || 'Unnamed'}</span>
                        <span className="text-gray-400">{d.os} {d.app_version} · {fmtDate(d.last_checkin)}</span>
                        <form action={adminRemoveDevice}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="device" value={d.device_id} />
                          <input type="hidden" name="q" value={q} />
                          <button className="text-red-700 font-semibold">Remove</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {s.status === 'revoked' ? (
                    <form action={reinstate}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="q" value={q} />
                      <button className={btn}>Reinstate</button>
                    </form>
                  ) : (
                    <form action={revoke} className="flex gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="q" value={q} />
                      <input name="reason" placeholder="Reason" className={input} />
                      <button className={`${btn} text-red-700`}>Revoke</button>
                    </form>
                  )}
                  <form action={setSeats} className="flex gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="q" value={q} />
                    <input name="seats" type="number" min={1} max={50} defaultValue={s.seats} className={`${input} w-20`} aria-label="Seats" />
                    <button className={btn}>Set seats</button>
                  </form>
                </div>

                <details className="mt-3">
                  <summary className="text-sm text-gray-500 cursor-pointer">History</summary>
                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    {events
                      .filter((e) => e.subscription_id === s.id)
                      .map((e, i) => (
                        <li key={i}>
                          {new Date(e.at).toISOString().replace('T', ' ').slice(0, 16)} · {e.kind} · {e.actor}{' '}
                          {Object.keys(e.detail || {}).length ? JSON.stringify(e.detail) : ''}
                        </li>
                      ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Refunds: issue them in Stripe. Full refunds of lifetime purchases revoke automatically; for monthly or annual,
            cancel the subscription in Stripe (or revoke here).
          </p>
        </Container>
      </section>
    </>
  );
}
