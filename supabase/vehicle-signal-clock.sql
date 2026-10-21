-- ---------------------------------------------------------------------------
-- Vehicle & Signal Position Test (1f) on the House Position Test's pattern,
-- and the Octagonal Test (5b) on a six-minute clock — run once in the
-- Supabase SQL editor after the matching code is deployed.
--
-- New papers get these settings by themselves. This file brings the papers
-- already made into line; it touches nothing else.
--
-- 1f: 2.5 minutes to study and 2.5 to answer each part, on every paper of
--     the kind, and the three-minute instruction screen before Part 2 on
--     a paper made before it existed. 12 questions a part (the railway's
--     mock gave 3) on a paper that has nothing yet; a paper that holds
--     questions keeps two parts of its own size, counted from its vehicle
--     and signal questions, so its two maps still come as two parts. Each
--     paper's clock is then recomputed as the admin panel does it: parts ×
--     (study + questions) + (parts − 1) × (break + the later part's
--     instruction screen). The instruction texts that quote the old clock
--     are reworded where they still carry the built-in words.
--     A paper short of 12 + 12 cannot be topped up, since new questions are
--     added after the last one: to move it to the new pattern, delete its
--     questions, set Questions per part to 12 in its Settings, and upload
--     12 vehicles and then 12 signals. The last query lists every paper
--     with what it needs.
-- 5b: every Octagonal paper still on the old five-minute clock goes to six,
--     and its instruction line with it.
-- ---------------------------------------------------------------------------

-- 1f · the schedule: the clocks on every paper; the count a part from the
--      paper's own vehicles and signals (12 on an empty paper); the Part 2
--      instruction screen where none was set
update public.watch_papers p
   set features = coalesce(p.features, '{}'::jsonb)
                  || jsonb_build_object('studyTimeMin', 2.5, 'partTimeMin', 2.5)
                  || case
                       when held.n = 0 then '{"questionsPerPart": 12}'::jsonb
                       when held.vehicles > 0
                        and (held.signals = 0 or held.signals = held.vehicles)
                        and held.vehicles + held.signals = held.n
                         then jsonb_build_object('questionsPerPart', held.vehicles)
                       else '{}'::jsonb
                     end
                  || case when coalesce(p.features, '{}'::jsonb) ? 'partInstructionMin' then '{}'::jsonb else '{"partInstructionMin": 3}'::jsonb end,
       updated_at = now()
  from (
    select p2.id,
           count(q.id)                                                    as n,
           count(q.id) filter (where lower(q.topic) like 'vehicle%')      as vehicles,
           count(q.id) filter (where lower(q.topic) like 'signal%')       as signals
      from public.watch_papers p2
      left join public.watch_questions q on q.paper_id = p2.id
     where p2.category = 'vehicle'
     group by p2.id
  ) held
 where held.id = p.id;

-- 1f · the clock, from the questions each paper holds and its count a part
update public.watch_papers p
   set time_limit_min = greatest(1, ceil(
         parts.n * 5
         + (parts.n - 1) * (coalesce((p.features->>'breakTimeMin')::numeric, 0)
                            + coalesce((p.features->>'partInstructionMin')::numeric, 0))
       ))::int,
       updated_at = now()
  from (
    select p2.id,
           greatest(1, ceil(count(q.id)::numeric
                            / greatest(1, coalesce((p2.features->>'questionsPerPart')::numeric, 12))))::int as n
      from public.watch_papers p2
      left join public.watch_questions q on q.paper_id = p2.id
     where p2.category = 'vehicle'
     group by p2.id
  ) parts
 where parts.id = p.id;

-- 1f · Part 1's instruction screen (stored on the paper) and Part 2's
--      (stored under features.partInstructions): the built-in wording,
--      where it is still there, reads the new clock. "2 minutes" was a
--      part's own clock, "4 minutes" the whole test's on the first build.
update public.watch_papers
   set instructions = replace(replace(replace(replace(replace(replace(instructions::text,
         'for 1 minute.', 'for 2.5 minutes.'),
         '1 मिनट तक याद करनी है', '2.5 मिनट तक याद करनी है'),
         'The time limit for the test is 2 minutes.', 'The time limit for the test is 5 minutes.'),
         'समय सीमा 2 मिनट है', 'समय सीमा 5 मिनट है'),
         'The time limit for the test is 4 minutes.', 'The time limit for the test is 10 minutes.'),
         'समय सीमा 4 मिनट है', 'समय सीमा 10 मिनट है')::jsonb,
       updated_at = now()
 where category = 'vehicle'
   and (instructions::text like '%for 1 minute.%'
     or instructions::text like '%1 मिनट तक याद करनी है%'
     or instructions::text like '%The time limit for the test is 2 minutes.%'
     or instructions::text like '%समय सीमा 2 मिनट है%'
     or instructions::text like '%The time limit for the test is 4 minutes.%'
     or instructions::text like '%समय सीमा 4 मिनट है%');

update public.watch_papers
   set features = replace(replace(replace(replace(features::text,
         'for 1 minute.', 'for 2.5 minutes.'),
         '1 मिनट तक याद करनी है', '2.5 मिनट तक याद करनी है'),
         'The time limit for the test is 2 minutes.', 'The time limit for the test is 5 minutes.'),
         'समय सीमा 2 मिनट है', 'समय सीमा 5 मिनट है')::jsonb,
       updated_at = now()
 where category = 'vehicle'
   and features ? 'partInstructions'
   and (features::text like '%for 1 minute.%'
     or features::text like '%1 मिनट तक याद करनी है%'
     or features::text like '%The time limit for the test is 2 minutes.%'
     or features::text like '%समय सीमा 2 मिनट है%');

-- 5b · six minutes
update public.watch_papers
   set time_limit_min = 6,
       instructions = replace(replace(instructions::text,
         'The time limit for the test is 5 minutes.', 'The time limit for the test is 6 minutes.'),
         'समय सीमा 5 मिनट है', 'समय सीमा 6 मिनट है')::jsonb,
       updated_at = now()
 where category = 'octagonal'
   and time_limit_min = 5;

-- What the 1f papers hold now. A paper short of 12 + 12 runs on as it is,
-- with the new clocks; the note says what it needs.
select p.display_name,
       p.slug,
       count(q.id)                                                    as questions,
       count(q.id) filter (where lower(q.topic) like 'vehicle%')      as vehicles,
       count(q.id) filter (where lower(q.topic) like 'signal%')       as signals,
       p.features->>'questionsPerPart'                                as per_part,
       p.features->>'studyTimeMin'                                    as study_min,
       p.features->>'partTimeMin'                                     as part_min,
       p.features->>'partInstructionMin'                              as part2_intro_min,
       p.time_limit_min                                               as sitting_min,
       p.is_published                                                 as published,
       case
         when count(q.id) = 0 then 'empty: upload 12 vehicles, then 12 signals'
         when count(q.id) filter (where lower(q.topic) like 'signal%') = 0
           then 'Part 2 missing: upload ' || (p.features->>'questionsPerPart') || ' signals'
         when count(q.id) filter (where lower(q.topic) like 'vehicle%') <> count(q.id) filter (where lower(q.topic) like 'signal%')
           then 'uneven parts: rebuild as 12 + 12'
         when count(q.id) < 24 then 'rebuild as 12 + 12 (runs as ' || (p.features->>'questionsPerPart') || ' + ' || (p.features->>'questionsPerPart') || ' for now)'
         else 'complete'
       end                                                            as note
  from public.watch_papers p
  left join public.watch_questions q on q.paper_id = p.id
 where p.category = 'vehicle'
 group by p.id
 order by p.sort_order, p.display_name;
