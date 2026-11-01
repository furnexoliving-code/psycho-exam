-- Pictures on Cloudflare R2 (1 Nov 2026). Run once in the Supabase SQL
-- editor. Safe to run again.
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

-- The pictures not tried yet, oldest name first. A failed one is not
-- listed again until its failure is forgotten (Retry on the page).
create or replace function public.image_mirror_pending(p_limit int default 300)
returns table(name text, mimetype text)
language sql
security definer
set search_path = public, storage
as $$
  select o.name, o.metadata ->> 'mimetype'
    from storage.objects o
    left join public.image_mirror m on m.name = o.name
   where o.bucket_id = 'watch-diagrams'
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
create or replace function public.image_mirror_progress()
returns table(total bigint, copied bigint, failed bigint, missing bigint, remaining bigint)
language sql
security definer
set search_path = public, storage
as $$
  with objects as (
    select o.name
      from storage.objects o
     where o.bucket_id = 'watch-diagrams'
       and o.name not like '%/.emptyFolderPlaceholder'
  )
  select (select count(*) from objects),
         (select count(*) from objects o join public.image_mirror m on m.name = o.name where m.error is null),
         (select count(*) from objects o join public.image_mirror m on m.name = o.name where m.error is not null),
         (select count(*) from objects o join public.image_mirror m on m.name = o.name
           where m.error like 'not in the Supabase bucket%' or m.error like 'a name the copy cannot carry%'),
         (select count(*) from objects o left join public.image_mirror m on m.name = o.name where m.name is null);
$$;

revoke execute on function public.image_mirror_pending(int) from public, anon, authenticated;
revoke execute on function public.image_mirror_progress() from public, anon, authenticated;
grant execute on function public.image_mirror_pending(int) to service_role;
grant execute on function public.image_mirror_progress() to service_role;

-- What the copy looks like now (all zeros but total before the first run)
select * from public.image_mirror_progress();
