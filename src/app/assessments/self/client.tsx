'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Container } from '@/components';
import {
  controls,
  scale,
  NOT_SURE,
  profileQuestions,
  igInfo,
  targetIG,
  inScope,
  notApplicable,
  profileDone,
  type Answers,
  type Profile,
  type IG,
} from '@/content/cis-assessment';
import { frameworks } from '@/content/crosswalk';
import { finish, saveProgress } from './actions';

const LAST = controls.length;


interface Props {
  id: string;
  initial: { step: number; profile: Profile; answers: Answers };
  hasHistory: boolean;
}

export default function SelfAssessment({ id, initial, hasHistory }: Props) {
  const [step, setStep] = useState(Math.min(initial.step, LAST));
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [error, setError] = useState<string | null>(null);
  const [finishing, startFinish] = useTransition();
  const top = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Autosave a moment after each change
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      setSaveState('saving');
      saveProgress(id, { step, profile, answers })
        .then((r) => setSaveState(r.ok ? 'saved' : 'error'))
        .catch(() => setSaveState('error'));
    }, 600);
    return () => clearTimeout(t);
  }, [id, step, profile, answers]);

  const ig: IG = targetIG(profile);
  const go = (n: number) => {
    setStep(n);
    top.current?.scrollIntoView({ block: 'start' });
  };

  const done = () =>
    startFinish(async () => {
      setError(null);
      const r = await finish(id, { profile, answers });
      if (r && !r.ok) setError(r.error ?? 'Could not save. Please try again.');
    });

  const answeredCount = controls.flatMap((c) => inScope(c, ig, profile)).filter((q) => q.id in answers).length;
  const totalInScope = controls.flatMap((c) => inScope(c, ig, profile)).length;

  // Steps (1-based) for controls with at least one question that applies
  const steps = controls.map((c, i) => (inScope(c, ig, profile).length ? i + 1 : 0)).filter(Boolean);
  const nextStep = steps.find((n) => n > step);
  const prevStep = [...steps].reverse().find((n) => n < step) ?? 0;

  return (
    <section className="py-8 md:py-10 bg-gray-50 min-h-[60vh] scroll-mt-20" ref={top}>
      <Container>
        {step > 0 && (
          <Progress step={step} answered={answeredCount} total={totalInScope} onJump={go} answers={answers} ig={ig} profile={profile} saveState={saveState} />
        )}

        {step === 0 && (
          <Intro profile={profile} setProfile={setProfile} ig={ig} onStart={() => go(steps[0] ?? 1)} resumed={Object.keys(answers).length > 0} hasHistory={hasHistory} />
        )}

        {step > 0 && (
          <ControlStep
            index={step - 1}
            ig={ig}
            answers={answers}
            setAnswer={(qid, v) => setAnswers((a) => ({ ...a, [qid]: v }))}
            profile={profile}
            last={!nextStep}
            onBack={() => go(prevStep)}
            onNext={() => (nextStep ? go(nextStep) : done())}
            busy={finishing}
          />
        )}
        {error && <p role="alert" className="mt-4 text-red-700 font-semibold">{error}</p>}
      </Container>
    </section>
  );
}

/* ---------- Intro and profile ---------- */

function Intro({
  profile,
  setProfile,
  ig,
  onStart,
  resumed,
  hasHistory,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  ig: IG;
  onStart: () => void;
  resumed: boolean;
  hasHistory: boolean;
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">About your organization</h2>
        <p className="text-gray-600 mb-6">A few questions set the right bar for you.</p>

        <div className="space-y-6">
          {profileQuestions.map((q) => (
            <fieldset key={q.key}>
              <legend className="font-semibold text-gray-900 mb-2">{q.text}</legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = profile[q.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setProfile({ ...profile, [q.key]: o.value })}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        on ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <fieldset>
            <legend className="font-semibold text-gray-900 mb-1">Which frameworks matter to you?</legend>
            <p className="text-sm text-gray-500 mb-2">Optional. Pick any. Your report maps your answers to each one.</p>
            <div className="flex flex-wrap gap-2">
              {frameworks.map((f) => {
                const chosen = profile.frameworks ?? [];
                const on = chosen.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setProfile({ ...profile, frameworks: on ? chosen.filter((k) => k !== f.key) : [...chosen, f.key] })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      on ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {on && <Check className="w-4 h-4 inline -mt-0.5 mr-1" aria-hidden />}
                    {f.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {profileDone(profile) && (
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Your target: {igInfo[ig].name}.</span> {igInfo[ig].description}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!profileDone(profile)}
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resumed ? 'Continue' : 'Start'} <ArrowRight className="w-4 h-4" />
          </button>
          {hasHistory && (
            <Link href="/assessments/self/history" className="px-5 py-3 rounded-lg font-semibold text-blue-700 hover:bg-blue-50">
              Your past results
            </Link>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">How it works</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li><span className="font-semibold">1.</span> Answer up to three questions for each of the 18 CIS Controls.</li>
            <li><span className="font-semibold">2.</span> Rate each one from &ldquo;Not in place&rdquo; to &ldquo;Fully&rdquo;. Pick &ldquo;Not sure&rdquo; if you don&rsquo;t know.</li>
            <li><span className="font-semibold">3.</span> Get your score, your biggest gaps, what closes them and how you map to CIS, CMMC, ISO 27001, NIST CSF and SOC 2.</li>
          </ol>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Private by design
          </h3>
          <p className="text-sm text-gray-700">
            Answers save as you go, so you can stop and come back from any device. Only you and the Emruz team can see them.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Progress ---------- */

function Progress({
  step,
  answered,
  total,
  onJump,
  answers,
  ig,
  profile,
  saveState,
}: {
  profile: Profile;
  saveState: 'saved' | 'saving' | 'error';
  step: number;
  answered: number;
  total: number;
  onJump: (n: number) => void;
  answers: Answers;
  ig: IG;
}) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>
          Control {step} of {controls.length}
        </span>
        <span>
          {pct}% answered
          <span className={`ml-3 ${saveState === 'error' ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Not saved' : 'Saved'}
          </span>
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <nav aria-label="Controls" className="mt-3 flex flex-wrap gap-1.5">
        {controls.map((c, i) => {
          const qs = inScope(c, ig, profile);
          const done = qs.length > 0 && qs.every((q) => q.id in answers);
          const current = step === i + 1;
          return (
            <button
              key={c.id}
              type="button"
              disabled={qs.length === 0}
              onClick={() => onJump(i + 1)}
              title={qs.length === 0 ? `${c.title}: doesn't apply` : c.title}
              aria-current={current ? 'step' : undefined}
              className={`w-8 h-8 rounded-md text-xs font-semibold border ${
                current
                  ? 'bg-blue-600 text-white border-blue-600'
                  : done
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : qs.length === 0
                      ? 'bg-gray-100 text-gray-300 border-gray-200 line-through cursor-not-allowed'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {c.id}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------- One control ---------- */

function ControlStep({
  index,
  ig,
  answers,
  setAnswer,
  onBack,
  onNext,
  busy,
  profile,
  last,
}: {
  profile: Profile;
  last: boolean;
  busy: boolean;
  index: number;
  ig: IG;
  answers: Answers;
  setAnswer: (id: string, v: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const c = controls[index];
  const qs = inScope(c, ig, profile);
  const complete = qs.every((q) => q.id in answers);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">CIS Control {c.id}</p>
      <h2 className="text-2xl font-bold text-gray-900">{c.title}</h2>
      <p className="text-gray-600 mt-1 mb-6">{c.summary}</p>

      {qs.length === 0 ? (
        <p className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-gray-700">
          {notApplicable(c, ig, profile)
            ? 'This control doesn’t apply based on your answers about your organization. You can skip it.'
            : `This control isn’t expected at ${igInfo[ig].name.split(':')[0]}. You can skip it.`}
        </p>
      ) : (
        <div className="space-y-6">
          {qs.map((q, qi) => (
            <div key={q.id} className="border-t border-gray-100 pt-5 first:border-0 first:pt-0">
            <fieldset>
              <legend className="font-medium text-gray-900 mb-3">
                <span className="text-gray-400 mr-2">{qi + 1}.</span>
                {q.text}
              </legend>
              <div className="flex flex-wrap gap-2">
                {[...scale, { value: NOT_SURE, label: 'Not sure' }].map((o) => {
                  const on = answers[q.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setAnswer(q.id, o.value)}
                      className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        on
                          ? o.value === NOT_SURE
                            ? 'bg-gray-700 border-gray-700 text-white'
                            : 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                      } ${o.value === NOT_SURE ? 'sm:ml-2' : ''}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          {!complete && <span className="hidden sm:inline text-sm text-gray-500">Answer each question to continue</span>}
          <button
            type="button"
            disabled={!complete || busy}
            onClick={onNext}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {last ? (busy ? 'Scoring…' : 'See results') : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
