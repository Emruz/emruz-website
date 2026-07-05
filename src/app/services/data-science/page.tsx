import { Hero, SectionIntro, Container, Card, CTABanner } from '@/components';
import { CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Data Science & Analytics | Emruz',
  description: 'Data science and analytics services for security, operational, and business intelligence.',
};

export default function DataScience() {
  return (
    <>
      <Hero
        headline="Data Science & Analytics"
        subheadline="Turn data into insight. Threat hunting, anomaly detection, operational analytics, risk prediction."
        primaryCta={{
          label: 'Schedule Data Analytics Discovery',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Discuss Your Data',
          href: '/contact',
        }}
      />

      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro heading="Analytics Use Cases" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Security analytics and threat hunting', 'Anomaly detection and behavioral analysis', 'Operational metrics and dashboards', 'Predictive risk and compliance analytics', 'Data governance and quality frameworks', 'Self-service analytics enablement'].map((item, i) => (
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
        heading="Ready to leverage your data?"
        description="Schedule a data analytics discovery. Let's understand your data sources and high-value use cases."
        primaryCta={{
          label: 'Schedule Discovery',
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
