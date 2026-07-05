import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CTABannerProps {
  heading: string;
  description?: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  backgroundClass?: string;
}

export default function CTABanner({
  heading,
  description,
  primaryCta,
  secondaryCta,
  backgroundClass = 'bg-gradient-to-r from-blue-600 to-blue-700',
}: CTABannerProps) {
  return (
    <section className={`${backgroundClass} py-16 md:py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>

        {/* Description */}
        {description && (
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {primaryCta.label}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border-2 border-white"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
