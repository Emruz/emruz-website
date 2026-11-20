import 'server-only';
import { parseRelease, type MotivRelease } from '@/lib/motiv-downloads';

const LATEST = 'https://api.github.com/repos/Emruz/motiv-releases/releases/latest';

/** Latest public Motiv release, cached for 10 minutes. Null if GitHub can't be reached. */
export async function latestMotivRelease(): Promise<MotivRelease | null> {
  try {
    const res = await fetch(LATEST, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'emruz.com' },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const r = (await res.json()) as {
      tag_name: string;
      assets: { name: string; browser_download_url: string; size: number }[];
    };
    return parseRelease(
      r.tag_name,
      r.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
    );
  } catch (e) {
    console.error('latest Motiv release lookup failed', e);
    return null;
  }
}
