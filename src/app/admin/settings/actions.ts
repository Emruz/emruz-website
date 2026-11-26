'use server';

import { notFound, redirect } from 'next/navigation';
import { bundleFor } from '@/lib/server/kits/content';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';
import { saveSetting, storedSettings } from '@/lib/server/settings';
import { checkSetting, priceProblem, SETTINGS, type SettingDef } from '@/lib/server/settings-core';
import { stripe } from '@/lib/server/stripe';

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

/** A price ID must exist in this Stripe account and fit the plan. */
async function checkPrice(def: SettingDef, id: string): Promise<string | null> {
  try {
    const p = await stripe().prices.retrieve(id);
    const problem = priceProblem(def.plan!, { active: p.active, type: p.type, recurring: p.recurring });
    return problem ? `${def.label}: ${problem}` : null;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'resource_missing') return `${def.label}: Stripe has no price ${id} in this account.`;
    console.error('settings: Stripe price check failed', e);
    return `${def.label}: could not check the price with Stripe. Try again.`;
  }
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
    if (c.value === (stored.get(def.key)?.value ?? null)) continue;
    changes.push({ def, value: c.value });
  }
  for (const { def, value } of changes) {
    if (value === null) continue;
    const problem = def.kind === 'price' ? await checkPrice(def, value) : def.kind === 'release' ? await checkRelease(def, value) : null;
    if (problem) errors.push(problem);
  }
  if (errors.length) back(`Nothing saved. ${errors.join(' ')}`, true);
  if (!changes.length) back('No changes.');

  const saved: string[] = [];
  for (const { def, value } of changes) {
    if ((await saveSetting(def.key, value, actor)) !== 'unchanged') saved.push(def.label);
  }
  back(saved.length ? `Saved: ${saved.join(', ')}. Live within 30 seconds.` : 'No changes.');
}
