import Link from 'next/link';
import { getEngagement, getEvidence, getRatings, getReports, requireStaff } from '@/lib/server/workbench';
import { flagsFor, flagInfo, type Flag } from '@/content/workbench';
import { csfSubcategories } from '@/content/csf';
import { generateReport, saveSummary } from '../../../actions';
import { ReportBadge, FlagBadge, btn, btnGhost, card, input, fmtTime } from '../../../ui';

export default async function ReportTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff(`/workbench/e/${id}/report`);
  const [e, ratings, evidence, reports] = await Promise.all([getEngagement(id), getRatings(id), getEvidence(id), getReports(id)]);
  const linked = new Map<string, number>();
  for (const ev of evidence) for (const s of ev.subcategories) linked.set(s, (linked.get(s) ?? 0) + 1);
  const flagged = csfSubcategories.map((s) => ({ s, flags: flagsFor(ratings[s.id], linked.get(s.id) ?? 0) })).filter((x) => x.flags.length);
  const byFlag = (Object.keys(flagInfo) as Flag[]).map((f) => ({ f, items: flagged.filter((x) => x.flags.includes(f)) })).filter((x) => x.items.length);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <form action={saveSummary} className={`${card} p-5 space-y-3`}>
          <h2 className="font-bold text-gray-900">Executive summary</h2>
          <p className="text-sm text-gray-600">Plain-language overview for leadership. Included in every draft you generate.</p>
          <input type="hidden" name="id" value={id} />
          <textarea name="summary" rows={10} defaultValue={e!.summary} className={input} placeholder="Overall posture, key strengths, the three to five things to fix first, and the expected effect." />
          <button className={btnGhost}>Save summary</button>
        </form>

        <div className={card}>
          <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Versions</h2>
          <ul className="divide-y divide-gray-100">
            {reports.length === 0 && <li className="p-4 text-sm text-gray-500">No drafts yet.</li>}
            {reports.map((r) => (
              <li key={r.id} className="p-4 flex flex-wrap justify-between gap-2">
                <Link href={`/workbench/e/${id}/report/${r.id}`} className="font-semibold text-blue-700 hover:underline">Version {r.version}</Link>
                <span className="flex items-center gap-3 text-sm text-gray-600">
                  {fmtTime(r.created_at)} · {r.created_by_email} <ReportBadge status={r.status} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <form action={generateReport} className={`${card} p-5 space-y-3`}>
          <h2 className="font-bold text-gray-900">Generate draft</h2>
          <p className="text-sm text-gray-600">Freezes the current ratings, evidence and summary into a new version for review. Earlier versions are kept.</p>
          <input type="hidden" name="id" value={id} />
          <button className={btn}>Generate draft v{(reports[0]?.version ?? 0) + 1}</button>
        </form>

        <div className={`${card} p-5`}>
          <h2 className="font-bold text-gray-900 mb-1">Open flags</h2>
          <p className="text-sm text-gray-600 mb-3">{flagged.length ? 'Resolve these before review, or the reviewer must justify approving with them.' : 'None. Ready for review.'}</p>
          <div className="space-y-3">
            {byFlag.map(({ f, items }) => (
              <div key={f}>
                <p className="mb-1"><FlagBadge flag={f} /> <span className="text-sm text-gray-600">{items.length}</span></p>
                <p className="font-mono text-xs text-gray-600 leading-6">
                  {items.slice(0, 40).map(({ s }) => (
                    <Link key={s.id} href={`/workbench/e/${id}/assess?fn=${s.fn}#${s.id}`} className="mr-2 hover:underline">{s.id}</Link>
                  ))}
                  {items.length > 40 && `+${items.length - 40} more`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
