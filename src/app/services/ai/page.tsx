import { Hero, SectionIntro, Container, Card, CTABanner } from '@/components';
import { CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'AI Advisory & Enablement | Emruz',
  description: 'AI strategy, governance, and team enablement for organizations evaluating AI opportunity and risk.',
};

export default function AIAdvisory() {
  return (
    <>
      <Hero
        headline="AI Advisory & Enablement"
        subheadline="Understand AI opportunity and risk. Build governance. Upskill your team. Execute with confidence."
        primaryCta={{
          label: 'Schedule AI Readiness Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Explore AI Strategy',
          href: '/contact',
        }}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro heading="What We Help With" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['AI readiness assessment', 'AI strategy and roadmap development', 'AI governance and risk framework', 'Use case prioritization and business cases', 'Team training and upskilling', 'Vendor evaluation and selection'].map((item, i) => (
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

      <CTABanner
        heading="Ready to develop your AI strategy?"
        description="Schedule an AI readiness assessment. We'll evaluate your current state and chart a path to responsible, strategic AI adoption."
        primaryCta={{
          label: 'Schedule Assessment',
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
