import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  /** Extra buttons stacked above cta */
  ctasAbove?: { label: string; href: string }[];
}

/**
 * Compact header for section landing pages (Services, Products, About...).
 * Roughly a third of the home hero's height so the page content shows
 * above the fold.
 */
export default function PageHeader({ eyebrow, title, description, cta, ctasAbove = [] }: PageHeaderProps) {
  const buttons = [...ctasAbove, ...(cta ? [cta] : [])];
  return (
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-base md:text-lg text-slate-300">{description}</p>
          )}
        </div>
        {buttons.length > 0 && (
          <div className="flex flex-col gap-2 self-start md:self-auto">
            {buttons.map((b) => (
              <Link
                key={b.href + b.label}
                href={b.href}
                className="btn-light inline-flex items-center justify-between gap-2 whitespace-nowrap bg-white text-slate-900 px-5 py-2.5 rounded-md font-semibold hover:bg-indigo-50 transition-colors"
              >
                {b.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
