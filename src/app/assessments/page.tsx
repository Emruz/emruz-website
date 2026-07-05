import { Hero, SectionIntro, Container, Card, CTABanner, FAQAccordion } from '@/components';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Assessments | Emruz',
  description:
    'Diagnostic assessments across security, compliance, cloud, data science, and AI. Low-pressure entry point with clear actionable insights.',
};

export default function Assessments() {
  const assessmentTypes = [
    { name: 'Security Assessment', service: 'Security & Compliance' },
    { name: 'vCISO Assessment', service: 'vCISO & Leadership' },
    { name: 'Compliance Assessment', service: 'GRC' },
    { name: 'Cloud Readiness Assessment', service: 'Cloud' },
    { name: 'Data Analytics Discovery', service: 'Data Science' },
    { name: 'AI Readiness Assessment', service: 'AI Advisory' },
  ];

  const faqItems = [
    {
      question: 'What does an assessment involve?',
      answer:
        'Diagnostic engagements (3-4 weeks) combining interviews, technical review, and documentation audit. Deliverable: assessment report with findings and clear recommendations. No sales pitch—just honest diagnosis.',
    },
    {
      question: 'How much does an assessment cost?',
      answer:
        'Pricing depends on scope and complexity. Contact us to discuss your specific needs and get a custom quote.',
    },
    {
      question: 'What happens after the assessment?',
      answer:
        'You receive a comprehensive report with findings and recommendations. We discuss next steps: program engagement, ongoing retainer, or standalone recommendations.',
    },
    {
      question: 'Do assessments require any upfront commitment?',
      answer:
        'No. Assessments are scoped, time-bound engagements. After completion, you decide if and how to proceed.',
    },
  ];

  return (
    <>
      <Hero
        headline="Assessments"
        subheadline="Start with clarity. Diagnostic assessments across security, compliance, cloud, and AI. Understanding your current state leads to better decisions."
        primaryCta={{
          label: 'Schedule an Assessment',
          href: '/contact',
        }}
        secondaryCta={{
          label: 'Learn More',
          href: '#types',
        }}
      />

      <section id="types" className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Assessment Types"
            description="All our core service areas offer diagnostic assessments"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessmentTypes.map((assessment, i) => (
              <Card key={i} hoverable className="border-0 shadow-lg flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {assessment.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">
                  Part of our {assessment.service} engagement model
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                >
                  Schedule <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="What to Expect"
            description="How assessments work"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                phase: '1',
                title: 'Kick-off',
                description: 'Understand goals, scope, and your current situation',
              },
              {
                phase: '2',
                title: 'Discovery',
                description: 'Interviews, technical review, documentation audit',
              },
              {
                phase: '3',
                title: 'Analysis',
                description: 'Synthesize findings and develop recommendations',
              },
              {
                phase: '4',
                title: 'Report',
                description: 'Comprehensive assessment with clear next steps',
              },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-md">
                <div className="bg-blue-600 text-white font-bold text-lg px-3 py-1 rounded-full inline-block mb-3">
                  {item.phase}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Frequently Asked Questions"
            description="Common assessment questions"
          />

          <div className="max-w-3xl mx-auto">
            <FAQAccordion items={faqItems} />
          </div>
        </Container>
      </section>

      <CTABanner
        heading="Ready to understand your current state?"
        description="Schedule an assessment and get clear insights into your situation, gaps, and opportunities."
        primaryCta={{
          label: 'Schedule an Assessment',
          href: '/contact',
        }}
        secondaryCta={{
          label: 'Contact Us',
          href: '/contact',
        }}
      />
    </>
  );
}
