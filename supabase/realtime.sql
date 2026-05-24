-- Executa no Supabase → SQL Editor (uma vez) para sync quase em tempo real entre aparelhos.

alter publication supabase_realtime add table public.journal_spaces;
alter publication supabase_realtime add table public.journal_blocks;
alter publication supabase_realtime add table public.wishlist_groups;
alter publication supabase_realtime add table public.wishlist_items;
