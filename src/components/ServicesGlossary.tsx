import Link from 'next/link';
import { addOnLines } from '@/content/packages';

/** Glossary entries for the individual services, each linking to its page. */
export default function ServicesGlossary() {
  return (
    <>
      <h3 className="text-xl font-bold text-gray-900 mt-12 mb-1">Individual services</h3>
      <p className="text-gray-600 mb-6">Available on their own or with any EDR, MDR, XDR or ΔDR edition.</p>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
        {addOnLines.map((l) => (
          <div key={l.slug} className="flex gap-4">
            <dt className="w-20 flex-shrink-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-200">
                {l.label}
              </span>
            </dt>
            <dd>
              <Link href={`/products/${l.path}`} className="font-semibold text-gray-900 hover:text-indigo-700">
                {l.name} →
              </Link>
              <p className="text-sm text-gray-600">{l.brief}</p>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
