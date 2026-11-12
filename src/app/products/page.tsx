import Link from 'next/link';
import { ArrowRight, CloudUpload, Fingerprint, GraduationCap, Lock, Radar, Shield } from 'lucide-react';
import { PageHeader, Container } from '@/components';
import { products } from '@/content/products';
import { addOnLines, families, packages, POWERED_BY, SOC_LINE } from '@/content/packages';

export const metadata = {
  title: 'Products',
  description:
    'Motiv, a private AI meeting assistant built by Emruz, managed security (EDR, MDR, XDR and ΔDR) and add-on services for posture management, identity, awareness training, data risk and SaaS backup.',
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

      <section id="add-ons" className="pb-12 md:pb-16 scroll-mt-20">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">Add-on services</h2>
          <p className="text-gray-600 mt-1 mb-6">Close specific gaps on top of any managed security edition, or use them on their own.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {addOnLines.map((l) => (
              <Link
                key={l.slug}
                href={`/products/${l.path}`}
                className="group flex flex-col bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-12 h-12 flex-shrink-0 rounded-xl bg-indigo-800 text-white flex items-center justify-center">
                    {l.slug === 'SPM' ? <Radar className="w-6 h-6" aria-hidden /> : l.slug === 'ZTI' ? <Fingerprint className="w-6 h-6" aria-hidden /> : l.slug === 'PSA' ? <GraduationCap className="w-6 h-6" aria-hidden /> : l.slug === 'DRM' ? <Lock className="w-6 h-6" aria-hidden /> : <CloudUpload className="w-6 h-6" aria-hidden />}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{l.label}</h3>
                    <p className="text-sm text-gray-500">{l.name}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{l.tagline}</p>
                <p className="mt-2 text-gray-600 text-sm flex-1">{l.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-indigo-700 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
                <span className="block mt-3 text-[11px] text-gray-400">{POWERED_BY}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
