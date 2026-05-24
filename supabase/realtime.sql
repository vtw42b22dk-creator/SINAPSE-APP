-- Executa no Supabase → SQL Editor (uma vez). Não dá erro se já estiver configurado.

do $rl$ begin alter publication supabase_realtime add table public.journal_spaces; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.journal_blocks; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.wishlist_groups; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.wishlist_items; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.finance_categories; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.expenses; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.income_categories; exception when others then null; end $rl$;
do $rl$ begin alter publication supabase_realtime add table public.incomes; exception when others then null; end $rl$;
