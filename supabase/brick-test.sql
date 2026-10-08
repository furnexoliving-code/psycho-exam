-- ---------------------------------------------------------------------------
-- Brick Test (3a) — run once in the Supabase SQL editor before making the
-- first Brick paper.
--
-- Its category is 'brick'. It rides the picture engine: one picture per
-- pile, five questions (A to E) on each, answered by a number. Nothing
-- else is new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick'));
