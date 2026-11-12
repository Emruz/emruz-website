'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Check, Link2, FileText, Paperclip } from 'lucide-react';
import { csfCategories, csfFunctions, csfSubcategories, type FunctionId } from '@/content/csf';
import { flagsFor, flagInfo, maturityLevels, priorityFor, relatedFor, EVIDENCE_REQUIRED_AT, type Flag, type Rating } from '@/content/workbench';
import { saveRating, setEvidenceLink } from '../../../actions';

interface Ev {
  id: string;
  title: string;
  kind: 'file' | 'link';
  subcategories: string[];
}

const empty = (id: string): Rating => ({
  subcategory: id,
  current_level: null,
  target_level: null,
  na: false,
  na_reason: null,
  notes: null,
  recommendation: null,
  override_reason: null,
  prefilled: false,
});

const filters: { key: string; label: string; test: (f: Flag[], r: Rating) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'attention', label: 'Needs attention', test: (f) => f.length > 0 },
  { key: 'missing_evidence', label: 'Missing evidence', test: (f) => f.includes('missing_evidence') },
  { key: 'prefilled', label: 'Pre-filled', test: (f) => f.includes('prefilled') },
  { key: 'unrated', label: 'Not rated', test: (f) => f.includes('unrated') },
  { key: 'gaps', label: 'Gaps', test: (_f, r) => !!priorityFor(r.current_level, r.target_level) && !r.na },
];

const relatedLabel = { cis: 'CIS', cmmc: 'CMMC', iso: 'ISO', soc2: 'SOC 2' } as const;

export default function AssessGrid({ id, initial, evidence: initialEvidence, initialFilter, initialFn }: {
  id: string;
  initial: Record<string, Rating>;
  evidence: Ev[];
  initialFilter: string;
  initialFn: string;
}) {
  const [ratings, setRatings] = useState(initial);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [fn, setFn] = useState<FunctionId | 'ALL'>(initialFilter !== 'all' ? 'ALL' : ((csfFunctions.some((f) => f.id === initialFn) ? initialFn : 'GV') as FunctionId));
  const [filter, setFilter] = useState(filters.some((f) => f.key === initialFilter) ? initialFilter : 'all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const linkedCount = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of evidence) for (const s of e.subcategories) m.set(s, [...(m.get(s) ?? []), e]);
    return m;
  }, [evidence]);

  const flagsOf = (sid: string) => flagsFor(ratings[sid], linkedCount.get(sid)?.length ?? 0);

  const persist = (sid: string, patch: Parameters<typeof saveRating>[2]) => {
    setSaving((n) => n + 1);
    saveRating(id, sid, patch)
      .then(() => setError(false))
      .catch(() => setError(true))
      .finally(() => setSaving((n) => n - 1));
  };

  const update = (sid: string, patch: Partial<Rating>, opts: { text?: boolean; confirm?: boolean } = {}) => {
    setRatings((rs) => {
      const cur = rs[sid] ?? empty(sid);
      const next = { ...cur, ...patch };
      if ('current_level' in patch || opts.confirm) next.prefilled = false;
      return { ...rs, [sid]: next };
    });
    const payload = { ...patch, ...(opts.confirm ? { confirm: true } : {}) } as Parameters<typeof saveRating>[2];
    if (opts.text) {
      const key = `${sid}:${Object.keys(patch).join(',')}`;
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => persist(sid, payload), 700);
    } else persist(sid, payload);
  };

  const toggleLink = (sid: string, evId: string, on: boolean) => {
    setEvidence((evs) => evs.map((e) => (e.id === evId ? { ...e, subcategories: on ? [...e.subcategories, sid] : e.subcategories.filter((s) => s !== sid) } : e)));
    setSaving((n) => n + 1);
    setEvidenceLink(id, evId, sid, on)
      .catch(() => setError(true))
      .finally(() => setSaving((n) => n - 1));
  };

  const testFilter = filters.find((f) => f.key === filter)!.test;
  const visible = csfSubcategories.filter((s) => (fn === 'ALL' || s.fn === fn) && testFilter(flagsOf(s.id), ratings[s.id] ?? empty(s.id)));
  const fnFlags = (f: FunctionId) => csfSubcategories.filter((s) => s.fn === f && flagsOf(s.id).some((x) => flagInfo[x].blocks)).length;
  const fnRated = (f: FunctionId) => csfSubcategories.filter((s) => s.fn === f && !flagsOf(s.id).includes('unrated')).length;
  const fnTotal = (f: FunctionId) => csfSubcategories.filter((s) => s.fn === f).length;
  const toggle = (sid: string) => setOpen((o) => { const n = new Set(o); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {csfFunctions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFn(f.id)}
              aria-pressed={fn === f.id}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${fn === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              {f.title} <span className="font-normal opacity-70">{fnRated(f.id)}/{fnTotal(f.id)}</span>
              {fnFlags(f.id) > 0 && <span className="ml-1 text-xs bg-red-100 text-red-700 rounded-full px-1.5">{fnFlags(f.id)}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setFn('ALL')} aria-pressed={fn === 'ALL'} className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${fn === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-300 text-gray-700'}`}>
            All functions
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1.5" aria-label="Filter">
            {filters.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <button type="button" className="text-sm text-blue-700 font-semibold" onClick={() => setOpen(open.size ? new Set() : new Set(visible.map((s) => s.id)))}>
            {open.size ? 'Collapse all' : 'Expand all'}
          </button>
          <span className={`text-xs ${error ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>{error ? 'Not saved' : saving ? 'Saving…' : 'Saved'}</span>
        </div>
      </div>

      <details className="mb-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg">
        <summary className="cursor-pointer px-4 py-2 font-semibold">Scoring rules</summary>
        <div className="px-4 pb-3 space-y-1">
          <p>{maturityLevels.map((m) => `${m.value} ${m.label}`).join(' · ')}</p>
          <p>A current level of {EVIDENCE_REQUIRED_AT} or more needs linked evidence, or a note on how it was verified. N/A needs a reason. Pre-filled ratings must be confirmed.</p>
          <p>Gap of 2 or more is High priority, 1 is Medium. Every gap needs a recommendation before the report goes out.</p>
        </div>
      </details>

      {visible.length === 0 && <p className="text-gray-500 p-6 text-center bg-white rounded-xl border border-gray-200">Nothing matches this filter.</p>}

      <div className="space-y-6">
        {csfCategories
          .filter((c) => visible.some((s) => s.category === c.id))
          .map((c) => (
            <section key={c.id}>
              <h2 className="text-sm font-bold text-gray-900 mb-2">
                {c.id} {c.title} <span className="font-normal text-gray-500">· {c.text}</span>
              </h2>
              <ul className="space-y-2">
                {visible
                  .filter((s) => s.category === c.id)
                  .map((s) => {
                    const r = ratings[s.id] ?? empty(s.id);
                    const flags = flagsOf(s.id);
                    const linked = linkedCount.get(s.id) ?? [];
                    const isOpen = open.has(s.id);
                    const prio = r.na ? null : priorityFor(r.current_level, r.target_level);
                    const rel = relatedFor(s.id);
                    return (
                      <li key={s.id} id={s.id} className={`bg-white border rounded-xl ${flags.some((f) => flagInfo[f].tone === 'red') ? 'border-red-200' : 'border-gray-200'}`}>
                        <div className="p-4 flex flex-col lg:flex-row lg:items-start gap-3">
                          <button type="button" onClick={() => toggle(s.id)} className="flex-1 text-left flex gap-3" aria-expanded={isOpen}>
                            <ChevronDown className={`w-4 h-4 mt-1 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            <span>
                              <span className="font-mono text-xs text-gray-500 mr-2">{s.id}</span>
                              <span className="text-gray-900">{s.text}</span>
                              <span className="flex flex-wrap gap-1.5 mt-1.5">
                                {flags.map((f) => (
                                  <span key={f} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${flagInfo[f].tone === 'red' ? 'bg-red-50 text-red-700 border-red-200' : flagInfo[f].tone === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {flagInfo[f].label}
                                  </span>
                                ))}
                                {prio && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${prio === 'High' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{prio} priority</span>}
                                {linked.length > 0 && <span className="text-[11px] text-gray-500 inline-flex items-center gap-1"><Paperclip className="w-3 h-3" />{linked.length}</span>}
                              </span>
                            </span>
                          </button>
                          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                            {r.na ? (
                              <span className="text-sm font-semibold text-gray-500">Not applicable</span>
                            ) : (
                              <div className="flex gap-1" role="group" aria-label={`Current maturity for ${s.id}`}>
                                {maturityLevels.map((m) => (
                                  <button
                                    key={m.value}
                                    type="button"
                                    title={`${m.label}: ${m.help}`}
                                    aria-pressed={r.current_level === m.value}
                                    onClick={() => update(s.id, { current_level: m.value })}
                                    className={`w-8 h-8 rounded-md text-sm font-semibold border ${
                                      r.current_level === m.value
                                        ? r.prefilled ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                                    }`}
                                  >
                                    {m.value}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!r.na && (
                              <label className="text-xs text-gray-500 flex items-center gap-1">
                                Target
                                <select
                                  value={r.target_level ?? ''}
                                  onChange={(e) => update(s.id, { target_level: e.target.value === '' ? null : Number(e.target.value) })}
                                  className="border border-gray-300 rounded px-1 py-1 text-sm text-gray-900"
                                >
                                  <option value="">–</option>
                                  {maturityLevels.map((m) => <option key={m.value} value={m.value}>{m.value}</option>)}
                                </select>
                              </label>
                            )}
                            {r.prefilled && (
                              <button type="button" onClick={() => update(s.id, {}, { confirm: true })} className="text-xs font-semibold text-amber-800 border border-amber-300 rounded px-2 py-1 hover:bg-amber-50 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Confirm
                              </button>
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-gray-100 p-4 grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-3">
                              <label className="flex items-center gap-2">
                                <input type="checkbox" checked={r.na} onChange={(e) => update(s.id, { na: e.target.checked })} /> Not applicable
                              </label>
                              {r.na && (
                                <textarea
                                  placeholder="Why it does not apply (required)"
                                  rows={2}
                                  value={r.na_reason ?? ''}
                                  onChange={(e) => update(s.id, { na_reason: e.target.value }, { text: true })}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">Observations</p>
                                <textarea rows={3} value={r.notes ?? ''} onChange={(e) => update(s.id, { notes: e.target.value }, { text: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="What you found and how you verified it" />
                              </div>
                              {!r.na && (
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Recommendation {prio && <span className="text-xs font-normal text-amber-700">needed for the report</span>}</p>
                                  <textarea rows={3} value={r.recommendation ?? ''} onChange={(e) => update(s.id, { recommendation: e.target.value }, { text: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="What the client should do" />
                                </div>
                              )}
                              {!r.na && (r.current_level ?? 0) >= EVIDENCE_REQUIRED_AT && linked.length === 0 && (
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Verified without documents?</p>
                                  <textarea rows={2} value={r.override_reason ?? ''} onChange={(e) => update(s.id, { override_reason: e.target.value }, { text: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="For example: observed in a live demo on 12 Nov with the IT manager" />
                                </div>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">Evidence</p>
                                {linked.length === 0 && <p className="text-gray-500">None linked.</p>}
                                <ul className="space-y-1">
                                  {linked.map((e) => (
                                    <li key={e.id} className="flex items-center justify-between gap-2">
                                      <a href={`/api/evidence/${e.id}`} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1 truncate">
                                        {e.kind === 'link' ? <Link2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} {e.title}
                                      </a>
                                      <button type="button" onClick={() => toggleLink(s.id, e.id, false)} className="text-xs text-gray-500 hover:text-red-700">Unlink</button>
                                    </li>
                                  ))}
                                </ul>
                                {evidence.some((e) => !e.subcategories.includes(s.id)) && (
                                  <select
                                    value=""
                                    onChange={(ev) => ev.target.value && toggleLink(s.id, ev.target.value, true)}
                                    className="mt-2 w-full border border-gray-300 rounded-lg px-2 py-1.5"
                                    aria-label="Link evidence"
                                  >
                                    <option value="">Link existing evidence…</option>
                                    {evidence.filter((e) => !e.subcategories.includes(s.id)).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                                  </select>
                                )}
                                <p className="mt-2 flex gap-3">
                                  <Link href={`/workbench/e/${id}/evidence?sub=${s.id}`} className="text-blue-700 font-semibold">Add evidence</Link>
                                  <Link href={`/workbench/e/${id}/evidence?sub=${s.id}#request`} className="text-blue-700 font-semibold">Request from client</Link>
                                </p>
                              </div>
                              {Object.keys(rel).length > 0 && (
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Related requirements</p>
                                  <dl className="space-y-0.5 text-xs">
                                    {(Object.keys(relatedLabel) as (keyof typeof relatedLabel)[]).filter((k) => rel[k]?.length).map((k) => (
                                      <div key={k} className="flex gap-2"><dt className="w-12 text-gray-500">{relatedLabel[k]}</dt><dd className="font-mono text-gray-700">{rel[k]!.join(', ')}</dd></div>
                                    ))}
                                  </dl>
                                </div>
                              )}
                              {s.examples.length > 0 && (
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">NIST implementation examples</p>
                                  <ul className="list-disc pl-4 text-gray-600 space-y-1">{s.examples.map((x, i) => <li key={i}>{x}</li>)}</ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}
