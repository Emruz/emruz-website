import 'server-only';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

/**
 * Emruz kits content (#67): release selection, manifest checks, the release
 * tarball reader and the access decision per skill. Pure: no network or database,
 * so tests cover it directly. The fetching and caching live in content.ts.
 */

export const SOURCE = 'emruz-kits';
export const ACCESS_LEVELS = ['free', 'full'] as const;
export type Access = (typeof ACCESS_LEVELS)[number];

export interface ManifestItem {
  type: 'skill';
  name: string;
  group: string;
  pack: string;
  description: string;
  path: string;
  access: Access;
}

export interface Manifest {
  format: string;
  source: string;
  packs: string[];
  items: ManifestItem[];
}

export interface Bundle {
  ref: string;
  manifest: Manifest;
  /** Files by path from the repo root, e.g. skills/testing/testing-kit/SKILL.md */
  files: Map<string, Buffer>;
}

// ---------- Release tags ----------

const REF = /^v(\d{4})\.(\d{1,2})\.(\d{1,4})$/;
export const isRef = (s: unknown): s is string => typeof s === 'string' && REF.test(s);

export function compareRefs(a: string, b: string): number {
  const x = REF.exec(a)!.slice(1).map(Number);
  const y = REF.exec(b)!.slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export interface ReleaseInfo {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
}

/** Published (not draft, not pre-release) releases with a valid tag, newest first. */
export function publishedRefs(releases: ReleaseInfo[]): string[] {
  return releases
    .filter((r) => !r.draft && !r.prerelease && isRef(r.tag_name))
    .map((r) => r.tag_name)
    .sort((a, b) => compareRefs(b, a));
}

// ---------- Manifest ----------

const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function validateManifest(raw: unknown): { ok: true; manifest: Manifest } | { ok: false; problem: string } {
  const bad = (problem: string) => ({ ok: false as const, problem });
  if (!raw || typeof raw !== 'object') return bad('manifest is not an object');
  const m = raw as Record<string, unknown>;
  if (typeof m.format !== 'string' || !m.format.startsWith('emruz-content-manifest/')) return bad(`unknown format ${String(m.format)}`);
  if (m.source !== SOURCE) return bad(`source is ${String(m.source)}, expected ${SOURCE}`);
  if (!Array.isArray(m.packs) || m.packs.length === 0 || !m.packs.every((p) => typeof p === 'string' && NAME.test(p))) return bad('packs must be a list of pack ids');
  if (m.packs.includes('all')) return bad('"all" is reserved and cannot be a pack id');
  if (!Array.isArray(m.items) || m.items.length === 0) return bad('items is empty');
  const packs = m.packs as string[];
  const seen = new Set<string>();
  const paths = new Set<string>();
  const items: ManifestItem[] = [];
  for (const it of m.items as Record<string, unknown>[]) {
    const label = String(it?.name ?? '?');
    if (it?.type !== 'skill') continue; // other item types (standards) arrive later
    if (typeof it.name !== 'string' || !NAME.test(it.name)) return bad(`item ${label}: bad name`);
    if (seen.has(it.name)) return bad(`item ${label}: duplicate name`);
    if (typeof it.pack !== 'string' || !packs.includes(it.pack)) return bad(`item ${label}: missing or unknown pack`);
    if (!ACCESS_LEVELS.includes(it.access as Access)) return bad(`item ${label}: bad access`);
    if (typeof it.path !== 'string' || !/^skills\/[a-z0-9-]+\/[a-z0-9-]+$/.test(it.path)) return bad(`item ${label}: bad path`);
    // One folder per item, so a free item can never serve a paid skill's files
    if (paths.has(it.path)) return bad(`item ${label}: duplicate path`);
    seen.add(it.name);
    paths.add(it.path);
    items.push({
      type: 'skill',
      name: it.name,
      group: typeof it.group === 'string' ? it.group : '',
      pack: it.pack,
      description: typeof it.description === 'string' ? it.description.slice(0, 1000) : '',
      path: it.path,
      access: it.access as Access,
    });
  }
  if (!items.length) return bad('no skills in manifest');
  return { ok: true, manifest: { format: m.format, source: SOURCE, packs, items } };
}

// ---------- Release archive ----------

/** SHA256SUMS lines: "<hex>  <file>". */
export function parseSums(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split('\n')) {
    const m = /^([0-9a-f]{64})\s+\*?(\S+)\s*$/i.exec(line.trim());
    if (m) out.set(m[2], m[1].toLowerCase());
  }
  return out;
}

export const sha256 = (b: Buffer) => crypto.createHash('sha256').update(b).digest('hex');

const MAX_UNPACKED = 25 * 1024 * 1024;
const MAX_ENTRIES = 3000;

/**
 * Reads a .tar.gz into memory. Regular files only; the top folder
 * (emruz-kits-vX/) is stripped; paths with .. or a leading / are rejected.
 */
export function readTarGz(gz: Buffer): Map<string, Buffer> {
  const tar = zlib.gunzipSync(gz, { maxOutputLength: MAX_UNPACKED });
  const files = new Map<string, Buffer>();
  let off = 0;
  let longName: string | null = null;
  let entries = 0;
  const str = (a: number, b: number) => tar.subarray(off + a, off + b).toString('utf8').replace(/\0[\s\S]*$/, '');
  while (off + 512 <= tar.length) {
    if (tar.subarray(off, off + 512).every((x) => x === 0)) break;
    if (++entries > MAX_ENTRIES) throw new Error('archive has too many entries');
    const size = parseInt(str(124, 136).trim() || '0', 8);
    const type = String.fromCharCode(tar[off + 156] || 48);
    const prefix = str(345, 500);
    let name = longName ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
    longName = null;
    const body = tar.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') {
      longName = body.toString('utf8').replace(/\0[\s\S]*$/, '');
      continue;
    }
    if (type === 'x') {
      const m = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'));
      if (m) longName = m[1];
      continue;
    }
    if (type !== '0' && type !== '\0') continue; // folders, links and the rest
    name = name.split('/').slice(1).join('/');
    if (!name || name.startsWith('/') || name.split('/').includes('..')) continue;
    files.set(name, Buffer.from(body));
  }
  return files;
}

/** Text files only (no NUL bytes, valid UTF-8), up to 256 KB. */
export function asText(b: Buffer | undefined): string | null {
  if (!b || b.length > 256 * 1024 || b.includes(0)) return null;
  const s = b.toString('utf8');
  return s.includes('�') ? null : s;
}

/** Text files of one skill other than SKILL.md, relative to the skill folder. */
export function skillFiles(bundle: Bundle, item: ManifestItem): string[] {
  const base = `${item.path}/`;
  return [...bundle.files.entries()]
    .filter(([p, b]) => p.startsWith(base) && p !== `${base}SKILL.md` && asText(b) !== null)
    .map(([p]) => p)
    .map((p) => p.slice(base.length))
    .sort();
}

// ---------- Access ----------

export interface Entitlement {
  pack: string;
  /** null: follows new releases. A tag: that release and earlier. */
  throughRef: string | null;
}

export type Decision = { allowed: true; ref: string } | { allowed: false; reason: 'paid' };

/**
 * Which release (if any) an account may read a skill from. Free skills come
 * from the latest release. Paid skills need an entitlement for the skill's pack
 * (or "all"); a held entitlement reads from its tag while that is older than latest.
 */
export function decide(item: Pick<ManifestItem, 'pack' | 'access'>, ents: Entitlement[], latest: string): Decision {
  if (item.access === 'free') return { allowed: true, ref: latest };
  const mine = ents.filter((e) => e.pack === item.pack || e.pack === 'all');
  if (!mine.length) return { allowed: false, reason: 'paid' };
  if (mine.some((e) => e.throughRef === null)) return { allowed: true, ref: latest };
  const held = mine.map((e) => e.throughRef!).sort((a, b) => compareRefs(b, a))[0];
  return { allowed: true, ref: compareRefs(held, latest) >= 0 ? latest : held };
}
