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
  backgroundClass = 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900',
}: CTABannerProps) {
  return (
    <section className={`${backgroundClass} py-16 md:py-20 relative overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-8 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white text-center relative z-10">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>

        {/* Description */}
        {description && (
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg"
          >
            {primaryCta.label}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
