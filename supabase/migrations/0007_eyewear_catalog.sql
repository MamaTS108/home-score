-- Eyewear catalog + virtual try-on for opticians.
--
-- Any authenticated user can become an "optician" simply by adding a product
-- (no separate approval flow for V1 — same demand-validation posture as the
-- rest of the product catalog). Each product belongs to the optician who
-- created it (optician_id -> auth.users.id) and is shown in the public
-- try-on catalogue once marked active.

create table if not exists eyewear_products (
  id uuid primary key default gen_random_uuid(),
  optician_id uuid not null references auth.users (id) on delete cascade,
  brand text not null,
  name text not null,
  category text not null default 'optique'
    check (category in ('optique', 'solaire')),
  price numeric,
  currency text not null default 'EUR',
  description text not null default '',
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eyewear_products_optician_id on eyewear_products (optician_id);
create index if not exists idx_eyewear_products_active on eyewear_products (active);

alter table eyewear_products enable row level security;

-- The optician who owns a product can fully manage it.
create policy "eyewear_products: owner can manage" on eyewear_products
  for all using (auth.uid() = optician_id) with check (auth.uid() = optician_id);

-- Anyone (including anonymous visitors trying glasses on) can read active
-- products, so the public try-on catalogue works without an account.
create policy "eyewear_products: public read active" on eyewear_products
  for select using (active = true);

-- Storage bucket for glasses cutout images (ideally transparent PNG).
insert into storage.buckets (id, name, public)
values ('eyewear-photos', 'eyewear-photos', true)
on conflict (id) do nothing;
