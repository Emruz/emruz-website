import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { requireAccount } from '@/lib/server/session';
import { statusLabel, type EngagementStatus } from '@/content/workbench';

export const metadata = { title: 'Client portal', robots: { index: false } };

export default async function Portal() {
  const account = await requireAccount('/portal');
  const rows = await db()<{ id: string; title: string; client: string; status: EngagementStatus; open_requests: number; reports: number }[]>`
    select e.id, e.title, c.name as client, e.status,
           (select count(*)::int from evidence_requests q where q.engagement_id = e.id and q.status = 'open') as open_requests,
           (select count(*)::int from reports r where r.engagement_id = e.id and r.status = 'sent') as reports
    from client_contacts cc join clients c on c.id = cc.client_id join engagements e on e.client_id = c.id
    where cc.account_id = ${account.id} and e.deleted_at is null
    order by e.created_at desc`;
  return (
    <>
      <DetailHeader breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Client portal' }]} title="Client portal" summary="Your Emruz assessments, evidence requests and reports." />
      <section className="py-8 bg-gray-50 min-h-[50vh]">
        <Container>
          {rows.length === 0 ? (
            <p className="text-gray-600">No engagements are shared with {account.email}. If you expected one, contact your Emruz assessor.</p>
          ) : (
            <ul className="space-y-3 max-w-3xl">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/portal/e/${r.id}`} className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400">
                    <p className="text-sm text-gray-500">{r.client}</p>
                    <p className="font-bold text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {r.status === 'review' ? 'In progress' : r.status === 'fieldwork' || r.status === 'intake' ? 'In progress' : statusLabel[r.status]}
                      {r.open_requests > 0 && <span className="text-amber-800 font-semibold"> · {r.open_requests} evidence {r.open_requests === 1 ? 'request' : 'requests'} waiting</span>}
                      {r.reports > 0 && <span className="text-emerald-700 font-semibold"> · report ready</span>}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
