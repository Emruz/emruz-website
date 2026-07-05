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
  blue: 'bg-blue-100 text-blue-600',
  teal: 'bg-teal-100 text-teal-600',
  purple: 'bg-purple-100 text-purple-600',
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
    <Card hoverable className="flex flex-col">
      {/* Icon */}
      <div className={`${colorMap[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
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
        className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
      >
        {ctaLabel} →
      </Link>
    </Card>
  );
}
