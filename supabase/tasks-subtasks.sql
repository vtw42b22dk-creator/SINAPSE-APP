alter table public.tasks add column if not exists subtasks jsonb default '[]'::jsonb;
