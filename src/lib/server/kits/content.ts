import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { securityEvent } from '../alerts';
import { siteSettings } from '../settings';
import { asText, isRef, parseSums, publishedRefs, readTarGz, sha256, skillFiles, validateManifest, type Bundle, type ManifestItem, type ReleaseInfo } from './content-core';

/**
 * Emruz kits content from GitHub releases (#67).
 *
 * The site follows the latest published release of SKILLS_REPO (drafts and
 * pre-releases are ignored), checked every 10 minutes. The skills_ref site setting, when set,
 * holds the site at that tag. A release's tarball is checked against its
 * SHA256SUMS and its manifest validated; if either fails, the site keeps
 * serving the last good release and sends an alert.
 *
 * Release archives are cached in memory and in Netlify Blobs (a local folder in
 * development), so a cold start does not need GitHub. Tags are treated as immutable.
 */

const RELEASES_TTL_MS = 10 * 60 * 1000;
const BAD_RETRY_MS = 10 * 60 * 1000;
const MAX_ASSET = 10 * 1024 * 1024;
const MAX_BUNDLES = 6;
const LOCAL_DIR = path.join(process.cwd(), '.data', 'kits');

const isNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

function repo(): string {
  const r = (process.env.SKILLS_REPO || 'Emruz/emruz-kits').trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r)) throw new Error('SKILLS_REPO must look like owner/name');
  return r;
}

function ghHeaders(accept = 'application/vnd.github+json'): Record<string, string> {
  const token = process.env.SKILLS_TOKEN;
  if (!token) throw new Error('SKILLS_TOKEN is not set');
  return { Authorization: `Bearer ${token}`, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'emruz.com' };
}

async function gh(url: string, accept?: string): Promise<Response> {
  const res = await fetch(url, { headers: ghHeaders(accept), signal: AbortSignal.timeout(15_000), cache: 'no-store' });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url.replace(/\?.*$/, '')}`);
  return res;
}

async function readCapped(res: Response): Promise<Buffer> {
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_ASSET) throw new Error('release asset is too large');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_ASSET) throw new Error('release asset is too large');
  return buf;
}

// ---------- Archive cache (Blobs or local folder) ----------

async function blobStore() {
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: 'kits-releases', consistency: 'strong' });
}

async function cacheGet(key: string): Promise<Buffer | null> {
  try {
    if (isNetlify()) {
      const v = await (await blobStore()).get(key, { type: 'arrayBuffer' });
      return v ? Buffer.from(v) : null;
    }
    return await fs.readFile(path.join(LOCAL_DIR, key));
  } catch {
    return null;
  }
}

async function cachePut(key: string, data: Buffer) {
  try {
    if (isNetlify()) return void (await (await blobStore()).set(key, new Uint8Array(data).buffer as ArrayBuffer));
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DIR, key), data);
  } catch (e) {
    console.error('kits cache write failed', e);
  }
}

// ---------- Releases ----------

let releases: { at: number; refs: string[] } | null = null;

async function listRefs(): Promise<string[]> {
  if (releases && Date.now() - releases.at < RELEASES_TTL_MS) return releases.refs;
  try {
    const res = await gh(`https://api.github.com/repos/${repo()}/releases?per_page=50`);
    const refs = publishedRefs((await res.json()) as ReleaseInfo[]);
    releases = { at: Date.now(), refs };
    return refs;
  } catch (e) {
    if (releases) {
      console.error('kits: release list failed, using the previous list', e);
      releases.at = Date.now() - RELEASES_TTL_MS + 60_000; // retry in a minute
      return releases.refs;
    }
    throw e;
  }
}

/** Downloads (or reads from cache) a release's tarball and SHA256SUMS, checks and unpacks it. */
async function fetchBundle(ref: string): Promise<Bundle> {
  let gz = await cacheGet(`${ref}.tar.gz`);
  let sums = await cacheGet(`${ref}.sums`);
  let assetName = (await cacheGet(`${ref}.name`))?.toString('utf8') ?? null;
  const cached = !!(gz && sums && assetName);
  if (!cached) {
    const rel = (await (await gh(`https://api.github.com/repos/${repo()}/releases/tags/${ref}`)).json()) as {
      draft: boolean;
      assets: { name: string; url: string; size: number }[];
    };
    const tar = rel.assets.find((a) => a.name.endsWith('.tar.gz'));
    const sumAsset = rel.assets.find((a) => a.name === 'SHA256SUMS');
    if (!tar || !sumAsset) throw new Error('release has no .tar.gz or no SHA256SUMS asset');
    if (tar.size > MAX_ASSET) throw new Error('release archive is too large');
    // Only ever fetch GitHub's own asset API (SSRF guard)
    const prefix = `https://api.github.com/repos/${repo()}/releases/assets/`;
    if (!tar.url.startsWith(prefix) || !sumAsset.url.startsWith(prefix)) throw new Error('unexpected asset URL');
    gz = await readCapped(await gh(tar.url, 'application/octet-stream'));
    sums = await readCapped(await gh(sumAsset.url, 'application/octet-stream'));
    assetName = tar.name;
  }
  const expected = parseSums(sums!.toString('utf8')).get(assetName!);
  if (!expected || expected !== sha256(gz!)) throw new Error(`${assetName} does not match SHA256SUMS`);
  const files = readTarGz(gz!);
  const raw = files.get('manifest.json');
  if (!raw) throw new Error('archive has no manifest.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new Error('manifest.json is not valid JSON');
  }
  const v = validateManifest(parsed);
  if (!v.ok) throw new Error(v.problem);
  for (const item of v.manifest.items) {
    if (!files.has(`${item.path}/SKILL.md`)) throw new Error(`${item.name} has no SKILL.md in the archive`);
  }
  if (!cached) {
    await cachePut(`${ref}.tar.gz`, gz!);
    await cachePut(`${ref}.sums`, sums!);
    await cachePut(`${ref}.name`, Buffer.from(assetName!));
  }
  return { ref, manifest: v.manifest, files };
}

const bundles = new Map<string, Promise<Bundle>>();
const badRefs = new Map<string, number>();

/** One release, loaded once per instance. Rejects for a bad or missing release. */
export function bundleFor(ref: string): Promise<Bundle> {
  if (!isRef(ref)) return Promise.reject(new Error(`bad release tag ${ref}`));
  const bad = badRefs.get(ref);
  if (bad && Date.now() - bad < BAD_RETRY_MS) return Promise.reject(new Error(`release ${ref} was rejected recently`));
  let p = bundles.get(ref);
  if (!p) {
    p = fetchBundle(ref);
    p.catch(() => {
      bundles.delete(ref);
      badRefs.set(ref, Date.now());
    });
    bundles.set(ref, p);
    if (bundles.size > MAX_BUNDLES) bundles.delete(bundles.keys().next().value!);
  }
  return p;
}

let lastGood: Bundle | null = null;

/**
 * The release the site serves now: the held release if set on /admin/settings (#74), else the newest published
 * release. Falls back to the last good release when that one is rejected.
 */
export async function currentBundle(): Promise<Bundle> {
  const hold = (await siteSettings()).skillsRef;
  let candidates: string[];
  if (hold && isRef(hold)) {
    candidates = [hold];
  } else {
    try {
      candidates = await listRefs();
    } catch (e) {
      // GitHub unreachable: keep serving the release in memory, or the last good one recorded
      if (lastGood) return lastGood;
      candidates = [];
      console.error('kits: listing releases failed', e instanceof Error ? e.message : e);
    }
  }
  const target = candidates[0];
  if (target && lastGood?.ref === target) return lastGood;
  if (target) {
    try {
      lastGood = await bundleFor(target);
      void cachePut('last-good', Buffer.from(target));
      return lastGood;
    } catch (e) {
      const problem = e instanceof Error ? e.message : String(e);
      if (!problem.includes('rejected recently')) void securityEvent('kits_release_invalid', { ref: target, problem });
    }
  }
  if (lastGood) return lastGood;
  // Cold start with a bad newest release: the last good one recorded, then older published ones
  const recorded = (await cacheGet('last-good'))?.toString('utf8');
  for (const ref of [recorded, ...candidates.slice(1)].filter(isRef)) {
    try {
      lastGood = await bundleFor(ref);
      return lastGood;
    } catch {
      /* try the next */
    }
  }
  throw new Error('No usable Emruz kits release');
}

/** Published releases that pass the checks, newest first (for the admin grant form). Checks the newest 10. */
export async function releaseTags(): Promise<string[]> {
  let refs: string[];
  try {
    refs = (await listRefs()).slice(0, 10);
  } catch {
    return lastGood ? [lastGood.ref] : [];
  }
  const checked = await Promise.allSettled(refs.map((r) => bundleFor(r)));
  return refs.filter((_, i) => checked[i].status === 'fulfilled');
}

export async function readSkill(item: ManifestItem, ref: string): Promise<{ text: string; files: string[] } | null> {
  let b: Bundle;
  try {
    b = await bundleFor(ref);
  } catch {
    return null;
  }
  // Same name and same pack in that release, so an older release cannot serve another pack's skill
  const own = b.manifest.items.find((i) => i.name === item.name && i.pack === item.pack);
  if (!own) return null;
  const text = asText(b.files.get(`${own.path}/SKILL.md`));
  return text == null ? null : { text, files: skillFiles(b, own) };
}

export async function readFile(item: ManifestItem, ref: string, rel: string): Promise<string | null> {
  let b: Bundle;
  try {
    b = await bundleFor(ref);
  } catch {
    return null;
  }
  // Same name and same pack in that release, so an older release cannot serve another pack's skill
  const own = b.manifest.items.find((i) => i.name === item.name && i.pack === item.pack);
  if (!own) return null;
  return asText(b.files.get(`${own.path}/${rel}`));
}

/** "release" → "Emruz Release Kit" */
export function packTitle(pack: string): string {
  if (pack === 'all') return 'all Emruz kits';
  return `Emruz ${pack.charAt(0).toUpperCase()}${pack.slice(1)} Kit`;
}
