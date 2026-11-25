import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { SITE_URL } from '@/lib/server/config';

export const metadata = { title: 'Thanks for buying Emruz kits', robots: { index: false } };

export default function KitsThanksPage() {
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Kits', href: '/kits' }, { label: 'Thank you' }]}
        title="Thanks for buying Emruz kits"
        summary="A receipt and setup steps are on their way to your email."
      />
      <section className="py-10 md:py-12">
        <Container>
          <CheckCircle2 className="w-8 h-8 text-green-600 mb-4" />
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 max-w-2xl">
            <li>
              In Claude, add a custom connector with the URL <span className="font-mono text-sm break-all">{SITE_URL}/api/mcp</span>. In
              Claude Code, run <span className="font-mono text-sm break-all">claude mcp add --transport http emruz-kits {SITE_URL}/api/mcp</span>.
            </li>
            <li>Sign in with the Emruz account you bought with and approve the connection.</li>
            <li>Ask Claude to list your Emruz skills.</li>
          </ol>
          <Link
            href="/motiv/account#kits"
            className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            See your kits
          </Link>
          <p className="mt-3 text-sm text-gray-500">It can take a minute for a new purchase to appear there.</p>
        </Container>
      </section>
    </>
  );
}
