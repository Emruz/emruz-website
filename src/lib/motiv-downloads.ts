// Picks the right Motiv installer for each platform from a GitHub release.
// Pure functions so they can be tested without the network (tests/downloads.test.mts).

export type Platform = 'mac' | 'windows' | 'linux';

export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
}

export interface Download {
  platform: Platform;
  label: string;
  kind: string;
  name: string;
  url: string;
  size: number;
}

export interface MotivRelease {
  version: string;
  /** The recommended installer for each platform */
  primary: Partial<Record<Platform, Download>>;
  /** Every installer, recommended ones included */
  all: Download[];
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  mac: 'Mac',
  windows: 'Windows',
  linux: 'Linux',
};

// Order sets which file is recommended when a platform has more than one
const KINDS: { test: RegExp; platform: Platform; kind: string }[] = [
  { test: /\.dmg$/i, platform: 'mac', kind: 'Mac installer (Apple Silicon)' },
  { test: /-setup\.exe$/i, platform: 'windows', kind: 'Windows installer' },
  { test: /\.msi$/i, platform: 'windows', kind: 'Windows installer for IT (MSI)' },
  { test: /\.AppImage$/i, platform: 'linux', kind: 'Linux AppImage' },
  { test: /\.deb$/i, platform: 'linux', kind: 'Debian / Ubuntu package (.deb)' },
  { test: /\.rpm$/i, platform: 'linux', kind: 'Fedora / Red Hat package (.rpm)' },
];

export function parseRelease(tag: string, assets: ReleaseAsset[]): MotivRelease {
  const all: Download[] = [];
  for (const k of KINDS) {
    for (const a of assets) {
      if (!k.test.test(a.name)) continue;
      all.push({ platform: k.platform, label: PLATFORM_LABEL[k.platform], kind: k.kind, name: a.name, url: a.url, size: a.size });
    }
  }
  const primary: MotivRelease['primary'] = {};
  for (const d of all) primary[d.platform] ??= d;
  return { version: tag.replace(/^v/, ''), primary, all };
}

/** Best guess from a User-Agent header. Phones and tablets get null. */
export function detectPlatform(userAgent: string | null | undefined): Platform | null {
  const ua = userAgent || '';
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return null;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Linux|X11|CrOS/i.test(ua)) return 'linux';
  return null;
}

export function formatSize(bytes: number): string {
  return `${Math.round(bytes / 1_000_000)} MB`;
}
