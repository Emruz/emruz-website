import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import {
  functions,
  NOT_SURE,
  profileSummary,
  tierInfo,
  categoryScore,
  functionScore,
  notApplicable,
  overallScore,
  maturity,
  recommend,
  withPackage,
  GAP_THRESHOLD,
  type Answers,
  type Profile,
  type Tier,
} from '@/content/self-assessment';
import { addOnHref, addOnLabel, capabilities, displayCode, packageHref, POWERED_BY } from '@/content/packages';
import Crosswalk from './Crosswalk';
import ObligationViews from '@/components/assessment/ObligationViews';
import { cleanObligations, obligationView } from '@/content/obligations';
import { prefillFromSelf } from '@/content/workbench';

/** Results of one assessment. No hooks, so it renders on the server. */
export default function ResultsView({
  answers,
  profile,
  tier,
  actions,
  staffView = false,
}: {
  /** Workbench view: hide the customer call to action */
  staffView?: boolean;
  /** Buttons shown in the "second opinion" bar */
  actions?: React.ReactNode;
  answers: Answers;
  profile: Profile;
  tier: Tier;
}) {
  const ig = tier;
  const score = overallScore(answers, ig, profile);
  const essential = overallScore(answers, 1, profile);
  const m = maturity(score);
  const rec = recommend(answers, ig, profile);
  const projected = withPackage(answers, rec.pkg);
  const after = overallScore(projected, ig, profile);
  const extras = rec.addOns;
  const projectedAll = withPackage(answers, rec.pkg, ...extras);
  const afterAll = overallScore(projectedAll, ig, profile);
  const cols = 2 + (rec.pkg ? 1 : 0) + (extras.length ? 1 : 0);
  const unsure = Object.values(answers).filter((v) => v === NOT_SURE).length;
  const obligations = cleanObligations(profile.obligations);
  const csfRatings = obligations.length ? prefillFromSelf(answers, profile, ig) : {};
  const views = obligations.map((k) => obligationView(k, csfRatings));

  const summary = [
    `NIST CSF 2.0 self-assessment: ${score}% (${m.label}), ${tierInfo[ig].name} profile`,
    ig > 1 ? `Essential practices: ${essential}%` : '',
    rec.gaps.length ? `Top gaps: ${rec.gaps.slice(0, 5).map((g) => `${g.category.id} (${g.score}%)`).join(', ')}` : 'No major gaps',
    rec.pkg ? `Suggested: ${displayCode(rec.pkg.code)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const contactHref = `/contact?topic=${encodeURIComponent('Self-assessment results')}&message=${encodeURIComponent(summary)}`;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 md:p-8 grid md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="text-sm text-gray-500">Overall maturity</p>
            <p className="text-5xl font-bold text-gray-900">{score}%</p>
            <p className={`font-semibold ${m.color}`}>{m.label}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target profile</p>
            <p className="font-semibold text-gray-900">{tierInfo[ig].name}</p>
            <p className="text-sm text-gray-600">{tierInfo[ig].description}</p>
            <p className="text-xs text-gray-500 mt-1">NIST CSF 2.0, aligned to {tierInfo[ig].csfTier}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Essential practices</p>
            <p className="text-2xl font-bold text-gray-900">{essential}%</p>
            <p className="text-sm text-gray-600">{essential >= 90 ? 'Strong foundation.' : 'Start here. These basics stop most common attacks.'}</p>
          </div>
          {unsure > 0 && (
            <p className="md:col-span-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
              You answered &ldquo;Not sure&rdquo; {unsure} {unsure === 1 ? 'time' : 'times'}. Those count as not in place. Confirming them may raise your score.
            </p>
          )}
        </div>

        {/* Biggest gaps */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Biggest gaps</h2>
          {rec.gaps.length === 0 ? (
            <p className="text-gray-700 flex gap-2">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" /> Every category in scope scores {GAP_THRESHOLD}% or more.
            </p>
          ) : (
            <ol className="space-y-2 text-sm">
              {rec.gaps.slice(0, 5).map((g) => (
                <li key={g.category.id} className="flex justify-between gap-3">
                  <span className="text-gray-800">
                    <span className="font-mono text-xs text-gray-500 mr-1">{g.category.id}</span> {g.category.title}
                  </span>
                  <span className={`font-semibold ${maturity(g.score).color}`}>{g.score}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* By CSF Function and Category */}
        <div className="lg:col-span-2 min-w-0 bg-white border border-gray-200 rounded-xl p-4 sm:p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">By CSF Function and Category</h2>
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            {(rec.pkg || extras.length > 0) && (
              <thead>
                <tr>
                  <th />
                  <th />
                  {rec.pkg && (
                    <th className="bg-slate-900/80 text-white rounded-t-lg px-2 pt-3 pb-2 text-center align-bottom w-20 min-w-20 max-w-20 sm:w-28 sm:min-w-28 sm:max-w-28">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-white/90">With</span>
                      <span className="block font-extrabold text-base whitespace-nowrap">{displayCode(rec.pkg.code)}</span>
                    </th>
                  )}
                  {extras.length > 0 && (
                    <th className="bg-indigo-800/80 text-white rounded-t-lg px-2 pt-3 pb-2 text-center align-bottom w-20 min-w-20 max-w-20 sm:w-28 sm:min-w-28 sm:max-w-28">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-white/90">{rec.pkg ? 'Plus' : 'With'}</span>
                      <span className="block font-extrabold text-xs leading-tight">{extras.map((a, i) => (
                        <Fragment key={a.code}>
                          {i > 0 && ' + '}
                          <span className="whitespace-nowrap">{addOnLabel(a)}</span>
                        </Fragment>
                      ))}</span>
                    </th>
                  )}
                </tr>
              </thead>
            )}
            <tbody>
              {functions.flatMap((f, fi) => {
                const fs = functionScore(f.id, answers, ig, profile);
                const header = (
                  <tr key={f.id}>
                    <td className={`pr-4 pb-1 font-bold text-gray-900 ${fi > 0 ? 'pt-4' : ''}`}>{f.title}</td>
                    <td className={`pr-4 pb-1 text-right font-bold whitespace-nowrap ${fs === null ? 'text-gray-400' : maturity(fs).color} ${fi > 0 ? 'pt-4' : ''}`}>
                      {fs === null ? '' : `${fs}%`}
                    </td>
                    {cols > 2 && rec.pkg && <td className="bg-slate-900/80" />}
                    {cols > 2 && extras.length > 0 && <td className="bg-indigo-800/80" />}
                  </tr>
                );
                return [header, ...f.categories.map((c, ci) => {
                const s = categoryScore(c, answers, ig, profile);
                const na = notApplicable(c, ig, profile);
                const cm = s === null ? null : maturity(s);
                const after = rec.pkg ? categoryScore(c, projected, ig, profile) : null;
                const lifted = s !== null && after !== null && after > s;
                const afterAll = extras.length ? categoryScore(c, projectedAll, ig, profile) : null;
                const liftedAll = afterAll !== null && afterAll > (after ?? s ?? 0);
                const last = fi === functions.length - 1 && ci === f.categories.length - 1;
                return (
                  <tr key={c.id}>
                    <td className="py-1.5 pr-4 align-top">
                      <span className="text-gray-800">
                        <span className="text-gray-400 font-mono text-xs block sm:inline-block sm:w-14">{c.id}</span>
                        {c.title}
                      </span>
                      <div className="sm:ml-14 mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        {s !== null && <div className={`h-full ${cm!.bar}`} style={{ width: `${Math.max(s, 2)}%` }} />}
                      </div>
                    </td>
                    <td className={`py-1.5 pr-4 align-top text-right font-semibold whitespace-nowrap ${cm ? cm.color : 'text-gray-400'}`}>
                      {s === null ? (na ? 'Not applicable' : 'Not in scope') : `${s}%`}
                    </td>
                    {rec.pkg && (
                      <td className={`bg-slate-900/80 px-1.5 sm:px-3 py-1.5 align-top text-center whitespace-nowrap ${last ? 'rounded-b-lg pb-3' : ''}`}>
                        {s === null ? (
                          <span className="text-white/80">–</span>
                        ) : (
                          <span className={lifted ? 'font-bold text-white bg-emerald-600 rounded px-1.5 py-0.5' : 'font-semibold text-white'}>→ {after}%</span>
                        )}
                      </td>
                    )}
                    {extras.length > 0 && (
                      <td className={`bg-indigo-800/80 px-1.5 sm:px-3 py-1.5 align-top text-center whitespace-nowrap ${last ? 'rounded-b-lg pb-3' : ''}`}>
                        {s === null ? (
                          <span className="text-white/80">–</span>
                        ) : (
                          <span className={liftedAll ? 'font-bold text-white bg-emerald-600 rounded px-1.5 py-0.5' : 'font-semibold text-white'}>→ {afterAll}%</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })];
              })}
            </tbody>
          </table>
          </div>
          {(rec.pkg || extras.length > 0) && (
            <p className="text-xs text-gray-500 mt-4">
              Shaded columns show your score with the suggested services in place. Overall {score}%
              {rec.pkg && <> → {after}% with {displayCode(rec.pkg.code)}</>}
              {extras.length > 0 && <> → {afterAll}% adding {extras.map((a) => addOnLabel(a)).join(', ')}</>}. Process work such as
              governance, supplier management and secure development is not included.
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div className="space-y-6">
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
                    <p className="font-bold">{addOnLabel(a)} <span className="font-normal text-indigo-200 text-sm">· {a.name}</span></p>
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

      <Crosswalk
        answers={answers}
        tier={ig}
        profile={profile}
        withPkg={rec.pkg ? { label: displayCode(rec.pkg.code), answers: projected } : null}
        withAll={extras.length ? { codes: extras.map((a) => addOnLabel(a)), plus: !!rec.pkg, answers: projectedAll } : null}
      />

      <ObligationViews views={views} csvName="poam-self-assessment.csv" />

      {!staffView && (
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
      )}

      <p className="text-xs text-gray-500">
        Profile: {profileSummary(profile)}. This self-assessment is
        indicative only and is not an audit or certification.
      </p>
    </div>
  );
}
