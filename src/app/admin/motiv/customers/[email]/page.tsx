import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { fmtDate, planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { btn, licenceTone, Notice, ReauthBanner, StatusPill } from '../../ui';

export const metadata = { title: 'Motiv customer', robots: { index: false } };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const { email: raw } = await params;
  const sp = await searchParams;
  const email = decodeURIComponent(raw).toLowerCase();
  const account = await requireAccount(`/admin/motiv/customers/${raw}`);
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);
  const all = await subscriptionsFor({ email });
  if (all.length === 0) notFound();
  const licences = all.filter((s) => !s.archived_at);
  const archived = all.filter((s) => s.archived_at);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv', href: '/admin/motiv' }, { label: email }]}
        title={email}
        summary={`${licences.length} licence${licences.length === 1 ? '' : 's'}`}
        secondaryCta={{ label: 'Grant another', href: `/admin/motiv/grant?email=${encodeURIComponent(email)}` }}
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next={`/admin/motiv/customers/${raw}`} />}
          <Notice msg={sp.msg} error={sp.err === '1'} />
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
          {archived.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-semibold text-gray-900">Archived</h2>
              <ul className="space-y-2 text-sm">
                {archived.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 px-4 py-2">
                    <span className="text-gray-700">
                      {planLabel[s.plan]} · {statusLabel(s)} · bought {fmtDate(s.created_at)}
                    </span>
                    <Link href={`/admin/motiv/licences/${s.id}`} className={btn}>Open</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section></fieldset>
    </>
  );
}
