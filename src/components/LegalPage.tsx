import Link from 'next/link';
import DetailHeader from './DetailHeader';
import Container from './Container';

export const LEGAL_PARTY = 'Shahin Pirooz, doing business as Emruz';
export const LEGAL_CONTACT = 'info@emruz.com';
export const COPYRIGHT_YEAR = 2026;
export const WHITEDOG_LEGAL_URL = 'https://www.whitedogcyber.com/legal';

const related = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
  { label: 'Motiv privacy policy', href: '/motiv/privacy' },
  { label: 'Motiv license agreement (EULA)', href: '/motiv/eula' },
];

interface Props {
  title: string;
  summary: string;
  updated: string;
  path: string;
  parent?: { label: string; href: string };
  children: React.ReactNode;
}

/** Shared layout for the legal pages: compact header, readable column, related links. */
export default function LegalPage({ title, summary, updated, path, parent, children }: Props) {
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, ...(parent ? [parent] : []), { label: title }]}
        title={title}
        summary={summary}
      />
      <section className="py-10 md:py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-10">
            <article className="legal max-w-3xl text-gray-700 leading-relaxed">
              <p className="text-sm text-gray-500">Last updated: {updated}</p>
              {children}
            </article>
            <aside className="lg:sticky lg:top-24 self-start">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Legal</h2>
              <ul className="space-y-2 text-sm">
                {related.map((r) => (
                  <li key={r.href}>
                    {r.href === path ? (
                      <span className="font-semibold text-gray-900">{r.label}</span>
                    ) : (
                      <Link href={r.href} className="text-blue-700 hover:text-blue-900">
                        {r.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-500">
                Managed security products (EDR, MDR, XDR, ΔDR):{' '}
                <a href={WHITEDOG_LEGAL_URL} className="text-blue-700">WhiteDog Cyber terms</a>
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Questions: <a href={`mailto:${LEGAL_CONTACT}`} className="text-blue-700">{LEGAL_CONTACT}</a>
              </p>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
