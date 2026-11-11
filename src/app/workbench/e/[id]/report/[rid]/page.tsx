import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isUuid } from '@/lib/server/api';
import { canReview, clientContacts, getEngagement, getReport, requireStaff } from '@/lib/server/workbench';
import { flagInfo, type Flag } from '@/content/workbench';
import ReportDocument from '@/components/assessment/ReportDocument';
import PrintButton from '@/app/assessments/self/PrintButton';
import { reviewReport, sendReport, submitReport } from '../../../../actions';
import { ReportBadge, FlagBadge, btn, btnGhost, card, input, fmtTime } from '../../../../ui';

const errors: Record<string, string> = {
  review: 'Only a lead or admin can review a report that is in review.',
  self: 'Someone other than the author must review this report.',
  flags: 'This version has open flags. Add a note explaining why you are approving anyway.',
  send: 'Only an approved report can be sent, by a lead or admin.',
  contacts: 'The client has no contacts to send to. Add one on the client page.',
};

export default async function ReportVersion({ params, searchParams }: { params: Promise<{ id: string; rid: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id, rid } = await params;
  const { account, role } = await requireStaff(`/workbench/e/${id}/report/${rid}`);
  if (!isUuid(rid)) notFound();
  const [r, e] = await Promise.all([getReport(rid), getEngagement(id)]);
  if (!r || r.engagement_id !== id || !e) notFound();
  const sp = await searchParams;
  const contacts = await clientContacts(e.client_id);
  const flags = r.content.flags as { id: string; flags: Flag[] }[];
  const blocking = flags.filter((f) => f.flags.some((x) => flagInfo[x]?.blocks));
  const reviewer = canReview(role) && (r.created_by !== account.id || role === 'admin');

  return (
    <div className="space-y-6">
      <div className={`${card} p-5 print:hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/workbench/e/${id}/report`} className="text-sm text-blue-700">All versions</Link>
            <h2 className="font-bold text-gray-900">Version {r.version}</h2>
            <ReportBadge status={r.status} />
          </div>
          <PrintButton />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Generated {fmtTime(r.created_at)} by {r.created_by_email}
          {r.submitted_at && ` · submitted ${fmtTime(r.submitted_at)}`}
          {r.reviewed_at && ` · reviewed ${fmtTime(r.reviewed_at)} by ${r.reviewed_by_email}`}
          {r.sent_at && ` · sent ${fmtTime(r.sent_at)} to ${r.sent_to?.join(', ')}`}
        </p>
        {r.review_note && <p className="mt-2 text-sm bg-gray-50 border border-gray-200 rounded p-3"><span className="font-semibold">Reviewer note: </span>{r.review_note}</p>}
        {sp.error && <p role="alert" className="mt-3 text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}

        {flags.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-red-700">{flags.length} subcategories had open flags when this version was generated ({blocking.length} blocking)</summary>
            <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
              {flags.map((f) => (
                <li key={f.id} className="flex items-center gap-2"><span className="font-mono w-16">{f.id}</span>{f.flags.map((x) => <FlagBadge key={x} flag={x} />)}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-4 flex flex-wrap gap-4 items-start">
          {(r.status === 'draft' || r.status === 'changes_requested') && (
            <form action={submitReport}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="report_id" value={r.id} />
              <button className={btn}>Submit for review</button>
            </form>
          )}
          {r.status === 'in_review' && reviewer && (
            <form action={reviewReport} className="flex flex-col gap-2 w-full max-w-xl">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="report_id" value={r.id} />
              <textarea name="note" rows={2} className={input} placeholder={blocking.length ? 'Required to approve with open flags: explain why' : 'Note to the assessor (optional)'} />
              <div className="flex gap-2">
                <button name="decision" value="approve" className={btn}>Approve</button>
                <button name="decision" value="changes" className={btnGhost}>Request changes</button>
              </div>
            </form>
          )}
          {r.status === 'in_review' && !reviewer && <p className="text-sm text-gray-600">Waiting for a lead to review.</p>}
          {r.status === 'approved' && canReview(role) && (
            <form action={sendReport} className="flex flex-col gap-2 w-full max-w-xl">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="report_id" value={r.id} />
              <p className="text-sm text-gray-700">
                Sends a portal link to {contacts.length ? contacts.map((c) => c.email).join(', ') : <span className="text-red-700">no contacts yet</span>}.
              </p>
              <textarea name="message" rows={2} className={input} placeholder="Personal note for the email (optional)" />
              <button className={btn} disabled={!contacts.length}>Send to client</button>
            </form>
          )}
          {r.status === 'sent' && <p className="text-sm text-gray-600">Delivered. The client can view it in their portal.</p>}
        </div>
      </div>

      <ReportDocument c={r.content} version={r.version} draft={r.status !== 'sent' && r.status !== 'approved'} />
    </div>
  );
}
