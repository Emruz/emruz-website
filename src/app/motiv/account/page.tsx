import Link from 'next/link';
import { Laptop } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { PROVIDERS, providerConfigured, providerLabel } from '@/lib/server/oauth';
import { fmtDate, planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { removeDevice, unlinkIdentity } from './actions';

export const metadata = { title: 'Your Motiv account', robots: { index: false } };

const claimMessages: Record<string, string> = {
  sent: 'Check that inbox for a confirmation link.',
  done: 'Email added. Purchases made with it now show below.',
  invalid: 'Enter a valid email address.',
  failed: 'We could not send the email. Please try again shortly.',
};

const providerNames: Record<string, string> = { ...providerLabel, email: 'Email link' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ claim?: string; removed?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/motiv/account');
  const subs = await subscriptionsFor({ accountId: account.id });
  const identities = await db()<{ id: string; provider: string; email: string | null }[]>`
    select id, provider, email from identities where account_id = ${account.id} order by linked_at`;
  const linkable = PROVIDERS.filter((p) => providerConfigured(p) && !identities.some((i) => i.provider === p));

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Motiv', href: '/motiv' }, { label: 'Your account' }]}
        title="Your Motiv account"
        summary={`Signed in as ${account.email}.`}
        sections={[
          { label: 'Subscriptions', href: '#subscriptions' },
          { label: 'Sign-in methods', href: '#signin' },
          { label: 'Find a purchase', href: '#claim' },
        ]}
      />

      <section id="subscriptions" className="py-10 md:py-12 scroll-mt-20">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscriptions</h2>
          {sp.removed && <p className="mb-4 text-sm text-green-800">Computer removed. That seat is free.</p>}
          {subs.length === 0 ? (
            <p className="text-gray-600">
              No Motiv subscriptions on this account yet.{' '}
              <Link href="/motiv#plans" className="text-blue-700 font-semibold">See plans</Link> or{' '}
              <a href="#claim" className="text-blue-700 font-semibold">find a purchase made with another email</a>.
            </p>
          ) : (
            <div className="space-y-6">
              {subs.map((s) => (
                <article key={s.id} className="rounded-xl border border-gray-200 p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Motiv Premium · {planLabel[s.plan]}
                        {s.complimentary && <span className="ml-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Complimentary</span>}
                      </h3>
                      <p className={`text-sm mt-1 ${s.usable ? 'text-gray-600' : 'text-red-700'}`}>{statusLabel(s)}</p>
                      <p className="mt-3 text-sm text-gray-500">Subscription ID</p>
                      <p className="font-mono text-lg text-gray-900 select-all">{s.subscription_id}</p>
                    </div>
                    {s.stripe_customer_id && (
                      <form action="/api/motiv/portal" method="post">
                        <input type="hidden" name="subscription" value={s.id} />
                        <button className="px-4 py-2 rounded-md font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50 whitespace-nowrap">
                          Billing &amp; receipts
                        </button>
                      </form>
                    )}
                  </div>

                  <h4 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Computers ({s.devices.length} of {s.seats})
                  </h4>
                  {s.devices.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-600">
                      None yet. In Motiv, open Settings &gt; Premium and choose Register this computer.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-100">
                      {s.devices.map((d) => (
                        <li key={d.device_id} className="flex items-center justify-between gap-4 py-3">
                          <div className="flex items-center gap-3">
                            <Laptop className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{d.device_name || 'Unnamed computer'}</p>
                              <p className="text-xs text-gray-500">
                                {[d.os, d.app_version && `Motiv ${d.app_version}`, d.last_checkin && `last seen ${fmtDate(d.last_checkin)}`]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                          </div>
                          <form action={removeDevice}>
                            <input type="hidden" name="subscription" value={s.id} />
                            <input type="hidden" name="device" value={d.device_id} />
                            <button className="text-sm font-semibold text-red-700 hover:text-red-900">Remove</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="mt-6 text-sm text-gray-500">
            Downloads will be listed here when Motiv is released. Questions? <Link href="/contact?topic=motiv" className="text-blue-700">Contact us</Link>.
          </p>
        </Container>
      </section>

      <section id="signin" className="py-10 md:py-12 bg-gray-50 border-y border-gray-200 scroll-mt-20">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign-in methods</h2>
          <ul className="divide-y divide-gray-200 max-w-xl">
            {identities.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium text-gray-900">{providerNames[i.provider] ?? i.provider}</span>
                  {i.email && <span className="text-sm text-gray-500"> · {i.email}</span>}
                </span>
                {identities.length > 1 && (
                  <form action={unlinkIdentity}>
                    <input type="hidden" name="identity" value={i.id} />
                    <button className="text-sm font-semibold text-gray-600 hover:text-red-700">Unlink</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {linkable.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {linkable.map((p) => (
                <a
                  key={p}
                  href={`/auth/${p}?link=1&next=/motiv/account%23signin`}
                  className="px-4 py-2 rounded-md font-semibold border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                >
                  Link {providerLabel[p]}
                </a>
              ))}
            </div>
          )}
          <form action="/auth/signout" method="post" className="mt-6">
            <button className="text-sm font-semibold text-gray-600 hover:text-gray-900">Sign out</button>
          </form>
          {isAdmin(account) && (
            <p className="mt-4 text-sm">
              <Link href="/admin/motiv" className="text-indigo-700 font-semibold">Motiv admin →</Link>
            </p>
          )}
        </Container>
      </section>

      <section id="claim" className="py-10 md:py-12 scroll-mt-20">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Find a purchase made with another email</h2>
          <p className="text-gray-600 mb-4 max-w-2xl">
            If you bought Motiv with a different address (for example, you sign in with Apple&apos;s Hide My Email), enter it
            here. We&apos;ll send a link to that address; opening it adds the email and its purchases to this account.
          </p>
          {sp.claim && <p className="mb-4 text-sm font-semibold text-gray-800">{claimMessages[sp.claim]}</p>}
          <form action="/auth/email" method="post" className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input type="hidden" name="purpose" value="claim" />
            <input type="hidden" name="next" value="/motiv/account" />
            <label htmlFor="claim-email" className="sr-only">Purchase email</label>
            <input
              id="claim-email"
              name="email"
              type="email"
              required
              placeholder="purchase@example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
              Send link
            </button>
          </form>
        </Container>
      </section>
    </>
  );
}
