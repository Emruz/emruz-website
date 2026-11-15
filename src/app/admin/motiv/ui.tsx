import type { ReactNode } from 'react';

export const input = 'px-3 py-2 border border-gray-300 rounded-md text-sm';
export const btn = 'px-3 py-2 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50';
export const danger = 'px-3 py-2 rounded-md text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-50';

/** Shown when the admin must sign in again before making changes. The page is read-only until then. */
export function ReauthBanner({ next }: { next: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <span>For security, this page is read-only until you sign in again.</span>
      <a href={`/signin?reauth=1&next=${encodeURIComponent(next)}`} className="font-semibold underline">Sign in again</a>
    </div>
  );
}

/** One-line result of an action: green for success, red for an error. */
export function Notice({ msg, error = false }: { msg?: string; error?: boolean }) {
  if (!msg) return null;
  const tone = error
    ? 'bg-red-50 border-red-300 text-red-800'
    : 'bg-green-50 border-green-200 text-green-900';
  return <p role={error ? 'alert' : 'status'} className={`mb-6 p-3 rounded-md border text-sm ${tone}`}>{msg}</p>;
}

const tones = {
  good: 'bg-green-100 text-green-800',
  warn: 'bg-amber-100 text-amber-900',
  bad: 'bg-red-100 text-red-800',
  muted: 'bg-gray-100 text-gray-700',
  info: 'bg-indigo-100 text-indigo-800',
} as const;

export function StatusPill({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Tone for a licence's status label. */
export function licenceTone(status: string, usable: boolean): keyof typeof tones {
  if (status === 'revoked') return 'bad';
  if (!usable || status === 'past_due') return 'warn';
  return 'good';
}
