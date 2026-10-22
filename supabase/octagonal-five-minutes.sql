-- ---------------------------------------------------------------------------
-- Octagonal Test (5b) back on its five-minute clock — run once in the
-- Supabase SQL editor after the matching code is deployed.
--
-- The clock went to six minutes on 21 October and back to five the next
-- day. New papers take five from the hall's index by themselves; this puts
-- every Octagonal paper the earlier run moved to six back to five, with its
-- instruction line. A paper on any other clock is left as it is.
-- ---------------------------------------------------------------------------
update public.watch_papers
   set time_limit_min = 5,
       instructions = replace(replace(instructions::text,
         'The time limit for the test is 6 minutes.', 'The time limit for the test is 5 minutes.'),
         'समय सीमा 6 मिनट है', 'समय सीमा 5 मिनट है')::jsonb,
       updated_at = now()
 where category = 'octagonal'
   and time_limit_min = 6;

-- What the Octagonal papers hold now.
select display_name, slug, time_limit_min, is_published
  from public.watch_papers
 where category = 'octagonal'
 order by sort_order, display_name;
