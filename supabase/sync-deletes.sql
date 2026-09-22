-- ============================================================
-- SINAPSE — sincronização de eliminações entre dispositivos
-- Cola isto no Supabase → SQL Editor → Run (uma vez)
-- ============================================================

create table if not exists public.sync_deletes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  row_id text not null,
  deleted_at timestamptz default now()
);

create unique index if not exists sync_deletes_user_table_row
  on public.sync_deletes (user_id, table_name, row_id);

alter table public.sync_deletes enable row level security;

drop policy if exists "own sync deletes" on public.sync_deletes;
create policy "own sync deletes" on public.sync_deletes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $rl$ begin
  alter publication supabase_realtime add table public.sync_deletes;
exception when others then null;
end $rl$;
