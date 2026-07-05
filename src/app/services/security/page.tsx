import { Hero, SectionIntro, Container, Card, CTABanner } from '@/components';
import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Security & Compliance | Emruz',
  description:
    'GRC programs and security operations that deliver outcomes. Compliance that actually works, security operations that scale.',
};

export default function SecurityHub() {
  return (
    <>
      <Hero
        headline="Security & Compliance"
        subheadline="Build GRC programs that work. Optimize security operations that scale. Both grounded in frameworks and focused on outcomes."
        primaryCta={{
          label: 'Schedule Assessment',
          href: '/assessments',
        }}
        secondaryCta={{
          label: 'Explore Services',
          href: '#services',
        }}
      />

      <section id="services" className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Two Connected Offerings"
            description="GRC and Security Operations work together"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* GRC */}
            <Card hoverable className="border-0 shadow-lg flex flex-col">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                GRC Program
              </h3>
              <p className="text-gray-600 mb-6 flex-grow">
                Governance, risk management, and compliance frameworks grounded in NIST CSF, CIS Controls, or ISO 27001. Build sustainable compliance programs that audit-ready.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  Compliance frameworks and policies
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  Risk assessment and remediation
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  Audit-ready documentation
                </li>
              </ul>
              <Link
                href="/services/grc"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>

            {/* Security Ops */}
            <Card hoverable className="border-0 shadow-lg flex flex-col">
              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Security Operations
              </h3>
              <p className="text-gray-600 mb-6 flex-grow">
                Security operations programs focused on detection, response, and 24/7 monitoring. Build or optimize your SOC and incident response capability.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  SOC assessment and design
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  Incident response programs
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">✓</span>
                  24/7 monitoring (optional)
                </li>
              </ul>
              <Link
                href="/services/security-ops"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          </div>
        </Container>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Why Both Matter"
            description="GRC and Ops are two sides of the same coin"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                GRC: The Strategic Foundation
              </h3>
              <p className="text-gray-600">
                Governance frameworks set the rules. Risk management identifies what matters. Compliance ensures accountability. Together, they create the policy foundation that security operations execute.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Ops: The Execution Layer
              </h3>
              <p className="text-gray-600">
                Security operations implement the policies. Detection and response execute the risk management strategy. Monitoring validates that compliance controls are working. Ops makes governance real.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <CTABanner
        heading="Ready to build security and compliance outcomes?"
        description="Schedule an assessment for either GRC or Security Operations. Let's understand your needs and build a program that works."
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
