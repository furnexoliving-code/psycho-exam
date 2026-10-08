-- ---------------------------------------------------------------------------
-- Yes or No Test (4a), Find 6 Test (4b), Find 9 Test (4c) — run once in the
-- Supabase SQL editor before making the first paper of any of them.
--
-- Their categories are 'yesno', 'find6' and 'find9'. Nothing else is new
-- in the database: their questions are ordinary rows of text (a pair of
-- numbers, or four lettered groups of digits), built by the portal when
-- the paper is made.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick', 'similarity', 'similarity2', 'house', 'fignum', 'railway', 'figfig'));
