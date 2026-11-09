import {
  Hero,
  SectionIntro,
  Container,
  Card,
  ServiceCard,
  CTABanner,
  FAQAccordion,
} from '@/components';
import {
  Shield,
  Cloud,
  Zap,
  BarChart3,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import PackagePortfolio from '@/components/PackagePortfolio';

export default function Home() {
  // Capability cards data
  const capabilities = [
    {
      icon: Shield,
      title: 'vCISO & Leadership',
      description: 'Security strategy and governance from someone who thinks like a CISO.',
      benefits: [
        'Strategic security roadmap',
        'Board-ready reporting',
        'Governance framework',
      ],
      href: '/services/vciso',
      color: 'blue' as const,
    },
    {
      icon: CheckCircle2,
      title: 'Security & Compliance',
      description: 'GRC programs and security operations that actually work.',
      benefits: [
        'Compliance framework',
        'Risk assessment',
        'Security operations',
      ],
      href: '/services/security',
      color: 'teal' as const,
    },
    {
      icon: Cloud,
      title: 'Cloud Strategy & Security',
      description: 'Cloud architecture that\'s secure and cost-effective from day one.',
      benefits: [
        'Migration roadmap',
        'Security architecture',
        'Cost optimization',
      ],
      href: '/services/cloud',
      color: 'blue' as const,
    },
    {
      icon: BarChart3,
      title: 'Data Science & Analytics',
      description: 'Turn data into insight. Threat hunting, anomaly detection, risk prediction.',
      benefits: [
        'Analytics roadmap',
        'Threat hunting',
        'Predictive models',
      ],
      href: '/services/data-science',
      color: 'teal' as const,
    },
    {
      icon: Brain,
      title: 'AI Advisory & Enablement',
      description: 'Understand AI opportunity and risk. Build governance. Upskill your team.',
      benefits: [
        'AI strategy',
        'Governance framework',
        'Team enablement',
      ],
      href: '/services/ai',
      color: 'blue' as const,
    },
  ];

  // Value propositions
  const valueProps = [
    {
      title: 'Framework-First Methodology',
      description:
        'Every engagement grounded in NIST CSF, CIS Controls, or equivalent. We speak the language of compliance, auditors, and boards.',
      icon: CheckCircle2,
    },
    {
      title: 'Assessment-Driven Engagement',
      description:
        'No guessing. We start by understanding where you are, what\'s at risk, and what\'s possible. Then we design and deliver based on real gaps.',
      icon: Zap,
    },
    {
      title: 'Operational Delivery Capability',
      description:
        'Strategy is just paper without execution. We have the team and platform to deliver outcomes at scale, not just advise from the sidelines.',
      icon: Cloud,
    },
  ];

  // Engagement model phases
  const phases = [
    {
      number: '01',
      title: 'Assess',
      description: 'Understand current state, gaps, and opportunities',
    },
    {
      number: '02',
      title: 'Design',
      description: 'Build roadmap and implementation plan',
    },
    {
      number: '03',
      title: 'Deliver',
      description: 'Execute outcomes and support your team',
    },
    {
      number: '04',
      title: 'Optimize',
      description: 'Refine, measure, and improve',
    },
  ];

  // FAQ items
  const faqItems = [
    {
      question: 'What does an assessment involve?',
      answer:
        'Our assessments are diagnostic engagements (typically 3-4 weeks) where we understand your current state, gaps, and opportunities. You\'ll receive a clear roadmap and next steps. No sales pitch—just honest diagnosis.',
    },
    {
      question: 'How long do programs typically take?',
      answer:
        'It depends on scope and complexity. Most engagements range from 3-12 months. We\'ll give you realistic timelines and milestones upfront.',
    },
    {
      question: 'Do you work with remote teams?',
      answer:
        'Yes. We work with distributed teams across multiple time zones. Most of our engagements blend remote and in-person work based on your needs.',
    },
    {
      question: 'What makes you different from other consultancies?',
      answer:
        'We combine strategic clarity with execution capability. Most consultancies advise; most vendors execute. We do both. We\'re grounded in frameworks (NIST, CIS, CSF) and focused on outcomes.',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <Hero
        headline="Strategy and execution. Technical clarity without the overhead."
        subheadline="Emruz helps organizations understand their security, cloud, and AI landscape, and how to evolve it. Through frameworks like NIST and CIS. Through outcomes we can measure."
        primaryCta={{
          label: 'Schedule an Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Explore Services',
          href: '#capabilities',
        }}
      />

      {/* Trust Strip - Framework Logos */}
      <section className="bg-gray-50 py-8 md:py-12 border-y border-gray-200">
        <Container>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-semibold mb-2">
                Framework-Grounded
              </p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 items-center">
                <span className="font-bold text-gray-700">NIST CSF</span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-gray-700">CIS Controls</span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-gray-700">ISO 27001</span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-gray-700">CMMC</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full -ml-32 -mt-32 opacity-20"></div>
        <Container className="relative z-10">
          <SectionIntro
            heading="Core Capabilities"
            description="We deliver across security, cloud, data science, and AI. Choose based on your challenge, or let's talk about what matters most."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <ServiceCard
                key={i}
                icon={cap.icon}
                title={cap.title}
                description={cap.description}
                benefits={cap.benefits}
                href={cap.href}
                color={cap.color}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Assessments Entry Section */}
      <section className="bg-blue-50 py-12 md:py-16">
        <Container>
          <SectionIntro
            heading="Start With a Diagnostic"
            description="Every engagement starts with clarity. We'll assess where you are, what's at risk, and what's possible. Then we'll design and deliver outcomes."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Security', 'Cloud', 'AI'].map((type) => (
              <Card key={type} hoverable className="text-center flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {type} Assessment
                </h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  Diagnostic readiness and opportunity assessment
                </p>
                <a
                  href="/assessments"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                  Learn More →
                </a>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/assessments"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explore All Assessments
            </a>
          </div>
        </Container>
      </section>

      {/* Package portfolio preview */}
      <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-200">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Managed security products</h2>
              <p className="text-lg text-gray-600 mt-2">EDR, MDR, XDR and ΔDR, from endpoint protection to full detect, defend and respond.</p>
            </div>
            <Link href="/products/compare" className="text-indigo-700 font-semibold hover:text-indigo-900 whitespace-nowrap">
              Compare all packages →
            </Link>
          </div>
          <PackagePortfolio preview />
        </Container>
      </section>

      {/* Products */}
      <section className="py-12 md:py-16">
        <Container>
          <Link
            href="/motiv"
            className="group flex flex-col md:flex-row md:items-center gap-6 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-[#4F46E5] via-[#6D5AE6] to-[#7C3AED] text-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/motiv/motiv-logo.svg" alt="" width={64} height={64} className="w-16 h-16 flex-shrink-0 drop-shadow-lg" />
            <div className="flex-grow">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100">New from Emruz · Coming soon</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-1">Motiv, the private AI meeting assistant</h2>
              <p className="text-indigo-100 mt-1">Meetings recorded, transcribed and understood on your own computer. Your audio never leaves it.</p>
            </div>
            <span className="font-semibold whitespace-nowrap group-hover:translate-x-1 transition-transform">Meet Motiv →</span>
          </Link>
        </Container>
      </section>

      {/* Why Emruz Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-slate-50 to-purple-50 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 rounded-full -mr-48 opacity-10"></div>
        <Container className="relative z-10">
          <SectionIntro
            heading="Why Emruz"
            description="Three reasons organizations choose Emruz"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map((prop, i) => {
              const Icon = prop.icon;
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
              ];
              return (
                <Card key={i} hoverable className="border-0 shadow-lg">
                  <div className="flex justify-center mb-4">
                    <div className={`bg-gradient-to-br ${gradients[i]} text-white w-16 h-16 rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                    {prop.title}
                  </h3>
                  <p className="text-gray-600 text-center">{prop.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Engagement Model Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <Container className="relative z-10">
          <SectionIntro
            heading="How We Work"
            description="Most consultancies stop at recommendations. We don't. We assess, design, and deliver outcomes."
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, i) => (
              <div key={i} className="relative">
                {/* Card background */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-purple-500/20">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                    {phase.number}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {phase.title}
                  </h3>
                  <p className="text-slate-300">{phase.description}</p>
                </div>
                {/* Connector line */}
                {i < phases.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-12 md:py-16">
        <Container>
          <SectionIntro
            heading="Frequently Asked Questions"
            description="Get answers to common questions about our approach and services"
          />

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      {/* Final CTA Banner */}
      <CTABanner
        heading="Ready to assess your security, cloud, or AI posture?"
        description="Schedule a diagnostic assessment with our team. No sales pitch. Just honest diagnosis and a clear roadmap."
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
