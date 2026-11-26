import { ChevronDown } from 'lucide-react';
import PoamDownload from './PoamDownload';
import {
  poamCsv,
  reqStatusLabel,
  SPRS_MAX,
  type ObligationView,
  type ReqStatus,
  type RequirementResult,
} from '@/content/obligations';
import { SCF_ATTRIBUTION, SCF_URL, scfEvidenceById } from '@/content/scf';

const badge: Record<ReqStatus, string> = {
  met: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  not_met: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-gray-50 text-gray-600 border-gray-200',
};

function Status({ s, overridden }: { s: ReqStatus; overridden?: boolean }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-xs font-semibold ${badge[s]}`}>
      {reqStatusLabel[s]}
      {overridden ? ' *' : ''}
    </span>
  );
}

function Counts({ c }: { c: Record<ReqStatus, number> }) {
  return (
    <p className="text-xs text-gray-600">
      {c.met} met · {c.partial} partly · {c.not_met} not met{c.unknown ? ` · ${c.unknown} not assessed` : ''}
    </p>
  );
}

function Rows({ reqs, showEvidence, evidenceTitles }: { reqs: RequirementResult[]; showEvidence: boolean; evidenceTitles?: Record<string, string> }) {
  const starts = new Set(reqs.filter((r, i) => i === 0 || reqs[i - 1].group !== r.group).map((r) => r.id));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="py-2 pr-3 font-medium">Requirement</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">CSF 2.0</th>
            <th className="py-2 font-medium">{showEvidence ? 'Evidence' : 'Evidence to collect (SCF ERL)'}</th>
          </tr>
        </thead>
        <tbody>
          {reqs.flatMap((r) => {
            const head = starts.has(r.id)
              ? [
                  <tr key={`g-${r.id}`}>
                    <td colSpan={4} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {r.group}
                    </td>
                  </tr>,
                ]
              : [];
            return [
              ...head,
              <tr key={r.id} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium text-gray-900">{r.title === r.id ? r.id : r.title}</span>
                  {r.title !== r.id && !r.title.endsWith(r.id) && <span className="text-gray-500"> {r.id}</span>}
                  {r.weight !== undefined && r.weight > 0 && <span className="text-gray-500"> · {r.weight} pts</span>}
                  {r.bridged && <span className="ml-1 text-[11px] text-gray-500">(Emruz mapping)</span>}
                  {r.refs && r.refs.length > 0 && <p className="text-xs text-gray-500 mt-0.5">{r.refs.join(' · ')}</p>}
                  {r.note && <p className="text-xs text-gray-700 mt-0.5">{r.note}</p>}
                </td>
                <td className="py-2 pr-3">
                  <Status s={r.status} overridden={r.overridden} />
                </td>
                <td className="py-2 pr-3 text-xs text-gray-600">{r.csf.join(', ')}</td>
                <td className="py-2 text-xs text-gray-600">
                  {showEvidence ? (
                    r.evidence.length ? (
                      <ul className="space-y-0.5">
                        {r.evidence.map((id) => (
                          <li key={id}>{evidenceTitles?.[id] ?? 'Evidence item'}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-red-700">None yet</span>
                    )
                  ) : (
                    r.erl
                      .slice(0, 4)
                      .map((e) => `${e} ${scfEvidenceById.get(e)?.artifact ?? ''}`.trim())
                      .join('; ') + (r.erl.length > 4 ? ` and ${r.erl.length - 4} more` : '')
                  )}
                </td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Obligation views (HIPAA, 800-171, ISO 27001 Annex A, insurer) under the CSF score.
 * Server-safe. Pass evidenceTitles on full assessments to list linked evidence.
 */
export default function ObligationViews({
  views,
  evidenceTitles,
  csvName = 'poam.csv',
  expanded = false,
}: {
  /** Open every view (reports, so they print in full). */
  expanded?: boolean;
  views: ObligationView[];
  /** Evidence titles by ID; when given, each requirement lists its evidence. */
  evidenceTitles?: Record<string, string>;
  csvName?: string;
}) {
  if (!views.length) return null;
  const showEvidence = !!evidenceTitles;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 break-inside-avoid-page">
      <h2 className="text-xl font-bold text-gray-900">Your obligations</h2>
      <p className="text-sm text-gray-600 mt-1 mb-5">
        The NIST CSF 2.0 results above, read against the obligations you answer to. Each requirement is rated through the CSF Subcategories it maps
        to. An estimate to plan from, not a compliance finding.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {views.map((v) => (
          <a key={v.key} href={`#ob-${v.key}`} className="rounded-lg border border-gray-200 p-4 hover:border-blue-400">
            <p className="text-sm font-semibold text-gray-900">{v.name}</p>
            {v.sprs ? (
              <p className="text-2xl font-bold text-gray-900">
                {v.sprs.score} <span className="text-sm font-normal text-gray-500">of {SPRS_MAX} est. SPRS</span>
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {v.counts.met} <span className="text-sm font-normal text-gray-500">of {v.requirements.length} met</span>
              </p>
            )}
            <Counts c={v.counts} />
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {views.map((v) => (
          <details key={v.key} id={`ob-${v.key}`} className="group rounded-lg border border-gray-200 scroll-mt-24" open={expanded || views.length === 1}>
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4">
              <span className="font-semibold text-gray-900">
                {v.name}
                <span className="font-normal text-gray-500"> · {v.requirements.length} requirements</span>
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" aria-hidden />
            </summary>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-600 mb-3">{v.note}</p>

              {v.sprs && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Estimated SPRS score: {v.sprs.score}</span> (range -203 to {SPRS_MAX}). Partly met counts as not
                    implemented, as SPRS has no partial credit except for 3.5.3 and 3.13.11.
                  </p>
                  {v.sprs.noSsp && (
                    <p className="text-sm text-red-700 mt-1">
                      3.12.4 (system security plan) is not met. Without a plan, no SPRS score can be submitted.
                    </p>
                  )}
                  {v.sprs.poam.length > 0 && (
                    <PoamDownload csv={poamCsv(v)} filename={csvName} label={`POA&M starter list (${v.sprs.poam.length} items, CSV)`} />
                  )}
                </div>
              )}

              <Rows reqs={v.requirements} showEvidence={showEvidence} evidenceTitles={evidenceTitles} />

              {v.rev3 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                    NIST SP 800-171 Rev. 3 ({v.rev3.requirements.length} requirements)
                  </summary>
                  <div className="mt-2">
                    <Counts c={v.rev3.counts} />
                    <Rows reqs={v.rev3.requirements} showEvidence={showEvidence} evidenceTitles={evidenceTitles} />
                  </div>
                </details>
              )}
            </div>
          </details>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-5">
        * Status set by the assessor. &ldquo;Emruz mapping&rdquo; marks requirements the SCF does not map to CSF 2.0; Emruz linked them by control
        domain. HICP practice references and the insurer checklist are Emruz content. ISO/IEC 27001 controls are listed by number only. {SCF_ATTRIBUTION}{' '}
        <a href={SCF_URL} className="underline">
          securecontrolsframework.com
        </a>
      </p>
    </div>
  );
}
