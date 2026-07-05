import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  hoverable = false,
}: CardProps) {
  const baseClass =
    'bg-white border border-gray-200 rounded-lg p-6 shadow-light';
  const hoverClass = hoverable
    ? 'hover:shadow-md transition-shadow hover:-translate-y-0.5'
    : '';

  return (
    <div className={`${baseClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
