import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { PageHeader, Container } from '@/components';
import { products } from '@/content/products';
import { families, packages, POWERED_BY } from '@/content/packages';

export const metadata = {
  title: 'Products',
  description:
    'Managed security products (EDR, MDR, XDR and ΔDR) and software built by Emruz, including Motiv, a private AI meeting assistant.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Products"
        description="Managed security you can grow into, and software we build ourselves."
        cta={{ label: 'Compare managed security', href: '/products/compare' }}
      />

      <section className="py-10 md:py-12">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
            <h2 className="text-2xl font-bold text-gray-900">Managed security</h2>
            <Link href="/products/compare" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              Compare all nine tiers →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {families.map((f) => {
              const tiers = packages.filter((p) => p.family === f.slug).length;
              return (
                <Link
                  key={f.slug}
                  href={`/products/${f.path}`}
                  className="group flex flex-col bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      <Shield className="w-5 h-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{f.label}</h3>
                      <p className="text-xs text-gray-500">{tiers === 1 ? '1 package' : `${tiers} tiers`}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{f.name}</p>
                  <p className="mt-1 text-sm text-gray-600 flex-grow">{f.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="mt-3 text-[11px] text-gray-400">{POWERED_BY}</span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-12 bg-gray-50 border-t border-gray-200">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Software</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                className="group block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/motiv/motiv-logo.svg" alt="" width={56} height={56} className="w-14 h-14" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500">
                      {p.platforms} · <span className="font-semibold text-[#4F46E5]">{p.status}</span>
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{p.tagline}</p>
                <p className="mt-2 text-gray-600">{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-[#4F46E5] group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
