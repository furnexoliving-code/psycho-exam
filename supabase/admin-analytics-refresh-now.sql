-- Cuts the Admin › Analytics figures now, as the ten-minute job does — run
-- on its own in the Supabase SQL editor after admin-analytics-snapshot.sql,
-- whenever the figures should not wait for the next run. On a big table it
-- can take a while; the editor waits. Safe to run any number of times.
select public.admin_analytics_refresh();

-- When the figures were cut, and how long they took
select key, computed_at, took_ms, data is not null as has_figures
  from public.admin_analytics_snapshot;
