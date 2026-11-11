-- Security finding E7: sliding idle expiry and step-up sign-in.
-- last_seen_at: last request on this session (idle timeout).
-- authenticated_at: when the person last proved who they are (step-up for admin actions).
alter table sessions add column if not exists last_seen_at timestamptz not null default now();
alter table sessions add column if not exists authenticated_at timestamptz not null default now();
