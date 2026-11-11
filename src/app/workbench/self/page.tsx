import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { purgeDate, purgeDeleted, requireStaff, seesAll, staffList } from '@/lib/server/workbench';
import { controls, inScope, maturity, recommend, targetIG } from '@/content/cis-assessment';
import { displayCode } from '@/content/packages';
import { frameworks } from '@/content/crosswalk';
import { WorkbenchNav, card, fmtDate } from '../ui';
import AssignSelect from '../AssignSelect';
import { markSelfDeleted, restoreSelf, toggleSelfFollowUp } from '../actions';
import { selfAssessments, type SelfRow } from './data';

export const metadata = { title: 'Self-assessments', robots: { index: false } };

const live = (r: SelfRow) => !r.deleted_at;
const filters = [
  { key: 'all', label: 'All', test: live },
  { key: 'followup', label: 'Needs follow-up', test: (r: SelfRow) => live(r) && r.status === 'completed' && !r.followed_up_at && !r.engagement_id },
  { key: 'progress', label: 'In progress', test: (r: SelfRow) => live(r) && r.status === 'in_progress' },
  { key: 'unassigned', label: 'Unassigned', test: (r: SelfRow) => live(r) && !r.assigned_to },
  { key: 'deleted', label: 'Marked for deletion', test: (r: SelfRow) => !!r.deleted_at },
] as const;

function progress(r: SelfRow) {
  const qs = controls.flatMap((c) => inScope(c, targetIG(r.profile), r.profile));
  return Math.round((qs.filter((q) => q.id in r.answers).length / qs.length) * 100);
}

export default async function SelfAssessments({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { account, role } = await requireStaff('/workbench/self');
  const all = seesAll(role);
  const sp = await searchParams;
  await purgeDeleted();
  const filter = filters.find((f) => f.key === sp.f) ?? filters[0];
  const [rows, staff] = await Promise.all([selfAssessments({ accountId: account.id, all }), all ? staffList() : Promise.resolve([])]);
  const people = [{ account_id: account.id, label: account.name || account.email }, ...staff.filter((s) => s.account_id !== account.id).map((s) => ({ account_id: s.account_id, label: s.name || s.email }))];
  const shown = rows.filter((r) => filter.test(r));

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Self-assessments' }]}
        title="Assessment workbench"
        summary={all ? 'Every self-assessment from registered visitors. Assign each to an analyst to follow up.' : 'Self-assessments assigned to you.'}
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="self" isAdmin={role === 'admin'} />
          <div className="flex flex-wrap gap-2 text-sm mb-4">
            {filters
              .filter((f) => all || f.key !== 'unassigned')
              .map((f) => (
                <Link
                  key={f.key}
                  href={f.key === 'all' ? '/workbench/self' : `/workbench/self?f=${f.key}`}
                  className={`px-3 py-1.5 rounded-full border ${filter.key === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-300'}`}
                >
                  {f.label} <span className="opacity-60">{rows.filter((r) => f.test(r)).length}</span>
                </Link>
              ))}
          </div>

          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="p-3 font-medium">Organization</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Suggested</th>
                  <th className="p-3 font-medium">Frameworks</th>
                  <th className="p-3 font-medium">Analyst</th>
                  <th className="p-3 font-medium">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-gray-500">{all ? 'No self-assessments here.' : 'Nothing assigned to you yet.'}</td></tr>
                )}
                {shown.map((r) => {
                  const ig = r.target_ig ?? targetIG(r.profile);
                  const rec = r.status === 'completed' ? recommend(r.answers, ig, r.profile) : null;
                  return (
                    <tr key={r.id} className="border-b border-gray-100 last:border-0 align-top hover:bg-gray-50">
                      <td className="p-3">
                        <Link href={`/workbench/self/${r.id}`} className="font-semibold text-blue-700 hover:underline">{r.company}</Link>
                        <p className="text-gray-700">{r.full_name}{r.job_title && `, ${r.job_title}`}</p>
                        <p className="text-xs text-gray-500">{r.email}{r.phone && ` · ${r.phone}`}</p>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {r.status === 'completed' ? (
                          <>
                            <p><span className={`text-lg font-bold ${maturity(r.score ?? 0).color}`}>{r.score}%</span> <span className="text-gray-500">IG{ig}</span></p>
                            <p className="text-xs text-gray-500">{fmtDate(r.completed_at)}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-amber-700">In progress</p>
                            <p className="text-xs text-gray-500">{progress(r)}% answered · {fmtDate(r.updated_at)}</p>
                          </>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        {rec?.pkg && <p className="font-semibold text-gray-900">{displayCode(rec.pkg.code)}</p>}
                        {rec && rec.addOns.length > 0 && <p className="text-indigo-700">+ {rec.addOns.map((a) => a.code).join(', ')}</p>}
                        {!rec && <span className="text-gray-400">–</span>}
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        {r.profile.frameworks?.length ? r.profile.frameworks.map((k) => frameworks.find((f) => f.key === k)?.short).join(', ') : <span className="text-gray-400">–</span>}
                      </td>
                      <td className="p-3">
                        {all ? <AssignSelect id={r.id} value={r.assigned_to} staff={people} /> : <span className="text-gray-700">{r.assigned_label}</span>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {r.deleted_at ? (
                          <div className="text-xs">
                            <p className="text-red-700 font-semibold">Deletes {fmtDate(purgeDate(r.deleted_at))}</p>
                            <p className="text-gray-500">by {r.deleted_by}</p>
                            {(role === 'admin' || r.assigned_to === account.id) && (
                              <form action={restoreSelf}>
                                <input type="hidden" name="id" value={r.id} />
                                <button className="font-semibold text-blue-700 mt-1">Restore</button>
                              </form>
                            )}
                          </div>
                        ) : r.engagement_id ? (
                          <Link href={`/workbench/e/${r.engagement_id}`} className="text-xs font-semibold text-emerald-700 hover:underline">Engagement started</Link>
                        ) : r.status === 'completed' ? (
                          <form action={toggleSelfFollowUp}>
                            <input type="hidden" name="id" value={r.id} />
                            {r.followed_up_at ? (
                              <button className="text-xs text-gray-500 hover:text-gray-800" title={`Marked by ${r.followed_up_by}. Click to undo.`}>Followed up {fmtDate(r.followed_up_at)}</button>
                            ) : (
                              <button className="text-xs font-semibold px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">Mark followed up</button>
                            )}
                          </form>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                        {!r.deleted_at && (role === 'admin' || r.assigned_to === account.id) && (
                          <form action={markSelfDeleted} className="mt-1">
                            <input type="hidden" name="id" value={r.id} />
                            <button className="text-xs text-gray-400 hover:text-red-700">Mark for deletion</button>
                          </form>
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
