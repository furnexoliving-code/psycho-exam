-- ---------------------------------------------------------------------------
-- Yes or No Test (Power of Observation, 4a) — run once in the Supabase SQL
-- editor before making the first Yes or No paper.
--
-- The paper's category is 'yesno'. Nothing else is new in the database:
-- the pairs of numbers are ordinary questions (prompt "48426 = 38436",
-- options Y and N), built by the portal when the paper is made.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno'));
