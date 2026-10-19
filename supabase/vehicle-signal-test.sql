-- ---------------------------------------------------------------------------
-- Vehicle & Signal Position Test (1f) — run once in the Supabase SQL editor
-- before making the first paper of it.
--
-- Its category is 'vehicle'. It rides the picture engine on the Memory
-- Test's schedule, as the House Position Test does (a study screen, then
-- the part's questions, with a break between parts): Part 1 a street map
-- with vehicles on it, Part 2 a railway map with rail signals, each lettered
-- A to D on the test screen. It is the kind the railway's own mock test for
-- CEN 01/2025 gives as Test 1. Nothing else is new in the database.
-- ---------------------------------------------------------------------------
alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number', 'figure', 'memory', 'depth', 'observation', 'yesno', 'find6', 'find9', 'octagonal', 'circle', 'brick', 'similarity', 'similarity2', 'house', 'fignum', 'railway', 'figfig', 'vehicle'));

-- The blog articles seeded on 11 and 12 October 2026 counted 19 kinds of
-- question; the pages they point at now count 20. Same change on the
-- live rows as in the seed files.
update public.blog_posts
  set content = replace(replace(content, '19 kinds', '20 kinds'), '19 in all', '20 in all'),
      excerpt = replace(excerpt, '19 kinds', '20 kinds'),
      meta_description = replace(meta_description, '19 kinds', '20 kinds'),
      faq = replace(faq::text, '19 kinds', '20 kinds')::jsonb
  where content like '%19 kinds%' or content like '%19 in all%' or excerpt like '%19 kinds%'
     or meta_description like '%19 kinds%' or faq::text like '%19 kinds%';
