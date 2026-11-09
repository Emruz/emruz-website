import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader, Container } from '@/components';
import { products } from '@/content/products';

export const metadata = {
  title: 'Products',
  description: 'Software built by Emruz, starting with Motiv, a private AI meeting assistant.',
};

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Software we build"
        description="Tools that come out of our own work, built to be private by default."
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
          </div>
        </Container>
      </section>
    </>
  );
}
