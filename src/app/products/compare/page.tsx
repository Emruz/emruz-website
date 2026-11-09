import { DetailHeader, Container, CTABanner } from '@/components';
import { POWERED_BY } from '@/content/packages';
import PackagePortfolio from '@/components/PackagePortfolio';
import { capabilities, type CapabilityCode } from '@/content/packages';

export const metadata = {
  title: 'Compare managed security: EDR, MDR, XDR and ΔDR',
  description:
    'Managed security packages from endpoint protection to full detect, defend and respond coverage with compliance reporting. Each tier builds on the one before.',
};

export default function ComparePage() {
  const codes = Object.keys(capabilities) as CapabilityCode[];

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Compare managed security' },
        ]}
        title="Compare managed security"
        summary="EDR, MDR, XDR and ΔDR in nine tiers. Each tier includes everything in the one before, so you can start where you are and grow."
        primaryCta={{ label: 'Help me choose', href: '/assessments' }}
        secondaryCta={{ label: 'Talk to us', href: '/contact?topic=packages' }}
        sections={[
          { label: 'Packages', href: '#packages' },
          { label: 'Capability glossary', href: '#glossary' },
        ]}
      />

      <section id="packages" className="py-10 md:py-12 bg-gray-50 scroll-mt-20">
        <Container>
          <PackagePortfolio filters />
          <p className="mt-6 text-sm text-gray-500">
            Every package from MDR up includes 24/7 security operations, continuous incident response,
            exposure management and continuous pen testing. Scope and pricing are set per engagement.
          </p>
          <p className="mt-2 text-xs text-gray-400">{POWERED_BY}</p>
        </Container>
      </section>

      <section id="glossary" className="py-12 md:py-16 scroll-mt-20">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Capability glossary</h2>
          <p className="text-gray-600 mb-8">What each abbreviation on the package cards means.</p>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {codes.map((c) => (
              <div key={c} className="flex gap-4">
                <dt className="w-20 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-gray-50 text-gray-700 border-gray-200">
                    {c}
                  </span>
                </dt>
                <dd>
                  <p className="font-semibold text-gray-900">{capabilities[c].name}</p>
                  <p className="text-sm text-gray-600">{capabilities[c].description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <CTABanner
        heading="Not sure which tier fits?"
        description="A short assessment shows where you are today and which package closes the gaps that matter."
        primaryCta={{ label: 'Schedule an Assessment', href: '/assessments' }}
        secondaryCta={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}
