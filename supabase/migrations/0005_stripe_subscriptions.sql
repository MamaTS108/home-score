-- Tracks Premium subscription status per user, kept in sync via the Stripe
-- webhook (checkout.session.completed, customer.subscription.updated/deleted).
create table if not exists user_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_subscriptions enable row level security;

create policy "user_subscriptions: owner can read" on user_subscriptions
  for select using (auth.uid() = user_id);

-- Only the service role (webhook) ever writes to this table, so no insert/
-- update policy is needed for regular users.
