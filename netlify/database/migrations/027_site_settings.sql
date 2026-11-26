-- Site settings (#74): business settings staff change on /admin/settings instead of Netlify
-- environment variables, so a change needs no redeploy. Generalises kit_settings (#71).
-- New table only, and kit_settings is left as it is, so the previous deploy still runs on
-- this schema. The kits launch date is copied across.

create table if not exists site_settings (
  key         text primary key check (key ~ '^[a-z_]{1,40}$'),
  value       text not null check (char_length(value) <= 1000),
  updated_by  text not null,
  updated_at  timestamptz not null default now()
);

insert into site_settings (key, value, updated_by, updated_at)
select 'kits_launch_date', value, updated_by, updated_at from kit_settings where key = 'launch_date'
on conflict (key) do nothing;
