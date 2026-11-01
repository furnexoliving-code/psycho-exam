-- Pictures on Cloudflare R2 (1 Nov 2026). Run once in the Supabase SQL
-- editor. Safe to run again (and run again after an update of this file:
-- the functions are replaced, the table and its rows stay).
--
-- The admin's uploads stay in the watch-diagrams bucket, the master copy.
-- Each is copied to R2 — every new upload as it lands, and the rest from
-- Admin → Pictures, a batch at a time — and the portal serves the copy
-- once NEXT_PUBLIC_IMAGE_HOST names the domain in front of it. This table
-- remembers which pictures are copied, so a run can stop and resume, and
-- a refused copy is shown rather than tried again for ever.

create table if not exists public.image_mirror (
  -- The object's name in the bucket: 2026-10-01/….png
  name         text primary key,
  -- When the copy was written; null while the last try failed.
  mirrored_at  timestamptz,
  bytes        integer,
  content_type text,
  -- Why the last try failed; null once copied.
  error        text
);

-- The service role alone reads and writes it: no policy, so no student,
-- editor or anonymous visitor can.
alter table public.image_mirror enable row level security;
revoke all on public.image_mirror from anon, authenticated;

-- The pictures not tried yet, in name order, from after the name given:
-- each batch starts where the last one stopped instead of walking over
-- everything already copied. A failed one is not listed again until its
-- failure is forgotten (Retry on the page, which starts from the top).
drop function if exists public.image_mirror_pending(int);
create or replace function public.image_mirror_pending(p_limit int default 300, p_after text default '')
returns table(name text, mimetype text)
language sql
security definer
set search_path = public, storage
as $$
  select o.name, o.metadata ->> 'mimetype'
    from storage.objects o
    left join public.image_mirror m on m.name = o.name
   where o.bucket_id = 'watch-diagrams'
     and o.name > coalesce(p_after, '')
     and o.name not like '%/.emptyFolderPlaceholder'
     and m.name is null
   order by o.name
   limit greatest(1, least(coalesce(p_limit, 300), 1000));
$$;

-- Where the copy stands: pictures in the bucket, copied, failed, and of
-- the failed those no retry can mend (the bucket lists the picture but no
-- longer holds it, or its name cannot be carried — students never saw
-- these), and not tried yet. The two reasons are the words
-- lib/images/mirror.ts writes.
-- One pass over the bucket's rows: on a small compute five passes over
-- seventy thousand rows ran past the statement timeout.
create or replace function public.image_mirror_progress()
returns table(total bigint, copied bigint, failed bigint, missing bigint, remaining bigint)
language sql
security definer
set search_path = public, storage
as $$
  select count(*),
         count(*) filter (where m.name is not null and m.error is null),
         count(*) filter (where m.error is not null),
         count(*) filter (where m.error like 'not in the Supabase bucket%' or m.error like 'a name the copy cannot carry%'),
         count(*) filter (where m.name is null)
    from storage.objects o
    left join public.image_mirror m on m.name = o.name
   where o.bucket_id = 'watch-diagrams'
     and o.name not like '%/.emptyFolderPlaceholder';
$$;

revoke execute on function public.image_mirror_pending(int, text) from public, anon, authenticated;
revoke execute on function public.image_mirror_progress() from public, anon, authenticated;
grant execute on function public.image_mirror_pending(int, text) to service_role;
grant execute on function public.image_mirror_progress() to service_role;

-- What the copy looks like now (all zeros but total before the first run)
select * from public.image_mirror_progress();
