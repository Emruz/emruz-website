-- Admin "switch user": a session opened by an admin on behalf of another account.
alter table sessions add column if not exists impersonated_by uuid references accounts(id) on delete cascade;
