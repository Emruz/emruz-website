'use server';

import { notFound, redirect } from 'next/navigation';
import { bundleFor } from '@/lib/server/kits/content';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';
import { saveSetting, storedSettings } from '@/lib/server/settings';
import { checkSetting, SETTINGS, storedForm, type SettingDef } from '@/lib/server/settings-core';

/** Site settings (#74): change business settings without a redeploy. */

async function admin() {
  const a = await currentAccount();
  if (!a) redirect('/signin?reauth=1&next=%2Fadmin%2Fsettings');
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a, '/admin/settings');
  return `admin:${a.email}`;
}

function back(msg: string, error = false): never {
  redirect(`/admin/settings?${error ? 'err=1&' : ''}msg=${encodeURIComponent(msg)}`);
}

/** A held release must be published and pass its checks, or the kits would stop loading. */
async function checkRelease(def: SettingDef, ref: string): Promise<string | null> {
  try {
    await bundleFor(ref);
    return null;
  } catch (e) {
    return `${def.label}: ${ref} could not be loaded (${e instanceof Error ? e.message.slice(0, 120) : 'unknown error'}).`;
  }
}

/** Save every changed setting. Nothing is saved if any value is wrong. */
export async function saveSettings(form: FormData) {
  const actor = await admin();
  const stored = await storedSettings();
  const changes: { def: SettingDef; value: string | null }[] = [];
  const errors: string[] = [];
  for (const def of SETTINGS) {
    if (!form.has(def.key)) continue;
    const c = checkSetting(def, form.get(def.key));
    if (!c.ok) {
      errors.push(c.error);
      continue;
    }
    // Default or blank is stored as an empty row while the Netlify variable is still set
    const value = storedForm(def, c.value);
    if (value === (stored.get(def.key)?.value ?? null)) continue;
    changes.push({ def, value });
  }
  for (const { def, value } of changes) {
    if (def.kind === 'release' && value) {
      const problem = await checkRelease(def, value);
      if (problem) errors.push(problem);
    }
  }
  if (errors.length) back(`Nothing saved. ${errors.join(' ')}`, true);
  if (!changes.length) back('No changes.');

  const saved: string[] = [];
  for (const { def, value } of changes) {
    if ((await saveSetting(def.key, value, actor)) !== 'unchanged') saved.push(def.label);
  }
  back(saved.length ? `Saved: ${saved.join(', ')}. Live within 30 seconds.` : 'No changes.');
}
