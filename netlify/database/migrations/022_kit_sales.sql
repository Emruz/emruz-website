-- Emruz kit pack sales (#68): link purchase entitlements to their Stripe objects.
-- Nullable columns only, so the previous deploy still runs on this schema.

alter table kit_entitlements
  add column if not exists kind                     text check (kind in ('once', 'upgrade', 'subscription', 'lifetime')),
  add column if not exists stripe_checkout_session  text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_subscription_id   text,
  add column if not exists stripe_customer_id       text;

-- One entitlement per checkout, so a repeated webhook cannot grant twice.
create unique index if not exists kit_entitlements_checkout_idx on kit_entitlements (stripe_checkout_session)
  where stripe_checkout_session is not null;
create index if not exists kit_entitlements_payment_idx on kit_entitlements (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create index if not exists kit_entitlements_sub_idx on kit_entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;
