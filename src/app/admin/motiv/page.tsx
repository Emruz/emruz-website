import Link from 'next/link';
import LiveSearch from '@/components/LiveSearch';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { systemChecks } from '@/lib/server/health';
import { customerSummaries, fmtDate, unregisteredLicences } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { MoreHorizontal } from 'lucide-react';
import { resendWelcomeToCustomer, sendWelcomeToUnregistered } from './actions';
import { btn, Notice, ReauthBanner } from './ui';

export const metadata = { title: 'Motiv admin', robots: { index: false } };

export default async function MotivAdmin({ searchParams }: { searchParams: Promise<{ q?: string; msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv');
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);
  const q = sp.q?.trim() || '';
  const customers = await customerSummaries(q);
  const [totals] = await db()<{ active: number; devices: number }[]>`
    select (select count(*)::int from subscriptions where status in ('active','past_due')) as active,
           (select count(*)::int from devices where deactivated_at is null) as devices`;
  const [support] = await db()<{ support_ends_at: Date | null; ended: boolean }[]>`
    select support_ends_at, (support_ends_at is not null and support_ends_at <= now()) as ended
    from motiv_support where id = 1`;
  const checks = await systemChecks();
  const unregistered = await unregisteredLicences();
  const supportEnds = support?.support_ends_at ?? null;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv' }]}
        title="Motiv"
        summary={`${totals.active} active licences · ${totals.devices} registered computers`}
        secondaryCta={{ label: 'Switch user', href: '/admin/users' }}
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next={'/admin/motiv'} />}
          <Notice msg={sp.msg} error={sp.err === '1'} />

          <Link
            href="/admin/motiv/support"
            className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-indigo-600 bg-indigo-50 px-5 py-4 hover:bg-indigo-100"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Motiv support</p>
              <p className="text-lg font-bold text-gray-900">
                {!supportEnds ? 'Active' : support?.ended ? 'Ended' : `Ends ${fmtDate(supportEnds)}`}
              </p>
              <p className="text-sm text-gray-600">
                {supportEnds
                  ? 'Lifetime licences can be revoked for misuse until this date.'
                  : 'No end date set. Lifetime licences can be revoked for misuse.'}
              </p>
            </div>
            <span className="text-sm font-semibold text-indigo-800">Edit support dates →</span>
          </Link>

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

          {unregistered.length > 0 && (
            <form action={sendWelcomeToUnregistered} className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {unregistered.length} active {unregistered.length === 1 ? 'licence has' : 'licences have'} no computer registered yet
              </p>
              <p className="mt-1 text-gray-700">{unregistered.map((r) => r.customer_email).join(', ')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" name="confirm" /> Send each of them the welcome email with their subscription ID
                </label>
                <button className={btn} disabled={locked}>Send welcome emails</button>
              </div>
            </form>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <LiveSearch server placeholder="Search customers by email" className="flex-1 min-w-64" />
            <Link href="/admin/motiv/archive" className={btn}>Archive</Link>
            <Link href="/admin/motiv/grant" className={btn}>Grant a licence</Link>
            <Link href="/admin/settings" className={btn}>Site settings</Link>
          </div>

          {customers.length === 0 ? (
            <p className="text-gray-600">No customers found.</p>
          ) : (
            <div className="overflow-x-auto md:overflow-visible rounded-lg border border-gray-200">
              <table data-search-list className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Licences</th>
                    <th className="px-4 py-2 font-semibold">Active</th>
                    <th className="px-4 py-2 font-semibold">Revoked</th>
                    <th className="px-4 py-2 font-semibold">Computers</th>
                    <th className="px-4 py-2 font-semibold">Latest purchase</th>
                    <th className="px-2 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.email} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/motiv/customers/${encodeURIComponent(c.email)}`} className="font-semibold text-indigo-700 hover:underline">
                          {c.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{c.licences}</td>
                      <td className="px-4 py-3">{c.active}</td>
                      <td className="px-4 py-3">{c.revoked}</td>
                      <td className={`px-4 py-3 ${c.seats > 0 && c.computers === 0 ? 'text-amber-700 font-semibold' : ''}`}>
                        {c.computers}/{c.seats}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(c.last_bought)}</td>
                      <td data-search-ignore className="px-2 py-3 text-right">
                        <details className="relative inline-block text-left">
                          <summary
                            aria-label={`Actions for ${c.email}`}
                            className="list-none cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 [&::-webkit-details-marker]:hidden"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </summary>
                          <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {c.active > 0 && (
                              <form action={resendWelcomeToCustomer}>
                                <input type="hidden" name="email" value={c.email} />
                                <input type="hidden" name="return" value={q ? `/admin/motiv?q=${encodeURIComponent(q)}` : '/admin/motiv'} />
                                <button className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-50 disabled:text-gray-400">
                                  Resend welcome email with ID
                                </button>
                              </form>
                            )}
                            <Link href={`/admin/motiv/customers/${encodeURIComponent(c.email)}`} className="block px-4 py-2 text-gray-800 hover:bg-gray-50">
                              View customer
                            </Link>
                            <Link href={`/admin/motiv/grant?email=${encodeURIComponent(c.email)}`} className="block px-4 py-2 text-gray-800 hover:bg-gray-50">
                              Grant another licence
                            </Link>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-500">
            Refunds: issue them in Stripe. A refund or lost chargeback ends the licence and cancels billing automatically.
            Revoking for EULA misuse does not refund anything.
          </p>
        </Container>
      </section></fieldset>
    </>
  );
}
