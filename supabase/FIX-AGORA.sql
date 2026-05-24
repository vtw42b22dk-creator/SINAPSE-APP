-- Correção rápida — corre no Supabase → SQL Editor → Run
-- (resolve os erros de order_index e group_id)

-- 1) Wishlist: coluna group_id (se a tabela foi criada antes sem ela)
alter table public.wishlist_items add column if not exists group_id text;

-- 2) order_index demasiado grande (Date.now em milissegundos não cabe em integer)
alter table public.journal_blocks alter column order_index type bigint;
alter table public.wishlist_groups alter column order_index type bigint;
alter table public.finance_categories alter column order_index type bigint;
alter table public.income_categories alter column order_index type bigint;
