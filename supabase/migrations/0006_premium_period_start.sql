-- Needed to compute how many AI generations a Premium user has used in
-- their CURRENT billing cycle (the quota resets each renewal, not each
-- calendar month — simplest to track via Stripe's own cycle boundaries).
alter table user_subscriptions
  add column if not exists current_period_start timestamptz;
