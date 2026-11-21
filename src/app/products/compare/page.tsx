import { DetailHeader, Container, CTABanner } from '@/components';
import { POWERED_BY } from '@/content/packages';
import PackagePortfolio from '@/components/PackagePortfolio';
import IndividualServices from '@/components/IndividualServices';
import { alphabetical, capabilities, type CapabilityCode } from '@/content/packages';

export const metadata = {
  title: 'Compare managed security: EDR, MDR, XDR, ΔDR and individual services',
  description:
    'Managed security packages from endpoint protection to full detect, defend and respond coverage with compliance reporting, in eleven editions, plus individual services you can buy on their own.',
};

export default function ComparePage() {
  const codes = alphabetical(Object.keys(capabilities) as CapabilityCode[]);

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: 'Compare managed security' },
        ]}
        title="Compare managed security"
        summary="EDR, MDR, XDR and ΔDR in eleven editions, plus individual services for posture, identity, network access, training, data and backup. Start where you are and grow; each card shows exactly what's included."
        primaryCta={{ label: 'Help me choose', href: '/assessments' }}
        secondaryCta={{ label: 'Talk to us', href: '/contact?topic=packages' }}
        sections={[
          { label: 'Packages', href: '#packages' },
          { label: 'Individual services', href: '#individual-services' },
          { label: 'Capability glossary', href: '#glossary' },
        ]}
      />

      <section id="packages" className="py-10 md:py-12 bg-gray-50 scroll-mt-20">
        <Container>
          <PackagePortfolio filters />
          <p className="mt-6 text-sm text-gray-500">
            Every edition is monitored and managed by our 24x7 SOC. From MDR up, editions also include the AI-driven
            SIEM, continuous incident response, exposure management and continuous pen testing. Scope and pricing are set per engagement.
          </p>
          <p className="mt-2 text-xs text-gray-400">{POWERED_BY}</p>
        </Container>
      </section>

      <section id="individual-services" className="py-12 md:py-16 scroll-mt-20">
        <Container>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Individual services</h2>
          <p className="text-gray-600 mb-8">
            Managed services you can buy on their own or alongside any EDR, MDR, XDR or ΔDR edition.
          </p>
          <IndividualServices />
        </Container>
      </section>

      <section id="glossary" className="py-12 md:py-16 bg-gray-50 border-t border-gray-200 scroll-mt-20">
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
        heading="Not sure which edition fits?"
        description="A short assessment shows where you are today and which package closes the gaps that matter."
        primaryCta={{ label: 'Schedule an Assessment', href: '/assessments' }}
        secondaryCta={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}
