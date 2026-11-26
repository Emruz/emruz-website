import Link from 'next/link';
import { getEngagement, getEvidence, getObligationRatings, getRatings, requireEngagementAccess } from '@/lib/server/workbench';
import { frameworkFor } from '@/content/frameworks';
import {
  cleanObligations,
  evidenceIndex,
  fromMaturity,
  isObligation,
  MET,
  PARTIAL,
  obligationInfo,
  obligationView,
  OBLIGATION_KEYS,
  reqStatusLabel,
  SPRS_MAX,
  type ReqStatus,
} from '@/content/obligations';
import { SCF_ATTRIBUTION } from '@/content/scf';
import { setObligationRating, setObligations } from '../../../actions';
import { btn, card } from '../../../ui';

const tone: Record<ReqStatus, string> = {
  met: 'text-emerald-700',
  partial: 'text-amber-800',
  not_met: 'text-red-700',
  unknown: 'text-gray-500',
};

export default async function ObligationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ob?: string; show?: string }>;
}) {
  const { id } = await params;
  await requireEngagementAccess(id, `/workbench/e/${id}/obligations`);
  const sp = await searchParams;
  const e = (await getEngagement(id))!;
  if (frameworkFor(e.assessment_type).type !== 'security') {
    return <p className="text-sm text-gray-600">Obligation views are part of NIST CSF 2.0 security assessments.</p>;
  }
  const chosen = cleanObligations(e.obligations);
  const [ratings, evidence, overrides] = await Promise.all([getRatings(id), getEvidence(id), getObligationRatings(id)]);
  const ob = isObligation(sp.ob) && chosen.includes(sp.ob) ? sp.ob : chosen[0];
  const view = ob ? obligationView(ob, fromMaturity(Object.values(ratings)), evidenceIndex(evidence), overrides[ob] ?? {}) : null;
  const titles = Object.fromEntries(evidence.map((x) => [x.id, x.title]));
  const reqs = view ? view.requirements.filter((r) => (sp.show === 'emruz' ? r.bridged : sp.show === 'open' ? r.status !== 'met' : true)) : [];
  const href = (q: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ ob, show: sp.show, ...q }).filter(([, v]) => v) as [string, string][]);
    return `/workbench/e/${id}/obligations?${u}`;
  };

  return (
    <div className="space-y-6">
      <form action={setObligations} className={`${card} p-5 space-y-3`}>
        <input type="hidden" name="id" value={id} />
        <h2 className="font-bold text-gray-900">Obligations on the report</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {OBLIGATION_KEYS.map((k) => (
            <label key={k} className="flex gap-2 text-sm">
              <input type="checkbox" name="obligation" value={k} defaultChecked={chosen.includes(k)} /> {obligationInfo[k].name}
            </label>
          ))}
        </div>
        <button className={btn}>Save</button>
      </form>

      {view && (
        <div className={card}>
          <div className="p-4 border-b border-gray-100 space-y-3">
            <nav className="flex flex-wrap gap-2" aria-label="Obligation">
              {chosen.map((k) => (
                <Link
                  key={k}
                  href={href({ ob: k })}
                  aria-current={k === ob ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${k === ob ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-700'}`}
                >
                  {obligationInfo[k].short}
                </Link>
              ))}
            </nav>
            <p className="text-sm text-gray-700">
              {view.counts.met} met · {view.counts.partial} partly · {view.counts.not_met} not met · {view.counts.unknown} not assessed
              {view.sprs && (
                <>
                  {' '}· estimated SPRS <strong>{view.sprs.score}</strong> of {SPRS_MAX}
                </>
              )}
            </p>
            <p className="text-xs text-gray-600">
              Status comes from the CSF ratings of the mapped Subcategories. Set it here where the mapping is weak, above all for requirements marked
              Emruz mapping (the SCF has no CSF link for them).
            </p>
            <div className="flex gap-3 text-sm">
              <Link href={href({ show: '' })} className={!sp.show ? 'font-semibold text-gray-900' : 'text-blue-700'}>All</Link>
              <Link href={href({ show: 'open' })} className={sp.show === 'open' ? 'font-semibold text-gray-900' : 'text-blue-700'}>Not met</Link>
              <Link href={href({ show: 'emruz' })} className={sp.show === 'emruz' ? 'font-semibold text-gray-900' : 'text-blue-700'}>Emruz mapping</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="p-3 font-medium">Requirement</th>
                  <th className="p-3 font-medium">From CSF</th>
                  <th className="p-3 font-medium">Evidence</th>
                  <th className="p-3 font-medium">Assessor status</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => {
                  const derived: ReqStatus = r.rating === null ? 'unknown' : r.rating >= MET ? 'met' : r.rating >= PARTIAL ? 'partial' : 'not_met';
                  return (
                    <tr key={r.id} className="border-b border-gray-100 align-top">
                      <td className="p-3">
                        <span className="font-medium text-gray-900">{r.title}</span>
                        {!r.title.endsWith(r.id) && <span className="text-gray-500"> {r.id}</span>}
                        {r.weight ? <span className="text-gray-500"> · {r.weight} pts</span> : null}
                        {r.bridged && <span className="ml-1 text-[11px] text-gray-500">(Emruz mapping)</span>}
                        <p className="text-xs text-gray-500 font-mono">{r.csf.join(' ')}</p>
                      </td>
                      <td className={`p-3 text-xs font-semibold ${tone[derived]}`}>{reqStatusLabel[derived]}</td>
                      <td className="p-3 text-xs text-gray-700">
                        {r.evidence.length ? r.evidence.map((x) => <p key={x}>{titles[x]}</p>) : <span className="text-red-700">None</span>}
                      </td>
                      <td className="p-3">
                        <form action={setObligationRating} className="flex flex-wrap gap-1.5 items-start">
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="obligation" value={ob} />
                          <input type="hidden" name="requirement" value={r.id} />
                          <select
                            name="status"
                            defaultValue={r.overridden ? r.status : 'auto'}
                            aria-label={`Status for ${r.id}`}
                            className="text-xs border border-gray-300 rounded px-1.5 py-1"
                          >
                            <option value="auto">From CSF</option>
                            {(['met', 'partial', 'not_met', 'unknown'] as ReqStatus[]).map((s) => (
                              <option key={s} value={s}>{reqStatusLabel[s]}</option>
                            ))}
                          </select>
                          <input
                            name="note"
                            defaultValue={r.note ?? ''}
                            placeholder="Note"
                            aria-label={`Note for ${r.id}`}
                            className="text-xs border border-gray-300 rounded px-1.5 py-1 w-32"
                          />
                          <button className="text-xs font-semibold text-blue-700">Save</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!view && <p className="text-sm text-gray-600">Choose the obligations this client answers to.</p>}
      <p className="text-xs text-gray-500">{SCF_ATTRIBUTION}</p>
    </div>
  );
}
