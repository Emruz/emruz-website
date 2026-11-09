import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface DetailHeaderProps {
  breadcrumbs: Crumb[];
  title: string;
  summary?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Optional in-page links shown under the header */
  sections?: { label: string; href: string }[];
}

/**
 * Header for third-level detail pages. No banner: breadcrumb, title and a
 * one-line summary, so moving from a section page to a detail page is
 * visually obvious and content starts right away.
 */
export default function DetailHeader({
  breadcrumbs,
  title,
  summary,
  primaryCta,
  secondaryCta,
  sections,
}: DetailHeaderProps) {
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden />}
                {crumb.href ? (
                  <Link href={crumb.href} className="crumb-link">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-gray-900 font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{title}</h1>
            {summary && <p className="mt-2 text-lg text-gray-600">{summary}</p>}
          </div>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap lg:flex-nowrap gap-3 lg:flex-shrink-0">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="btn-outline px-5 py-2.5 rounded-md font-semibold border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>

        {sections && sections.length > 0 && (
          <nav aria-label="On this page" className="mt-5 -mb-1 flex gap-2 overflow-x-auto">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="chip-link whitespace-nowrap text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                {s.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
