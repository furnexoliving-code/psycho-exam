-- Faster cohort figures for a portal with thousands of attempts.
--
-- Run once in Supabase → SQL editor on a database set up before this file
-- existed; a fresh database gets the same from watch-table-schema.sql.
-- Safe to run again. Nothing is deleted or changed in the data: the two
-- cohort functions are replaced by the same functions keyed on a uuid
-- rather than text, and an index is added that walks the attempts in the
-- order they need, so a paper's figures come from an index scan instead of
-- a sort over the whole table.

-- The latest attempt per candidate, in the order the cohort functions
-- walk it: one index scan instead of a sort over the whole table.
create index if not exists watch_attempts_latest_idx
  on public.watch_attempts (paper_id, (coalesce(user_id, id)), submitted_at desc);

create or replace function public.watch_cohort(
  p_paper uuid,
  p_total integer,
  p_user uuid,
  p_marks integer
)
returns table (
  others_n      integer,
  others_sum    bigint,
  others_sumsq  bigint,
  others_better integer,
  others_worse  integer,
  own_latest    integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with latest as (
    select distinct on (coalesce(a.user_id, a.id)) a.user_id, a.marks
    from public.watch_attempts a
    where a.paper_id = p_paper and a.total = p_total
    order by coalesce(a.user_id, a.id), a.submitted_at desc
  )
  select
    count(*) filter (where user_id is distinct from p_user)::integer,
    coalesce(sum(marks) filter (where user_id is distinct from p_user), 0)::bigint,
    coalesce(sum(marks * marks) filter (where user_id is distinct from p_user), 0)::bigint,
    count(*) filter (where user_id is distinct from p_user and marks > p_marks)::integer,
    count(*) filter (where user_id is distinct from p_user and marks < p_marks)::integer,
    (select l.marks from latest l where p_user is not null and l.user_id = p_user limit 1)
  from latest;
$$;

grant execute on function public.watch_cohort(uuid, integer, uuid, integer)
  to authenticated, service_role;

create or replace function public.watch_cohorts(p_papers uuid[])
returns table (paper_id uuid, total integer, n integer, mean double precision, sd double precision)
language sql
stable
security definer set search_path = public
as $$
  with latest as (
    select distinct on (a.paper_id, coalesce(a.user_id, a.id))
      a.paper_id, a.total, a.marks
    from public.watch_attempts a
    where a.paper_id = any (p_papers)
    order by a.paper_id, coalesce(a.user_id, a.id), a.submitted_at desc
  )
  select
    l.paper_id,
    l.total,
    count(*)::integer,
    avg(l.marks)::double precision,
    coalesce(stddev_pop(l.marks), 0)::double precision
  from latest l
  group by l.paper_id, l.total;
$$;
grant execute on function public.watch_cohorts(uuid[]) to service_role;
