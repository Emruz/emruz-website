'use client';

import { useEffect, useRef, useState } from 'react';
import { intakeSections, intakeCompleteness } from '@/content/workbench';
import { saveIntake } from '../../../actions';
import { card, input, label } from '../../../ui';

export default function IntakeForm({ id, initial }: { id: string; initial: Record<string, string> }) {
  const [data, setData] = useState<Record<string, string>>(initial);
  const [state, setState] = useState<'saved' | 'saving' | 'error'>('saved');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      setState('saving');
      saveIntake(id, data)
        .then(() => setState('saved'))
        .catch(() => setState('error'));
    }, 800);
    return () => clearTimeout(t);
  }, [id, data]);

  const c = intakeCompleteness(data);

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {intakeSections.map((s) => (
          <fieldset key={s.title} className={`${card} p-5`}>
            <legend className="sr-only">{s.title}</legend>
            <h2 className="font-bold text-gray-900 mb-4">{s.title}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {s.fields.map((f) => {
                const missing = f.required && !String(data[f.key] ?? '').trim();
                const common = {
                  id: f.key,
                  value: data[f.key] ?? '',
                  onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                    setData((d) => ({ ...d, [f.key]: ev.target.value })),
                  className: `${input} ${missing ? 'border-amber-400 bg-amber-50/40' : ''}`,
                };
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className={label} htmlFor={f.key}>
                      {f.label} {f.required && <span className="text-amber-700 font-normal text-xs">Required</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea rows={3} {...common} />
                    ) : f.type === 'select' ? (
                      <select {...common}>
                        <option value="">Choose…</option>
                        {f.options!.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type === 'number' ? 'number' : 'text'} {...common} />
                    )}
                    {f.help && <p className="text-xs text-gray-500 mt-1">{f.help}</p>}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <aside className={`${card} p-5 h-fit lg:sticky lg:top-20`}>
        <p className="text-sm text-gray-500">Required fields</p>
        <p className="text-2xl font-bold text-gray-900">{c.done} of {c.total}</p>
        <p className={`text-xs mt-1 ${state === 'error' ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
          {state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved. Check your connection.' : 'All changes saved'}
        </p>
        {c.missing.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {c.missing.map((f) => (
              <li key={f.key}><a href={`#${f.key}`} className="text-amber-800 hover:underline">{f.label}</a></li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
