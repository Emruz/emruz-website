-- Profile photo (version doubles as a cache buster; null means no photo)
alter table accounts add column if not exists avatar_version bigint;
-- Admin rights granted from the Staff page, in addition to ADMIN_EMAILS
alter table staff add column if not exists is_admin boolean not null default false;
