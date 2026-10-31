-- After the exam (31 Oct 2026): the two background jobs eased, for a small
-- compute. Run once in the Supabase SQL editor. Safe to run again.
--
-- On the Micro compute the attempts table no longer fits in memory, so
-- every full read of it is disk IO, and Supabase warns that the disk IO
-- budget is nearly spent. The cohort figures were rebuilt every minute
-- (a full read of the attempts; 41% of all statement time at the exam's
-- size) for readers that hold them for a minute anyway; the admin's
-- analytics were cut every ten minutes whether or not anyone looked.
-- Both now run a fifth as often; what a student sees changes by a few
-- minutes' lag in the T-scores on the practice page.

-- 1. The cohort figures (T-scores, ranks): every five minutes instead of
--    every minute. Scheduling by the same name replaces the job.
select cron.schedule(
  'watch-cohort-stats',
  '*/5 * * * *',
  $$refresh materialized view concurrently public.watch_cohort_stats$$
);

-- 2. The admin's analytics: a cut when the last is twenty minutes old
--    (was ten), or when one is asked for (the page's Refresh now). The
--    job still looks every minute; it just finds less to do. Twenty keeps
--    within the page's own thirty-minute rule, so the page never makes
--    the long live call.
create or replace function public.admin_analytics_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  due boolean;
begin
  select data is null
         or computed_at < now() - interval '20 minutes'
         or requested_at > coalesce(computed_at, '-infinity'::timestamptz)
    into due
    from public.admin_analytics_snapshot
   where key = 'default';
  if coalesce(due, false) then
    perform public.admin_analytics_refresh();
  end if;
end;
$$;

-- 3. The analytics job itself: a database set up from the first version
--    of admin-analytics-snapshot.sql still runs the cut straight, every
--    ten minutes; the job now runs the tick every minute, which cuts only
--    when due. Scheduling by the same name replaces it.
select cron.schedule(
  'admin-analytics',
  '* * * * *',
  $$select public.admin_analytics_tick()$$
);

-- What the jobs are now
select jobname, schedule, active
  from cron.job
 where jobname in ('watch-cohort-stats', 'admin-analytics')
 order by jobname;
