-- ---------------------------------------------------------------------------
-- Brick Test (3a), Similarity Test (5a) and Similarity Test Type-II (5c) —
-- run once in the Supabase SQL editor before making the first paper of
-- any of them.
--
-- Their categories are 'brick', 'similarity' and 'similarity2'. They ride
-- the picture engine: one picture per part, several questions on each
-- (A to E answered by a number on a pile; a to d answered by a letter on
-- a sheet). Nothing else is new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick', 'similarity', 'similarity2'));
