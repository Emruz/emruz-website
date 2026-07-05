import { Hero, SectionIntro, Container, Card, CTABanner } from '@/components';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Insights | Emruz',
  description:
    'Security, cloud, and AI insights from our team. Frameworks, trends, and practical guidance for organizations.',
};

export default function Insights() {
  const insights = [
    {
      title: 'NIST Cybersecurity Framework: A Practical Guide',
      excerpt:
        'Understanding NIST CSF, how it applies to your organization, and why framework-based thinking matters for compliance and strategy.',
      date: 'July 2024',
      category: 'Frameworks',
      slug: 'nist-csf-guide',
    },
    {
      title: 'Cloud Security Architecture: Design Principles That Matter',
      excerpt:
        'Five design principles that should guide your cloud security strategy. From zero-trust to compliance-first thinking.',
      date: 'June 2024',
      category: 'Cloud',
      slug: 'cloud-security-architecture',
    },
    {
      title: 'Building a vCISO Program: When and How',
      excerpt:
        'When organizations need fractional CISO leadership, how to structure it for success, and what to measure.',
      date: 'May 2024',
      category: 'Leadership',
      slug: 'vciso-program-guide',
    },
    {
      title: 'AI Governance: The Framework Every Organization Needs',
      excerpt:
        'AI opportunity + governance risk = need for clear frameworks. What AI governance looks like in practice.',
      date: 'April 2024',
      category: 'AI',
      slug: 'ai-governance-framework',
    },
    {
      title: 'From Assessment to Roadmap: Making Diagnostic Work Useful',
      excerpt:
        'How to turn security assessments into actionable roadmaps that actually move the needle.',
      date: 'March 2024',
      category: 'Strategy',
      slug: 'assessment-to-roadmap',
    },
    {
      title: 'Security Operations at Scale: SOC Design for Enterprise',
      excerpt:
        'Designing security operations that scale without breaking. Architecture, tooling, and team structure.',
      date: 'February 2024',
      category: 'Operations',
      slug: 'soc-design-enterprise',
    },
  ];

  return (
    <>
      {/* Hero */}
      <Hero
        headline="Insights"
        subheadline="Security, cloud, and AI thinking from our team. Frameworks, trends, and practical guidance for organizations serious about outcomes."
        primaryCta={{
          label: 'Subscribe for Updates',
          href: '/contact',
        }}
        secondaryCta={{
          label: 'Explore Services',
          href: '/services',
        }}
      />

      {/* Insights Grid */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full -ml-32 -mt-32 opacity-20"></div>
        <Container className="relative z-10">
          <SectionIntro heading="Latest Insights" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, i) => (
              <Card key={i} hoverable className="border-0 shadow-lg flex flex-col">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    {insight.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {insight.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                  {insight.excerpt}
                </p>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  {insight.date}
                </div>

                {/* Read More Link */}
                <Link
                  href={`/insights/${insight.slug}`}
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                >
                  Read More <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16 md:py-24">
        <Container>
          <SectionIntro
            heading="Stay Updated"
            description="Subscribe for security, cloud, and AI insights delivered monthly"
          />

          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg p-8">
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Subscribe
                </button>

                <p className="text-xs text-gray-600 text-center">
                  We send monthly insights. Unsubscribe anytime. No spam.
                </p>
              </form>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner
        heading="Ready to work with us?"
        description="Whether you're looking for insights or ready to engage, let's connect."
        primaryCta={{
          label: 'Schedule an Assessment',
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
