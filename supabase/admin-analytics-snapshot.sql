-- Admin › Analytics worked out in the background (28 Oct 2026). Run once in
-- the Supabase SQL editor, after admin-analytics.sql. Safe to run again.
--
-- The page used to work the batch's figures out when an admin opened it,
-- in one database call (admin_analytics). Past a few lakh attempts that
-- call outran the forty seconds a page may take, and the page stopped
-- opening. The figures are now worked out here, every ten minutes, into
-- one row the page reads in an instant; the page says when they were cut.
-- The portal keeps the row's parameters in step with its own (the pass
-- mark, the target, which test each kind of paper belongs to), and works
-- the figures out live only while this row does not exist yet.

create table if not exists public.admin_analytics_snapshot (
  key         text primary key,
  -- What admin_analytics was called with: passT, targetT, batteries,
  -- batteryIds, days, quietDays, quietLimit. The portal rewrites these
  -- when its own differ; the refresh below uses whatever is here.
  params      jsonb not null,
  data        jsonb,
  computed_at timestamptz,
  took_ms     integer
);

alter table public.admin_analytics_snapshot enable row level security;
revoke all on public.admin_analytics_snapshot from public, anon, authenticated;
grant select, insert, update on public.admin_analytics_snapshot to service_role;

-- The refresh: admin_analytics with the stored parameters, kept with the time it took.
create or replace function public.admin_analytics_refresh()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p      jsonb;
  t0     timestamptz := clock_timestamp();
  result jsonb;
begin
  select params into p from public.admin_analytics_snapshot where key = 'default';
  if p is null then
    return;
  end if;
  result := public.admin_analytics(
    (p ->> 'passT')::double precision,
    (p ->> 'targetT')::double precision,
    p -> 'batteries',
    (select array_agg(x::integer) from jsonb_array_elements_text(p -> 'batteryIds') x),
    coalesce((p ->> 'days')::integer, 14),
    coalesce((p ->> 'quietDays')::integer, 7),
    coalesce((p ->> 'quietLimit')::integer, 30)
  );
  update public.admin_analytics_snapshot
     set data = result,
         computed_at = now(),
         took_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::integer
   where key = 'default';
end;
$$;

revoke all on function public.admin_analytics_refresh() from public, anon, authenticated;
grant execute on function public.admin_analytics_refresh() to service_role;

-- The first parameters, as the portal has them today: the pass mark 42,
-- the institute's target from the exam settings (60 until set), and
-- which test each kind of paper belongs to (lib/wt/categories.ts). The
-- portal rewrites them the first time its own differ.
insert into public.admin_analytics_snapshot (key, params)
values ('default', jsonb_build_object(
  'passT', 42,
  'targetT', coalesce((select (value ->> 'targetT')::double precision from public.portal_settings where key = 'exam'), 60),
  'batteries', '{"house":1,"fignum":1,"railway":1,"figfig":1,"memory":1,"vehicle":1,"signal":1,"watch":2,"letter":2,"number":2,"letter2":2,"brick":3,"depth":3,"yesno":4,"find6":4,"find9":4,"observation":4,"similarity":5,"octagonal":5,"similarity2":5,"circle":5,"figure":5,"figure2":5}'::jsonb,
  'batteryIds', '[1,2,3,4,5]'::jsonb,
  'days', 14,
  'quietDays', 7,
  'quietLimit', 30
))
on conflict (key) do nothing;

-- The first figures now (this may take a while on a big table; the editor waits).
select public.admin_analytics_refresh();

-- Then every ten minutes. Scheduling by the same name again replaces the job.
select cron.schedule(
  'admin-analytics',
  '*/10 * * * *',
  $$select public.admin_analytics_refresh()$$
);

-- When the figures were last cut, and how long they took
select key, computed_at, took_ms, data is not null as has_figures
  from public.admin_analytics_snapshot;
