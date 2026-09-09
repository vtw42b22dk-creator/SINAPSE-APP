-- Loja / stock nos projetos — corre no Supabase → SQL Editor → Run
-- (Se já tinhas project-modules.sql, basta correr este ficheiro)

create table if not exists public.project_stock (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  body text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, project_id)
);

alter table public.project_stock enable row level security;
drop policy if exists "own project stock" on public.project_stock;
create policy "own project stock" on public.project_stock
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists project_stock_project_idx on public.project_stock (user_id, project_id);
