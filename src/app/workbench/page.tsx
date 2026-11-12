import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { purgeDate, purgeDeleted, requireStaff, seesAll } from '@/lib/server/workbench';
import { engagementStatuses, statusLabel, type EngagementStatus, type ReportStatus, EVIDENCE_REQUIRED_AT } from '@/content/workbench';
import { csfSubcategories } from '@/content/csf';
import { StatusBadge, ReportBadge, WorkbenchNav, Meter, fmtDate, btn, card } from './ui';

export const metadata = { title: 'Assessment workbench', robots: { index: false } };

interface Row {
  id: string;
  title: string;
  client_name: string;
  status: EngagementStatus;
  lead: string | null;
  due_date: string | null;
  updated_at: Date;
  rated: number;
  missing_evidence: number;
  open_requests: number;
  report_status: ReportStatus | null;
  report_version: number | null;
  deleted_at: Date | null;
}

export default async function Workbench({ searchParams }: { searchParams: Promise<{ status?: string; mine?: string; deleted?: string }> }) {
  const { account, role } = await requireStaff('/workbench');
  const sp = await searchParams;
  const status = engagementStatuses.includes(sp.status as EngagementStatus) ? (sp.status as EngagementStatus) : null;
  const mine = sp.mine === '1';
  const deleted = sp.deleted === '1';
  await purgeDeleted();

  const rows = await db()<Row[]>`
    select e.id, e.title, c.name as client_name, e.status, coalesce(a.name, a.email) as lead,
           to_char(e.due_date, 'YYYY-MM-DD') as due_date, e.updated_at,
           (select count(*)::int from engagement_ratings r where r.engagement_id = e.id and (r.na or r.current_level is not null)) as rated,
           (select count(*)::int from engagement_ratings r where r.engagement_id = e.id and not r.na
              and r.current_level >= ${EVIDENCE_REQUIRED_AT} and coalesce(r.override_reason, '') = ''
              and not exists (select 1 from evidence_links l join evidence ev on ev.id = l.evidence_id
                              where ev.engagement_id = e.id and l.subcategory = r.subcategory)) as missing_evidence,
           (select count(*)::int from evidence_requests q where q.engagement_id = e.id and q.status = 'open') as open_requests,
           lr.status as report_status, lr.version as report_version, e.deleted_at
    from engagements e
    join clients c on c.id = e.client_id
    left join accounts a on a.id = e.lead_account_id
    left join lateral (select status, version from reports where engagement_id = e.id order by version desc limit 1) lr on true
    where (${status}::text is null or e.status = ${status})
      and (e.deleted_at is not null) = ${deleted}
      and (${!mine && seesAll(role)} or e.lead_account_id = ${account.id})
    order by (e.status = 'closed'), e.due_date nulls last, e.updated_at desc
    limit 300`;

  const counts = await db()<{ status: EngagementStatus; n: number }[]>`
    select status, count(*)::int as n from engagements
    where deleted_at is null and (${seesAll(role)} or lead_account_id = ${account.id}) group by status`;
  const [{ n: deletedCount }] = await db()<{ n: number }[]>`
    select count(*)::int as n from engagements where deleted_at is not null and (${seesAll(role)} or lead_account_id = ${account.id})`;
  const n = (s: EngagementStatus) => counts.find((c) => c.status === s)?.n ?? 0;
  const q = (p: Record<string, string | null>) => {
    const u = new URLSearchParams();
    const merged = { status, mine: mine ? '1' : null, deleted: null, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, v);
    const s = u.toString();
    return `/workbench${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench' }]}
        title="Assessment workbench"
        summary="NIST CSF 2.0 assessments, evidence and reports."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="engagements" isAdmin={role === 'admin'} />
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={q({ status: null })} className={`px-3 py-1.5 rounded-full border ${!status && !deleted ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-300'}`}>
                All
              </Link>
              {engagementStatuses.map((s) => (
                <Link key={s} href={q({ status: s })} className={`px-3 py-1.5 rounded-full border ${status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-300'}`}>
                  {statusLabel[s]} <span className="opacity-60">{n(s)}</span>
                </Link>
              ))}
              {seesAll(role) && <Link href={q({ mine: mine ? null : '1' })} className={`px-3 py-1.5 rounded-full border ${mine ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}>
                Mine
              </Link>}
              {deletedCount > 0 && (
                <Link href={q({ status: null, deleted: deleted ? null : '1' })} className={`px-3 py-1.5 rounded-full border ${deleted ? 'bg-red-700 text-white border-red-700' : 'bg-white border-gray-300 text-red-700'}`}>
                  Marked for deletion <span className="opacity-60">{deletedCount}</span>
                </Link>
              )}
            </div>
            <Link href="/workbench/new" className={btn}>
              <Plus className="w-4 h-4" /> New engagement
            </Link>
          </div>

          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="p-3 font-medium">Engagement</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Lead</th>
                  <th className="p-3 font-medium">Due</th>
                  <th className="p-3 font-medium w-40">Rated</th>
                  <th className="p-3 font-medium">Flags</th>
                  <th className="p-3 font-medium">Report</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-gray-500">No engagements yet.</td>
                  </tr>
                )}
                {rows.map((r) => {
                  const overdue = r.due_date && r.status !== 'delivered' && r.status !== 'closed' && new Date(r.due_date) < new Date();
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="p-3">
                        <Link href={`/workbench/e/${r.id}`} className="font-semibold text-blue-700 hover:underline">{r.client_name}</Link>
                        <p className="text-gray-500">{r.title}</p>
                      </td>
                      <td className="p-3">
                        {r.deleted_at ? <span className="text-xs font-semibold text-red-700">Deletes {fmtDate(purgeDate(r.deleted_at))}</span> : <StatusBadge status={r.status} />}
                      </td>
                      <td className="p-3 text-gray-700">{r.lead}</td>
                      <td className={`p-3 whitespace-nowrap ${overdue ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>{fmtDate(r.due_date)}</td>
                      <td className="p-3">
                        <p className="text-xs text-gray-600 mb-1">{r.rated} of {csfSubcategories.length}</p>
                        <Meter value={r.rated} total={csfSubcategories.length} />
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap">
                        {r.missing_evidence > 0 && <p className="text-red-700 font-semibold">{r.missing_evidence} missing evidence</p>}
                        {r.open_requests > 0 && <p className="text-amber-800">{r.open_requests} open requests</p>}
                        {!r.missing_evidence && !r.open_requests && <span className="text-gray-400">None</span>}
                      </td>
                      <td className="p-3">
                        {r.report_status ? (
                          <span className="flex items-center gap-1.5"><span className="text-xs text-gray-500">v{r.report_version}</span><ReportBadge status={r.report_status} /></span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
