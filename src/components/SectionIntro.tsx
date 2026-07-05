interface SectionIntroProps {
  heading: string;
  description?: string;
  align?: 'left' | 'center';
}

export default function SectionIntro({
  heading,
  description,
  align = 'center',
}: SectionIntroProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`mb-12 ${alignClass}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {heading}
      </h2>
      {description && (
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
