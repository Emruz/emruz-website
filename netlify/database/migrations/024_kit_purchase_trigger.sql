-- Kits launch conditions (#71): what made the buyer buy now, asked on /kits before checkout,
-- and whether a kit subscription is monthly or annual.
-- Nullable columns only, so the previous deploy still runs on this schema.

alter table kit_entitlements
  add column if not exists purchase_trigger text check (purchase_trigger ~ '^[a-z_]{1,40}$'),
  add column if not exists subscription_type text check (subscription_type in ('monthly', 'annual'));
