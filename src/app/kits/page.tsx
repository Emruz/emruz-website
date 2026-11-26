import Link from 'next/link';
import { Check, Plug, RefreshCw, ShieldCheck } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { BUNDLE_PACK, kitOffers, kitResults, LEAD_PACK, type KitOffer } from '@/content/kits';
import { SITE_URL } from '@/lib/server/config';
import { currentBundle } from '@/lib/server/kits/content';
import { PURCHASE_TRIGGERS } from '@/lib/server/kits/launch-core';
import { lifetimeOffer } from '@/lib/server/kits/sales';
import { canBuy, holding, LIFETIME_PACK, type Holding, type KitPlan } from '@/lib/server/kits/sales-core';
import { entitlementsFor } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';
import { siteSettings } from '@/lib/server/settings';

export const metadata = {
  title: 'Emruz Release Kit: Claude skills that check every release before it ships',
  description:
    'Claude skills that test, secure and check every release before it ships, with Founder and Marketing Kits as add-ons. Connect once over MCP.',
};

const notices: Record<string, string> = {
  owned: 'You already have the latest release of that kit.',
  use_upgrade: 'You own an earlier release of that kit. Choose Upgrade to get the latest release at the lower price.',
  no_upgrade: 'Upgrade is for owners of an earlier release of that kit.',
  unknown_pack: 'That kit is not on sale.',
  unavailable: 'That option is not available right now. Please try again later.',
  lifetime_closed: 'The founding lifetime offer has closed.',
  impersonating: 'Switch back to your own account to buy.',
  trigger: 'Tell us what made you buy now, then choose a price again.',
};

async function loadState() {
  const account = await currentAccount();
  let latest: string | null = null;
  const counts = new Map<string, { total: number; free: number }>();
  try {
    const b = await currentBundle();
    latest = b.ref;
    for (const i of b.manifest.items) {
      if (i.type !== 'skill') continue;
      for (const key of [i.pack, 'all']) {
        const c = counts.get(key) ?? { total: 0, free: 0 };
        c.total++;
        if (i.access === 'free') c.free++;
        counts.set(key, c);
      }
    }
  } catch {
    /* page still shows the offers */
  }
  const ents = account && latest ? await entitlementsFor(account.id) : [];
  const life = await lifetimeOffer().catch(() => ({ open: false, sold: 0, cap: 0, until: null }));
  // An account that already has lifetime (or an open staff grant of the bundle) is not offered it
  const lifetimeForMe = life.open && (!latest || canBuy(LIFETIME_PACK, 'lifetime', ents, latest, [], true).ok);
  return { account, latest, counts, ents, life, lifetimeForMe };
}

const fmtDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function LifetimeRow({ price, left, cap, until, open }: { price: number; left: number; cap: number; until: string; open: boolean }) {
  return (
    <div className="rounded-lg bg-indigo-50 p-4 space-y-3">
      <PriceRow price={price} period="lifetime">
        {open && <BuyButton pack={LIFETIME_PACK} plan="lifetime" label="Buy lifetime" primary />}
      </PriceRow>
      <p className="text-sm text-gray-700">
        Founding offer: one payment, every future release for as long as Emruz offers the kits. {left} of {cap} left, until {fmtDay(until)}.
      </p>
    </div>
  );
}

const PLAN_LABEL: Record<KitPlan, string> = { once: 'one time', upgrade: 'upgrade', month: 'monthly', year: 'annual', lifetime: 'lifetime' };

function BuyButton({ pack, plan, label, primary }: { pack: string; plan: KitPlan; label: string; primary?: boolean }) {
  // Inside the price list form (BuyForm), which carries the trigger question
  return (
    <button
      name="offer"
      value={`${pack}:${plan}`}
      aria-label={`${label}: ${kitOffers.find((o) => o.pack === pack)?.name ?? pack}, ${PLAN_LABEL[plan]}`}
      className={
        primary
          ? 'w-full bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4338CA] transition-colors'
          : 'w-full border border-[#4F46E5] text-[#4F46E5] px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors'
      }
    >
      {label}
    </button>
  );
}

/** Price list: one form when sales are open, so "what made you buy now" is asked once for every buy button (#71). */
function BuyForm({ open, ask, children }: { open: boolean; ask: boolean; children: React.ReactNode }) {
  if (!open) return <div>{children}</div>;
  // Nothing left to buy: no question
  if (!ask) return <form action="/api/kits/checkout" method="post">{children}</form>;
  return (
    <form action="/api/kits/checkout" method="post">
      <label className="mb-6 block max-w-xl text-sm">
        <span className="font-semibold text-gray-900">What made you buy now?</span>
        <span className="block text-gray-600">One answer helps us build what buyers need next. It is stored with your purchase.</span>
        <select name="trigger" required defaultValue="" className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
          <option value="" disabled>Choose one</option>
          {PURCHASE_TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </label>
      {children}
    </form>
  );
}

function PriceRow({ price, period, children }: { price: number; period: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <p>
        <span className="text-2xl font-bold text-gray-900">${price}</span> <span className="text-sm text-gray-500 whitespace-nowrap">{period}</span>
      </p>
      <div className="w-32">{children}</div>
    </div>
  );
}

function OfferCard({
  offer, count, have, open, lifetime, lead,
}: {
  offer: KitOffer;
  count?: { total: number; free: number };
  have: Holding | null;
  open: boolean;
  lifetime: { left: number; cap: number; until: string } | null;
  lead?: boolean;
}) {
  const p = offer.prices;
  const owned = have?.state === 'latest';
  const upgradable = have?.state === 'held' && have.upgradable;
  return (
    <div className={`flex flex-col rounded-xl border bg-white p-6 ${lead ? 'border-2 border-[#4F46E5] md:grid md:grid-cols-2 md:gap-10 md:p-8' : 'border-gray-200'}`}>
      <div>
        {lead && <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">Start here</p>}
        <h3 className={`${lead ? 'text-2xl' : 'text-xl'} font-bold text-gray-900`}>{offer.name}</h3>
        {count && (
          <p className="text-sm text-gray-500">
            {count.total} skills{count.free ? `, ${count.free} of them free` : ''}
          </p>
        )}
        <p className="mt-3 text-gray-700">{offer.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
          {offer.covers.map((c) => (
            <li key={c} className="flex gap-2">
              <Check className="w-4 h-4 text-[#4F46E5] flex-shrink-0 mt-0.5" />
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className={`mt-auto pt-6 space-y-4 ${lead ? 'md:mt-0 md:pt-0 md:self-center' : ''}`}>
        {lifetime && offer.prices.lifetime && <LifetimeRow price={offer.prices.lifetime} left={lifetime.left} cap={lifetime.cap} until={lifetime.until} open={open} />}
        {owned ? (
          <p role="status" className="rounded-lg bg-green-50 text-green-800 text-sm font-semibold px-4 py-3">
            You have the latest release. <Link href="/motiv/account#kits" className="underline">See your kits</Link>
          </p>
        ) : (
          <>
            {upgradable ? (
              <PriceRow price={p.upgrade} period="upgrade">
                {open && <BuyButton pack={offer.pack} plan="upgrade" label="Upgrade" primary />}
              </PriceRow>
            ) : (
              <PriceRow price={p.once} period="one time">
                {open && <BuyButton pack={offer.pack} plan="once" label="Buy" primary />}
              </PriceRow>
            )}
            <PriceRow price={p.month} period="per month">
              {open && <BuyButton pack={offer.pack} plan="month" label="Subscribe" />}
            </PriceRow>
            <PriceRow price={p.year} period="per year">
              {open && <BuyButton pack={offer.pack} plan="year" label="Subscribe" />}
            </PriceRow>
            {have?.state === 'held' && (
              <p className="text-sm text-gray-600">
                You have release {have.ref}.{upgradable ? '' : ' Your bundle covers this kit up to that release.'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default async function KitsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { account, latest, counts, ents, life, lifetimeForMe } = await loadState();
  const open = (await siteSettings()).kitsSalesOpen;
  const card = (o: KitOffer, isLead = false) => (
    <OfferCard
      key={o.pack}
      offer={o}
      lead={isLead}
      count={counts.get(o.pack)}
      have={account && latest ? holding(o.pack, ents, latest) : null}
      open={open}
      lifetime={o.pack === LIFETIME_PACK && lifetimeForMe && life.until ? { left: life.cap - life.sold, cap: life.cap, until: life.until } : null}
    />
  );
  // Release Kit first, the other kits as add-ons, the all-kits bundle last (#71)
  const lead = kitOffers.find((o) => o.pack === LEAD_PACK);
  const bundle = kitOffers.find((o) => o.pack === BUNDLE_PACK);
  const addOns = kitOffers.filter((o) => o !== lead && o !== bundle);
  const canBuyAny = !account || !latest || lifetimeForMe || kitOffers.some((o) => holding(o.pack, ents, latest).state !== 'latest');
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Kits' }]}
        title="Emruz Release Kit"
        summary="Claude skills that test, secure and check every release before it ships. Add the Founder and Marketing Kits when you need them."
        primaryCta={{ label: open ? 'See prices' : 'Get notified at launch', href: open ? '#pricing' : '/contact?topic=kits' }}
        secondaryCta={account ? { label: 'Your kits', href: '/motiv/account#kits' } : { label: 'Sign in', href: '/signin?next=%2Fkits' }}
        sections={[
          { label: 'How it works', href: '#how' },
          { label: 'Prices', href: '#pricing' },
          ...(kitResults.length ? [{ label: 'Results', href: '#results' }] : []),
          { label: 'Security', href: '/kits/security' },
          { label: 'Questions', href: '#faq' },
        ]}
      />

      <section id="how" className="scroll-mt-20 py-12 md:py-16">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Plug className="w-6 h-6 text-[#4F46E5] mb-3" />
              <h3 className="font-semibold text-gray-900">Connect once</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add <span className="font-mono text-gray-800 break-all">{SITE_URL}/api/mcp</span> to Claude or another MCP app and sign
                in with your Emruz account. No files to copy.
              </p>
            </div>
            <div>
              <ShieldCheck className="w-6 h-6 text-[#4F46E5] mb-3" />
              <h3 className="font-semibold text-gray-900">Free to start</h3>
              <p className="mt-1 text-sm text-gray-600">Free skills work with any account, including the testing kit. Paid kits add the rest.</p>
            </div>
            <div>
              <RefreshCw className="w-6 h-6 text-[#4F46E5] mb-3" />
              <h3 className="font-semibold text-gray-900">Buy once or subscribe</h3>
              <p className="mt-1 text-sm text-gray-600">
                Buy a kit once and keep the release you bought, with a lower price to upgrade later. Or subscribe and always get the
                latest release.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section id="pricing" className="scroll-mt-20 py-12 md:py-16 bg-gray-50 border-y border-gray-200">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Prices</h2>
          <p className="mt-2 text-gray-600 mb-6">
            Per person, in USD. Sales tax or VAT is added at checkout where it applies.
            {latest ? ` Current release: ${latest}.` : ''}
            {!open && ' Available at launch.'}
          </p>
          {notice && Object.hasOwn(notices, notice) && (
            <p role="status" className="mb-6 rounded-lg bg-amber-50 text-amber-900 text-sm font-semibold px-4 py-3">{notices[notice]}</p>
          )}
          <BuyForm open={open} ask={canBuyAny}>
            {lead && card(lead, true)}
            {addOns.length > 0 && (
              <>
                <h3 className="mt-10 text-xl font-bold text-gray-900">Add-ons</h3>
                <p className="mt-1 mb-4 text-gray-600">Add to the Release Kit when you need them, or get every kit in the bundle.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{addOns.map((o) => card(o))}</div>
              </>
            )}
            {bundle && (
              <>
                <h3 className="mt-10 mb-4 text-xl font-bold text-gray-900">Every kit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{card(bundle)}</div>
              </>
            )}
          </BuyForm>
          {open && (
            <p className="mt-4 text-sm text-gray-500">
              {account ? '' : 'You will be asked to sign in first, so the kit is linked to the account you connect with. '}
              By buying you agree to the <Link href="/terms" className="underline">terms of service</Link>.
            </p>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Buying for a company? Read how the kits server signs you in and handles data in the{' '}
            <Link href="/kits/security" className="font-semibold text-[#4F46E5] underline">security and data statement</Link>.
          </p>
        </Container>
      </section>

      {kitResults.length > 0 && (
        <section id="results" className="scroll-mt-20 py-12 md:py-16">
          <Container>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Results</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kitResults.map((r) => (
                <li key={`${r.customer}-${r.pack}`} className="rounded-xl border border-gray-200 p-6">
                  <p className="text-gray-800">{r.outcome}</p>
                  <p className="mt-3 text-sm text-gray-600">
                    {r.customer} · {kitOffers.find((o) => o.pack === r.pack)?.name ?? r.pack} ·{' '}
                    <a href={r.source} className="underline" rel="noopener noreferrer" target="_blank">Source</a>
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section id="faq" className="scroll-mt-20 py-12 md:py-16">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Questions</h2>
          <dl className="space-y-5 max-w-3xl">
            <div>
              <dt className="font-semibold text-gray-900">What does a one-time purchase include?</dt>
              <dd className="mt-1 text-gray-600">
                The kit as of the release you bought, for as long as Emruz offers the kits. When a newer release comes out you can upgrade
                for less than the full price, or keep the one you have.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">What is the founding lifetime offer?</dt>
              <dd className="mt-1 text-gray-600">
                While it is open, All kits can be bought once with every future release included for as long as Emruz offers the kits. It is
                limited to the first buyers and closes on the date shown. If you already subscribe, cancel the subscription from your account
                after buying.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">What happens if I cancel a subscription?</dt>
              <dd className="mt-1 text-gray-600">Access continues to the end of the period you paid for, then the kit stops working. Free skills keep working.</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Refunds</dt>
              <dd className="mt-1 text-gray-600">
                Full refund within 14 days of a first purchase. <Link href="/contact?topic=kits" className="underline">Contact us</Link> to ask
                for one; access ends when it is refunded.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Can my security team review it?</dt>
              <dd className="mt-1 text-gray-600">
                Yes. The <Link href="/kits/security" className="underline">security and data statement</Link> covers sign-in, what apps can
                do, token lifetimes, what is stored, the audit log, rate limits and hosting.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Can my team use one purchase?</dt>
              <dd className="mt-1 text-gray-600">Each purchase is for one person. Each team member buys their own for now.</dd>
            </div>
          </dl>
        </Container>
      </section>
    </>
  );
}
