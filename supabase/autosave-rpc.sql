-- The autosave in one round trip (14 Oct 2026). Run once in the Supabase SQL editor.
--
-- The exam page sends the sheet every fifteen seconds while the clock runs. Each
-- save used to cost four statements: who is asking (profiles), the paper,
-- the open sitting, then the update. With the busiest hour at 2.5 lakh saves
-- that was most of the database's work. This function does all of it in one
-- call, under the same rules as the server code: the account must be on and
-- (for a student) stamped with this device, as lib/auth.ts readProfile
-- demands; and nothing is saved once the paper's time is more than 180
-- seconds over, as lib/wt/session.ts saveSnapshot demands. The portal falls
-- back to the old path on a database where this function is not there yet,
-- so the order of deploy and SQL does not matter.
--
-- Security invoker, on purpose: the portal calls it with the service role,
-- which may read and write these tables anyway; any other caller runs it
-- under their own row-level rights, which allow no write to a sitting. So
-- the function hands out nothing even if the grant lines below are skipped.
create or replace function public.watch_save_snapshot(p_slug text, p_user uuid, p_device text, p_responses jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  s record;
  overrun_sec numeric;
begin
  if p_slug is null or p_user is null or p_responses is null then
    return false;
  end if;

  select ws.id, ws.started_at, ws.questions_started_at,
         coalesce(wp.instruction_time_min, 0) * 60 as instruction_sec,
         coalesce(wp.time_limit_min, 0) * 60 as limit_sec
    into s
  from public.watch_sessions ws
  join public.watch_papers wp on wp.id = ws.paper_id
  join public.profiles pr on pr.id = p_user
  where wp.slug = p_slug
    and ws.user_id = p_user
    and ws.submitted_at is null
    -- the account is on (a null flag counts as on, as readProfile reads it)
    and coalesce(pr.is_active, true)
    -- one device at a time for a student: an account never stamped is left alone
    and (pr.role is distinct from 'student'
         or coalesce(pr.session_id, '') = ''
         or pr.session_id = p_device)
  limit 1;
  if not found then
    return false;
  end if;

  -- The same clock as lib/wt/session.ts overrun(): from when the questions
  -- opened, or from the start of the sitting with the instruction time added.
  if s.questions_started_at is not null then
    overrun_sec := extract(epoch from (now() - s.questions_started_at)) - s.limit_sec;
  else
    overrun_sec := extract(epoch from (now() - s.started_at)) - (s.instruction_sec + s.limit_sec);
  end if;
  if overrun_sec > 180 then
    return false;
  end if;

  update public.watch_sessions
     set responses = p_responses
   where id = s.id
     and submitted_at is null;
  return found;
end;
$$;

-- Only the server (service role) may call it through the API.
revoke all on function public.watch_save_snapshot(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.watch_save_snapshot(text, uuid, text, jsonb) to service_role;
