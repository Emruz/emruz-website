import {
  PageHeader,
  SectionIntro,
  Container,
  ServiceCard,
  CTABanner,
  Card,
} from '@/components';
import {
  Shield,
  CheckCircle2,
  Cloud,
  BarChart3,
  Brain,
  ArrowRight,
  ShieldCheck,
  Radar,
  Fingerprint,
  Network,
  GraduationCap,
  Lock,
  CloudUpload,
} from 'lucide-react';
import Link from 'next/link';
import PackagePortfolio from '@/components/PackagePortfolio';
import { addOnLines, POWERED_BY, SOC_LINE } from '@/content/packages';

const ADD_ON_ICONS: Record<string, typeof Radar> = {
  SPM: Radar,
  ZTI: Fingerprint,
  ZTNA: Network,
  PSA: GraduationCap,
  DRM: Lock,
};

export const metadata = {
  title: 'Services',
  description:
    'Security, compliance, cloud strategy, data science and AI advisory, plus managed security (EDR, MDR, XDR and ΔDR) and add-on security services.',
};

export default function Services() {
  const services = [
    {
      icon: Shield,
      title: 'vCISO & Leadership',
      description:
        'Strategic security leadership and governance from someone who thinks like a CISO.',
      href: '/services/vciso',
      benefits: ['Security strategy and roadmap', 'Board-ready risk reporting', 'Governance framework'],
      color: 'blue' as const,
    },
    {
      icon: CheckCircle2,
      title: 'Security & Compliance',
      description:
        'GRC programs and security operations that actually work at scale.',
      href: '/services/security',
      benefits: ['GRC program design', 'Risk assessment', 'Security operations'],
      color: 'teal' as const,
    },
    {
      icon: Cloud,
      title: 'Cloud Strategy & Security',
      description:
        'Cloud architecture that is secure and cost-effective from day one.',
      href: '/services/cloud',
      benefits: ['Cloud readiness and migration roadmap', 'Security architecture', 'Cost optimization'],
      color: 'blue' as const,
    },
    {
      icon: BarChart3,
      title: 'Data Science & Analytics',
      description:
        'Turn data into insight. Threat hunting, anomaly detection, risk prediction.',
      href: '/services/data-science',
      benefits: ['Analytics roadmap', 'Threat hunting and anomaly detection', 'Predictive risk models'],
      color: 'teal' as const,
    },
    {
      icon: Brain,
      title: 'AI Advisory & Enablement',
      description:
        'Understand AI opportunity and risk. Build governance. Upskill your team.',
      href: '/services/ai',
      benefits: ['AI strategy and use cases', 'AI governance', 'Team enablement'],
      color: 'blue' as const,
    },
    {
      icon: ShieldCheck,
      title: 'Managed Security',
      description: `${SOC_LINE}, at the level of protection you need.`,
      href: '/products/compare',
      benefits: ['EDR, MDR, XDR and ΔDR editions', 'Grow from endpoint protection to identity and data risk', 'Compare every edition side by side'],
      color: 'teal' as const,
      ctaLabel: 'Compare editions',
      note: POWERED_BY,
    },
  ];

  const engagementModels = [
    {
      title: 'Assessment',
      description: 'Diagnostic clarity on your current state and opportunities',
      timeline: '3-4 weeks',
    },
    {
      title: 'Program',
      description: 'Full engagement from strategy through implementation',
      timeline: '3-12 months',
    },
    {
      title: 'Retainer',
      description: 'Ongoing advisory and support as you execute',
      timeline: 'Ongoing',
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="What we deliver"
        description="Advisory and managed services across security, cloud, data science and AI. Pick a service below, or start with an assessment."
        cta={{ label: 'Schedule an Assessment', href: '/assessments' }}
      />

      {/* Services Grid */}
      <section className="py-10 md:py-12">
        <Container>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <ServiceCard
                key={i}
                icon={service.icon}
                title={service.title}
                description={service.description}
                benefits={service.benefits}
                href={service.href}
                ctaLabel={service.ctaLabel ?? 'Learn more'}
                color={service.color}
                note={service.note}
              />
            ))}
          </div>

          <div id="add-ons" className="mt-12 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900">Add-on security services</h2>
            <p className="text-gray-600 mt-1 mb-6">Close specific gaps on top of any managed security edition, or use them on their own.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addOnLines.map((l) => {
                const Icon = ADD_ON_ICONS[l.slug] ?? CloudUpload;
                return (
                  <Link
                    key={l.slug}
                    href={`/products/${l.path}`}
                    className="group flex flex-col bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-12 h-12 flex-shrink-0 rounded-xl bg-indigo-800 text-white flex items-center justify-center">
                        <Icon className="w-6 h-6" aria-hidden />
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
                );
              })}
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              All engagements start with an assessment.
            </h3>
            <p className="text-gray-600 mb-6">
              Low-pressure, diagnostic engagements (3-4 weeks) where we understand your current state,
              gaps, and opportunities. You’ll receive a clear roadmap and next steps.
            </p>
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
            >
              Explore assessments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Package portfolio preview */}
      <section className="py-12 md:py-16 bg-gray-50 border-y border-gray-200">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Managed security packages</h2>
              <p className="text-gray-600 mt-1">EDR, MDR, XDR and ΔDR: eleven editions from endpoint protection to full detect, defend and respond with compliance reporting.</p>
            </div>
            <Link href="/products/compare" className="text-indigo-700 font-semibold hover:text-indigo-900 whitespace-nowrap">
              Compare all packages →
            </Link>
          </div>
          <PackagePortfolio preview />
        </Container>
      </section>

      {/* Engagement Models */}
      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-12 md:py-16">
        <Container>
          <SectionIntro
            heading="How Engagements Work"
            description="Three engagement models to match your needs"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {engagementModels.map((model, i) => (
              <Card key={i} hoverable className="flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {model.title}
                  </h3>
                  <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {i + 1}
                  </div>
                </div>
                <p className="text-gray-600 mb-4 flex-grow">
                  {model.description}
                </p>
                <div className="text-sm text-gray-500 font-semibold">
                  Timeline: {model.timeline}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Framework Alignment */}
      <section className="py-12 md:py-16">
        <Container>
          <SectionIntro
            heading="Framework-Grounded Approach"
            description="Every engagement grounded in industry-standard frameworks"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'NIST Cybersecurity Framework',
                description:
                  'Governance, risk management, and compliance aligned to NIST CSF.',
              },
              {
                title: 'CIS Controls',
                description:
                  'Technical controls and operational maturity aligned to CIS standards.',
              },
              {
                title: 'CMMC',
                description:
                  'Cybersecurity Maturity Model Certification readiness for defense contractors, mapped to NIST SP 800-171.',
              },
              {
                title: 'Industry-Specific Frameworks',
                description:
                  'Compliance and governance tailored to your industry requirements.',
              },
            ].map((framework, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {framework.title}
                </h3>
                <p className="text-gray-600">{framework.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner
        heading="Ready to get started?"
        description="Choose your starting point: assessment, consultation, or let's discuss your specific needs."
        primaryCta={{
          label: 'Schedule an Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Get in Touch',
          href: '/contact',
        }}
      />
    </>
  );
}
