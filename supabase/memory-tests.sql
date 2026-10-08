-- ---------------------------------------------------------------------------
-- House Position (1a), Figure to Number (1b), Railway Track Route (1c) and
-- Figure to Figure (1d) Tests — run once in the Supabase SQL editor before
-- making the first paper of any of them.
--
-- Their categories are 'house', 'fignum', 'railway' and 'figfig'. They
-- ride the picture engine on the Memory Test's schedule (a study screen,
-- then the part's questions, with a break between parts). Nothing else is
-- new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick', 'similarity', 'similarity2', 'house', 'fignum', 'railway', 'figfig'));
