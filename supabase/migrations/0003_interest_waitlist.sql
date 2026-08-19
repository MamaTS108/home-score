-- Waitlist / demand-capture tables for the "Trouver les produits" and
-- "Trouver un artisan" CTAs — V1 does NOT pretend a real supplier/artisan
-- network exists. Instead we capture structured interest so we know what to
-- build/source first, before investing in real marketplace integrations.

create table if not exists product_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid references renovation_projects (id) on delete cascade,
  categories text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_product_interest_project_id on product_interest (project_id);
create index if not exists idx_product_interest_categories on product_interest using gin (categories);

create table if not exists artisan_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid references renovation_projects (id) on delete cascade,
  work_type text,
  location text,
  budget numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_artisan_interest_project_id on artisan_interest (project_id);

alter table product_interest enable row level security;
alter table artisan_interest enable row level security;

-- Anyone can insert (covers the anonymous, pre-auth part of the funnel);
-- only the owning user can read their own submissions back.
create policy "product_interest: anyone can insert" on product_interest
  for insert with check (true);

create policy "product_interest: owner can read" on product_interest
  for select using (auth.uid() = user_id);

create policy "artisan_interest: anyone can insert" on artisan_interest
  for insert with check (true);

create policy "artisan_interest: owner can read" on artisan_interest
  for select using (auth.uid() = user_id);
