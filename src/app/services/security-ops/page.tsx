import { Hero, SectionIntro, Container, Card, CTABanner } from '@/components';
import { CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Security Operations | Emruz',
  description: 'Security operations and SOC services focused on detection, response, and 24/7 monitoring.',
};

export default function SecurityOps() {
  return (
    <>
      <Hero
        headline="Security Operations"
        subheadline="Build or optimize your security operations program. From SOC design through 24/7 monitoring and incident response."
        primaryCta={{
          label: 'Schedule Security Ops Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Get in Touch',
          href: '/contact',
        }}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro heading="What We Help With" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['SOC assessment and optimization', 'Tool rationalization and integration', 'Incident response playbooks', 'Alert tuning and false-positive reduction', 'Team training and enablement', '24/7 monitoring and response (optional)'].map((item, i) => (
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
        heading="Ready to build or optimize your security operations?"
        description="Schedule a security ops assessment to understand your current SOC maturity and opportunities."
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
