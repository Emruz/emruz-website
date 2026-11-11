import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import {
  controls,
  NOT_SURE,
  profileSummary,
  igInfo,
  controlScore,
  notApplicable,
  overallScore,
  maturity,
  recommend,
  withPackage,
  GAP_THRESHOLD,
  type Answers,
  type Profile,
  type IG,
} from '@/content/cis-assessment';
import { addOnHref, capabilities, displayCode, packageHref, POWERED_BY } from '@/content/packages';
import Crosswalk from './Crosswalk';

/** Results of one assessment. No hooks, so it renders on the server. */
export default function ResultsView({
  answers,
  profile,
  ig,
  actions,
}: {
  /** Buttons shown in the "second opinion" bar */
  actions?: React.ReactNode;
  answers: Answers;
  profile: Profile;
  ig: IG;
}) {
  const score = overallScore(answers, ig, profile);
  const ig1 = overallScore(answers, 1, profile);
  const m = maturity(score);
  const rec = recommend(answers, ig, profile);
  const projected = withPackage(answers, rec.pkg);
  const after = overallScore(projected, ig, profile);
  const extras = rec.addOns;
  const projectedAll = withPackage(answers, rec.pkg, ...extras);
  const afterAll = overallScore(projectedAll, ig, profile);
  const unsure = Object.values(answers).filter((v) => v === NOT_SURE).length;

  const summary = [
    `CIS v8 self-assessment: ${score}% (${m.label}) at ${igInfo[ig].name.split(':')[0]}`,
    `IG1 hygiene: ${ig1}%`,
    rec.gaps.length ? `Top gaps: ${rec.gaps.slice(0, 5).map((g) => `CIS ${g.control.id} (${g.score}%)`).join(', ')}` : 'No major gaps',
    rec.pkg ? `Suggested: ${displayCode(rec.pkg.code)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const contactHref = `/contact?topic=${encodeURIComponent('Self-assessment results')}&message=${encodeURIComponent(summary)}`;

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 grid md:grid-cols-3 gap-6 items-center">
        <div>
          <p className="text-sm text-gray-500">Overall maturity</p>
          <p className="text-5xl font-bold text-gray-900">{score}%</p>
          <p className={`font-semibold ${m.color}`}>{m.label}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Measured against</p>
          <p className="font-semibold text-gray-900">{igInfo[ig].name}</p>
          <p className="text-sm text-gray-600">{igInfo[ig].description}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Essential cyber hygiene (IG1)</p>
          <p className="text-2xl font-bold text-gray-900">{ig1}%</p>
          <p className="text-sm text-gray-600">{ig1 >= 90 ? 'Strong foundation.' : 'Start here. These basics stop most common attacks.'}</p>
        </div>
        {unsure > 0 && (
          <p className="md:col-span-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
            You answered &ldquo;Not sure&rdquo; {unsure} {unsure === 1 ? 'time' : 'times'}. Those count as not in place. Confirming them may raise your score.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* By control */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">By control</h2>
          <table className="w-full text-sm border-separate border-spacing-0">
            {(rec.pkg || extras.length > 0) && (
              <thead>
                <tr>
                  <th />
                  <th />
                  {rec.pkg && (
                    <th className="bg-slate-900/75 text-white rounded-t-lg px-3 pt-3 pb-2 text-center align-bottom w-24">
                      <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-300">With</span>
                      <span className="block font-bold whitespace-nowrap">{displayCode(rec.pkg.code)}</span>
                    </th>
                  )}
                  {extras.length > 0 && (
                    <th className="bg-indigo-800/75 text-white rounded-t-lg px-3 pt-3 pb-2 text-center align-bottom w-28">
                      <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-200">{rec.pkg ? 'Plus' : 'With'}</span>
                      <span className="block font-bold text-xs leading-tight">{extras.map((a) => a.code).join(' + ')}</span>
                    </th>
                  )}
                </tr>
              </thead>
            )}
            <tbody>
              {controls.map((c, i) => {
                const s = controlScore(c, answers, ig, profile);
                const na = notApplicable(c, ig, profile);
                const cm = s === null ? null : maturity(s);
                const after = rec.pkg ? controlScore(c, projected, ig, profile) : null;
                const lifted = s !== null && after !== null && after > s;
                const afterAll = extras.length ? controlScore(c, projectedAll, ig, profile) : null;
                const liftedAll = afterAll !== null && afterAll > (after ?? s ?? 0);
                const last = i === controls.length - 1;
                return (
                  <tr key={c.id}>
                    <td className="py-1.5 pr-4 align-top">
                      <span className="text-gray-800">
                        <span className="text-gray-400 w-6 inline-block">{c.id}</span>
                        {c.title}
                      </span>
                      <div className="ml-6 mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        {s !== null && <div className={`h-full ${cm!.bar}`} style={{ width: `${Math.max(s, 2)}%` }} />}
                      </div>
                    </td>
                    <td className={`py-1.5 pr-4 align-top text-right font-semibold whitespace-nowrap ${cm ? cm.color : 'text-gray-400'}`}>
                      {s === null ? (na ? 'Not applicable' : 'Not in scope') : `${s}%`}
                    </td>
                    {rec.pkg && (
                      <td className={`bg-slate-900/75 px-3 py-1.5 align-top text-center whitespace-nowrap ${last ? 'rounded-b-lg pb-3' : ''}`}>
                        {s === null ? (
                          <span className="text-slate-200">–</span>
                        ) : (
                          <span className={lifted ? 'font-bold text-emerald-200' : 'text-slate-100'}>→ {after}%</span>
                        )}
                      </td>
                    )}
                    {extras.length > 0 && (
                      <td className={`bg-indigo-800/75 px-3 py-1.5 align-top text-center whitespace-nowrap ${last ? 'rounded-b-lg pb-3' : ''}`}>
                        {s === null ? (
                          <span className="text-indigo-200">–</span>
                        ) : (
                          <span className={liftedAll ? 'font-bold text-emerald-200' : 'text-indigo-100'}>→ {afterAll}%</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(rec.pkg || extras.length > 0) && (
            <p className="text-xs text-gray-500 mt-4">
              Shaded columns show your score with the suggested services in place. Overall {score}%
              {rec.pkg && <> → {after}% with {displayCode(rec.pkg.code)}</>}
              {extras.length > 0 && <> → {afterAll}% adding {extras.map((a) => a.code).join(', ')}</>}. Process work such as
              supplier management and secure development is not included.
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Biggest gaps</h2>
            {rec.gaps.length === 0 ? (
              <p className="text-gray-700 flex gap-2">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Every control in scope scores {GAP_THRESHOLD}% or more.
              </p>
            ) : (
              <ol className="space-y-2 text-sm">
                {rec.gaps.slice(0, 5).map((g) => (
                  <li key={g.control.id} className="flex justify-between gap-3">
                    <span className="text-gray-800">
                      CIS {g.control.id}: {g.control.title}
                    </span>
                    <span className={`font-semibold ${maturity(g.score).color}`}>{g.score}%</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {rec.pkg && (
            <div className="bg-slate-900 text-white rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">Closes the most gaps</p>
              <h3 className="text-xl font-bold">{displayCode(rec.pkg.code)}</h3>
              <p className="text-slate-300 text-sm mb-3">{rec.pkg.name}</p>
              <ul className="space-y-1 text-sm mb-4">
                {rec.covered.map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {capabilities[c].name}
                  </li>
                ))}
              </ul>
              <Link href={packageHref(rec.pkg)} className="inline-flex items-center gap-1 font-semibold text-indigo-200 hover:text-white print:hidden">
                See what&rsquo;s included <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-slate-400 mt-3">{POWERED_BY}</p>
            </div>
          )}

          {extras.length > 0 && (
            <div className="bg-indigo-800 text-white rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-3">{rec.pkg ? 'Add to close more gaps' : 'Closes your gaps'}</p>
              <ul className="space-y-4">
                {extras.map((a) => (
                  <li key={a.code}>
                    <p className="font-bold">{a.code} <span className="font-normal text-indigo-200 text-sm">· {a.name}</span></p>
                    <p className="text-sm text-indigo-100">{a.summary}</p>
                    <Link href={addOnHref(a)} className="text-sm font-semibold text-indigo-200 hover:text-white print:hidden">Learn more →</Link>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-indigo-300 mt-3">{POWERED_BY}</p>
            </div>
          )}

          {rec.services.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Advisory help</h3>
              <ul className="space-y-1.5 text-sm">
                {rec.services.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-blue-700 font-semibold hover:underline">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Crosswalk answers={answers} ig={ig} profile={profile} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h3 className="font-bold text-gray-900">Want a second opinion?</h3>
          <p className="text-sm text-gray-600">We&rsquo;ll be in touch to walk through your results. Want to talk sooner?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={contactHref} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700">
            Talk to us now
          </Link>
          {actions}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Profile: {profileSummary(profile)}. This self-assessment is
        indicative only and is not an audit or certification.
      </p>
    </div>
  );
}
