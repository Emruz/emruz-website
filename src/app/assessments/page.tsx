import { PageHeader, SectionIntro, Container, Card, CTABanner, FAQAccordion } from '@/components';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck } from 'lucide-react';

export const metadata = {
  title: 'Assessments',
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
      <PageHeader
        eyebrow="Start here"
        title="Assessments"
        description="Start with clarity. Diagnostic assessments across security, compliance, cloud, and AI. Understanding your current state leads to better decisions."
        cta={{ label: 'Schedule an Assessment', href: '/contact' }}
      />

      <section className="pt-10 md:pt-12">
        <Container>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex gap-4">
              <ClipboardCheck className="w-10 h-10 text-blue-600 flex-shrink-0" aria-hidden />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Security self-assessment</h2>
                <p className="text-gray-700 mt-1">
                  Rate your organization against the 18 CIS Critical Security Controls v8 in about 15 minutes. Get a maturity score,
                  your biggest gaps and what closes them, with a report by email. Free for registered users.
                </p>
              </div>
            </div>
            <Link
              href="/assessments/self"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 whitespace-nowrap"
            >
              Register and start <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      <section id="types" className="py-12 md:py-16">
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

      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-12 md:py-16">
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

      <section className="py-12 md:py-16">
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
