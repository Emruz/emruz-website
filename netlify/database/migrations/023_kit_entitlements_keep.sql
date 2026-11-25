-- Kit entitlements are paid records (#68 review sens-1): an account that still has any
-- cannot be deleted; they must be moved first, as claimEmail does. Was on delete cascade
-- in 021. Only the foreign key changes, so the previous deploy still runs on this schema.
alter table kit_entitlements drop constraint if exists kit_entitlements_account_id_fkey;
alter table kit_entitlements add constraint kit_entitlements_account_id_fkey
  foreign key (account_id) references accounts(id) on delete restrict;
