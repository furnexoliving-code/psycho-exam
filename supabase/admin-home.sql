-- Admin › Home in one call (17 Oct 2026). Run once in the Supabase SQL
-- editor. Safe to run again.
--
-- The panel's front page used to read rows through the API a thousand at
-- a time for three of its figures: every attempt of the day (to count the
-- students who sat), every Full Mock result (to count who sat each mock),
-- and the month's paid orders. On a thirty-thousand-attempt day that was
-- thirty requests before the page could draw; by the exam it would have
-- been eighty. The Students page paged every enrollment and every active
-- student on each visit, to list those without a package. These two
-- functions count inside the database. The portal pages rows as before
-- on a database without them, so the order of deploy and SQL does not
-- matter.

-- The three counts of the front page. p_day_start and p_month_start are
-- the moments the Indian day and month began, as the page works them out.
create or replace function public.admin_home_counts(p_day_start timestamptz, p_month_start timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    -- Distinct signed-in students who submitted a paper since the day began.
    'studentsToday', (select count(distinct a.user_id)
                      from public.watch_attempts a
                      where a.submitted_at >= p_day_start),
    -- Distinct students who finished each Full Mock: {"<mock id>": n, ...}.
    'mockStudents', (select coalesce(jsonb_object_agg(m.mock_id, m.n), '{}'::jsonb)
                     from (select r.mock_id, count(distinct r.user_id) as n
                           from public.mock_results r
                           group by r.mock_id) m),
    -- The month's paid orders: rupees and count.
    'paidMonth', (select jsonb_build_object('inr', coalesce(sum(o.amount_inr), 0), 'orders', count(*))
                  from public.orders o
                  where o.status = 'paid' and o.paid_at >= p_month_start)
  );
$$;

-- Switched-on students who hold no package at all, oldest account first:
-- the Admissions box on the Students page, and the count on Home. One
-- JSON array rather than rows: the API cuts a row set at a thousand
-- without saying so, and never a single value.
drop function if exists public.admin_students_without_package();
create or replace function public.admin_students_without_package()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', pr.id, 'full_name', pr.full_name, 'valid_until', pr.valid_until,
           'self', (pr.signup_source = 'self')) order by pr.created_at, pr.id), '[]'::jsonb)
  from public.profiles pr
  where pr.role = 'student'
    and pr.is_active
    and not exists (select 1 from public.enrollments e where e.user_id = pr.id);
$$;

-- Only the server (service role) may call them through the API.
revoke all on function public.admin_home_counts(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_home_counts(timestamptz, timestamptz) to service_role;
revoke all on function public.admin_students_without_package() from public, anon, authenticated;
grant execute on function public.admin_students_without_package() to service_role;
