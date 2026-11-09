'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Check } from 'lucide-react';
import {
  packages,
  capabilities,
  includedCapabilities,
  type ServicePackage,
} from '@/content/packages';

type Family = 'All' | ServicePackage['family'];
const families: Family[] = ['All', 'Foundation', 'MDR', 'XDR', 'DDR'];

const familyStyle: Record<ServicePackage['family'], string> = {
  Foundation: 'bg-slate-100 text-slate-700',
  MDR: 'bg-blue-50 text-blue-700',
  XDR: 'bg-indigo-50 text-indigo-700',
  DDR: 'bg-violet-50 text-violet-700',
};

interface Props {
  /** Compact preview: no filters, no expansion, cards link to the full portfolio */
  preview?: boolean;
}

export default function PackagePortfolio({ preview = false }: Props) {
  const [family, setFamily] = useState<Family>('All');
  const [open, setOpen] = useState<string | null>(null);

  // Open the package named in the URL hash (e.g. /services/packages#XDR-ES)
  useEffect(() => {
    if (preview) return;
    const openFromHash = () => {
      const fromHash = decodeURIComponent(window.location.hash.slice(1));
      if (packages.some((p) => p.code === fromHash)) {
        setFamily('All');
        setOpen(fromHash);
        requestAnimationFrame(() =>
          document.getElementById(`pkg-${fromHash}`)?.scrollIntoView({ block: 'start' }),
        );
      }
    };
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, [preview]);

  const shown = family === 'All' ? packages : packages.filter((p) => p.family === family);

  return (
    <div>
      {!preview && (
        <div role="tablist" aria-label="Filter packages" className="flex flex-wrap gap-2 mb-6">
          {families.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={family === f}
              onClick={() => setFamily(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                family === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f === 'All' ? 'All packages' : f}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {shown.map((pkg) => {
          const tier = packages.indexOf(pkg);
          const included = includedCapabilities(pkg.code);
          const isOpen = open === pkg.code;
          return (
            <article
              key={pkg.code}
              id={`pkg-${pkg.code}`}
              className={`scroll-mt-24 bg-white rounded-xl border p-5 transition-shadow ${
                isOpen ? 'border-indigo-400 shadow-lg' : 'border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${familyStyle[pkg.family]}`}>
                  {pkg.family}
                </span>
                <span className="text-xs text-gray-400">Tier {tier + 1} of {packages.length}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{pkg.code}</h3>
              <p className="text-sm text-gray-500">{pkg.name}</p>
              <p className="mt-3 font-semibold text-gray-900">{pkg.tagline}</p>
              <p className="mt-1 text-sm text-gray-600">{pkg.summary}</p>

              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Included capabilities">
                {included.map((c) => {
                  const isNew = pkg.adds.includes(c);
                  return (
                    <li
                      key={c}
                      title={capabilities[c].name}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        isNew
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {c}
                    </li>
                  );
                })}
              </ul>
              {tier > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Includes everything in {packages[tier - 1].code}, plus the highlighted capabilities.
                </p>
              )}

              {preview ? (
                <Link
                  href={`/services/packages#${pkg.code}`}
                  className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View details →
                </Link>
              ) : (
                <button
                  onClick={() => setOpen(isOpen ? null : pkg.code)}
                  aria-expanded={isOpen}
                  aria-controls={`pkg-detail-${pkg.code}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  {isOpen ? 'Hide details' : 'View details'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {!preview && isOpen && (
                <div id={`pkg-detail-${pkg.code}`} className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Best for</h4>
                    <p className="text-sm text-gray-700">{pkg.bestFor}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Outcomes</h4>
                    <ul className="space-y-1">
                      {pkg.outcomes.map((o) => (
                        <li key={o} className="flex gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">What&apos;s included</h4>
                    <dl className="space-y-2">
                      {included.map((c) => (
                        <div key={c} className="text-sm">
                          <dt className="font-semibold text-gray-900">
                            {capabilities[c].name} <span className="text-gray-400 font-normal">({c})</span>
                          </dt>
                          <dd className="text-gray-600">{capabilities[c].description}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <Link
                    href={`/contact?topic=${encodeURIComponent(pkg.code)}`}
                    className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Discuss {pkg.code}
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
