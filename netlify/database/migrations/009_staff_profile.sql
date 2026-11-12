-- Staff profile details and deactivation (keeps their history, removes access).
alter table staff add column if not exists title text;
alter table staff add column if not exists phone text;
alter table staff add column if not exists notes text;
alter table staff add column if not exists active boolean not null default true;
alter table staff add column if not exists updated_at timestamptz not null default now();
