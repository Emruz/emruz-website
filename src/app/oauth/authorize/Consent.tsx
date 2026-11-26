'use client';

import { useState } from 'react';

const btn = 'px-4 py-2 rounded-md text-sm font-semibold';

export default function Consent({ params, appName, returnHost, email }: { params: Record<string, string | undefined>; appName: string; returnHost: string; email: string }) {
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'approve' | 'deny') {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch('/api/oauth/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...params, decision }),
      });
      const body = (await res.json()) as { redirect?: string; error?: string };
      if (body.redirect) {
        window.location.assign(body.redirect);
        return;
      }
      setError(body.error || 'Something went wrong. Please try again.');
    } catch {
      setError('Could not reach emruz.com. Check your connection and try again.');
    }
    setBusy(null);
  }

  return (
    <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-6 space-y-5">
      <div>
        <p className="text-sm text-gray-600">Signed in as {email}</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900 break-words">{appName} wants to read your Emruz kits</h2>
      </div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
        <li>It can list the kit skills and read the ones your account has.</li>
        <li>It cannot change anything or see your profile, billing or other data.</li>
        <li>You can disconnect it any time on your account page.</li>
      </ul>
      <p className="text-sm text-gray-600">
        How sign-in, tokens and your data are handled:{' '}
        <a href="/kits/security" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline">kits security and data statement</a>.
      </p>
      <p className="text-sm text-gray-600 break-words">
        After you approve, you go back to <span className="font-semibold text-gray-900">{returnHost}</span>. The app name comes from the app itself; only approve if you just started connecting it.
      </p>
      {error && (
        <p role="alert" className="p-3 rounded-md border border-red-300 bg-red-50 text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!!busy} onClick={() => decide('approve')} className={`${btn} bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60`}>
          {busy === 'approve' ? 'Connecting…' : 'Approve'}
        </button>
        <button type="button" disabled={!!busy} onClick={() => decide('deny')} className={`${btn} border border-gray-300 hover:bg-gray-50 disabled:opacity-60`}>
          Deny
        </button>
      </div>
    </div>
  );
}
