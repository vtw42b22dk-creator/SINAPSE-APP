-- Executa no Supabase → SQL Editor (uma vez) para sync quase em tempo real entre aparelhos.

alter publication supabase_realtime add table public.journal_spaces;
alter publication supabase_realtime add table public.journal_blocks;
alter publication supabase_realtime add table public.wishlist_groups;
alter publication supabase_realtime add table public.wishlist_items;
alter publication supabase_realtime add table public.finance_categories;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.income_categories;
alter publication supabase_realtime add table public.incomes;
