-- Admin › Analytics in one database call (17 Oct 2026). Run once in the
-- Supabase SQL editor. Safe to run again.
--
-- The page used to read every attempt, every student and every Full Mock
-- result through the API, a thousand rows at a time, and work the figures
-- out in the function. Past a few lakh attempts that took longer than the
-- forty seconds a page may run, and the page stopped opening. This
-- function works the same figures out inside the database, where the rows
-- are, and hands back one JSON document. Until it is run the portal falls
-- back to reading the rows as before, so the order of deploy and SQL does
-- not matter.
--
-- The figures match lib/wt/analytics-core.ts aggregateRows() line for
-- line; the rounding and the ordering for display stay in the portal
-- (assemble()), so both paths show the same page.

-- The fortnight's bars, and the panel's "today" and "this week" counts,
-- walk the attempts by date. On a busy live database, build it first on
-- its own, as a single statement, with "create index concurrently": a
-- plain create index holds attempts' inserts for the seconds it takes.
create index if not exists watch_attempts_submitted_idx
  on public.watch_attempts (submitted_at);

create or replace function public.admin_analytics(
  p_pass_t      double precision,
  p_target_t    double precision,
  -- {"house": 1, "fignum": 1, ...}: which test each kind of paper belongs
  -- to, as lib/wt/categories.ts lists them. A kind not listed counts as
  -- Test 2, as batteryOf() reads it.
  p_batteries   jsonb,
  -- The tests a student must clear to count as exam-ready: {1,2,3,4,5}.
  p_battery_ids integer[],
  p_days        integer default 14,
  p_quiet_days  integer default 7,
  p_quiet_limit integer default 30
)
returns jsonb
language sql
stable
security invoker
set search_path = public
set work_mem = '32MB'
as $$
with
papers as (
  select p.id, p.slug, p.display_name, p.is_published,
         coalesce((p_batteries ->> p.category)::integer, 2) as battery,
         coalesce(p.stats_min_attempts, 5) as min_n,
         p.reference_mean::double precision as ref_mean,
         p.reference_sd::double precision as ref_sd
  from public.watch_papers p
),
bounds as (
  select first_day,
         (first_day::timestamp at time zone 'Asia/Kolkata') as first_ts,
         now() - make_interval(days => p_quiet_days) as quiet_before
  from (select ((now() at time zone 'Asia/Kolkata')::date - (p_days - 1)) as first_day) d
),
-- One pass over the attempts: each person's attempts of each paper and
-- length, summed up. A candidate who sat without signing in (rows from
-- before accounts were required) is a person of their own.
grp as (
  select coalesce(a.user_id, a.id) as who, a.user_id, a.paper_id, a.total,
         max(a.marks) as marks,
         count(*)::integer as n,
         max(a.submitted_at) as last_at,
         sum(case when a.total > 0 then a.marks::double precision / a.total * 100 end) as sum_pct,
         sum(case when a.total > 0 then (a.marks::double precision / a.total * 100) ^ 2 end) as sumsq_pct,
         count(*) filter (where a.total > 0)::integer as n_pct
  from public.watch_attempts a
  group by coalesce(a.user_id, a.id), a.user_id, a.paper_id, a.total
),
-- A paper's cohort over one length is everyone's LATEST attempt, as
-- watch_cohorts() counts it for the students' own pages.
latest_at as (
  select who, paper_id, max(last_at) as at
  from grp
  group by who, paper_id
),
latest as (
  select distinct on (a.paper_id, l.who) a.paper_id, l.who, a.total, a.marks
  from public.watch_attempts a
  join latest_at l on l.paper_id = a.paper_id and l.at = a.submitted_at and l.who = coalesce(a.user_id, a.id)
  order by a.paper_id, l.who, a.id desc
),
-- The figures a T-score is measured against: the live cohort once enough
-- have sat the paper, the institute's reference figures until then, and
-- nothing at all when there are neither (cohortFromMoments()).
cohort as (
  select c.paper_id, c.total,
         case when c.n >= p.min_n then c.mean
              when p.ref_mean is not null and p.ref_sd is not null then p.ref_mean end as mean,
         case when c.n >= p.min_n then c.sd
              when p.ref_mean is not null and p.ref_sd is not null then p.ref_sd end as sd
  from (
    select l.paper_id, l.total, count(*)::integer as n,
           avg(l.marks::double precision) as mean,
           coalesce(stddev_pop(l.marks::double precision), 0) as sd
    from latest l
    group by l.paper_id, l.total
  ) c
  join papers p on p.id = c.paper_id
),
-- Each student's best marks per paper and length earn a T-score
-- (T = 50 + 10 (marks - mean) / sd; 50 when everyone scored the same;
-- none without a cohort); the best of them per paper, and per test.
best_t as (
  select x.user_id, x.paper_id, x.battery, max(x.t) as t
  from (
    select g.user_id, g.paper_id, p.battery,
           case when c.sd is null then null
                when c.sd = 0 then 50::double precision
                else 50 + 10 * (g.marks - c.mean) / c.sd end as t
    from grp g
    join papers p on p.id = g.paper_id
    left join cohort c on c.paper_id = g.paper_id and c.total = g.total
    where g.user_id is not null
  ) x
  where x.t is not null
  group by x.user_id, x.paper_id, x.battery
),
best_battery as (
  select user_id, battery, max(t) as t
  from best_t
  group by user_id, battery
),
per_user as (
  select user_id, max(last_at) as last_at, sum(n)::integer as attempts
  from grp
  where user_id is not null
  group by user_id
),
students as (
  select pr.id, pr.full_name, pr.phone, pr.is_active, pr.created_at
  from public.profiles pr
  where pr.role = 'student'
),
-- The fortnight, by Indian day, from the index on submitted_at.
recent as (
  select (a.submitted_at at time zone 'Asia/Kolkata')::date as day, a.user_id
  from public.watch_attempts a
  where a.submitted_at >= (select first_ts from bounds)
),
days as (
  select day, count(*)::integer as attempts, count(distinct user_id)::integer as students
  from recent
  where day >= (select first_day from bounds)
  group by day
),
paper_rows as (
  select p.id, p.slug, p.display_name as name, p.battery, p.is_published as published,
         s.students, s.attempts, s.mean_pct,
         case when s.n_pct > 0 then sqrt(greatest(0, s.sumsq_pct / s.n_pct - (s.mean_pct ^ 2))) end as sd_pct,
         coalesce(t.measured, 0) as measured, coalesce(t.passed, 0) as passed
  from (
    select g.paper_id,
           count(distinct g.who)::integer as students,
           sum(g.n)::integer as attempts,
           case when sum(g.n_pct) > 0 then sum(g.sum_pct) / sum(g.n_pct) end as mean_pct,
           sum(g.sumsq_pct) as sumsq_pct,
           sum(g.n_pct) as n_pct
    from grp g
    group by g.paper_id
  ) s
  join papers p on p.id = s.paper_id
  left join (
    select paper_id, count(*)::integer as measured,
           (count(*) filter (where t >= p_pass_t))::integer as passed
    from best_t
    group by paper_id
  ) t on t.paper_id = s.paper_id
),
sat_battery as (
  select p.battery, count(distinct g.user_id)::integer as sat
  from grp g
  join papers p on p.id = g.paper_id
  where g.user_id is not null
  group by p.battery
),
battery_rows as (
  select b.id as battery,
         coalesce(s.sat, 0) as sat,
         coalesce(t.passed, 0) as passed,
         coalesce(t.target, 0) as target,
         t.mean_best_t
  from unnest(p_battery_ids) as b(id)
  left join sat_battery s on s.battery = b.id
  left join (
    select battery,
           (count(*) filter (where t >= p_pass_t))::integer as passed,
           (count(*) filter (where t >= p_target_t))::integer as target,
           avg(t) as mean_best_t
    from best_battery
    group by battery
  ) t on t.battery = b.id
),
quiet_all as (
  select s.id, s.full_name, s.phone, s.created_at, u.last_at, u.attempts
  from students s
  join per_user u on u.user_id = s.id
  where s.is_active and u.last_at < (select quiet_before from bounds)
),
quiet as (
  select q.*, (select max(bb.t) from best_battery bb where bb.user_id = q.id) as best_t
  from quiet_all q
  order by q.last_at desc, q.created_at, q.id
  limit p_quiet_limit
),
mock_scored as (
  select r.mock_id, r.user_id, r.qualified,
         -- outOf30(): the five T-scores as a mark out of 30, unrounded
         -- (the mean is rounded once, by the portal); none when any
         -- test went unmeasured.
         case when jsonb_typeof(r.tests) <> 'array' or jsonb_array_length(r.tests) = 0 then null
              when exists (select 1 from jsonb_array_elements(r.tests) e where e ->> 'tScore' is null) then null
              else ((select sum((e ->> 'tScore')::double precision) from jsonb_array_elements(r.tests) e) / 400) * 30
         end as out30
  from public.mock_results r
),
mock_rows as (
  select m.id, m.slug, m.name, m.sort_order, m.created_at,
         count(*)::integer as sat,
         count(distinct r.user_id)::integer as students,
         (count(*) filter (where r.qualified))::integer as qualified,
         avg(r.out30) as mean_out30
  from public.mock_tests m
  join mock_scored r on r.mock_id = m.id
  group by m.id, m.slug, m.name, m.sort_order, m.created_at
)
select jsonb_build_object(
  -- The day the figures were cut at: the chart's last bar.
  'today', to_char((now() at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD'),
  'totals', jsonb_build_object(
    'students',   (select count(*) from students),
    'active',     (select count(*) from students where is_active),
    'attempts',   (select coalesce(sum(n), 0) from grp),
    'attempts14', (select coalesce(sum(attempts), 0) from days),
    'students14', (select count(distinct user_id) from recent where day >= (select first_day from bounds)),
    'satAny',     (select count(*) from per_user),
    'ready',      (select count(*) from (
                     select user_id from best_battery
                     where battery = any (p_battery_ids) and t >= p_pass_t
                     group by user_id
                     having count(*) = cardinality(p_battery_ids)) r),
    'neverSat',   (select count(*) from students s
                   where s.is_active and not exists (select 1 from per_user u where u.user_id = s.id)),
    'quiet7',     (select count(*) from quiet_all)
  ),
  'days', (select coalesce(jsonb_agg(jsonb_build_object(
             'day', to_char(day, 'YYYY-MM-DD'), 'attempts', attempts, 'students', students) order by day), '[]'::jsonb)
           from days),
  'papers', (select coalesce(jsonb_agg(jsonb_build_object(
               'id', id, 'slug', slug, 'name', name, 'battery', battery, 'published', published,
               'students', students, 'attempts', attempts, 'meanPct', mean_pct, 'sdPct', sd_pct,
               'measured', measured, 'passed', passed)), '[]'::jsonb)
             from paper_rows),
  'batteries', (select coalesce(jsonb_agg(jsonb_build_object(
                  'battery', battery, 'sat', sat, 'passed', passed, 'target', target, 'meanBestT', mean_best_t) order by battery), '[]'::jsonb)
                from battery_rows),
  'quiet', (select coalesce(jsonb_agg(jsonb_build_object(
              'id', id, 'fullName', full_name, 'phone', phone, 'lastAt', last_at,
              'attempts', attempts, 'bestT', best_t) order by last_at desc, created_at, id), '[]'::jsonb)
            from quiet),
  'mocks', jsonb_build_object(
    'finished',  (select count(*) from mock_scored),
    'students',  (select count(distinct user_id) from mock_scored),
    'qualified', (select count(*) from mock_scored where qualified),
    'byMock',    (select coalesce(jsonb_agg(jsonb_build_object(
                    'slug', slug, 'name', name, 'sat', sat, 'students', students,
                    'qualified', qualified, 'meanOut30', mean_out30) order by sort_order, created_at), '[]'::jsonb)
                  from mock_rows)
  )
);
$$;

-- Only the server (service role) may call it through the API.
revoke all on function public.admin_analytics(double precision, double precision, jsonb, integer[], integer, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_analytics(double precision, double precision, jsonb, integer[], integer, integer, integer) to service_role;
