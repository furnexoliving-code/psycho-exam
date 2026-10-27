-- ---------------------------------------------------------------------------
-- Letter Table Test Type-II (2d): ten minutes instead of eight — run once in
-- the Supabase SQL editor after the matching code is deployed.
--
-- New papers get the ten-minute clock by themselves. This file brings the
-- papers already made into line: their clock, and the sentence of their
-- instruction screen that names it, where it still carries the built-in
-- words. It touches nothing else.
-- ---------------------------------------------------------------------------

-- 2d · the clock on every paper still on the old one
update public.watch_papers
   set time_limit_min = 10,
       updated_at = now()
 where category = 'letter2'
   and time_limit_min = 8;

-- 2d · the instruction screen's own sentence about the clock
update public.watch_papers
   set instructions = replace(
         replace(instructions::text,
                 'The time limit for the test is 8 minutes.',
                 'The time limit for the test is 10 minutes.'),
         'इस परीक्षण हेतु समय सीमा 8 मिनट है।',
         'इस परीक्षण हेतु समय सीमा 10 मिनट है।')::jsonb,
       updated_at = now()
 where category = 'letter2'
   and instructions::text like '%8 minutes%';

-- What the 2d papers now say
select slug, display_name, time_limit_min, is_published,
       instructions::text like '%10 minutes%' as says_ten_minutes
  from public.watch_papers
 where category = 'letter2'
 order by sort_order, slug;
