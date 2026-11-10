import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { PageHeader, Container } from '@/components';
import { products } from '@/content/products';
import { families, packages, POWERED_BY, SOC_LINE } from '@/content/packages';

export const metadata = {
  title: 'Products',
  description:
    'Motiv, a private AI meeting assistant built by Emruz, and managed security (EDR, MDR, XDR and ΔDR).',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Products"
        description="Software we build ourselves, and managed security you can grow into."
        cta={{ label: 'Compare managed security', href: '/products/compare' }}
      />

      <section className="py-10 md:py-12">
        <Container>
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
                    <h2 className="text-2xl font-bold text-gray-900">{p.name}</h2>
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

            <Link
              href="/products/compare"
              className="group block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Shield className="w-7 h-7" aria-hidden />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Managed security</h2>
                  <p className="text-sm text-gray-500">
                    {families.map((f) => f.label).join(', ')} · {packages.length} editions
                  </p>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{SOC_LINE}, at the level of protection you need.</p>
              <p className="mt-2 text-gray-600">
                Start with endpoint protection and grow into managed detection, extended detection across email and web,
                and full identity and data risk management. Compare every edition side by side.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-indigo-700 group-hover:gap-2 transition-all">
                Compare editions <ArrowRight className="w-4 h-4" />
              </span>
              <span className="block mt-3 text-[11px] text-gray-400">{POWERED_BY}</span>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
