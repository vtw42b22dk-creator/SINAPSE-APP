-- Organização de blocos de notas no Diário (sidebar) — sincroniza telemóvel ↔ computador
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

do $rl$ begin alter publication supabase_realtime add table public.journal_note_layout; exception when others then null; end $rl$;
