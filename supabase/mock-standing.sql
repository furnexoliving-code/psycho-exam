-- The Full Mock's standing and leaderboard worked out in the database
-- (31 Oct 2026). Run once in the Supabase SQL editor. Safe to run again.
--
-- The dashboard's leaderboard and the scorecard's rank used to read every
-- result row of the mock, a thousand at a time, on every view, and the
-- scorecard twice. With thousands of results a mock that was ten to twenty
-- requests and a megabyte a view. Each is now one call that reads the
-- (mock_id, composite) index once. Until this is run the portal reads the
-- rows as before, so the deploy and the SQL may land in either order.

-- Each candidate's best composite of a mock, best first; the top p_limit, or all.
create or replace function public.mock_best_composites(p_mock uuid, p_limit integer default null)
returns table (user_id uuid, composite double precision)
language sql
stable
security definer
set search_path = public
as $$
  select r.user_id, max(r.composite)::double precision as composite
    from public.mock_results r
   where r.mock_id = p_mock
     and r.user_id is not null
     and r.composite is not null
   group by r.user_id
   order by 2 desc, 1
   limit p_limit;
$$;

-- Where one candidate's best stands among everyone's best: rank 1 is the
-- best and equal composites share a rank; the percentile is the share of
-- candidates strictly below, as the sectional result counts it. No row
-- when the candidate has no scored result of the mock.
create or replace function public.mock_standing(p_mock uuid, p_user uuid)
returns table (rank integer, out_of integer, percentile double precision)
language sql
stable
security definer
set search_path = public
as $$
  with best as (
    select r.user_id, max(r.composite) as c
      from public.mock_results r
     where r.mock_id = p_mock
       and r.user_id is not null
       and r.composite is not null
     group by r.user_id
  ),
  mine as (select c from best where user_id = p_user)
  select (select count(*) from best, mine where best.c > mine.c)::integer + 1 as rank,
         (select count(*) from best)::integer as out_of,
         ((select count(*) from best, mine where best.c < mine.c)::double precision
            / nullif((select count(*) from best), 0) * 100) as percentile
   where exists (select 1 from mine);
$$;

-- Only the server (service role) may call them through the API.
revoke all on function public.mock_best_composites(uuid, integer) from public, anon, authenticated;
revoke all on function public.mock_standing(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mock_best_composites(uuid, integer) to service_role;
grant execute on function public.mock_standing(uuid, uuid) to service_role;
