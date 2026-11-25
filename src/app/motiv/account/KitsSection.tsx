import { Container } from '@/components';
import Link from 'next/link';
import { currentBundle, packTitle } from '@/lib/server/kits/content';
import { holding } from '@/lib/server/kits/sales-core';
import { connectedApps, ownedKits } from '@/lib/server/kits/store';
import { fmtDate } from '@/lib/server/queries';
import { SITE_URL } from '@/lib/server/config';
import { revokeApp } from './actions';

/** Emruz kits on the account page (#67, #68): kits the account has, billing, upgrades, and connected MCP apps it can disconnect. */
export default async function KitsSection({ accountId, readOnly, revoked }: { accountId: string; readOnly: boolean; revoked: boolean }) {
  const [kits, apps, latest] = await Promise.all([
    ownedKits(accountId),
    connectedApps(accountId),
    currentBundle().then((b) => b.ref, () => null),
  ]);
  const upgradable = latest
    ? [...new Set(kits.map((k) => k.pack))].filter((p) => {
        const h = holding(p, kits, latest);
        return h.state === 'held' && h.upgradable;
      })
    : [];
  return (
    <section id="kits" className="py-10 md:py-12 scroll-mt-20">
      <Container>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Emruz kits</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">
          Connect Claude or another MCP app to <span className="font-mono text-sm text-gray-800 break-all">{SITE_URL}/api/mcp</span> to use the kits.
          Free skills work with any account.
        </p>
        <h3 className="font-semibold text-gray-900 mb-2">Your kits</h3>
        {kits.length ? (
          <ul className="mb-2 space-y-1 text-sm text-gray-800">
            {kits.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {packTitle(k.pack)}
                  <span className="text-gray-500">
                    {' · '}
                    {k.kind === 'subscription' ? 'subscription, includes new releases' : k.kind === 'lifetime' ? 'lifetime, includes new releases' : k.throughRef ? `up to release ${k.throughRef}` : 'includes new releases'}
                  </span>
                </span>
                {k.billing && !readOnly && (
                  <form action="/api/kits/portal" method="post">
                    <input type="hidden" name="entitlement" value={k.id} />
                    <button className="text-sm font-semibold text-blue-700 hover:text-blue-900">Manage billing</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 text-sm text-gray-600">Free skills only.</p>
        )}
        {upgradable.length > 0 && (
          <p className="mb-2 text-sm text-gray-800">
            Release {latest} is out. Upgrade {upgradable.map(packTitle).join(', ')} at the lower price.
          </p>
        )}
        <p className="mb-6 text-sm">
          <Link href="/kits#pricing" className="font-semibold text-blue-700 hover:text-blue-900">
            {upgradable.length ? 'Upgrade or buy kits' : 'Buy kits'}
          </Link>
        </p>

        <h3 className="font-semibold text-gray-900 mb-2">Connected apps</h3>
        {revoked && <p role="status" className="mb-3 text-sm font-semibold text-green-800">App disconnected.</p>}
        {apps.length ? (
          <ul className="divide-y divide-gray-200 max-w-xl">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block font-medium text-gray-900 break-words">{a.clientName || 'Unnamed app'}</span>
                  <span className="block text-sm text-gray-500 break-words">
                    {a.redirectHost} · connected {fmtDate(a.createdAt)}
                    {a.lastUsedAt ? ` · last used ${fmtDate(a.lastUsedAt)}` : ''}
                  </span>
                </span>
                {!readOnly && (
                  <form action={revokeApp}>
                    <input type="hidden" name="grant" value={a.id} />
                    <button className="text-sm font-semibold text-gray-600 hover:text-red-700 whitespace-nowrap">Disconnect</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No apps connected.</p>
        )}
      </Container>
    </section>
  );
}
