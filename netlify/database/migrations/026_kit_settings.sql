-- Kits launch conditions (#71): kits settings staff change on /admin/kits instead of
-- environment variables, starting with the launch date for the 90-day review.
-- New table only, so the previous deploy still runs on this schema.

create table if not exists kit_settings (
  key         text primary key check (key ~ '^[a-z_]{1,40}$'),
  value       text not null check (char_length(value) <= 300),
  updated_by  text not null,
  updated_at  timestamptz not null default now()
);
