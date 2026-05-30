-- ============================================================
-- PROJETOS MODULARES — corre no Supabase → SQL Editor → Run
-- (Utilizadores que já tinham sync entre dispositivos)
-- ============================================================

-- Campos novos na lista de projetos
alter table public.synapse_projects
  add column if not exists description text default '',
  add column if not exists modules jsonb default '{"investments":true,"notes":true,"analytics":true,"inventory":true,"documents":true}'::jsonb;

-- Investimentos por projeto (ledger débito/crédito)
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

-- Notas / wiki (uma linha por projeto)
create table if not exists public.project_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  body text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, project_id)
);

-- KPIs / analytics
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

-- Inventário / stock
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

create policy "own project investments" on public.project_investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own project notes" on public.project_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own project kpis" on public.project_kpis
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own project inventory" on public.project_inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists project_investments_project_idx on public.project_investments (user_id, project_id);
create index if not exists project_kpis_project_idx on public.project_kpis (user_id, project_id);
create index if not exists project_inventory_project_idx on public.project_inventory (user_id, project_id);
