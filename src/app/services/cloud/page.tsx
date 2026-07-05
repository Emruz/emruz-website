import {
  Hero,
  SectionIntro,
  Container,
  Card,
  CTABanner,
  FAQAccordion,
} from '@/components';
import { CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Cloud Strategy & Security | Emruz',
  description:
    'Cloud architecture, strategy, and security services for organizations migrating to or optimizing cloud environments.',
};

export default function Cloud() {
  const phases = [
    {
      title: 'Assessment',
      description: 'Evaluate current apps, data, compliance needs, and cloud maturity',
      duration: '3-4 weeks',
    },
    {
      title: 'Strategy',
      description: 'Design cloud architecture, security model, and migration sequence',
      duration: '6-8 weeks',
    },
    {
      title: 'Implementation',
      description: 'Execute migrations, implement security controls, train team',
      duration: 'Ongoing',
    },
  ];

  const faqItems = [
    {
      question: 'Do you help with specific cloud providers (AWS, Azure, GCP)?',
      answer:
        'Yes. We have expertise across AWS, Azure, and GCP. Most organizations use multiple clouds, and we help design governance and architecture that works across them.',
    },
    {
      question: 'Can you help optimize cloud costs?',
      answer:
        'Yes. Cost optimization is part of cloud strategy. We help with resource right-sizing, reserved instances, and architectural decisions that reduce waste.',
    },
    {
      question: 'What about security in the cloud?',
      answer:
        'Cloud security is integral to our strategy. We design controls aligned to NIST CSF, ensure compliance (SOC 2, ISO, etc.), and implement security best practices.',
    },
  ];

  return (
    <>
      <Hero
        headline="Cloud Strategy & Security"
        subheadline="Architect cloud for security, cost, and organizational capability. From readiness assessment through implementation and optimization."
        primaryCta={{
          label: 'Schedule Cloud Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Discuss Your Cloud Journey',
          href: '/contact',
        }}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Why Cloud Strategy Matters"
            description="Cloud without strategy costs more and risks more"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Cost Control',
                description:
                  'Avoid overspend through architectural decisions and resource optimization.',
              },
              {
                title: 'Security Posture',
                description:
                  'Build security in from day one, not after cloud debt accumulates.',
              },
              {
                title: 'Team Capability',
                description:
                  'Develop organizational skills and governance for long-term cloud success.',
              },
            ].map((item, i) => (
              <Card key={i} hoverable className="border-0 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Engagement Model"
            description="How cloud engagements flow"
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

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro heading="What We Help With" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Cloud readiness assessment',
              'Multi-cloud architecture design',
              'Security controls and compliance mapping',
              'Migration planning and execution',
              'Cost optimization strategy',
              'Team training and enablement',
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

      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Frequently Asked Questions"
            description="Common cloud strategy questions"
          />

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      <CTABanner
        heading="Ready to architect your cloud strategy?"
        description="Schedule a cloud assessment. We'll understand your applications, data, compliance needs, and opportunities—then chart a clear path forward."
        primaryCta={{
          label: 'Schedule Cloud Assessment',
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
