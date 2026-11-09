import Link from 'next/link';
import { Laptop, CheckCircle2 } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { findPendingPairing } from '@/lib/server/licensing';
import { normalizeUserCode } from '@/lib/server/lease';
import { planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { requireAccount } from '@/lib/server/session';
import { approve, decline, lookupCode } from './actions';

export const metadata = { title: 'Register a computer', robots: { index: false } };

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; done?: string }>;
}) {
  const sp = await searchParams;
  const code = normalizeUserCode(sp.code);
  const account = await requireAccount(`/activate${code ? `?code=${code}` : ''}`);
  const pairing = code ? await findPendingPairing(code) : null;
  const subs = pairing ? (await subscriptionsFor({ accountId: account.id })).filter((s) => s.usable) : [];

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Motiv', href: '/motiv' },
          { label: 'Register a computer' },
        ]}
        title="Register a computer"
        summary={`Signed in as ${account.email}. Enter the code Motiv shows to unlock Premium on that computer.`}
      />
      <section className="py-10 md:py-12">
        <Container>
          <div className="max-w-xl">
            {sp.error && (
              <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm">
                {sp.error}
              </div>
            )}

            {sp.done === 'approved' && (
              <div className="p-6 rounded-xl bg-green-50 border border-green-300 text-green-900">
                <CheckCircle2 className="w-6 h-6 mb-2" />
                <p className="font-semibold">Approved. Motiv will unlock Premium in a few seconds.</p>
                <p className="text-sm mt-1">You can close this page.</p>
              </div>
            )}
            {sp.done === 'declined' && (
              <p className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
                Declined. That computer was not registered.
              </p>
            )}

            {!sp.done && !pairing && (
              <form action={lookupCode} className="space-y-3">
                <label htmlFor="code" className="block text-sm font-semibold text-gray-900">
                  Code from Motiv
                </label>
                <input
                  id="code"
                  name="code"
                  defaultValue={sp.code || ''}
                  required
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  placeholder="XXXX-XXXX"
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg text-2xl tracking-widest font-mono uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Continue
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  In Motiv, open Settings &gt; Premium and choose Register this computer to get a code.
                </p>
              </form>
            )}

            {!sp.done && pairing && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <Laptop className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{pairing.device_name || 'Unnamed computer'}</p>
                    <p className="text-sm text-gray-500">
                      {[pairing.os, pairing.app_version && `Motiv ${pairing.app_version}`].filter(Boolean).join(' · ')} ·
                      code <span className="font-mono">{pairing.user_code}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Only approve if this is your computer and you just asked for a code.</p>

                {subs.length === 0 ? (
                  <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
                    <p className="font-semibold">No active Motiv subscription on this account.</p>
                    <p className="text-sm mt-1">
                      <Link href="/motiv#plans" className="underline">Get Premium</Link>, or if you bought with a different email,{' '}
                      <Link href="/motiv/account" className="underline">add that email to your account</Link>. The code stays valid
                      for a few minutes.
                    </p>
                  </div>
                ) : (
                  <form action={approve} className="space-y-4">
                    <input type="hidden" name="code" value={pairing.user_code} />
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-semibold text-gray-900 mb-2">Use subscription</legend>
                      {subs.map((s, i) => (
                        <label key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input type="radio" name="subscription" value={s.id} defaultChecked={i === 0} className="mt-1" />
                          <span>
                            <span className="block font-semibold text-gray-900">
                              {planLabel[s.plan]} · <span className="font-mono text-sm">{s.subscription_id}</span>
                            </span>
                            <span className="block text-sm text-gray-500">
                              {statusLabel(s)} · {s.devices.length} of {s.seats} computers
                            </span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <div className="flex gap-3">
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Approve
                      </button>
                      <button
                        formAction={decline}
                        className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50"
                      >
                        Decline
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
