'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogIn } from 'lucide-react';

export interface Me {
  account: { email: string; name: string | null } | null;
  isAdmin?: boolean;
  isStaff?: boolean;
  isClient?: boolean;
  impersonatedBy?: string | null;
}

export function initials(a: { email: string; name: string | null }): string {
  const fromName = (a.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (fromName || a.email[0] || '?').toUpperCase();
}

/**
 * Signed-in user, loaded after the page so pages can stay static. Re-checked on
 * every navigation, since signing in, out or switching user can happen in-app.
 */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let alive = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Me) => alive && setMe(d))
      .catch(() => alive && setMe({ account: null }));
    return () => {
      alive = false;
    };
  }, [pathname]);
  return me;
}

export function Avatar({ me, size = 'md' }: { me: NonNullable<Me['account']>; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold ${
        size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
      }`}
    >
      {initials(me)}
    </span>
  );
}

export function accountLinks(me: Me) {
  const links = [
    { label: 'Your account', href: '/motiv/account' },
    { label: 'Subscriptions', href: '/motiv/account#subscriptions' },
    { label: 'Register a computer', href: '/activate' },
    { label: 'Sign-in methods', href: '/motiv/account#signin' },
    { label: 'Self-assessments', href: '/assessments/self/history' },
    ...(me.isClient ? [{ label: 'Client portal', href: '/portal' }] : []),
    // Assessors and leads; admins reach it from the Admin menu
    ...(me.isStaff && !me.isAdmin ? [{ label: 'My workbench', href: '/workbench' }] : []),
  ];
  return { links };
}

export interface AdminLink {
  label: string;
  href: string;
  description: string;
  divider?: boolean;
}

/** The Admin menu, for site admins only. */
export function adminLinks(me: Me | null): AdminLink[] {
  if (!me?.account || !me.isAdmin) return [];
  return [
    { label: 'Workbench', href: '/workbench', description: 'Assessments, engagements and reports' },
    { label: 'Staff', href: '/workbench/staff', description: 'Who can use the Workbench' },
    { label: 'Motiv', href: '/admin/motiv', description: 'Subscriptions, seats and computers', divider: true },
    { label: 'Insights', href: '/admin/insights', description: 'Write and publish articles' },
    { label: 'Messages', href: '/admin/messages', description: 'Contact form submissions' },
    { label: 'Switch user', href: '/admin/users', description: 'View the site as another user' },
  ];
}

/** Sign out, or switch back when an admin is viewing as someone else. */
export function SessionButtons({ me, className = '' }: { me: Me; className?: string }) {
  return (
    <>
      {me.impersonatedBy && (
        <form action="/auth/switch-back" method="post">
          <button className={`${className} text-amber-800 font-semibold`}>Switch back to {me.impersonatedBy}</button>
        </form>
      )}
      <form action="/auth/signout" method="post">
        <button className={`${className} text-gray-700`}>Sign out</button>
      </form>
    </>
  );
}

/** Desktop: "Sign in" when signed out, an avatar with a menu when signed in. */
export default function AccountMenu({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!me) return <span className="w-8 h-8" aria-hidden />; // reserve space while loading
  if (!me.account) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(pathname === '/' ? '/motiv/account' : pathname)}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-blue-700"
      >
        <LogIn className="w-4 h-4" /> Sign in
      </Link>
    );
  }

  const { links } = accountLinks(me);
  const item = 'block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-50';
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${me.account.email}`}
        className={`flex items-center gap-1 rounded-full p-0.5 ${me.impersonatedBy ? 'ring-2 ring-amber-400' : ''}`}
      >
        <Avatar me={me.account} />
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl p-2 z-50">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 mb-1">
            <Avatar me={me.account} size="lg" />
            <div className="min-w-0">
              {me.account.name && <p className="font-semibold text-gray-900 truncate">{me.account.name}</p>}
              <p className="text-sm text-gray-500 truncate">{me.account.email}</p>
            </div>
          </div>
          {me.impersonatedBy && (
            <p className="mx-1 mb-1 px-2 py-1.5 rounded-md bg-amber-50 text-xs text-amber-900">
              You are viewing as this user.
            </p>
          )}
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`${item} text-gray-800`}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <SessionButtons me={me} className={item} />
          </div>
        </div>
      )}
    </div>
  );
}
