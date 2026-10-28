-- Asks for the Admin › Analytics figures to be cut now rather than at the
-- next ten minutes — run in the Supabase SQL editor after
-- admin-analytics-snapshot.sql, as often as wanted. The job that looks
-- every minute makes the cut in the background, so nothing here waits on
-- it; the page shows the new figures once computed_at moves on.
update public.admin_analytics_snapshot
   set requested_at = now()
 where key = 'default';

-- When the figures were last cut, how long they took, and whether a cut is pending
select key, computed_at, took_ms, requested_at, data is not null as has_figures
  from public.admin_analytics_snapshot;
