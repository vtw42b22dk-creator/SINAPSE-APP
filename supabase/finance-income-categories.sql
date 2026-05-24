-- Categorias de gastos (sync multi-dispositivo)
create table if not exists public.finance_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.expenses add column if not exists categories jsonb default '[]'::jsonb;

-- Recursos / receitas
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
