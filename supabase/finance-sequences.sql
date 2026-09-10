-- Sequências do Financeiro (Geral / Projeto pessoal).
-- Supabase → SQL Editor → Run (uma vez).

alter table public.expenses add column if not exists sequence text default 'geral';
alter table public.incomes add column if not exists sequence text default 'geral';

update public.expenses set sequence = 'geral' where sequence is null or sequence = '';
update public.incomes set sequence = 'geral' where sequence is null or sequence = '';
