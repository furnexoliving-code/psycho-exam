-- ---------------------------------------------------------------------------
-- Octagonal Test (5b) and Same Circle Test (5d) — run once in the Supabase
-- SQL editor before making the first paper of either.
--
-- Their categories are 'octagonal' and 'circle'. They ride the Same
-- Figure Test's engine: picture questions the institute uploads, answered
-- by a letter. Nothing else is new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle'));
