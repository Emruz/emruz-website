import { notFound } from 'next/navigation';
import { Container, DetailHeader } from '@/components';
import { releaseTags } from '@/lib/server/kits/content';
import { fmtDate } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { settingChanges, storedSettings } from '@/lib/server/settings';
import { displayValue, effectiveSetting, SETTINGS, type SettingDef } from '@/lib/server/settings-core';
import { btn, input, Notice, ReauthBanner } from '../motiv/ui';
import { saveSettings } from './actions';

export const metadata = { title: 'Site settings', robots: { index: false } };

const GROUPS = ['Emruz kits', 'Motiv', 'Stripe', 'Email'] as const;

function Field({ def, value, tags }: { def: SettingDef; value: string | null; tags: string[] }) {
  const id = `s-${def.key}`;
  const common = { id, name: def.key, defaultValue: value ?? '', className: `${input} w-full`, 'aria-describedby': `${id}-help` };
  switch (def.kind) {
    case 'switch':
      return (
        <select {...common}>
          <option value="">Default ({displayValue(def, def.fallback)})</option>
          <option value="true">On</option>
          <option value="false">Off</option>
        </select>
      );
    case 'release': {
      const options = value && !tags.includes(value) ? [value, ...tags] : tags;
      return (
        <select {...common}>
          <option value="">{def.unsetText}</option>
          {options.map((t) => <option key={t} value={t}>Hold at {t}</option>)}
        </select>
      );
    }
    case 'day':
      return <input {...common} type="date" placeholder={def.fallback ?? ''} />;
    case 'number':
      return <input {...common} type="number" inputMode="numeric" min={def.min} max={def.max} step={1} placeholder={def.fallback ?? ''} />;
    case 'email':
      return <input {...common} type="email" maxLength={254} placeholder={def.fallback ?? ''} />;
    case 'emails':
      return <input {...common} type="text" maxLength={1000} placeholder="a@emruz.com, b@emruz.com" />;
    case 'price':
      return <input {...common} type="text" maxLength={70} pattern="price_[A-Za-z0-9]{6,60}" placeholder="price_…" spellCheck={false} autoComplete="off" />;
  }
}

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/settings');
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);
  const [stored, changes, tags] = await Promise.all([storedSettings(), settingChanges(), releaseTags()]);
  const labelFor = (key: string) => SETTINGS.find((s) => s.key === key)?.label ?? key;
  const current = Object.fromEntries([...stored].map(([k, r]) => [k, r.value]));
  const effective = new Map(SETTINGS.map((s) => [s.key, effectiveSetting(s, current)]));
  // Moved to the database (#74): a variable still set in Netlify applies until the setting is saved here
  const leftover = SETTINGS.filter((s) => process.env[s.env] !== undefined);
  const applying = leftover.filter((s) => effective.get(s.key)!.source === 'netlify').map((s) => s.env);
  const ignored = leftover.filter((s) => effective.get(s.key)!.source !== 'netlify').map((s) => s.env);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Site settings' }]}
        title="Site settings"
        summary="Business settings, changed here without a redeploy. A change is live within 30 seconds. Empty uses the default."
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next="/admin/settings" />}
          <Notice msg={sp.msg} error={sp.err === '1'} />
          {applying.length > 0 && (
            <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Still set in Netlify and in effect until saved here: <span className="font-mono break-all">{applying.join(', ')}</span>. Save the settings below (the form shows the Netlify values), then remove the variables from Netlify.
            </p>
          )}
          {ignored.length > 0 && (
            <p className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Still set in Netlify but replaced by a value saved here: <span className="font-mono break-all">{ignored.join(', ')}</span>. They can be removed from Netlify.
            </p>
          )}

          <form action={saveSettings} className="max-w-3xl space-y-10">
            {GROUPS.map((g) => (
              <fieldset key={g} className="rounded-lg border border-gray-200 p-5 md:p-6">
                <legend className="px-2 text-lg font-bold text-gray-900">{g}</legend>
                <div className="space-y-6">
                  {SETTINGS.filter((s) => s.group === g).map((def) => {
                    const row = stored.get(def.key);
                    const now = effective.get(def.key)!;
                    // A value carried over from Netlify fills the field, so saving the form keeps it
                    const fieldValue = now.source === 'netlify' ? now.value : row?.value || null;
                    const by = row ? ` ${fmtDate(row.updated_at)} by ${row.updated_by.replace(/^admin:/, '')}` : '';
                    const source =
                      now.source === 'saved' ? ` · changed${by}`
                      : now.source === 'netlify' ? ` · from Netlify variable ${def.env} (save to keep it here)`
                      : now.source === 'cleared' ? ` · default, cleared${by}`
                      : ' · default';
                    return (
                      <div key={def.key} className="text-sm">
                        <label htmlFor={`s-${def.key}`} className="font-semibold text-gray-900">{def.label}</label>
                        <p id={`s-${def.key}-help`} className="text-gray-600">
                          {def.help} Default: {displayValue(def, def.fallback)}.
                        </p>
                        <div className="mt-2"><Field def={def} value={fieldValue} tags={tags} /></div>
                        <p className="mt-1 text-xs text-gray-500 break-words">
                          Now: <span className="font-medium text-gray-800">{displayValue(def, now.value)}</span>
                          {source}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <button className={btn}>Save changes</button>
          </form>

          <h2 className="mt-12 mb-3 text-xl font-bold text-gray-900">Recent changes</h2>
          {changes.length === 0 ? (
            <p className="text-sm text-gray-600">None yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 text-sm">
              {changes.map((c, i) => (
                <li key={i} className="p-4 break-words">
                  <span className="font-semibold text-gray-900">{labelFor(c.detail.key)}</span>
                  <span className="text-gray-600"> · {c.detail.old || 'default'} → {c.detail.new || 'default'}</span>
                  <span className="block text-xs text-gray-500">{fmtDate(c.at)} · {(c.actor ?? '').replace(/^admin:/, '')}</span>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section></fieldset>
    </>
  );
}
