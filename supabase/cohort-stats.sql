-- ---------------------------------------------------------------------------
-- Cohort figures kept ready — run once in the Supabase SQL editor.
--
-- The dashboard, the practice page and a student's page read every paper's
-- cohort (how many latest attempts, their mean and spread) to show
-- T-scores. Asking the database to work that out afresh on every visit
-- (public.watch_cohorts over the whole attempts table) was the single
-- heaviest query of the day. This keeps the figures in a small table,
-- refreshed every minute by pg_cron, so a visit reads a few hundred rows
-- in no time. The result page and the mock's scorecard keep asking live:
-- those are the figures of record.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;

create materialized view if not exists public.watch_cohort_stats as
  with latest as (
    select distinct on (a.paper_id, coalesce(a.user_id, a.id))
      a.paper_id, a.total, a.marks
    from public.watch_attempts a
    order by a.paper_id, coalesce(a.user_id, a.id), a.submitted_at desc
  )
  select
    l.paper_id,
    l.total,
    count(*)::integer as n,
    avg(l.marks)::double precision as mean,
    coalesce(stddev_pop(l.marks), 0)::double precision as sd
  from latest l
  group by l.paper_id, l.total;

-- A concurrent refresh needs a unique key; reads stay open while it runs.
create unique index if not exists watch_cohort_stats_key
  on public.watch_cohort_stats (paper_id, total);

revoke all on public.watch_cohort_stats from public, anon, authenticated;
grant select on public.watch_cohort_stats to service_role;

refresh materialized view public.watch_cohort_stats;

-- Every minute. Scheduling by the same name again replaces the job.
select cron.schedule(
  'watch-cohort-stats',
  '* * * * *',
  $$refresh materialized view concurrently public.watch_cohort_stats$$
);
