'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { mainNav } from '@/content/navigation';
import Logo from './Logo';

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation (adjust state during render, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  // Close desktop menu on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo className="text-[3.375rem] text-blue-600" />

        {/* Desktop */}
        <div ref={navRef} className="hidden lg:flex items-center gap-1">
          {mainNav.map((group) =>
            group.children ? (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(group.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive(group.href) || group.children.some((c) => isActive(c.href))
                      ? 'text-blue-700'
                      : 'text-gray-700 hover:text-blue-700'
                  }`}
                  aria-expanded={openMenu === group.label}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                >
                  {group.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === group.label ? 'rotate-180' : ''}`} />
                </button>
                {openMenu === group.label && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="w-[26rem] bg-white rounded-xl border border-gray-200 shadow-xl p-2">
                      <ul>
                        {group.children.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={`block rounded-lg px-3 py-2 hover:bg-gray-50 ${isActive(item.href) ? 'bg-blue-50' : ''}`}
                            >
                              <span className="block font-semibold text-gray-900">{item.label}</span>
                              {item.description && (
                                <span className="block text-sm text-gray-500">{item.description}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {group.footer && (
                        <Link
                          href={group.footer.href}
                          className="block mt-1 px-3 py-2 border-t border-gray-100 text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          {group.footer.label} →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={group.href}
                href={group.href}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActive(group.href) ? 'text-blue-700' : 'text-gray-700 hover:text-blue-700'
                }`}
              >
                {group.label}
              </Link>
            ),
          )}
        </div>

        <div className="hidden lg:block">
          <Link
            href="/assessments"
            className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Schedule Assessment
          </Link>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <ul className="px-4 py-3">
            {mainNav.map((group) => (
              <li key={group.label} className="border-b border-gray-100 last:border-0">
                {group.children ? (
                  <>
                    <button
                      className="w-full flex items-center justify-between py-3 font-semibold text-gray-900"
                      aria-expanded={mobileGroup === group.label}
                      onClick={() => setMobileGroup(mobileGroup === group.label ? null : group.label)}
                    >
                      {group.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileGroup === group.label ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileGroup === group.label && (
                      <ul className="pb-3 pl-3 space-y-2">
                        {group.children.map((item) => (
                          <li key={item.href}>
                            <Link href={item.href} className="block text-gray-700">
                              {item.label}
                            </Link>
                          </li>
                        ))}
                        {group.footer && (
                          <li>
                            <Link href={group.footer.href} className="block font-semibold text-blue-700">
                              {group.footer.label} →
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link href={group.href} className="block py-3 font-semibold text-gray-900">
                    {group.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="px-4 pb-4">
            <Link
              href="/assessments"
              className="block text-center bg-blue-600 text-white px-5 py-2.5 rounded-md font-semibold hover:bg-blue-700"
            >
              Schedule Assessment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
