-- Adds a per-project "unlocked" flag. Past the 2nd AI generation, the 3rd
-- (and any later) visualization is shown blurred until the user pays a
-- one-time unlock fee via Stripe Checkout.
alter table renovation_projects
  add column if not exists premium_unlocked boolean not null default false;
