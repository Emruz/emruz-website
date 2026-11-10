import { PageHeader, SectionIntro, Container, Card, CTABanner } from '@/components';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { monthYear, publishedInsights } from '@/lib/server/insights';
import { subscribeAction } from '@/app/newsletter/actions';

export const metadata = {
  title: 'Insights',
  description:
    'Security, cloud, and AI insights from our team. Frameworks, trends, and practical guidance for organizations.',
};

export const dynamic = 'force-dynamic';

const notices: Record<string, string> = {
  check: 'Almost done. Check your email for a link to confirm.',
  invalid: 'Please enter a valid email address.',
  limited: 'Too many attempts. Please try again later.',
  error: 'Something went wrong. Please try again later.',
};

export default async function Insights({ searchParams }: { searchParams: Promise<{ newsletter?: string }> }) {
  const notice = notices[(await searchParams).newsletter || ''];
  const insights = await publishedInsights();

  return (
    <>
      {/* Hero */}
      <PageHeader
        eyebrow="Insights"
        title="Insights"
        description="Security, cloud, and AI thinking from our team. Frameworks, trends, and practical guidance for organizations serious about outcomes."
        cta={{ label: 'Subscribe for Updates', href: '#subscribe' }}
      />

      {/* Insights Grid */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full -ml-32 -mt-32 opacity-20"></div>
        <Container className="relative z-10">
          <SectionIntro heading="Latest Insights" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <Card key={insight.slug} hoverable className="border-0 shadow-lg flex flex-col">
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
                  {monthYear(insight.published_on)}
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
      <section id="subscribe" className="scroll-mt-20 bg-gradient-to-br from-blue-50 to-purple-50 py-12 md:py-16">
        <Container>
          <SectionIntro
            heading="Stay Updated"
            description="Subscribe for security, cloud, and AI insights delivered monthly"
          />

          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg p-8">
              <form action={subscribeAction} className="space-y-4">
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
                    name="email"
                    required
                    autoComplete="email"
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

                {notice && (
                  <p role="status" className="text-sm font-semibold text-blue-800 text-center">
                    {notice}
                  </p>
                )}

                <p className="text-xs text-gray-600 text-center">
                  We email when we publish something worth reading. Unsubscribe any time.
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
