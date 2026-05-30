create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text default '',
  priority text default 'med',
  due_date date,
  tags jsonb default '[]'::jsonb,
  status text default 'inbox',
  source_type text default 'manual',
  source_id text,
  synapse_project_id text,
  synapse_node_id text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key text not null,
  title text not null,
  notes text default '',
  color text,
  all_day boolean default false,
  time text,
  duration integer,
  task_id text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.synapse_projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  color text,
  collapsed jsonb default '[]'::jsonb,
  modules jsonb default '{"investments":true,"notes":true,"analytics":true,"inventory":true,"documents":true}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.synapse_nodes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.synapse_connections (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.journal_spaces (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.journal_blocks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id text not null,
  type text not null,
  content text default '',
  meta jsonb default '{}'::jsonb,
  order_index integer default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.attachments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_type text not null,
  owner_id text not null,
  name text not null,
  type text default 'file',
  mime_type text default 'application/octet-stream',
  size bigint default 0,
  storage_bucket text default 'attachments',
  storage_path text,
  public_url text,
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.synapse_projects enable row level security;
alter table public.synapse_nodes enable row level security;
alter table public.synapse_connections enable row level security;
alter table public.journal_spaces enable row level security;
alter table public.journal_blocks enable row level security;
alter table public.attachments enable row level security;

create policy "own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own calendar" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own synapse projects" on public.synapse_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own synapse nodes" on public.synapse_nodes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own synapse connections" on public.synapse_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal spaces" on public.journal_spaces for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal blocks" on public.journal_blocks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own attachments" on public.attachments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create policy "own project investments" on public.project_investments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project notes" on public.project_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project kpis" on public.project_kpis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project inventory" on public.project_inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "own attachment objects read" on storage.objects for select
using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own attachment objects insert" on storage.objects for insert
with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own attachment objects update" on storage.objects for update
using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own attachment objects delete" on storage.objects for delete
using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);
