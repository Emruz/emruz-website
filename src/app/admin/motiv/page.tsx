import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { systemChecks } from '@/lib/server/health';
import { customerSummaries, fmtDate } from '@/lib/server/queries';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { btn, input, Notice } from './ui';

export const metadata = { title: 'Motiv admin', robots: { index: false } };

export default async function MotivAdmin({ searchParams }: { searchParams: Promise<{ q?: string; msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv');
  if (!isAdmin(account)) notFound();
  const q = sp.q?.trim() || '';
  const customers = await customerSummaries(q);
  const [totals] = await db()<{ active: number; devices: number }[]>`
    select (select count(*)::int from subscriptions where status in ('active','past_due')) as active,
           (select count(*)::int from devices where deactivated_at is null) as devices`;
  const [support] = await db()<{ support_ends_at: Date | null; ended: boolean }[]>`
    select support_ends_at, (support_ends_at is not null and support_ends_at <= now()) as ended
    from motiv_support where id = 1`;
  const checks = await systemChecks();
  const supportEnds = support?.support_ends_at ?? null;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv' }]}
        title="Motiv"
        summary={`${totals.active} active licences · ${totals.devices} registered computers`}
        secondaryCta={{ label: 'Switch user', href: '/admin/users' }}
      />
      <section className="py-8">
        <Container>
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

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <form method="get" className="flex flex-1 gap-2 min-w-64">
              <label htmlFor="q" className="sr-only">Search customers</label>
              <input id="q" name="q" defaultValue={q} placeholder="Search by email" className={`${input} flex-1`} />
              <button className={btn}>Search</button>
            </form>
            <Link href="/admin/motiv/archive" className={btn}>Archive</Link>
            <Link href="/admin/motiv/grant" className={btn}>Grant a licence</Link>
          </div>

          {customers.length === 0 ? (
            <p className="text-gray-600">No customers found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Licences</th>
                    <th className="px-4 py-2 font-semibold">Active</th>
                    <th className="px-4 py-2 font-semibold">Revoked</th>
                    <th className="px-4 py-2 font-semibold">Latest purchase</th>
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
                      <td className="px-4 py-3 text-gray-600">{fmtDate(c.last_bought)}</td>
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
      </section>
    </>
  );
}
