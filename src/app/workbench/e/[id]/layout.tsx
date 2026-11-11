import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { getEngagement, getEvidence, getRatings, getRequests, purgeDate, requireEngagementAccess } from '@/lib/server/workbench';
import { restoreEngagement } from '../../actions';
import { flagsFor, flagInfo } from '@/content/workbench';
import { csfSubcategories } from '@/content/csf';
import Tabs from './Tabs';
import { StatusBadge, fmtDate } from '../../ui';

export default async function EngagementLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, role } = await requireEngagementAccess(id, `/workbench/e/${id}`);
  if (!isUuid(id)) notFound();
  const e = await getEngagement(id);
  if (!e) notFound();
  const [ratings, evidence, requests] = await Promise.all([getRatings(id), getEvidence(id), getRequests(id)]);
  const linked = new Map<string, number>();
  for (const ev of evidence) for (const s of ev.subcategories) linked.set(s, (linked.get(s) ?? 0) + 1);
  const blocking = csfSubcategories.filter((s) =>
    flagsFor(ratings[s.id], linked.get(s.id) ?? 0).some((f) => flagInfo[f].blocks && f !== 'unrated'),
  ).length;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: e.client_name }]}
        title={e.client_name}
        summary={`${e.title}${e.due_date ? ` · due ${fmtDate(e.due_date)}` : ''}${e.lead_email ? ` · lead ${e.lead_name || e.lead_email}` : ''}`}
      />
      <section className="py-6 bg-gray-50 min-h-[70vh]">
        <Container>
          {e.deleted_at && (
            <div role="status" className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 flex flex-wrap items-center justify-between gap-3">
              <p>
                Marked for deletion by {e.deleted_by} on {fmtDate(e.deleted_at)}. It will be permanently deleted, with its evidence and reports, on{' '}
                <strong>{fmtDate(purgeDate(e.deleted_at))}</strong>. The client can no longer see it.
              </p>
              {(role === 'admin' || e.lead_account_id === account.id) && (
                <form action={restoreEngagement}>
                  <input type="hidden" name="id" value={id} />
                  <button className="px-4 py-2 rounded-lg font-semibold border border-red-300 bg-white hover:bg-red-50">Restore</button>
                </form>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={e.status} />
            <span className="text-xs text-gray-500">IG{e.target_ig} target</span>
          </div>
          <Tabs id={id} counts={{ flags: blocking, requests: requests.filter((r) => r.status === 'open').length }} />
          {children}
        </Container>
      </section>
    </>
  );
}
