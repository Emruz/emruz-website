-- Kits launch conditions (#71): email addresses left out of the kits sales metrics on
-- /admin/kits (staff, family, test accounts), managed on that page. New table only, so the
-- previous deploy still runs on this schema.

create table if not exists kit_excluded_emails (
  email     text primary key check (email = lower(email) and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  note      text check (char_length(note) <= 300),
  added_by  text not null,
  added_at  timestamptz not null default now()
);
