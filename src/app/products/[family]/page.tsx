import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container, CTABanner } from '@/components';
import PackagePortfolio from '@/components/PackagePortfolio';
import {
  capabilities,
  displayCode,
  families,
  familyByPath,
  familyCapabilities,
  packages,
  POWERED_BY,
} from '@/content/packages';

export function generateStaticParams() {
  return families.map((f) => ({ family: f.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ family: string }> }) {
  const f = familyByPath((await params).family);
  if (!f) return {};
  return { title: `${f.label}: ${f.name}`, description: f.summary };
}

export default async function FamilyPage({ params }: { params: Promise<{ family: string }> }) {
  const f = familyByPath((await params).family);
  if (!f) notFound();

  const tiers = packages.filter((p) => p.family === f.slug);
  const all = familyCapabilities(f.slug);
  const idx = families.indexOf(f);
  const prev = families[idx - 1];
  const next = families[idx + 1];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: f.label }]}
        title={`${f.label}: ${f.name}`}
        summary={f.summary}
        primaryCta={{ label: `Discuss ${f.label}`, href: `/contact?topic=${encodeURIComponent(f.label)}` }}
        secondaryCta={{ label: 'Compare all', href: '/products/compare' }}
        sections={[
          { label: tiers.length > 1 ? 'Editions' : 'Package', href: '#tiers' },
          { label: "What's included", href: '#included' },
        ]}
      />
      <Container>
        <p className="-mt-3 pb-3 text-xs text-gray-400">{POWERED_BY}</p>
      </Container>

      <section id="tiers" className="py-10 md:py-12 bg-gray-50 border-y border-gray-200 scroll-mt-20">
        <Container>
          <div className="mb-6">
            <p className="text-sm font-semibold text-indigo-700">{f.tagline}</p>
            <p className="text-gray-600 mt-1">
              <strong className="text-gray-900">Best for:</strong> {f.bestFor}
            </p>
          </div>
          <PackagePortfolio family={f.slug} />
        </Container>
      </section>

      <section id="included" className="py-12 md:py-16 scroll-mt-20">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">What&apos;s included</h2>
          <p className="text-gray-600 mb-8">
            {tiers.length > 1
              ? `Every capability across the ${f.label} editions. Each card above shows which edition includes what.`
              : `Everything in ${displayCode(tiers[0].code)}.`}
          </p>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {all.map((c) => (
              <div key={c} className="flex gap-4">
                <dt className="w-20 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-gray-50 text-gray-700 border-gray-200">{c}</span>
                </dt>
                <dd>
                  <p className="font-semibold text-gray-900">{capabilities[c].name}</p>
                  <p className="text-sm text-gray-600">{capabilities[c].description}</p>
                </dd>
              </div>
            ))}
          </dl>

          <nav aria-label="Other products" className="mt-12 flex flex-wrap justify-between gap-4 border-t border-gray-200 pt-6">
            {prev ? (
              <Link href={`/products/${prev.path}`} className="text-indigo-700 font-semibold hover:text-indigo-900">
                ← {prev.label}: {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/products/${next.path}`} className="text-indigo-700 font-semibold hover:text-indigo-900">
                {next.label}: {next.name} →
              </Link>
            )}
          </nav>
        </Container>
      </section>

      <CTABanner
        heading={`Is ${f.label} the right fit?`}
        description="A short assessment shows where you are today and which edition closes the gaps that matter."
        primaryCta={{ label: 'Schedule an Assessment', href: '/assessments' }}
        secondaryCta={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}
