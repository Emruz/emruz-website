import { csfCategories, csfFunctions } from '@/content/csf';
import { intakeFields, maturityLevels, tierFor, EVIDENCE_REQUIRED_AT } from '@/content/workbench';
import type { ReportContent } from '@/lib/server/workbench';

const fmt = (d: string | null) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'America/Los_Angeles' }) : null;
const lvl = (n: number | null) => (n === null ? '–' : String(n));
const relLabel = { cis: 'CIS', cmmc: 'CMMC', iso: 'ISO 27001', soc2: 'SOC 2' } as const;

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mb-3 whitespace-pre-line">{p}</p>
        ))}
    </>
  );
}

/**
 * The assessment report, rendered from a frozen snapshot. Every finding links
 * to the evidence behind it (E1, E2...) and the evidence index links to the files.
 */
export default function ReportDocument({ c, version, draft }: { c: ReportContent; version: number; draft: boolean }) {
  const evNum = new Map(c.evidenceIndex.map((e, i) => [e.id, i + 1]));
  const priority = c.findings
    .filter((f) => f.priority)
    .sort((a, b) => (a.priority === b.priority ? a.id.localeCompare(b.id) : a.priority === 'High' ? -1 : 1));
  const unverified = c.findings.filter((f) => f.unverified && !f.overrideReason);
  const scopeKeys = ['overview', 'in_scope', 'out_of_scope', 'crown_jewels', 'regulations', 'method', 'constraints'];
  const overall = c.rollup.overall.current;

  const evRefs = (evs: { id: string }[]) =>
    evs.length ? (
      <span className="text-xs">
        {evs.map((e) => (
          <a key={e.id} href={`#ev-${evNum.get(e.id)}`} className="text-blue-700 mr-1 hover:underline">[E{evNum.get(e.id)}]</a>
        ))}
      </span>
    ) : null;

  return (
    <article className="report bg-white border border-gray-200 rounded-xl p-8 md:p-12 text-gray-800 text-[15px] leading-relaxed relative print:border-0 print:p-0">
      {draft && (
        <div className="absolute top-4 right-4 text-xs font-bold tracking-widest text-red-600 border border-red-300 rounded px-2 py-1">DRAFT v{version}</div>
      )}

      <header className="mb-10 border-b border-gray-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Emruz · NIST CSF 2.0 Assessment</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">{c.client}</h1>
        <p className="text-lg text-gray-600 mt-1">{c.title}</p>
        <dl className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-gray-500">Assessment period</dt><dd>{[fmt(c.period.start), fmt(c.period.end)].filter(Boolean).join(' to ') || '–'}</dd></div>
          <div><dt className="text-gray-500">Lead assessor</dt><dd>{c.assessor ?? '–'}</dd></div>
          <div><dt className="text-gray-500">Report version</dt><dd>v{version}, {fmt(c.generatedAt)}</dd></div>
        </dl>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Executive summary</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Overall maturity</p>
            <p className="text-3xl font-bold text-gray-900">{overall ?? '–'}<span className="text-base text-gray-500"> / 5</span></p>
            <p className="text-sm font-semibold text-blue-700">{tierFor(overall).label}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-3xl font-bold text-gray-900">{c.rollup.overall.target ?? '–'}<span className="text-base text-gray-500"> / 5</span></p>
            <p className="text-sm text-gray-600">CIS IG{c.targetIg} profile</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Priority findings</p>
            <p className="text-3xl font-bold text-gray-900">{priority.length}</p>
            <p className="text-sm text-gray-600">{priority.filter((p) => p.priority === 'High').length} high, {priority.filter((p) => p.priority === 'Medium').length} medium</p>
          </div>
        </div>
        {c.summary.trim() ? <Paragraphs text={c.summary} /> : draft && <p className="text-red-700 italic">Executive summary not written yet.</p>}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Scope and approach</h2>
        <dl className="space-y-3 mb-5">
          {scopeKeys
            .filter((k) => c.intake[k]?.trim())
            .map((k) => (
              <div key={k}>
                <dt className="text-sm font-semibold text-gray-900">{intakeFields.find((f) => f.key === k)?.label}</dt>
                <dd className="whitespace-pre-line">{c.intake[k]}</dd>
              </div>
            ))}
        </dl>
        <h3 className="font-semibold text-gray-900 mb-2">Scoring method</h3>
        <p className="mb-2">
          We rated each of the {c.rollup.total} NIST CSF 2.0 subcategories on a six-point maturity scale, using interviews,
          document review and observation. Category scores average their subcategories, function scores average their
          categories, and the overall score averages the six functions. Items marked not applicable are excluded.
        </p>
        <table className="w-full text-sm mb-2">
          <tbody>
            {maturityLevels.map((m) => (
              <tr key={m.value} className="border-b border-gray-100">
                <td className="py-1 pr-3 font-semibold w-8">{m.value}</td>
                <td className="py-1 pr-3 font-semibold w-36">{m.label}</td>
                <td className="py-1 text-gray-600">{m.help}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-gray-600">
          Ratings of {EVIDENCE_REQUIRED_AT} or higher are supported by evidence listed in Appendix A. Function scores map to CSF
          tiers: under 1.5 Partial, under 2.5 Risk Informed, under 3.5 Repeatable, otherwise Adaptive.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Results by function</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3 font-medium">Function</th>
              <th className="py-2 pr-3 font-medium">Current</th>
              <th className="py-2 pr-3 font-medium">Target</th>
              <th className="py-2 pr-3 font-medium">Tier</th>
              <th className="py-2 font-medium w-1/3" aria-label="Chart" />
            </tr>
          </thead>
          <tbody>
            {c.rollup.functions.map((f) => (
              <tr key={f.id} className="border-b border-gray-100">
                <td className="py-2 pr-3 font-semibold text-gray-900">{f.title}</td>
                <td className="py-2 pr-3">{f.current ?? '–'}</td>
                <td className="py-2 pr-3">{f.target ?? '–'}</td>
                <td className="py-2 pr-3">{tierFor(f.current).label}</td>
                <td className="py-2">
                  <div className="relative h-2 bg-gray-100 rounded-full">
                    <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style={{ width: `${((f.current ?? 0) / 5) * 100}%` }} />
                    {f.target !== null && <div className="absolute -top-1 -bottom-1 w-0.5 bg-gray-800" style={{ left: `${(f.target / 5) * 100}%` }} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="font-semibold text-gray-900 mt-6 mb-2">By category</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 text-sm">
          {c.rollup.categories.map((cat) => (
            <div key={cat.id} className="flex justify-between border-b border-gray-100 py-1">
              <span><span className="font-mono text-xs text-gray-500 mr-2">{cat.id}</span>{cat.title}</span>
              <span className={cat.current !== null && cat.target !== null && cat.target - cat.current >= 1 ? 'text-red-700 font-semibold' : ''}>
                {cat.current ?? '–'} / {cat.target ?? '–'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Priority findings and recommendations</h2>
        {priority.length === 0 && <p>No subcategory is below its target.</p>}
        <ol className="space-y-5">
          {priority.map((f, i) => (
            <li key={f.id} id={`f-${f.id}`} className="border-l-4 pl-4 break-inside-avoid" style={{ borderColor: f.priority === 'High' ? '#dc2626' : '#f59e0b' }}>
              <p className="text-sm">
                <span className={`font-semibold ${f.priority === 'High' ? 'text-red-700' : 'text-amber-700'}`}>{f.priority}</span>
                <span className="text-gray-500"> · {i + 1} · </span>
                <span className="font-mono text-xs">{f.id}</span>
                <span className="text-gray-500"> · current {lvl(f.current)}, target {lvl(f.target)}</span>
              </p>
              <p className="font-semibold text-gray-900">{f.text}</p>
              {f.notes && <p className="mt-1"><span className="font-semibold">Observation: </span>{f.notes} {evRefs(f.evidence)}</p>}
              {!f.notes && f.evidence.length > 0 && <p className="mt-1">{evRefs(f.evidence)}</p>}
              {f.recommendation ? (
                <p className="mt-1"><span className="font-semibold">Recommendation: </span>{f.recommendation}</p>
              ) : (
                draft && <p className="mt-1 text-red-700 italic">Recommendation missing.</p>
              )}
              {Object.keys(f.related).length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Related:{' '}
                  {(Object.keys(relLabel) as (keyof typeof relLabel)[])
                    .filter((k) => f.related[k]?.length)
                    .map((k) => `${relLabel[k]} ${f.related[k]!.join(', ')}`)
                    .join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Detailed results</h2>
        {csfFunctions.map((fn) => (
          <div key={fn.id} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{fn.title}</h3>
            {csfCategories
              .filter((cat) => cat.fn === fn.id)
              .map((cat) => (
                <table key={cat.id} className="w-full text-sm mb-3">
                  <caption className="text-left text-xs font-semibold text-gray-500 py-1">{cat.id} {cat.title}</caption>
                  <tbody>
                    {c.findings
                      .filter((f) => f.category === cat.id)
                      .map((f) => (
                        <tr key={f.id} id={`d-${f.id}`} className="border-b border-gray-100 align-top scroll-mt-24">
                          <td className="py-1 pr-3 font-mono text-xs text-gray-500 w-20">{f.id}</td>
                          <td className="py-1 pr-3">
                            {f.text}
                            {f.na && <span className="block text-xs text-gray-500">Not applicable: {f.naReason}</span>}
                            {f.unverified && !f.overrideReason && <span className="block text-xs text-red-700">Unverified: no supporting evidence</span>}
                            {f.overrideReason && <span className="block text-xs text-gray-500">Verified: {f.overrideReason}</span>}
                          </td>
                          <td className="py-1 pr-3 whitespace-nowrap text-right w-24">{f.na ? 'N/A' : `${lvl(f.current)} / ${lvl(f.target)}`}</td>
                          <td className="py-1 w-24 text-right">{evRefs(f.evidence)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ))}
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitations</h2>
        <p className="mb-2">
          This assessment reflects what we observed and the evidence provided during the assessment period. It is not an
          audit or certification, and it does not guarantee that the organization is secure. Mappings to CIS, CMMC, ISO
          27001 and SOC 2 are indicative.
        </p>
        {unverified.length > 0 && (
          <p className="text-red-700">
            {unverified.length} ratings of {EVIDENCE_REQUIRED_AT} or higher have no supporting evidence: {unverified.map((f) => f.id).join(', ')}.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Appendix A. Evidence index</h2>
        {c.evidenceIndex.length === 0 && <p>No evidence recorded.</p>}
        <table className="w-full text-sm">
          <tbody>
            {c.evidenceIndex.map((e, i) => (
              <tr key={e.id} id={`ev-${i + 1}`} className="border-b border-gray-100 align-top scroll-mt-24">
                <td className="py-1 pr-3 font-semibold w-12">E{i + 1}</td>
                <td className="py-1 pr-3">
                  <a href={`/api/evidence/${e.id}`} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{e.title}</a>
                  <span className="text-xs text-gray-500"> · {e.kind === 'link' ? 'link' : e.filename}{e.fromClient ? ' · provided by client' : ''}</span>
                </td>
                <td className="py-1 font-mono text-xs text-gray-500 text-right">
                  {e.subcategories.map((s) => <a key={s} href={`#d-${s}`} className="ml-1 hover:underline">{s}</a>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}
