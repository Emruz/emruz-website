import {
  Hero,
  SectionIntro,
  Container,
  Card,
  CTABanner,
  FAQAccordion,
} from '@/components';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'vCISO & Leadership | Emruz',
  description:
    'Fractional CISO services combining strategic security leadership with governance design and board-level reporting.',
};

export default function VCISo() {
  const phases = [
    {
      title: 'Discovery',
      description: 'Understand your current state, risk profile, and board expectations',
      duration: '2-3 weeks',
    },
    {
      title: 'Strategy',
      description: 'Develop security roadmap and governance framework aligned to business',
      duration: '4-6 weeks',
    },
    {
      title: 'Implementation Support',
      description: 'Ongoing monthly check-ins, board updates, and roadmap oversight',
      duration: 'Ongoing',
    },
  ];

  const triggers = [
    'Post-acquisition or restructuring requiring new security leader',
    'Board asking "what is our security risk?" and needing confident answers',
    'Incident or near-miss exposing governance gaps',
    'Growth requiring mature security function',
  ];

  const faqItems = [
    {
      question: 'How much time does a vCISO spend on engagements?',
      answer:
        'Initial engagements: 3-4 weeks of intensive discovery and strategy. Ongoing retainers: typically 10-20 hours per month for board reporting, governance oversight, and strategic guidance.',
    },
    {
      question: 'Do you replace our internal security team?',
      answer:
        'No. We work with and through your existing team, building their capability and maturity. Our role is strategic leadership and governance, not day-to-day operations.',
    },
    {
      question: 'What frameworks do you use?',
      answer:
        'Every engagement is grounded in NIST CSF, CIS Controls, or industry-specific frameworks. We align your governance model to frameworks your board and auditors recognize.',
    },
    {
      question: 'Can you help with board reporting?',
      answer:
        'Yes. Board-ready risk reporting and compliance dashboards are core deliverables. We translate technical risk into business language executives understand.',
    },
  ];

  return (
    <>
      {/* Hero */}
      <Hero
        headline="vCISO & Leadership"
        subheadline="Strategic security leadership and governance from someone who thinks like a CISO. Define and execute security strategy. Get board-ready risk reporting."
        primaryCta={{
          label: 'Schedule vCISO Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Discuss Your Needs',
          href: '/contact',
        }}
      />

      {/* What It Is */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="What a vCISO Does"
            description="Fractional security leadership for organizations without an internal Chief Information Security Officer"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Strategic Leadership
              </h3>
              <ul className="space-y-3">
                {[
                  'Security strategy and roadmap aligned to business goals',
                  'Governance framework (NIST, CIS-based)',
                  'Board-level risk narrative and reporting',
                  'Compliance posture assessment',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-0 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Execution Support
              </h3>
              <ul className="space-y-3">
                {[
                  'Team capability assessment and development',
                  'Incident response program design',
                  'Vendor evaluation and selection',
                  'Implementation oversight and validation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* When Needed */}
      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="When Organizations Need a vCISO"
            align="left"
          />

          <div className="space-y-4">
            {triggers.map((trigger, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-6 border-l-4 border-blue-600 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-gray-700">{trigger}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Engagement Model */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full -mr-48 opacity-10"></div>
        <Container className="relative z-10">
          <SectionIntro
            heading="Engagement Model"
            description="How vCISO engagements unfold"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phases.map((phase, i) => (
              <div key={i} className="relative">
                <Card hoverable className="border-0 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {phase.title}
                    </h3>
                    <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {i + 1}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{phase.description}</p>
                  <p className="text-sm text-gray-500 font-semibold">
                    Duration: {phase.duration}
                  </p>
                </Card>

                {i < phases.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Deliverables */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro heading="Typical Deliverables" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Security roadmap document (12-month outlook)',
              'Board-ready risk and compliance dashboard',
              'Governance framework (NIST CSF or CIS-based)',
              'Security policies (tailored to organization)',
              'Incident response playbook',
              'Quarterly board reporting and metrics',
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-md">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{item}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Frequently Asked Questions"
            description="Common questions about vCISO engagements"
          />

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner
        heading="Ready to define and execute your security strategy?"
        description="Schedule a vCISO assessment to understand your current state, gaps, and opportunities. No sales pitch—just honest diagnosis and a clear path forward."
        primaryCta={{
          label: 'Schedule vCISO Assessment',
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
