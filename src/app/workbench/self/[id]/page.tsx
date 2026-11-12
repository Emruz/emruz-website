import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { purgeDate, requireStaff, seesAll, staffList } from '@/lib/server/workbench';
import { controls, inScope, profileSummary, targetIG } from '@/content/cis-assessment';
import { frameworks } from '@/content/crosswalk';
import ResultsView from '@/app/assessments/self/ResultsView';
import PrintButton from '@/app/assessments/self/PrintButton';
import { engagementFromSelf, markSelfDeleted, restoreSelf, toggleSelfFollowUp } from '../../actions';
import AssignSelect from '../../AssignSelect';
import { btn, btnGhost, card, fmtDate, fmtTime } from '../../ui';
import { selfAssessments } from '../data';

export const metadata = { title: 'Self-assessment', robots: { index: false } };

export default async function SelfAssessmentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { account, role } = await requireStaff(`/workbench/self/${id}`);
  if (!isUuid(id)) notFound();
  const all = seesAll(role);
  const [r] = await selfAssessments({ accountId: account.id, all, id });
  if (!r) notFound();
  const sp = await searchParams;
  const staff = all ? await staffList() : [];
  const people = [{ account_id: account.id, label: account.name || account.email }, ...staff.filter((s) => s.account_id !== account.id).map((s) => ({ account_id: s.account_id, label: s.name || s.email }))];
  const ig = r.target_ig ?? targetIG(r.profile);
  const qs = controls.flatMap((c) => inScope(c, ig, r.profile));
  const answered = qs.filter((q) => q.id in r.answers).length;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Self-assessments', href: '/workbench/self' }, { label: r.company }]}
        title={r.company}
        summary={`${r.performed_by_label ? `Guided by ${r.performed_by_label} on behalf of ${r.full_name}` : `Self-assessment by ${r.full_name}`}${r.job_title ? `, ${r.job_title}` : ''}. ${r.status === 'completed' ? `Completed ${fmtDate(r.completed_at)}.` : 'In progress.'}`}
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          {r.deleted_at && (
            <div role="status" className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 flex flex-wrap items-center justify-between gap-3">
              <p>
                Marked for deletion by {r.deleted_by} on {fmtDate(r.deleted_at)}. It will be permanently deleted on{' '}
                <strong>{fmtDate(purgeDate(r.deleted_at))}</strong>.
              </p>
              {(role === 'admin' || r.assigned_to === account.id) && (
                <form action={restoreSelf}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className={btnGhost}>Restore</button>
                </form>
              )}
            </div>
          )}
          {sp.error === 'incomplete' && <p role="alert" className="mb-4 text-red-700 font-semibold">The assessment must be completed before starting an engagement.</p>}
          <div className={`${card} p-5 mb-6 grid md:grid-cols-4 gap-5 text-sm print:hidden`}>
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900">{r.full_name}</p>
              <p><a href={`mailto:${r.email}`} className="text-blue-700">{r.email}</a></p>
              {r.phone && <p className="text-gray-700">{r.phone}</p>}
              <p className="text-xs text-gray-500 mt-1">Consent given {fmtTime(r.consented_at)}</p>
              {r.performed_by_label && <p className="text-xs text-gray-500">Performed by {r.performed_by_label}</p>}
            </div>
            <div>
              <p className="text-gray-500">Profile</p>
              <p className="text-gray-800">{profileSummary(r.profile)}</p>
              <p className="text-gray-500 mt-2">Frameworks</p>
              <p className="text-gray-800">{r.profile.frameworks?.length ? r.profile.frameworks.map((k) => frameworks.find((f) => f.key === k)?.short).join(', ') : 'None chosen'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Analyst</p>
              {all ? <AssignSelect id={r.id} value={r.assigned_to} staff={people} /> : <p className="text-gray-800">{r.assigned_label}</p>}
              {r.status === 'completed' && !r.engagement_id && (
                <form action={toggleSelfFollowUp} className="mt-3">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs font-semibold text-blue-700">
                    {r.followed_up_at ? `Followed up ${fmtDate(r.followed_up_at)} (undo)` : 'Mark followed up'}
                  </button>
                </form>
              )}
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              {r.engagement_id ? (
                <Link href={`/workbench/e/${r.engagement_id}`} className={btn}>Open engagement</Link>
              ) : r.status === 'completed' && !r.deleted_at ? (
                <form action={engagementFromSelf}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className={btn}>Start engagement</button>
                </form>
              ) : null}
              {r.status === 'completed' && <PrintButton />}
              {!r.deleted_at && (role === 'admin' || r.assigned_to === account.id) && (
                <form action={markSelfDeleted}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-gray-500 hover:text-red-700">Mark for deletion</button>
                </form>
              )}
              {!r.engagement_id && r.status === 'completed' && (
                <p className="text-xs text-gray-500 md:text-right max-w-56">Creates the client, adds {r.full_name.split(' ')[0]} as a portal contact and pre-fills the NIST CSF ratings.</p>
              )}
            </div>
          </div>

          {r.status === 'completed' ? (
            <ResultsView answers={r.answers} profile={r.profile} ig={ig} staffView />
          ) : (
            <div className={`${card} p-6`}>
              <p className="font-semibold text-gray-900">Not finished yet</p>
              <p className="text-sm text-gray-600 mt-1">{answered} of {qs.length} questions answered. Last saved {fmtTime(r.updated_at)}.</p>
              {r.performed_by && (role === 'admin' || r.performed_by === account.id || r.assigned_to === account.id) && !r.deleted_at ? (
                <Link href={`/workbench/self/${r.id}/take`} className={`${btn} mt-4`}>Continue guided assessment</Link>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mt-3">Results appear here when {r.full_name.split(' ')[0]} completes it.</p>
                  <Link href={`mailto:${r.email}`} className={`${btnGhost} mt-4`}>Email {r.full_name.split(' ')[0]}</Link>
                </>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
