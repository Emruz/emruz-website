import {
  Hero,
  SectionIntro,
  Container,
  Card,
  CTABanner,
} from '@/components';
import { CheckCircle2, Users } from 'lucide-react';

export const metadata = {
  title: 'About Emruz',
  description:
    'Emruz is a consultancy combining strategic clarity with execution capability. We help organizations understand and evolve their security, cloud, and AI landscape.',
};

export default function About() {
  const values = [
    {
      title: 'Frameworks First',
      description:
        'Every engagement grounded in industry-standard frameworks (NIST, CIS, CSF). No bespoke thinking.',
    },
    {
      title: 'Assess Before Acting',
      description:
        'Diagnostic clarity upfront. We spend time understanding your situation before designing solutions.',
    },
    {
      title: 'Execution Matters',
      description:
        'Strategy is paper without delivery. We stay involved from design through implementation.',
    },
    {
      title: 'Outcomes Over Activity',
      description:
        'We measure success by results, not hours billed. Your business should be better off when we leave.',
    },
  ];

  const teamHighlights = [
    '15+ years of combined security operations, cloud architecture, and governance expertise',
    'Certifications: CISSP, CCSK, AWS Security Specialty, Azure Administrator',
    'Experience across enterprise and mid-market organizations',
    'Track record delivering outcomes across security, compliance, cloud, and data domains',
  ];

  return (
    <>
      {/* Hero */}
      <Hero
        headline="About Emruz"
        subheadline="We created Emruz because the choice between expensive consultants who advise (but don't execute) and vendors who execute (but don't advise) was false. We do both."
        primaryCta={{
          label: 'Get in Touch',
          href: '/contact',
        }}
        secondaryCta={{
          label: 'Explore Services',
          href: '/services',
        }}
      />

      {/* Company Story */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Why Emruz Exists"
            align="left"
          />

          <div className="max-w-3xl">
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Too many organizations have a choice: expensive consultancies that advise but don't execute, or vendors that execute but don't advise. We created Emruz to break that false choice.
            </p>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              We're a team of security, cloud, and AI leaders. We've spent years building programs, leading security functions, architecting cloud environments, and delivering at scale. We know what works and what doesn't.
            </p>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Emruz combines the strategic clarity of a top consultancy with the execution capability of a mature operations team. We start with frameworks (NIST CSF, CIS Controls, CSF) so organizations know we speak the language of compliance and boards. Then we deliver outcomes, not just recommendations.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              That's Emruz. Strategy and execution. Technical clarity without the overhead.
            </p>
          </div>
        </Container>
      </section>

      {/* Core Values */}
      <section className="bg-gradient-to-br from-slate-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro heading="How We Think About This Work" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <Card key={i} hoverable className="border-0 shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Our Team"
            description="Experienced leaders across security, cloud, and operations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-full h-64 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-32 h-32 opacity-50" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Leadership & Expertise
              </h3>
              <ul className="space-y-3">
                {teamHighlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <Card hoverable className="border-0 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Security Expertise
                </h4>
                <p className="text-gray-600">
                  Deep experience in security strategy, governance, compliance frameworks (NIST, CIS, ISO), and incident response across enterprise and mid-market organizations.
                </p>
              </Card>

              <Card hoverable className="border-0 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Cloud Architecture
                </h4>
                <p className="text-gray-600">
                  Expertise across AWS, Azure, and GCP. We've architected and migrated complex cloud environments with security and cost optimization built in.
                </p>
              </Card>

              <Card hoverable className="border-0 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Delivery at Scale
                </h4>
                <p className="text-gray-600">
                  Track record delivering outcomes for 200+ organizations. We know how to execute complex programs and deliver measurable results.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Approach */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Our Approach"
            description="How we work with organizations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Assessment First
              </h3>
              <p className="text-gray-600 mb-4">
                Every engagement starts with a diagnostic assessment. We take time to understand your current state, challenges, and opportunities before proposing solutions.
              </p>
              <p className="text-gray-600">
                No assumptions. No templates. Just honest diagnosis and clear recommendations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Framework-Grounded
              </h3>
              <p className="text-gray-600 mb-4">
                We design engagements around industry frameworks (NIST CSF, CIS Controls, CSF). This means your board and auditors recognize and trust our approach.
              </p>
              <p className="text-gray-600">
                Frameworks give us a shared language and proven model for success.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Outcome-Focused
              </h3>
              <p className="text-gray-600 mb-4">
                We measure success by results, not activity. Our goal is for your organization to be better off when we're done—measurably better.
              </p>
              <p className="text-gray-600">
                Clear outcomes, clear metrics, clear accountability.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Execution-Capable
              </h3>
              <p className="text-gray-600 mb-4">
                We don't just advise and walk away. We stay involved from design through implementation and help your team execute successfully.
              </p>
              <p className="text-gray-600">
                Strategy + execution = outcomes that matter.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner
        heading="Ready to work together?"
        description="Schedule a consultation or assessment. Let's discuss your challenges and explore how Emruz can help."
        primaryCta={{
          label: 'Get in Touch',
          href: '/contact',
        }}
        secondaryCta={{
          label: 'Schedule Assessment',
          href: '/assessments',
        }}
      />
    </>
  );
}
