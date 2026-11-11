import Link from 'next/link';
import { db } from '@/lib/server/db';
import { clientContacts, getEngagement, getEvidence, getRatings, getReports, getRequests, requireEngagementAccess, staffList } from '@/lib/server/workbench';
import { engagementStatuses, flagsFor, flagInfo, intakeCompleteness, rollup, statusLabel, tierFor } from '@/content/workbench';
import { csfSubcategories } from '@/content/csf';
import { markEngagementDeleted, updateEngagement } from '../../actions';
import { ReportBadge, Meter, btn, card, input, label, fmtTime } from '../../ui';

const eventText: Record<string, (d: Record<string, unknown>) => string> = {
  created: (d) => `Created the engagement${d.prefilled ? `, ${d.prefilled} ratings pre-filled from the self-assessment` : ''}`,
  status: (d) => `Moved from ${statusLabel[d.from as keyof typeof statusLabel] ?? d.from} to ${statusLabel[d.to as keyof typeof statusLabel] ?? d.to}`,
  details_updated: () => 'Updated engagement details',
  intake_saved: () => 'Edited the intake',
  summary_saved: () => 'Edited the executive summary',
  evidence_added: (d) => `${d.from_client ? 'Client uploaded' : 'Added'} evidence: ${d.title}`,
  evidence_deleted: (d) => `Deleted evidence: ${d.title}`,
  request_created: (d) => `Requested evidence: ${d.text}`,
  request_emailed: (d) => `Emailed the request to ${(d.to as string[]).join(', ')}`,
  request_status: (d) => `Marked a request ${d.status}`,
  report_generated: (d) => `Generated report draft v${d.version} (${d.flags} flags)`,
  report_submitted: (d) => `Submitted v${d.version} for review`,
  report_approved: (d) => `Approved v${d.version}${d.open_flags ? ` with ${d.open_flags} open flags: ${d.note}` : ''}`,
  report_changes_requested: (d) => `Requested changes to v${d.version}${d.note ? `: ${d.note}` : ''}`,
  report_sent: (d) => `Sent v${d.version} to ${(d.to as string[]).join(', ')}`,
  client_link_added: (d) => `Client shared a link: ${d.title}`,
  marked_deleted: () => 'Marked the engagement for deletion',
  restored: () => 'Restored the engagement',
};

export default async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, role } = await requireEngagementAccess(id, `/workbench/e/${id}`);
  const e = (await getEngagement(id))!;
  const [ratings, evidence, requests, reports, contacts, staff, events] = await Promise.all([
    getRatings(id),
    getEvidence(id),
    getRequests(id),
    getReports(id),
    clientContacts(e.client_id),
    staffList(),
    db()<{ actor: string; kind: string; detail: Record<string, unknown>; created_at: Date }[]>`
      select actor, kind, detail, created_at from engagement_events where engagement_id = ${id} order by created_at desc limit 60`,
  ]);
  const linked = new Map<string, number>();
  for (const ev of evidence) for (const s of ev.subcategories) linked.set(s, (linked.get(s) ?? 0) + 1);
  const flags = csfSubcategories.flatMap((s) => flagsFor(ratings[s.id], linked.get(s.id) ?? 0));
  const count = (f: keyof typeof flagInfo) => flags.filter((x) => x === f).length;
  const r = rollup(ratings);
  const intake = intakeCompleteness(e.intake);
  const latest = reports[0];
  const leads = [{ account_id: account.id, email: account.email, name: account.name }, ...staff.filter((s) => s.account_id !== account.id)];
  if (e.lead_account_id && !leads.some((l) => l.account_id === e.lead_account_id)) leads.push({ account_id: e.lead_account_id, email: e.lead_email ?? '', name: e.lead_name });

  const tiles = [
    { label: 'Intake', value: `${intake.done}/${intake.total}`, note: intake.missing.length ? `${intake.missing.length} required fields missing` : 'Complete', href: 'intake', bad: intake.missing.length > 0 },
    { label: 'Rated', value: `${r.rated}/${r.total}`, note: `${count('prefilled')} pre-filled to confirm`, href: 'assess', bad: count('prefilled') > 0 },
    { label: 'Missing evidence', value: String(count('missing_evidence')), note: 'Rated 3+ with no evidence', href: 'assess?filter=missing_evidence', bad: count('missing_evidence') > 0 },
    { label: 'Evidence', value: String(evidence.length), note: `${requests.filter((q) => q.status === 'open').length} open requests`, href: 'evidence', bad: false },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <Link key={t.label} href={`/workbench/e/${id}/${t.href}`} className={`${card} p-4 hover:border-blue-400`}>
              <p className="text-xs text-gray-500">{t.label}</p>
              <p className="text-2xl font-bold text-gray-900">{t.value}</p>
              <p className={`text-xs ${t.bad ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>{t.note}</p>
            </Link>
          ))}
        </div>

        <div className={`${card} p-5`}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-bold text-gray-900">Current profile</h2>
            <p className="text-sm text-gray-600">
              Overall {r.overall.current ?? '–'} of 5 · <span className="font-semibold">{tierFor(r.overall.current).label}</span>
            </p>
          </div>
          <ul className="space-y-3">
            {r.functions.map((f) => (
              <li key={f.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-800">{f.title}</span>
                  <span className="text-gray-600">{f.current ?? '–'} <span className="text-gray-400">/ target {f.target ?? '–'}</span></span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style={{ width: `${((f.current ?? 0) / 5) * 100}%` }} />
                  {f.target !== null && <div className="absolute -top-1 -bottom-1 w-0.5 bg-gray-800" style={{ left: `${(f.target / 5) * 100}%` }} title={`Target ${f.target}`} />}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-1">{r.rated} of {r.total} subcategories rated{r.na ? `, ${r.na} not applicable` : ''}</p>
            <Meter value={r.rated} total={r.total} />
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h2 className="font-bold text-gray-900 mb-3">Activity</h2>
          <ol className="space-y-2 text-sm">
            {events.map((ev, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-gray-400 whitespace-nowrap w-40 flex-shrink-0">{fmtTime(ev.created_at)}</span>
                <span className="text-gray-800">
                  {(eventText[ev.kind] ?? (() => ev.kind))(ev.detail)} <span className="text-gray-400">· {ev.actor}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`${card} p-5`}>
          <h2 className="font-bold text-gray-900 mb-2">Report</h2>
          {latest ? (
            <Link href={`/workbench/e/${id}/report/${latest.id}`} className="flex items-center gap-2 text-blue-700 font-semibold">
              Version {latest.version} <ReportBadge status={latest.status} />
            </Link>
          ) : (
            <p className="text-sm text-gray-600">No drafts yet.</p>
          )}
          <Link href={`/workbench/e/${id}/report`} className="text-sm text-blue-700 mt-2 inline-block">Go to report</Link>
        </div>

        <form action={updateEngagement} className={`${card} p-5 space-y-3`}>
          <h2 className="font-bold text-gray-900">Details</h2>
          <input type="hidden" name="id" value={id} />
          <div><label className={label} htmlFor="title">Title</label><input id="title" name="title" defaultValue={e.title} className={input} /></div>
          <div>
            <label className={label} htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={e.status} className={input}>
              {engagementStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="lead">Lead</label>
            <select id="lead" name="lead" defaultValue={e.lead_account_id ?? ''} className={input}>
              {leads.map((s) => <option key={s.account_id} value={s.account_id}>{s.name || s.email}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="target_ig">Target</label>
            <select id="target_ig" name="target_ig" defaultValue={String(e.target_ig)} className={input}>
              <option value="1">IG1</option><option value="2">IG2</option><option value="3">IG3</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label} htmlFor="start_date">Start</label><input id="start_date" name="start_date" type="date" defaultValue={e.start_date ?? ''} className={input} /></div>
            <div><label className={label} htmlFor="due_date">Due</label><input id="due_date" name="due_date" type="date" defaultValue={e.due_date ?? ''} className={input} /></div>
          </div>
          <button className={btn}>Save</button>
        </form>

        {!e.deleted_at && (role === 'admin' || e.lead_account_id === account.id) && (
          <form action={markEngagementDeleted} className="text-right">
            <input type="hidden" name="id" value={id} />
            <button className="text-sm text-gray-500 hover:text-red-700">Mark for deletion</button>
            <p className="text-xs text-gray-400">Recoverable for 30 days</p>
          </form>
        )}

        <div className={`${card} p-5`}>
          <h2 className="font-bold text-gray-900 mb-2">Client contacts</h2>
          {contacts.length === 0 && <p className="text-sm text-red-700">No contacts. Add one before sending the report.</p>}
          <ul className="space-y-1 text-sm">
            {contacts.map((c) => <li key={c.account_id}>{c.name || c.email} <span className="text-gray-500">{c.email}</span></li>)}
          </ul>
          <Link href={`/workbench/clients/${e.client_id}`} className="text-sm text-blue-700 mt-2 inline-block">Manage contacts</Link>
        </div>
      </div>
    </div>
  );
}
