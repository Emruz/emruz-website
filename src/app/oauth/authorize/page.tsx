import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container, DetailHeader } from '@/components';
import { ipFromHeaders } from '@/lib/server/api';
import { rules } from '@/lib/server/kits/limits';
import { checkAuthorize } from '@/lib/server/kits/oauth-core';
import { limited, serverConfig } from '@/lib/server/kits/server';
import { hostOf, oauthStore } from '@/lib/server/kits/store';
import { currentAccount } from '@/lib/server/session';
import Consent from './Consent';

export const metadata = { title: 'Connect an app', robots: { index: false } };

const PARAMS = ['client_id', 'redirect_uri', 'response_type', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource'] as const;

function Problem({ text }: { text: string }) {
  return (
    <p role="alert" className="max-w-xl p-4 rounded-md border border-red-300 bg-red-50 text-sm text-red-800">
      {text}
    </p>
  );
}

/** OAuth authorization endpoint (#67): sign in, then approve or deny an MCP client. */
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const params: Record<string, string | undefined> = {};
  for (const k of PARAMS) if (typeof sp[k] === 'string') params[k] = sp[k] as string;

  const shell = (body: React.ReactNode) => (
    <>
      <DetailHeader breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Connect an app' }]} title="Connect an app" summary="Let an AI app read your Emruz kits." />
      <section className="py-10 bg-gray-50 min-h-[50vh]">
        <Container>{body}</Container>
      </section>
    </>
  );

  if (await limited(rules.authorize(ipFromHeaders(await headers())))) return shell(<Problem text="Too many requests. Wait a few minutes and try again." />);

  const account = await currentAccount();
  if (!account) {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    redirect(`/signin?next=${encodeURIComponent(`/oauth/authorize?${q}`)}`);
  }

  const check = await checkAuthorize(oauthStore, serverConfig, params);
  // Errors go back to the app only when the person clicks, so this page is never an open redirect
  if (check.kind === 'redirect') {
    return shell(
      <div className="max-w-xl space-y-4">
        <Problem text={new URL(check.url).searchParams.get('error_description') || 'The app sent a request Emruz cannot accept.'} />
        <a href={check.url} className="inline-block text-sm font-semibold text-blue-700 hover:underline">Return to {hostOf(check.url)}</a>
      </div>,
    );
  }
  if (check.kind === 'fatal') return shell(<Problem text={check.message} />);
  if (account.impersonatedBy) return shell(<Problem text="You are viewing as another user. Switch back to your own account to connect an app." />);

  const { client, redirectUri } = check.req;
  return shell(
    <Consent
      params={params}
      appName={client.clientName || 'An unnamed app'}
      returnHost={hostOf(redirectUri)}
      email={account.email}
    />,
  );
}
