import 'server-only';
import { db } from '../db';
import { securityEvent } from '../alerts';
import type { ClientRecord, CodeRecord, GrantRecord, OAuthStore, RefreshUse } from './oauth-core';
import type { Entitlement } from './content-core';

/** Postgres storage for the OAuth server (migration 021). */
export const oauthStore: OAuthStore = {
  async insertClient(c: ClientRecord, ip: string) {
    await db()`insert into oauth_clients (id, client_name, redirect_uris, created_ip) values (${c.id}, ${c.clientName}, ${c.redirectUris}, ${ip})`;
  },
  async getClient(id: string) {
    const [r] = await db()<{ id: string; client_name: string | null; redirect_uris: string[] }[]>`
      select id, client_name, redirect_uris from oauth_clients where id = ${id}`;
    return r ? { id: r.id, clientName: r.client_name, redirectUris: r.redirect_uris } : null;
  },
  async insertCode(c: CodeRecord) {
    await db()`
      insert into oauth_codes (code_hash, account_id, client_id, redirect_uri, code_challenge, scope, expires_at)
      values (${c.codeHash}, ${c.accountId}, ${c.clientId}, ${c.redirectUri}, ${c.codeChallenge}, ${c.scope}, ${new Date(c.expiresAt)})`;
  },
  async takeCode(codeHash: string) {
    const [r] = await db()<{ account_id: string; client_id: string; redirect_uri: string; code_challenge: string; scope: string; expires_at: Date }[]>`
      delete from oauth_codes where code_hash = ${codeHash}
      returning account_id, client_id, redirect_uri, code_challenge, scope, expires_at`;
    return r
      ? { codeHash, accountId: r.account_id, clientId: r.client_id, redirectUri: r.redirect_uri, codeChallenge: r.code_challenge, scope: r.scope, expiresAt: new Date(r.expires_at).getTime() }
      : null;
  },
  async createGrant(accountId: string, clientId: string, scope: string) {
    const [r] = await db()<{ id: string }[]>`
      insert into oauth_grants (account_id, client_id, scope, last_used_at) values (${accountId}, ${clientId}, ${scope}, now()) returning id`;
    await db()`update oauth_clients set last_used_at = now() where id = ${clientId}`;
    return r.id;
  },
  async getGrant(id: string): Promise<GrantRecord | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const [r] = await db()<{ id: string; account_id: string; client_id: string; scope: string; revoked_at: Date | null }[]>`
      select id, account_id, client_id, scope, revoked_at from oauth_grants where id = ${id}`;
    return r ? { id: r.id, accountId: r.account_id, clientId: r.client_id, scope: r.scope, revoked: !!r.revoked_at } : null;
  },
  async revokeGrant(id: string, reason: string) {
    await db()`update oauth_grants set revoked_at = now(), revoked_reason = ${reason} where id = ${id} and revoked_at is null`;
    await db()`delete from oauth_refresh_tokens where grant_id = ${id}`;
    if (reason === 'refresh_reuse') void securityEvent('kits_refresh_reuse', { grant: id });
  },
  async insertRefresh(tokenHash: string, grantId: string, expiresAt: number) {
    await db()`insert into oauth_refresh_tokens (token_hash, grant_id, expires_at) values (${tokenHash}, ${grantId}, ${new Date(expiresAt)})`;
    await db()`update oauth_grants set last_used_at = now() where id = ${grantId}`;
  },
  async useRefresh(tokenHash: string, now: number): Promise<RefreshUse> {
    // Only one request can flip used_at from null, so a token is good exactly once
    const [first] = await db()<{ grant_id: string; expired: boolean }[]>`
      update oauth_refresh_tokens set used_at = now()
      where token_hash = ${tokenHash} and used_at is null
      returning grant_id, (expires_at <= ${new Date(now)}) as expired`;
    if (first) return first.expired ? { status: 'expired' } : { status: 'ok', grantId: first.grant_id };
    const [seen] = await db()<{ grant_id: string }[]>`select grant_id from oauth_refresh_tokens where token_hash = ${tokenHash}`;
    return seen ? { status: 'used', grantId: seen.grant_id } : { status: 'missing' };
  },
  async audit(kind, f) {
    await db()`
      insert into mcp_audit (kind, account_id, client_id, grant_id, ip, detail)
      values (${kind}, ${f.accountId ?? null}, ${f.clientId ?? null}, ${f.grantId ?? null}, ${f.ip ?? null}, ${f.detail ? db().json(f.detail as never) : null})`;
  },
};

/** Active entitlements, read fresh on every MCP call. */
export async function entitlementsFor(accountId: string): Promise<Entitlement[]> {
  const rows = await db()<{ pack: string; through_ref: string | null }[]>`
    select pack, through_ref from kit_entitlements where account_id = ${accountId} and revoked_at is null`;
  return rows.map((r) => ({ pack: r.pack, throughRef: r.through_ref }));
}

export interface ConnectedApp {
  id: string;
  clientName: string | null;
  redirectHost: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export async function connectedApps(accountId: string): Promise<ConnectedApp[]> {
  const rows = await db()<{ id: string; client_name: string | null; redirect_uris: string[]; created_at: Date; last_used_at: Date | null }[]>`
    select g.id, c.client_name, c.redirect_uris, g.created_at, g.last_used_at
    from oauth_grants g join oauth_clients c on c.id = g.client_id
    where g.account_id = ${accountId} and g.revoked_at is null
    order by coalesce(g.last_used_at, g.created_at) desc`;
  return rows.map((r) => ({
    id: r.id,
    clientName: r.client_name,
    redirectHost: hostOf(r.redirect_uris[0]),
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export function hostOf(uri: string | undefined): string {
  try {
    const u = new URL(uri ?? '');
    return u.host || u.protocol.replace(/:$/, '');
  } catch {
    return 'unknown';
  }
}

/** Revoke one of the account's own grants (account page). */
export async function revokeOwnGrant(accountId: string, grantId: string): Promise<boolean> {
  const [g] = await db()<{ client_id: string }[]>`
    update oauth_grants set revoked_at = now(), revoked_reason = 'account_revoked'
    where id = ${grantId} and account_id = ${accountId} and revoked_at is null returning client_id`;
  if (!g) return false;
  await db()`delete from oauth_refresh_tokens where grant_id = ${grantId}`;
  await oauthStore.audit('grant_revoked', { accountId, clientId: g.client_id, grantId, detail: { by: 'account' } });
  return true;
}

/** Last MCP use per grant is recorded at most once a minute. */
export async function touchGrant(grantId: string) {
  await db()`update oauth_grants set last_used_at = now() where id = ${grantId} and (last_used_at is null or last_used_at < now() - interval '1 minute')`;
}
