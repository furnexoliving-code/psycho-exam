-- Admin › Analytics worked out in the background (28 Oct 2026). Run once in
-- the Supabase SQL editor, after admin-analytics.sql. Safe to run again.
--
-- The page used to work the batch's figures out when an admin opened it,
-- in one database call (admin_analytics). Past a few lakh attempts that
-- call outran the forty seconds a page may take, and the page stopped
-- opening. The figures are now cut here, in the background, into one row
-- the page reads in an instant: a job looks every minute and cuts them
-- when the last cut is ten minutes old, when none has been made yet, or
-- when a cut has been asked for (the page's Refresh now, or
-- admin-analytics-refresh-now.sql). The page says when they were cut.
--
-- The row carries what admin_analytics is called with — the pass mark,
-- the institute's target, which test each kind of paper belongs to. The
-- target is read afresh from the exam settings at every cut; the rest
-- the portal rewrites the moment its own differ, and asks for a cut.

create table if not exists public.admin_analytics_snapshot (
  key          text primary key,
  -- passT, targetT, batteries, batteryIds, days, quietDays, quietLimit.
  params       jsonb not null,
  data         jsonb,
  computed_at  timestamptz,
  took_ms      integer,
  -- Set to ask for a cut before the next ten minutes are up.
  requested_at timestamptz
);
alter table public.admin_analytics_snapshot add column if not exists requested_at timestamptz;

alter table public.admin_analytics_snapshot enable row level security;
revoke all on public.admin_analytics_snapshot from public, anon, authenticated;
grant select, insert, update on public.admin_analytics_snapshot to service_role;

-- The cut: admin_analytics with the row's parameters, the target read
-- afresh from the exam settings, kept with the time it took. One at a
-- time: a cut still running when the next minute comes is left to
-- finish. The lock lasts the transaction, so a cut cut short — cancelled,
-- timed out — lets go of it by itself.
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
  if not pg_try_advisory_xact_lock(hashtext('admin_analytics_refresh')) then
    return;
  end if;
  select params into p from public.admin_analytics_snapshot where key = 'default';
  if p is null then
    return;
  end if;
  -- The institute's target as it stands now (lib/settings.ts: portal_settings 'exam').
  p := p || jsonb_build_object('targetT', coalesce(
         (select (value ->> 'targetT')::double precision from public.portal_settings where key = 'exam'),
         (p ->> 'targetT')::double precision, 60));
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
     set params = p,
         data = result,
         computed_at = now(),
         took_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::integer,
         requested_at = null
   where key = 'default';
end;
$$;

-- Every minute: a cut when one is due or asked for, nothing otherwise.
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
         or computed_at < now() - interval '10 minutes'
         or requested_at > coalesce(computed_at, '-infinity'::timestamptz)
    into due
    from public.admin_analytics_snapshot
   where key = 'default';
  if coalesce(due, false) then
    perform public.admin_analytics_refresh();
  end if;
end;
$$;

revoke all on function public.admin_analytics_refresh() from public, anon, authenticated;
revoke all on function public.admin_analytics_tick() from public, anon, authenticated;
grant execute on function public.admin_analytics_refresh() to service_role;
grant execute on function public.admin_analytics_tick() to service_role;

-- The first parameters, as the portal has them today: the pass mark 42,
-- the institute's target from the exam settings (60 until set), and
-- which test each kind of paper belongs to (lib/wt/categories.ts). The
-- portal rewrites them the first time its own differ.
insert into public.admin_analytics_snapshot (key, params, requested_at)
values ('default', jsonb_build_object(
  'passT', 42,
  'targetT', coalesce((select (value ->> 'targetT')::double precision from public.portal_settings where key = 'exam'), 60),
  'batteries', '{"house":1,"fignum":1,"railway":1,"figfig":1,"memory":1,"vehicle":1,"signal":1,"watch":2,"letter":2,"number":2,"letter2":2,"brick":3,"depth":3,"yesno":4,"find6":4,"find9":4,"observation":4,"similarity":5,"octagonal":5,"similarity2":5,"circle":5,"figure":5,"figure2":5}'::jsonb,
  'batteryIds', '[1,2,3,4,5]'::jsonb,
  'days', 14,
  'quietDays', 7,
  'quietLimit', 30
), now())
on conflict (key) do nothing;

-- The job, every minute. Scheduling by the same name again replaces it.
-- The first cut comes with the first run, within a minute or two; it is
-- not made here, since the editor runs a file as one transaction, and a
-- first cut that outran the editor's own time would undo the lot.
select cron.schedule(
  'admin-analytics',
  '* * * * *',
  $$select public.admin_analytics_tick()$$
);

-- The row as it stands: no figures until the first run
select key, computed_at, took_ms, requested_at, data is not null as has_figures
  from public.admin_analytics_snapshot;
