-- ============================================================
-- ESTÚDIO DE FOCO v2 — corre no Supabase → SQL Editor → Run
-- Novas tabelas: focus_projects, focus_tasks
-- Colunas novas: project_id em study_ideas e study_metrics
-- ============================================================

-- Projetos de foco personalizados
create table if not exists public.focus_projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  color text default '#00FFC8',
  icon text default '◈',
  goal_hours numeric not null default 0,
  deadline text default '',
  presets jsonb default '[]'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Tarefas to-do por projeto
create table if not exists public.focus_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null default '',
  text text not null default '',
  done boolean not null default false,
  priority text default 'normal',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Ideias espontâneas (existente — adiciona project_id e kind)
create table if not exists public.study_ideas (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  day_key text not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.study_ideas add column if not exists project_id text default '';
alter table public.study_ideas add column if not exists kind text default 'idea';

-- Métricas diárias (existente — adiciona project_id)
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

alter table public.study_metrics add column if not exists project_id text default '';

-- RLS
alter table public.focus_projects enable row level security;
alter table public.focus_tasks enable row level security;
alter table public.study_ideas enable row level security;
alter table public.study_metrics enable row level security;

drop policy if exists "own focus projects" on public.focus_projects;
drop policy if exists "own focus tasks" on public.focus_tasks;
drop policy if exists "own study ideas" on public.study_ideas;
drop policy if exists "own study metrics" on public.study_metrics;

create policy "own focus projects" on public.focus_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own focus tasks" on public.focus_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own study ideas" on public.study_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own study metrics" on public.study_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices
create index if not exists focus_projects_user_idx on public.focus_projects (user_id);
create index if not exists focus_tasks_user_project_idx on public.focus_tasks (user_id, project_id);
create index if not exists study_ideas_user_project_idx on public.study_ideas (user_id, project_id, day_key);

drop index if exists study_metrics_user_day_idx;
create unique index if not exists study_metrics_user_project_day_idx
  on public.study_metrics (user_id, project_id, day_key);
