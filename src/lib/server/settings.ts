import 'server-only';
import { db } from './db';
import { resolveSettings, settingDef, KITS_LAUNCH_DATE, type SiteSettings } from './settings-core';

/**
 * Site settings (#74), stored in site_settings and changed on /admin/settings without a
 * redeploy. Each server instance keeps them for up to 30 seconds; a change made on this
 * instance shows at once. If the database can't be read, the last values read are kept
 * (or, on an instance that has never read them, the Netlify variables and defaults, marked
 * as unread so the kits keep their last good release), and the read is retried after a few
 * seconds rather than on every request.
 */

const TTL_MS = 30 * 1000;
const RETRY_MS = 5 * 1000;
let cache: { at: number; values: SiteSettings } | null = null;
let loading: Promise<SiteSettings> | null = null;
/** Bumped on every save, so a read that started before the save is not cached. */
let generation = 0;
/** True until this instance has read the stored settings once. */
let unread = true;

/** True while this instance has never read the stored settings (the values are a fallback). */
export const settingsUnread = () => unread;

export interface StoredSetting {
  value: string;
  updated_by: string;
  updated_at: Date;
}

/** Stored rows, uncached, for /admin/settings. */
export async function storedSettings(): Promise<Map<string, StoredSetting>> {
  const rows = await db()<(StoredSetting & { key: string })[]>`select key, value, updated_by, updated_at from site_settings`;
  return new Map(rows.map((r) => [r.key, { value: r.value, updated_by: r.updated_by, updated_at: r.updated_at }]));
}

async function load(): Promise<SiteSettings> {
  const gen = generation;
  try {
    const rows = await storedSettings();
    const values = resolveSettings(Object.fromEntries([...rows].map(([k, r]) => [k, r.value])));
    if (gen === generation) {
      cache = { at: Date.now(), values };
      unread = false;
    }
    return values;
  } catch (e) {
    console.error('site settings: read failed, using last known values', e instanceof Error ? e.message : e);
    const values = cache?.values ?? resolveSettings({});
    // Retry in a few seconds, not on every request
    if (gen === generation) cache = { at: Date.now() - TTL_MS + RETRY_MS, values };
    return values;
  }
}

export async function siteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.values;
  if (!loading) {
    const p = load().finally(() => {
      if (loading === p) loading = null;
    });
    loading = p;
  }
  return loading;
}

/**
 * Set (or remove, with null) one setting and audit who changed it from what to what. An empty
 * value is an explicit clear (see storedForm).
 * Returns the previous stored value, or 'unchanged' when nothing changed.
 */
export async function saveSetting(key: string, value: string | null, actor: string): Promise<{ old: string | null } | 'unchanged'> {
  if (!settingDef(key) && key !== KITS_LAUNCH_DATE) throw new Error(`Unknown setting ${key}`);
  const result = await db().begin(async (tx) => {
    const [row] = await tx<{ value: string }[]>`select value from site_settings where key = ${key} for update`;
    const old = row?.value ?? null;
    if (old === value) return 'unchanged' as const;
    if (value === null) {
      await tx`delete from site_settings where key = ${key}`;
    } else {
      await tx`
        insert into site_settings (key, value, updated_by) values (${key}, ${value}, ${actor})
        on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`;
    }
    await tx`
      insert into events (kind, actor, detail)
      values ('setting_changed', ${actor}, ${tx.json({ key, old, new: value } as never)})`;
    return { old };
  });
  generation++;
  cache = null;
  loading = null;
  return result;
}

/** Recent changes, for /admin/settings. */
export async function settingChanges(limit = 30) {
  return db()<{ at: Date; actor: string | null; detail: { key: string; old: string | null; new: string | null } }[]>`
    select at, actor, detail from events where kind = 'setting_changed' order by at desc limit ${limit}`;
}
