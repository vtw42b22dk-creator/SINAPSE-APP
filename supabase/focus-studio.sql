-- ============================================================
-- ESTÚDIO DE FOCO — corre no Supabase → SQL Editor → Run
-- Tabelas: study_ideas (ideias espontâneas) e study_metrics
-- (métricas diárias). Notas de revisão são inseridas no Diário
-- existente (journal_blocks), por isso não precisam de tabela nova.
-- ============================================================

-- Ideias espontâneas registadas durante o estudo
create table if not exists public.study_ideas (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  day_key text not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Métricas diárias (uma linha por dia/utilizador)
create table if not exists public.study_metrics (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key text not null,
  minutes numeric not null default 0,
  pages numeric not null default 0,
  subject text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.study_ideas enable row level security;
alter table public.study_metrics enable row level security;

drop policy if exists "own study ideas" on public.study_ideas;
drop policy if exists "own study metrics" on public.study_metrics;

create policy "own study ideas" on public.study_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own study metrics" on public.study_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists study_ideas_user_idx on public.study_ideas (user_id, day_key);
create unique index if not exists study_metrics_user_day_idx on public.study_metrics (user_id, day_key);
