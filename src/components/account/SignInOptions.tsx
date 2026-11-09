import { Mail } from 'lucide-react';
import { PROVIDERS, providerConfigured, providerLabel } from '@/lib/server/oauth';

/** Microsoft, Google, Apple buttons plus the email link form. Server component. */
export default function SignInOptions({ next }: { next: string }) {
  const providers = PROVIDERS.filter(providerConfigured);
  return (
    <div className="space-y-3">
      {providers.map((p) => (
        <a
          key={p}
          href={`/auth/${p}?next=${encodeURIComponent(next)}`}
          className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-3 font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <ProviderMark provider={p} />
          Continue with {providerLabel[p]}
        </a>
      ))}

      {providers.length > 0 && (
        <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-wider text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      <form action="/auth/email" method="post" className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="purpose" value="signin" />
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          placeholder="you@company.com"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Mail className="w-4 h-4" /> Email me a sign-in link
        </button>
      </form>
    </div>
  );
}

function ProviderMark({ provider }: { provider: string }) {
  if (provider === 'microsoft') {
    return (
      <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    );
  }
  if (provider === 'google') {
    return (
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.6 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.9-2.1 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-16.7z" />
        <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.8-6z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.4 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="18" viewBox="0 0 384 512" aria-hidden>
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}
