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

drop policy if exists "own wishlist" on public.wishlist_items;
drop policy if exists "own wishlist groups" on public.wishlist_groups;
drop policy if exists "own expenses" on public.expenses;

create policy "own wishlist groups" on public.wishlist_groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wishlist" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own expenses" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
