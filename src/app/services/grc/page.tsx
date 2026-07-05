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
  title: 'GRC Program | Emruz',
  description:
    'Governance, risk, and compliance programs grounded in NIST CSF, CIS Controls, and industry-specific frameworks.',
};

export default function GRC() {
  const faqItems = [
    {
      question: 'Which compliance frameworks do you work with?',
      answer:
        'We work with NIST CSF, CIS Controls, ISO 27001, SOC 2, HIPAA, PCI-DSS, and other industry-specific frameworks. We align your program to what your business needs.',
    },
    {
      question: 'How long does it take to build a GRC program?',
      answer:
        'Assessment: 3-4 weeks. Design and implementation: 6-12 weeks depending on scope and organizational complexity. Ongoing maintenance: 10-20 hours per month.',
    },
    {
      question: 'Do you help prepare for audits?',
      answer:
        'Yes. Audit-ready documentation and evidence collection are core deliverables. We help you prepare for audits and manage the compliance lifecycle.',
    },
  ];

  return (
    <>
      <Hero
        headline="GRC Program"
        subheadline="Build a compliance program grounded in NIST, CIS, or ISO frameworks. Then maintain it without it becoming a second job."
        primaryCta={{
          label: 'Schedule GRC Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Discuss Compliance Needs',
          href: '/contact',
        }}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="What GRC Encompasses"
            description="Governance, risk management, and compliance as an integrated program"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Governance',
                description:
                  'Security policies, roles, and decision-making frameworks that scale with your organization.',
              },
              {
                title: 'Risk Management',
                description:
                  'Risk assessment, prioritization, and remediation tracking grounded in business impact.',
              },
              {
                title: 'Compliance',
                description:
                  'Evidence collection, audit readiness, and certification preparation (SOC 2, ISO, etc.).',
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
          <SectionIntro heading="Typical Deliverables" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'GRC framework document aligned to your chosen standard',
              'Risk assessment and remediation roadmap',
              'Security policies and procedures (tailored to your industry)',
              'Training program and awareness materials',
              'Audit-ready evidence collection system',
              'Compliance dashboard and reporting',
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

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Frequently Asked Questions"
            description="Common GRC program questions"
          />

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      <CTABanner
        heading="Ready to build a sustainable compliance program?"
        description="Schedule a GRC assessment. We'll understand your current posture, compliance requirements, and build a program that actually works."
        primaryCta={{
          label: 'Schedule GRC Assessment',
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
