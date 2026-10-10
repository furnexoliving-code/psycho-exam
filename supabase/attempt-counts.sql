-- ---------------------------------------------------------------------------
-- Attempts per paper, counted by the database — run once in the Supabase
-- SQL editor. The Results page used to fetch every attempt row to count
-- them, and the API answers at most a thousand rows, so past a thousand
-- attempts the later papers showed 0. Until this view exists the page
-- counts by paging, which is right but slower.
-- ---------------------------------------------------------------------------
drop view if exists public.watch_attempt_counts;
create view public.watch_attempt_counts
with (security_invoker = true) as
  select paper_id,
         count(*)::integer as attempts,
         count(distinct user_id)::integer as students
  from public.watch_attempts
  group by paper_id;
revoke select on public.watch_attempt_counts from anon, authenticated;
grant select on public.watch_attempt_counts to service_role;
