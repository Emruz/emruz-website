import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  headline: string;
  subheadline: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  backgroundClass?: string;
}

export default function Hero({
  headline,
  subheadline,
  primaryCta = { label: 'Schedule Assessment', href: '/assessments' },
  secondaryCta = { label: 'Learn More', href: '#services' },
  backgroundClass = 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
}: HeroProps) {
  return (
    <section className={`${backgroundClass} py-20 md:py-32 relative overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-purple-100 mb-8 leading-relaxed">
            {subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg"
            >
              {primaryCta.label}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
