-- Conteúdo da conta que ainda ficava só no dispositivo:
-- categorias de notas, estúdio de foco e preferências (ordem do menu, módulos ocultos, pins, prateleira do foco).
-- Corre no Supabase → SQL Editor. Pode correr mais do que uma vez.

create table if not exists public.journal_note_layout (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{"blocks":[],"assign":{},"collapsed":{}}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.journal_note_layout enable row level security;
drop policy if exists "own journal note layout" on public.journal_note_layout;
create policy "own journal note layout" on public.journal_note_layout
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create index if not exists focus_projects_user_idx on public.focus_projects (user_id);
create index if not exists focus_tasks_user_project_idx on public.focus_tasks (user_id, project_id);
create index if not exists study_ideas_user_project_idx on public.study_ideas (user_id, project_id, day_key);

drop index if exists study_metrics_user_day_idx;
create unique index if not exists study_metrics_user_project_day_idx
  on public.study_metrics (user_id, project_id, day_key);

create table if not exists public.user_prefs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.user_prefs enable row level security;
drop policy if exists "own user prefs" on public.user_prefs;
create policy "own user prefs" on public.user_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists user_prefs_user_idx on public.user_prefs (user_id);

grant select, insert, update, delete on public.journal_note_layout to authenticated;
grant select, insert, update, delete on public.focus_projects to authenticated;
grant select, insert, update, delete on public.focus_tasks to authenticated;
grant select, insert, update, delete on public.study_ideas to authenticated;
grant select, insert, update, delete on public.study_metrics to authenticated;
grant select, insert, update, delete on public.user_prefs to authenticated;

do $rl$ begin alter publication supabase_realtime add table public.journal_note_layout; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.focus_projects; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.focus_tasks; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.study_ideas; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.study_metrics; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.user_prefs; exception when others then null; end $rl$;
