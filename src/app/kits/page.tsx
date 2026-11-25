import Link from 'next/link';
import { Check, Plug, RefreshCw, ShieldCheck } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { kitOffers, type KitOffer } from '@/content/kits';
import { kits, SITE_URL } from '@/lib/server/config';
import { currentBundle } from '@/lib/server/kits/content';
import { lifetimeOffer } from '@/lib/server/kits/sales';
import { canBuy, holding, LIFETIME_PACK, type Holding, type KitPlan } from '@/lib/server/kits/sales-core';
import { entitlementsFor } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';

export const metadata = {
  title: 'Emruz kits: Claude skills for shipping, founding and marketing',
  description:
    'Packs of Claude skills for testing and securing releases, validating and pricing a B2B business, and building on-brand customer decks. Connect once over MCP.',
};

const notices: Record<string, string> = {
  owned: 'You already have the latest release of that kit.',
  use_upgrade: 'You own an earlier release of that kit. Choose Upgrade to get the latest release at the lower price.',
  no_upgrade: 'Upgrade is for owners of an earlier release of that kit.',
  unknown_pack: 'That kit is not on sale.',
  unavailable: 'That option is not available right now. Please try again later.',
  lifetime_closed: 'The founding lifetime offer has closed.',
  impersonating: 'Switch back to your own account to buy.',
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

function BuyButton({ pack, plan, label, primary }: { pack: string; plan: KitPlan; label: string; primary?: boolean }) {
  return (
    <form action="/api/kits/checkout" method="post">
      <input type="hidden" name="pack" value={pack} />
      <input type="hidden" name="plan" value={plan} />
      <button
        className={
          primary
            ? 'w-full bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4338CA] transition-colors'
            : 'w-full border border-[#4F46E5] text-[#4F46E5] px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors'
        }
      >
        {label}
      </button>
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
  offer, count, have, open, lifetime,
}: {
  offer: KitOffer;
  count?: { total: number; free: number };
  have: Holding | null;
  open: boolean;
  lifetime: { left: number; cap: number; until: string } | null;
}) {
  const p = offer.prices;
  const owned = have?.state === 'latest';
  const upgradable = have?.state === 'held' && have.upgradable;
  return (
    <div className={`flex flex-col rounded-xl border p-6 ${offer.pack === 'all' ? 'border-2 border-[#4F46E5]' : 'border-gray-200'}`}>
      <h3 className="text-xl font-bold text-gray-900">{offer.name}</h3>
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
      <div className="mt-auto pt-6 space-y-4">
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
  const open = kits.salesOpen;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Kits' }]}
        title="Emruz kits"
        summary="Packs of Claude skills that test and secure your releases, validate and price your business, and build on-brand decks."
        primaryCta={{ label: open ? 'See prices' : 'Get notified at launch', href: open ? '#pricing' : '/contact?topic=kits' }}
        secondaryCta={account ? { label: 'Your kits', href: '/motiv/account#kits' } : { label: 'Sign in', href: '/signin?next=%2Fkits' }}
        sections={[
          { label: 'How it works', href: '#how' },
          { label: 'Prices', href: '#pricing' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
            {kitOffers.map((o) => (
              <OfferCard
                key={o.pack}
                offer={o}
                count={counts.get(o.pack)}
                have={account && latest ? holding(o.pack, ents, latest) : null}
                open={open}
                lifetime={o.pack === LIFETIME_PACK && lifetimeForMe && life.until ? { left: life.cap - life.sold, cap: life.cap, until: life.until } : null}
              />
            ))}
          </div>
          {open && (
            <p className="mt-4 text-sm text-gray-500">
              {account ? '' : 'You will be asked to sign in first, so the kit is linked to the account you connect with. '}
              By buying you agree to the <Link href="/terms" className="underline">terms of service</Link>.
            </p>
          )}
        </Container>
      </section>

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
              <dt className="font-semibold text-gray-900">Can my team use one purchase?</dt>
              <dd className="mt-1 text-gray-600">Each purchase is for one person. Each team member buys their own for now.</dd>
            </div>
          </dl>
        </Container>
      </section>
    </>
  );
}
