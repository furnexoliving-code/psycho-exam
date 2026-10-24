-- ---------------------------------------------------------------------------
-- The kinds the railway's second mock link for CEN 01/2025 (24 October 2026)
-- gives — run once in the Supabase SQL editor before making the first paper
-- of any of them.
--
-- Their categories are 'signal' (Rail Signal Position Test, 1g: two
-- sections, each a railway map with its signals, on the Memory Test's
-- schedule like the Vehicle & Signal Position Test), 'letter2' (Letter
-- Table Test Type-II, 2d: the Following Directions engine in two parts,
-- a table of letters to each) and 'figure2' (Same Figure Test Type-II,
-- 5f: the picture-matching engine, 96 questions in 9 minutes). Nothing
-- else is new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick', 'similarity', 'similarity2', 'house', 'fignum', 'railway', 'figfig', 'vehicle', 'signal', 'letter2', 'figure2'));
