-- Ponte Vinted: o bot grava o estado e lê pedidos.
-- Supabase → SQL Editor → cola isto → Run. Podes correr outra vez.

create table if not exists public.vinted_estado (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  visto_em timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.vinted_comandos (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pedido',
  resultado jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists vinted_comandos_fila
  on public.vinted_comandos (user_id, estado, created_at);

alter table public.vinted_estado enable row level security;
alter table public.vinted_comandos enable row level security;

drop policy if exists "own vinted estado" on public.vinted_estado;
create policy "own vinted estado" on public.vinted_estado
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own vinted comandos" on public.vinted_comandos;
create policy "own vinted comandos" on public.vinted_comandos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.vinted_estado to authenticated;
grant select, insert, update, delete on public.vinted_comandos to authenticated;

alter table public.vinted_estado replica identity full;
alter table public.vinted_comandos replica identity full;

do $rl$ begin alter publication supabase_realtime add table public.vinted_estado; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.vinted_comandos; exception when others then null; end $rl$;
