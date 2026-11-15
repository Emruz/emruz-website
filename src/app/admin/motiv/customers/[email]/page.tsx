import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { fmtDate, planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { btn, licenceTone, Notice, StatusPill } from '../../ui';

export const metadata = { title: 'Motiv customer', robots: { index: false } };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { email: raw } = await params;
  const sp = await searchParams;
  const email = decodeURIComponent(raw).toLowerCase();
  const account = await requireAccount(`/admin/motiv/customers/${raw}`);
  if (!isAdmin(account)) notFound();
  const licences = await subscriptionsFor({ email });
  if (licences.length === 0) notFound();

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv', href: '/admin/motiv' }, { label: email }]}
        title={email}
        summary={`${licences.length} licence${licences.length === 1 ? '' : 's'}`}
        secondaryCta={{ label: 'Grant another', href: `/admin/motiv/grant?email=${encodeURIComponent(email)}` }}
      />
      <section className="py-8">
        <Container>
          <Notice msg={sp.msg} />
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">Plan</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Renewal or end</th>
                  <th className="px-4 py-2 font-semibold">Computers</th>
                  <th className="px-4 py-2 font-semibold">Bought</th>
                  <th className="px-4 py-2 font-semibold"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {licences.map((s) => (
                  <tr key={s.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/motiv/licences/${s.id}`} className="font-semibold text-indigo-700 hover:underline">
                        {planLabel[s.plan]}
                      </Link>
                      {s.complimentary && <span className="ml-2 text-xs text-gray-500">complimentary</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={licenceTone(s.status, s.usable)}>{statusLabel(s)}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.plan === 'lifetime' ? 'Never expires' : fmtDate(s.period_end)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.devices.length}/{s.seats}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/motiv/licences/${s.id}`} className={btn}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
