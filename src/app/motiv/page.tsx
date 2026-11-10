import Link from 'next/link';
import { Check, Lock, Cpu, EyeOff, CalendarCheck } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { MOTIV_DOWNLOAD_URL, motivFree, motivPremium, motivPrivacy } from '@/content/products';
import { motiv } from '@/lib/server/config';

export const metadata = {
  title: 'Motiv: private AI meeting assistant',
  description:
    'Motiv records your meetings, transcribes them on your own computer, and turns them into summaries, action items and answers. For macOS and Windows.',
};

const privacyIcons = [Lock, Cpu, EyeOff, CalendarCheck];

const plans = [
  { plan: 'monthly', name: 'Monthly', price: '$9', period: 'per month', note: 'Billed monthly. Cancel any time.' },
  { plan: 'annual', name: 'Annual', price: '$99', period: 'per year', note: 'Billed yearly. One month free compared with monthly.' },
  { plan: 'lifetime', name: 'Lifetime', price: '$299', period: 'one time', note: 'One payment, Premium for as long as you use Motiv.' },
];

export default function MotivPage() {
  const salesOpen = motiv.salesOpen;
  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Motiv' },
        ]}
        title="Motiv"
        summary="Your meetings, recorded, transcribed and understood, without sending your audio anywhere."
        primaryCta={salesOpen ? { label: 'Get Premium', href: '#plans' } : { label: 'Get notified at launch', href: '/contact?topic=motiv' }}
        secondaryCta={salesOpen ? { label: 'Download', href: MOTIV_DOWNLOAD_URL } : { label: 'Your account', href: '/motiv/account' }}
        sections={[
          { label: 'Overview', href: '#overview' },
          { label: 'Privacy', href: '#privacy' },
          { label: 'Free vs Premium', href: '#features' },
          { label: 'Plans', href: '#plans' },
        ]}
      />

      {/* Overview */}
      <section id="overview" className="scroll-mt-20 bg-gradient-to-br from-[#4F46E5] via-[#6D5AE6] to-[#7C3AED] text-white">
        <Container className="py-10 md:py-14 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="max-w-2xl">
            <p className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/15 rounded-full px-3 py-1 mb-4">
              Coming soon · macOS and Windows
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Otter-style notes, without giving a cloud service your audio.
            </h2>
            <p className="mt-4 text-lg text-indigo-100">
              Motiv records Teams, Zoom and Google Meet calls, transcribes them on your own computer, and turns them
              into summaries, action items and answers you can ask for in plain language. Built for consultants,
              managers, sales and anyone in regulated or confidential work.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/motiv/motiv-logo.svg" alt="Motiv logo" width={192} height={192} className="hidden lg:block w-48 h-48 drop-shadow-xl" />
        </Container>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-20 py-12 md:py-16">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Private by default</h2>
            <Link href="/motiv/privacy" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Read the Motiv privacy policy →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {motivPrivacy.map((item, i) => {
              const Icon = privacyIcons[i];
              return (
                <div key={item.title}>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-12 md:py-16 bg-gray-50 border-y border-gray-200">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Free vs Premium</h2>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <p className="text-sm text-gray-500 mb-4">Everything you need to record and summarize.</p>
              <ul className="space-y-2">
                {motivFree.map((f) => (
                  <li key={f} className="flex gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-[#4F46E5] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border-2 border-[#4F46E5] p-6">
              <h3 className="text-xl font-bold text-gray-900">Premium</h3>
              <p className="text-sm text-gray-500 mb-4">Everything in Free, plus:</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {motivPremium.map((f) => (
                  <div key={f.title}>
                    <dt className="font-semibold text-gray-900">{f.title}</dt>
                    <dd className="text-sm text-gray-600">{f.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-20 py-12 md:py-16">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Premium plans</h2>
          <p className="mt-2 text-gray-600 mb-8">Prices in USD. Sales tax or VAT is added at checkout where it applies.{!salesOpen && ' Available when Motiv launches.'}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>{' '}
                  <span className="text-gray-500">{plan.period}</span>
                </p>
                <p className="mt-2 text-sm text-gray-600">{plan.note}</p>
                {salesOpen && (
                  <form action="/api/motiv/checkout" method="post" className="mt-5">
                    <input type="hidden" name="plan" value={plan.plan} />
                    <button className="w-full bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#4338CA] transition-colors">
                      Buy {plan.name}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
          {salesOpen && (
            <p className="mt-4 text-sm text-gray-500">
              By buying you agree to the <Link href="/terms" className="underline">terms of service</Link> and the{' '}
              <Link href="/motiv/eula" className="underline">Motiv license agreement</Link>. Full refund within 14 days of
              your first purchase.
            </p>
          )}
          <p className="mt-6 text-sm text-gray-500">
            Register a computer by signing in on emruz.com and entering the code Motiv shows you, or paste your
            subscription ID. Manage billing and devices from your account.
          </p>
          {!salesOpen && (
            <Link
              href="/contact?topic=motiv"
              className="mt-6 inline-block bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4338CA] transition-colors"
            >
              Get notified at launch
            </Link>
          )}
        </Container>
      </section>
    </>
  );
}
