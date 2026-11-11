-- Security finding E4: count failed attempts against a pairing code; the code is
-- locked (expired) after 5.
alter table pairings add column if not exists attempts int not null default 0;
