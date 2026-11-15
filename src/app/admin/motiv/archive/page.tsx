import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { archivedLicences, fmtDate, planLabel } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { btn, input, Notice, ReauthBanner } from '../ui';

export const metadata = { title: 'Motiv archive', robots: { index: false } };

const statusText = { active: 'Active', past_due: 'Payment overdue', canceled: 'Cancelled', revoked: 'Revoked' } as const;

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ q?: string; msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv/archive');
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);
  const q = sp.q?.trim() || '';
  const rows = await archivedLicences(q);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv', href: '/admin/motiv' }, { label: 'Archive' }]}
        title="Archived licences"
        summary={`${rows.length} shown · hidden from the lists, kept for records`}
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next={'/admin/motiv/archive'} />}
          <Notice msg={sp.msg} error={sp.err === '1'} />

          <form method="get" className="mb-6 flex gap-2 max-w-xl">
            <label htmlFor="q" className="sr-only">Search archived licences</label>
            <input id="q" name="q" defaultValue={q} placeholder="Search by email" className={`${input} flex-1`} />
            <button className={btn}>Search</button>
          </form>

          {rows.length === 0 ? (
            <p className="text-gray-600">No archived licences{q ? ' match that search' : ''}.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Plan</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Reason</th>
                    <th className="px-4 py-2 font-semibold">Archived</th>
                    <th className="px-4 py-2 font-semibold"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/motiv/customers/${encodeURIComponent(r.customer_email)}`} className="text-indigo-700 hover:underline">
                          {r.customer_email}
                        </Link>
                        {r.complimentary && <span className="ml-2 text-xs text-gray-500">complimentary</span>}
                      </td>
                      <td className="px-4 py-3">{planLabel[r.plan]}</td>
                      <td className="px-4 py-3">{statusText[r.status]}</td>
                      <td className="px-4 py-3 text-gray-600">{r.revoke_reason ?? ''}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(r.archived_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/motiv/licences/${r.id}`} className={btn}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section></fieldset>
    </>
  );
}
