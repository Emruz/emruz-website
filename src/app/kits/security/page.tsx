import Link from 'next/link';
import LegalPage, { LEGAL_CONTACT } from '@/components/LegalPage';
import { SITE_URL } from '@/lib/server/config';
import { LIMITS } from '@/lib/server/kits/limits';
import { ACCESS_TTL_SECONDS, CODE_TTL_SECONDS, REFRESH_TTL_SECONDS, SCOPE } from '@/lib/server/kits/oauth-core';

// Security and data-handling statement for the kits MCP server (#71). Token lifetimes, scope and
// rate limits are read from the code that enforces them, so this page cannot drift from it.

export const metadata = {
  title: 'Emruz kits security and data statement',
  description: 'How the Emruz kits MCP server signs apps in, what they can do, token lifetimes, what is stored, the audit log, rate limits and hosting.',
};

const minutes = (s: number) => `${s / 60} minutes`;
const days = (s: number) => `${s / 86_400} days`;
const per = (w: number) => (w === 3600 ? 'hour' : minutes(w));

const limitRows: { what: string; rule: { limit: number; windowSeconds: number } }[] = [
  { what: 'App registration, per IP address', rule: LIMITS.registerPerIp },
  { what: 'App registration, all apps', rule: LIMITS.registerTotal },
  { what: 'Sign-in page, per IP address', rule: LIMITS.authorizePerIp },
  { what: 'Token requests, per app', rule: LIMITS.tokenPerClient },
  { what: 'Token requests, per IP address', rule: LIMITS.tokenPerIp },
  { what: 'Kits server without a valid token, per IP address', rule: LIMITS.mcpAnonPerIp },
  { what: 'Kits server, per account', rule: LIMITS.mcpPerAccount },
  { what: 'Kits server, per app', rule: LIMITS.mcpPerClient },
  { what: 'Kits server, all accounts', rule: LIMITS.mcpTotal },
];

export default function KitsSecurityPage() {
  return (
    <LegalPage
      title="Kits security and data statement"
      summary="How the Emruz kits server signs apps in, what they can do and what it keeps. For security and procurement reviews."
      updated="25 November 2026"
      path="/kits/security"
      parent={{ label: 'Kits', href: '/kits' }}
    >
      <p>
        The Emruz kits are served to Claude and other MCP apps from <code>{SITE_URL}/api/mcp</code>. This page covers that server and
        its sign-in. Buying on emruz.com is covered by the <Link href="/privacy">privacy policy</Link> and the{' '}
        <Link href="/terms">terms of service</Link>.
      </p>

      <h2>Sign-in</h2>
      <ul>
        <li>emruz.com is the OAuth 2.1 authorization server. Apps sign in with an Emruz account; there are no API keys or shared passwords.</li>
        <li>Apps are public clients registered by dynamic client registration. They have no client secret, and PKCE with S256 is required on every sign-in.</li>
        <li>Redirect addresses must be https, http on the same computer (loopback), or an app&apos;s own reverse-domain scheme. The redirect must match the one registered.</li>
        <li>Each app needs your approval on a consent page that names the app and where you return to. Staff viewing as a customer cannot approve apps.</li>
      </ul>

      <h2>What a connected app can do</h2>
      <ul>
        <li>One scope, <code>{SCOPE}</code>: list, search and read the kit skills your account has. All tools are read-only.</li>
        <li>An app cannot change anything, and cannot see your profile, billing, payment details or other Emruz data.</li>
        <li>Access is checked on every call, so a new purchase, an ended subscription or a revoked kit takes effect on the next request.</li>
      </ul>

      <h2>Tokens</h2>
      <ul>
        <li>Authorization codes last {minutes(CODE_TTL_SECONDS)}, work once, and are rejected after one failed attempt.</li>
        <li>Access tokens are signed (EdDSA) and last {minutes(ACCESS_TTL_SECONDS)}. They are only accepted by the kits server.</li>
        <li>
          Refresh tokens last {days(REFRESH_TTL_SECONDS)} and work once; each use issues a new one. If a used refresh token is presented
          again, the whole connection is revoked and Emruz staff are alerted.
        </li>
        <li>Codes and refresh tokens are stored only as SHA-256 hashes. Access tokens are not stored.</li>
        <li>
          Disconnect an app any time on <Link href="/motiv/account#kits">your account page</Link>. Apps can also revoke their own tokens
          (RFC 7009); revoking either token ends the connection.
        </li>
      </ul>

      <h2>What is stored</h2>
      <ul>
        <li>Your Emruz account: email address and sign-in details.</li>
        <li>Registered apps: the name the app gives itself, its redirect addresses and the IP address that registered it.</li>
        <li>Connections you approve: which app, when, when last used, and when revoked.</li>
        <li>Kits you have: which kit, which release, and for purchases the Stripe IDs and your answer to what made you buy. Card details stay with Stripe.</li>
        <li>
          Not stored: your prompts, conversations, code or files, and what you search for. The server only receives requests to list,
          search and read skills.
        </li>
      </ul>

      <h2>Audit log</h2>
      <p>
        The server records app registration, consent, token issue and refresh, refused codes, refresh token reuse, revocations, purchases and
        changes to kits, and each skill read or refused, with the account, app, IP address and time. Audit entries are deleted after 365
        days, revoked connections a year after revocation, and expired codes and refresh tokens daily.
      </p>

      <h2>Rate limits</h2>
      <p>Over a limit, the server answers 429 with Retry-After. Limits apply before tokens are checked against the database.</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">What</th>
              <th scope="col">Limit</th>
            </tr>
          </thead>
          <tbody>
            {limitRows.map((r) => (
              <tr key={r.what}>
                <td>{r.what}</td>
                <td className="whitespace-nowrap">
                  {r.rule.limit.toLocaleString('en-US')} per {per(r.rule.windowSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Hosting</h2>
      <ul>
        <li>emruz.com runs on Netlify: serverless functions, a Netlify Database (Postgres) and Netlify Blobs. All traffic is over HTTPS.</li>
        <li>
          Kit content comes from published releases of a private GitHub repository, read with a read-only token. Each release is checked
          against its SHA-256 checksums before it is served; if a release fails, the last good one keeps being served.
        </li>
        <li>Payments are handled by Stripe.</li>
      </ul>

      <h2>Questions and reports</h2>
      <p>
        For a security questionnaire, a question about this page, or to report a vulnerability, email{' '}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
