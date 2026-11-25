-- Emruz kits over MCP (#67): OAuth 2.1 for MCP clients, entitlements per pack,
-- and an audit log. New tables only, so the previous deploy still runs on this schema.

-- Clients registered through dynamic client registration (public clients, PKCE only).
create table if not exists oauth_clients (
  id             text primary key,
  client_name    text,
  redirect_uris  text[] not null,
  created_at     timestamptz not null default now(),
  created_ip     text,
  last_used_at   timestamptz
);

-- One row per approval of a client by an account. Access and refresh tokens
-- carry the grant id; revoking the grant ends them all at once.
create table if not exists oauth_grants (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references accounts(id) on delete cascade,
  client_id       text not null references oauth_clients(id) on delete cascade,
  scope           text not null,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  revoked_reason  text
);
create index if not exists oauth_grants_account_idx on oauth_grants (account_id) where revoked_at is null;

-- Authorization codes: single use, short-lived, stored hashed.
create table if not exists oauth_codes (
  code_hash       text primary key,
  account_id      uuid not null references accounts(id) on delete cascade,
  client_id       text not null references oauth_clients(id) on delete cascade,
  redirect_uri    text not null,
  code_challenge  text not null,
  scope           text not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

-- Refresh tokens, stored hashed. Rotated on every use; reuse of a used token
-- revokes the whole grant.
create table if not exists oauth_refresh_tokens (
  token_hash  text primary key,
  grant_id    uuid not null references oauth_grants(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists oauth_refresh_grant_idx on oauth_refresh_tokens (grant_id);

-- Paid access to kit packs. pack is a pack id from the emruz-kits manifest, or
-- 'all'. through_ref null follows new releases; a tag holds the account at that release.
create table if not exists kit_entitlements (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references accounts(id) on delete cascade,
  pack           text not null check (pack ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  through_ref    text check (through_ref ~ '^v[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,4}$'),
  source         text not null check (source in ('staff', 'purchase')),
  note           text,
  granted_by     text,
  granted_at     timestamptz not null default now(),
  revoked_at     timestamptz,
  revoked_by     text,
  revoked_reason text
);
create index if not exists kit_entitlements_account_idx on kit_entitlements (account_id) where revoked_at is null;

-- Token issuance, refresh, revocation and content access over MCP.
create table if not exists mcp_audit (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  kind        text not null,
  account_id  uuid references accounts(id) on delete set null,
  client_id   text,
  grant_id    uuid,
  ip          text,
  detail      jsonb
);
create index if not exists mcp_audit_account_idx on mcp_audit (account_id, at desc);
create index if not exists mcp_audit_at_idx on mcp_audit (at);
