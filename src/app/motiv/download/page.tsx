import Link from 'next/link';
import { headers } from 'next/headers';
import { Download as DownloadIcon } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { MOTIV_RELEASES_URL } from '@/content/products';
import { detectPlatform, formatSize, PLATFORM_LABEL, type Platform } from '@/lib/motiv-downloads';
import { latestMotivRelease } from '@/lib/server/releases';

export const metadata = {
  title: 'Download Motiv',
  description: 'Download Motiv for Mac, Windows or Linux and unlock Motiv Pro.',
};

const PLATFORMS: Platform[] = ['mac', 'windows', 'linux'];

const INSTALL: Record<Platform, string[]> = {
  mac: [
    'Open the downloaded file (it ends in .dmg) from your Downloads folder.',
    'Drag the Motiv icon into the Applications folder.',
    'Open Motiv from Applications or Launchpad.',
  ],
  windows: [
    'Open the downloaded file (it ends in -setup.exe) from your Downloads folder.',
    'Follow the installer and choose Install.',
    'Open Motiv from the Start menu.',
  ],
  linux: [
    'Right-click the downloaded .AppImage file, open Properties and allow it to run as a program.',
    'Double-click it to open Motiv.',
  ],
};

export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ os?: string }> }) {
  const sp = await searchParams;
  const chosen = PLATFORMS.find((p) => p === sp.os);
  const detected = detectPlatform((await headers()).get('user-agent'));
  const platform = chosen ?? detected;
  const release = await latestMotivRelease();
  const main = platform && release ? release.primary[platform] : undefined;
  const others = PLATFORMS.filter((p) => p !== platform);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Motiv', href: '/motiv' }, { label: 'Download' }]}
        title="Download Motiv"
        summary="Install Motiv on your computer, then unlock Pro with your subscription. It takes about two minutes."
      />
      <section className="py-10 md:py-12">
        <Container>
          <div className="max-w-2xl space-y-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Download</h2>
              {!release && (
                <p className="text-gray-700">
                  The download list is not available right now.{' '}
                  <a href={MOTIV_RELEASES_URL} className="text-blue-700 font-semibold">Open the release page</a> and choose the
                  file ending in <strong>.dmg</strong> for Mac or <strong>-setup.exe</strong> for Windows.
                </p>
              )}
              {release && !platform && (
                <div className="space-y-3">
                  <p className="text-gray-700">Motiv runs on a computer. Open this page on your Mac or PC, or choose one:</p>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((p) => (
                      <Link key={p} href={`/motiv/download?os=${p}`} className="px-5 py-3 rounded-lg border border-gray-300 font-semibold text-gray-800 hover:bg-gray-50">
                        {PLATFORM_LABEL[p]}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {release && platform && main && (
                <div className="space-y-3">
                  <a
                    href={main.url}
                    className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <DownloadIcon className="w-6 h-6" />
                    Download for {main.label}
                  </a>
                  <p className="text-sm text-gray-500">
                    Motiv {release.version} · {formatSize(main.size)}
                    {platform === 'mac' && ' · Needs a Mac with Apple Silicon (M1 or later)'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Not on {PLATFORM_LABEL[platform]}?{' '}
                    {others.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ' or '}
                        <Link href={`/motiv/download?os=${p}`} className="text-blue-700 font-semibold">
                          {PLATFORM_LABEL[p]}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>

            {platform && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Install</h2>
                <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                  {INSTALL[platform].map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{platform ? '3.' : '2.'} Unlock Motiv Pro</h2>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>In Motiv, open <strong>Settings</strong> and then <strong>License</strong>.</li>
                <li>Choose <strong>Register this computer</strong>. Motiv shows a short code and opens your browser.</li>
                <li>
                  Sign in at <Link href="/activate" className="text-blue-700 font-semibold">emruz.com/activate</Link> with the email
                  your subscription was sent to, enter the code, and choose Approve.
                </li>
              </ol>
              <p className="mt-3 text-gray-600">
                Prefer not to sign in? Paste the subscription ID from your email into Motiv instead. It starts with MOTIV-.
              </p>
              <p className="mt-3 text-gray-600">
                No subscription yet? <Link href="/motiv#plans" className="text-blue-700 font-semibold">See plans</Link>. Stuck?{' '}
                <Link href="/contact?topic=motiv" className="text-blue-700 font-semibold">Contact us</Link>.
              </p>
            </div>

            {release && release.all.length > 0 && (
              <details className="rounded-xl border border-gray-200 p-4">
                <summary className="cursor-pointer font-semibold text-gray-900">Other downloads</summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {release.all.map((d) => (
                    <li key={d.name} className="flex flex-wrap justify-between gap-2">
                      <a href={d.url} className="text-blue-700 font-semibold">{d.kind}</a>
                      <span className="text-gray-500">{formatSize(d.size)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-gray-500">
                  Checksums and older versions are on the <a href={MOTIV_RELEASES_URL} className="text-blue-700">release page</a>.
                </p>
              </details>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
