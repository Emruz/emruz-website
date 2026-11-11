import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container, CTABanner } from '@/components';
import PackagePortfolio from '@/components/PackagePortfolio';
import { Check } from 'lucide-react';
import {
  addOnLineByPath,
  addOnLines,
  addOns,
  capabilities,
  displayCode,
  families,
  familyByPath,
  familyCapabilities,
  packages,
  POWERED_BY,
} from '@/content/packages';

export function generateStaticParams() {
  return [...families.map((f) => ({ family: f.path })), ...addOnLines.map((l) => ({ family: l.path }))];
}

export async function generateMetadata({ params }: { params: Promise<{ family: string }> }) {
  const path = (await params).family;
  const f = familyByPath(path) ?? addOnLineByPath(path);
  if (!f) return {};
  return { title: `${f.label}: ${f.name}`, description: f.summary };
}

export default async function FamilyPage({ params }: { params: Promise<{ family: string }> }) {
  const path = (await params).family;
  const line = addOnLineByPath(path);
  if (line) return <AddOnPage path={path} />;
  const f = familyByPath(path);
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

/** Page for an add-on product line (PSA, DRM, DSB). */
function AddOnPage({ path }: { path: string }) {
  const l = addOnLineByPath(path)!;
  const items = addOns.filter((a) => a.family === l.slug);
  const idx = addOnLines.indexOf(l);
  const prev = addOnLines[idx - 1];
  const next = addOnLines[idx + 1];
  const single = l.columns.length === 1;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: l.label }]}
        title={`${l.label}: ${l.name}`}
        summary={l.summary}
        primaryCta={{ label: `Discuss ${l.label}`, href: `/contact?topic=${encodeURIComponent(l.label)}` }}
        secondaryCta={{ label: 'Compare managed security', href: '/products/compare' }}
        sections={[
          { label: 'Overview', href: '#overview' },
          { label: "What's included", href: '#included' },
        ]}
      />
      <Container>
        <p className="-mt-3 pb-3 text-xs text-gray-400">{POWERED_BY}</p>
      </Container>

      <section id="overview" className="py-10 md:py-12 bg-gray-50 border-y border-gray-200 scroll-mt-20">
        <Container>
          <div className="mb-6">
            <p className="text-sm font-semibold text-indigo-700">{l.tagline}</p>
            <p className="text-gray-600 mt-1">
              <strong className="text-gray-900">Best for:</strong> {l.bestFor}
            </p>
            <p className="text-gray-600 mt-1">
              <strong className="text-gray-900">Works with:</strong> any EDR, MDR, XDR or ΔDR edition, or on its own.
            </p>
          </div>
          <div className={`grid gap-6 ${items.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {items.map((a) => (
              <div key={a.code} className="bg-indigo-800 text-white rounded-xl p-6 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Add-on</p>
                <h2 className="text-2xl font-bold mt-1">{a.code}</h2>
                <p className="text-indigo-100 font-semibold">{a.name}</p>
                <p className="text-sm text-indigo-100 mt-2">{a.summary}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {a.features.map((x) => (
                    <li key={x} className="flex gap-2">
                      <Check className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">What you get</h3>
              <ul className="space-y-2">
                {l.outcomes.map((o) => (
                  <li key={o} className="flex gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section id="included" className="py-12 md:py-16 scroll-mt-20">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">What&apos;s included</h2>
          <p className="text-gray-600 mb-8">
            {single ? `Everything in ${l.columns[0].code}.` : `Compare ${l.columns.map((c) => c.label).join(' and ')}.`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm max-w-4xl">
              {!single && (
                <thead>
                  <tr className="border-b border-gray-200">
                    <th />
                    {l.columns.map((c) => (
                      <th key={c.code} className="py-2 px-3 text-center w-36">
                        <span className="block font-bold text-gray-900">{c.code}</span>
                        <span className="block text-xs font-normal text-gray-500">{c.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              {l.groups.map((g) => (
                <tbody key={g.title}>
                  <tr>
                    <th colSpan={l.columns.length + 1} className="text-left pt-6 pb-2 font-bold text-gray-900">{g.title}</th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-700">{r.label}</td>
                      {l.columns.map((c) => (
                        <td key={c.code} className="py-2 px-3 text-center">
                          {r.in.includes(c.code) ? (
                            <Check className="w-4 h-4 text-indigo-600 inline" aria-label="Included" />
                          ) : (
                            <span className="text-gray-300" aria-label="Not included">–</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>

          <nav aria-label="Other add-ons" className="mt-12 flex flex-wrap justify-between gap-4 border-t border-gray-200 pt-6">
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
        heading={`Do you need ${l.label}?`}
        description="The security self-assessment shows which gaps you have and which services close them."
        primaryCta={{ label: 'Take the self-assessment', href: '/assessments/self' }}
        secondaryCta={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}
