'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { CONSENT_TEXT } from '@/content/cis-assessment';
import { register, type RegisterState } from './actions';

const input =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

export default function RegisterForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});
  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-semibold text-gray-900 mb-1">Full name</label>
          <input id="full_name" name="full_name" required defaultValue={defaultName} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-semibold text-gray-900 mb-1">Company</label>
          <input id="company" name="company" required autoComplete="organization" className={input} />
        </div>
        <div>
          <label htmlFor="job_title" className="block text-sm font-semibold text-gray-900 mb-1">
            Job title <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input id="job_title" name="job_title" autoComplete="organization-title" className={input} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-1">
            Phone <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={input} />
        </div>
      </div>

      <label className="flex gap-3 items-start rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
        <input type="checkbox" name="consent" value="yes" required className="mt-1 w-4 h-4 accent-blue-600" />
        <span>
          {CONSENT_TEXT} See our <Link href="/privacy" className="text-blue-700 underline">privacy policy</Link>.
        </span>
      </label>

      {state.error && <p role="alert" className="text-red-700 font-semibold">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? 'Registering…' : 'Register and start'}
      </button>
    </form>
  );
}
