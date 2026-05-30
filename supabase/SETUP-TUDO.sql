-- ============================================================
-- SINAPSE — cola TUDO isto no Supabase → SQL Editor → Run (uma vez)
-- Projeto: supabase.com → teu projeto → SQL Editor
-- ============================================================

-- Correções (order_index + group_id)
alter table public.wishlist_items add column if not exists group_id text;
alter table public.journal_blocks alter column order_index type bigint;
alter table public.wishlist_groups alter column order_index type bigint;
alter table public.finance_categories alter column order_index type bigint;
alter table public.income_categories alter column order_index type bigint;

-- ---------- WISHLIST + GASTOS ----------
create table if not exists public.wishlist_groups (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#34D399',
  order_index integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.wishlist_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text,
  title text not null,
  url text default '',
  price numeric,
  currency text default 'EUR',
  priority text default 'med',
  notes text default '',
  purchased boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric default 0,
  category text default 'Outro',
  day_key text not null,
  notes text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.wishlist_groups enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "own wishlist groups" on public.wishlist_groups;
drop policy if exists "own wishlist" on public.wishlist_items;
drop policy if exists "own expenses" on public.expenses;

create policy "own wishlist groups" on public.wishlist_groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wishlist" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- FINANCEIRO (categorias + receitas) ----------
create table if not exists public.finance_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.expenses add column if not exists categories jsonb default '[]'::jsonb;

create table if not exists public.income_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.incomes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric default 0,
  category text default 'Outro',
  categories jsonb default '[]'::jsonb,
  day_key text not null,
  notes text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.finance_categories enable row level security;
alter table public.income_categories enable row level security;
alter table public.incomes enable row level security;

drop policy if exists "own finance categories" on public.finance_categories;
drop policy if exists "own income categories" on public.income_categories;
drop policy if exists "own incomes" on public.incomes;

create policy "own finance categories" on public.finance_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own income categories" on public.income_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own incomes" on public.incomes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- REALTIME (opcional; ignora se já existir) ----------
do $rl$ begin alter publication supabase_realtime add table public.journal_spaces; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.journal_blocks; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.wishlist_groups; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.wishlist_items; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.finance_categories; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.expenses; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.income_categories; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.incomes; exception when others then null; end $rl$;

-- ---------- PROJETOS MODULARES (2025) ----------
-- Ver também: supabase/project-modules.sql

alter table public.synapse_projects
  add column if not exists description text default '',
  add column if not exists modules jsonb default '{"investments":true,"notes":true,"analytics":true,"inventory":true,"documents":true}'::jsonb;

create table if not exists public.project_investments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  title text not null default '',
  amount numeric not null default 0,
  type text not null default 'debit',
  day_key text not null,
  notes text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.project_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  body text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, project_id)
);

create table if not exists public.project_kpis (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  label text not null default 'Meta',
  target numeric not null default 0,
  current numeric not null default 0,
  unit text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.project_inventory (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  name text not null default '',
  quantity numeric not null default 0,
  status text not null default 'missing',
  unit_cost numeric not null default 0,
  notes text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.project_investments enable row level security;
alter table public.project_notes enable row level security;
alter table public.project_kpis enable row level security;
alter table public.project_inventory enable row level security;

drop policy if exists "own project investments" on public.project_investments;
drop policy if exists "own project notes" on public.project_notes;
drop policy if exists "own project kpis" on public.project_kpis;
drop policy if exists "own project inventory" on public.project_inventory;

create policy "own project investments" on public.project_investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project notes" on public.project_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project kpis" on public.project_kpis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project inventory" on public.project_inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
