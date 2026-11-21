import Link from 'next/link';
import { ArrowRight, CloudUpload, Fingerprint, GraduationCap, Lock, Network, Radar } from 'lucide-react';
import { addOnLines, POWERED_BY } from '@/content/packages';

const ICONS: Record<string, typeof Radar> = {
  SPM: Radar,
  ZTI: Fingerprint,
  ZTNA: Network,
  PSA: GraduationCap,
  DRM: Lock,
};

/** Managed security services sold on their own or alongside any EDR, MDR, XDR or ΔDR edition. */
export default function IndividualServices() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {addOnLines.map((l) => {
        const Icon = ICONS[l.slug] ?? CloudUpload;
        return (
          <Link
            key={l.slug}
            href={`/products/${l.path}`}
            className="group flex flex-col bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 flex-shrink-0 rounded-xl bg-indigo-800 text-white flex items-center justify-center">
                <Icon className="w-6 h-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{l.label}</h3>
                <p className="text-sm text-gray-500">{l.name}</p>
              </div>
            </div>
            <p className="font-semibold text-gray-900">{l.tagline}</p>
            <p className="mt-2 text-gray-600 text-sm flex-1">{l.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1 font-semibold text-indigo-700 group-hover:gap-2 transition-all">
              Learn more <ArrowRight className="w-4 h-4" />
            </span>
            <span className="block mt-3 text-[11px] text-gray-400">{POWERED_BY}</span>
          </Link>
        );
      })}
    </div>
  );
}
