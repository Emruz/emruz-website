import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import Card from './Card';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  href: string;
  ctaLabel?: string;
  color?: 'blue' | 'teal' | 'purple';
}

const colorMap = {
  blue: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white' },
  teal: { bg: 'bg-gradient-to-br from-cyan-500 to-teal-600', text: 'text-white' },
  purple: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
};

export default function ServiceCard({
  icon: Icon,
  title,
  description,
  benefits,
  href,
  ctaLabel = 'Learn More',
  color = 'blue',
}: ServiceCardProps) {
  return (
    <Card hoverable className="flex flex-col relative overflow-hidden">
      {/* Gradient background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-12 -mt-12 opacity-30"></div>

      {/* Icon */}
      <div className={`${colorMap[color].bg} ${colorMap[color].text} w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative z-10 shadow-lg`}>
        <Icon className="w-7 h-7" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>

      {/* Benefits */}
      {benefits.length > 0 && (
        <ul className="space-y-2 mb-6">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span className="text-sm text-gray-600">{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <Link
        href={href}
        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors mt-auto"
      >
        {ctaLabel} →
      </Link>
    </Card>
  );
}
