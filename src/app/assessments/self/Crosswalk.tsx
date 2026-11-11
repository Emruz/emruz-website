import { ChevronDown } from 'lucide-react';
import { frameworks, frameworkResult, type FrameworkKey, type Status } from '@/content/crosswalk';
import type { Answers, IG, Profile } from '@/content/cis-assessment';

const badge: Record<Status, string> = {
  met: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  gap: 'bg-red-50 text-red-700 border-red-200',
};
const label: Record<Status, string> = { met: 'In place', partial: 'Partial', gap: 'Gap' };

/** How the answers map to CMMC, ISO 27001, NIST CSF and SOC 2. Server-safe. */
export default function Crosswalk({ answers, ig, profile }: { answers: Answers; ig: IG; profile: Profile }) {
  const focus: FrameworkKey[] = profile.frameworks ?? [];
  const ordered = [...frameworks].sort((a, b) => Number(focus.includes(b.key)) - Number(focus.includes(a.key)));
  const results = ordered.map((f) => frameworkResult(f.key, answers, ig, profile));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900">Framework crosswalk</h2>
      <p className="text-sm text-gray-600 mt-1 mb-5">
        Your answers mapped to CIS safeguards and related requirements in other frameworks. A readiness indicator, not a compliance
        finding.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {results.map((r) => (
          <a
            key={r.framework.key}
            href={`#fw-${r.framework.key}`}
            className={`rounded-lg border p-4 hover:border-blue-400 ${focus.includes(r.framework.key) ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}
          >
            <p className="text-sm font-semibold text-gray-900">{r.framework.short}</p>
            <p className="text-2xl font-bold text-gray-900">{r.score}%</p>
            <p className="text-xs text-gray-600">
              {r.counts.met} in place · {r.counts.partial} partial · {r.counts.gap} gaps
            </p>
            {focus.includes(r.framework.key) && <p className="text-[11px] font-semibold text-blue-700 mt-1">Your focus</p>}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {results.map((r) => (
          <details
            key={r.framework.key}
            id={`fw-${r.framework.key}`}
            open={focus.includes(r.framework.key)}
            className="group rounded-lg border border-gray-200 scroll-mt-24"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4">
              <span className="font-semibold text-gray-900">
                {r.framework.name}
                <span className="font-normal text-gray-500">
                  {' '}· {r.items.length} {r.framework.key === 'cis' ? 'safeguards' : 'related requirements'}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" aria-hidden />
            </summary>
            <div className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-3 font-medium">ID</th>
                      <th className="py-2 pr-3 font-medium">Requirement</th>
                      <th className="py-2 pr-3 font-medium whitespace-nowrap">From CIS</th>
                      <th className="py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((i) => (
                      <tr key={i.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs text-gray-700 whitespace-nowrap">{i.id}</td>
                        <td className="py-2 pr-3 text-gray-800">{i.title}</td>
                        <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{i.cis.join(', ')}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${badge[i.status]}`}>
                            {label[i.status]} {i.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                <span className="font-semibold">Not covered by this assessment:</span> {r.framework.notCovered}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
