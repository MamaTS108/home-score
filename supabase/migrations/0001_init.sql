-- HOME SCORE — MVP schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- renovation_projects
-- ---------------------------------------------------------------------------
create table if not exists renovation_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  room_type text,
  description text not null default '',
  style text not null default 'free',
  budget numeric,
  currency text not null default 'EUR',
  status text not null default 'draft'
    check (status in ('draft', 'analyzing', 'analyzed', 'planning', 'ready', 'archived')),
  original_image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_renovation_projects_user_id on renovation_projects (user_id);

-- ---------------------------------------------------------------------------
-- room_analyses
-- ---------------------------------------------------------------------------
create table if not exists room_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  analysis_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_analyses_project_id on room_analyses (project_id);

-- ---------------------------------------------------------------------------
-- renovation_plans
-- ---------------------------------------------------------------------------
create table if not exists renovation_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  summary text not null,
  required_material_categories text[] not null default '{}',
  version int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_renovation_plans_project_id on renovation_plans (project_id);

-- ---------------------------------------------------------------------------
-- renovation_tasks
-- ---------------------------------------------------------------------------
create table if not exists renovation_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references renovation_plans (id) on delete cascade,
  project_id uuid not null references renovation_projects (id) on delete cascade,
  name text not null,
  description text not null default '',
  quantity numeric,
  unit text,
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard', 'professional_required')),
  diy_possible boolean not null default true,
  requires_professional boolean not null default false,
  sort_order int not null default 0
);

create index if not exists idx_renovation_tasks_plan_id on renovation_tasks (plan_id);

-- ---------------------------------------------------------------------------
-- design_generations
-- ---------------------------------------------------------------------------
create table if not exists design_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  prompt text not null,
  image_url text not null,
  source_image_url text not null,
  version int not null default 1,
  disclaimer text not null default 'Visualisation IA — le résultat final peut différer de la réalisation.',
  created_at timestamptz not null default now()
);

create index if not exists idx_design_generations_project_id on design_generations (project_id);

-- ---------------------------------------------------------------------------
-- products (our simplified indicative catalog — mirrors src/lib/products/catalog.ts)
-- ---------------------------------------------------------------------------
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  unit text not null,
  estimated_unit_price numeric not null,
  currency text not null default 'EUR',
  provider text not null default 'mock',
  metadata jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- project_products
-- ---------------------------------------------------------------------------
create table if not exists project_products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  product_id text not null references products (id),
  quantity numeric not null,
  estimated_total numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_products_project_id on project_products (project_id);

-- ---------------------------------------------------------------------------
-- budget_estimates
-- ---------------------------------------------------------------------------
create table if not exists budget_estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  materials_total numeric not null default 0,
  accessories_total numeric not null default 0,
  estimated_total numeric not null default 0,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

create index if not exists idx_budget_estimates_project_id on budget_estimates (project_id);

-- ---------------------------------------------------------------------------
-- ai_messages (conversation log for iteration, section 6)
-- ---------------------------------------------------------------------------
create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references renovation_projects (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_project_id on ai_messages (project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is scoped to its owning user via
-- renovation_projects.user_id.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table renovation_projects enable row level security;
alter table room_analyses enable row level security;
alter table renovation_plans enable row level security;
alter table renovation_tasks enable row level security;
alter table design_generations enable row level security;
alter table project_products enable row level security;
alter table budget_estimates enable row level security;
alter table ai_messages enable row level security;

create policy "profiles: self read/write" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "renovation_projects: owner only" on renovation_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "room_analyses: via project ownership" on room_analyses
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "renovation_plans: via project ownership" on renovation_plans
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "renovation_tasks: via project ownership" on renovation_tasks
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "design_generations: via project ownership" on design_generations
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "project_products: via project ownership" on project_products
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "budget_estimates: via project ownership" on budget_estimates
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "ai_messages: via project ownership" on ai_messages
  for all using (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from renovation_projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- products is a shared read-only reference table
create policy "products: public read" on products for select using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for room photos & (future) generated renders
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;
