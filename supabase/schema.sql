-- ============================================================================
-- KAUTILYA CLASSES — exam portal schema
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It is safe to re-run: every object is created with IF NOT EXISTS or replaced.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, carrying the role and candidate details.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null default '',
  roll_no     text not null default '',
  phone       text not null default '',
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

-- A new signup gets a profile automatically, so the app never has to create one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, roll_no, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'roll_no', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used by policies below. SECURITY DEFINER so it can read profiles without
-- tripping the very policies it is being used to evaluate.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Test papers
-- ---------------------------------------------------------------------------
create table if not exists public.tests (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name_en       text not null,
  name_hi       text not null default '',
  display_name  text not null,
  is_published  boolean not null default false,
  is_free       boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.sections (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references public.tests on delete cascade,
  kind            text not null,
  name_en         text not null,
  name_hi         text not null default '',
  time_limit_min  integer not null default 10,
  scored          boolean not null default true,
  position        integer not null default 0,
  -- Free-form so a new test format needs no migration: arrays of {en, hi}.
  instructions    jsonb not null default '[]'::jsonb,
  example         jsonb,
  study_phase     jsonb
);

create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.sections on delete cascade,
  title_en    text not null default '',
  title_hi    text not null default '',
  -- The shared stimulus: a track map, figure row, symbol grid or image.
  stimulus    jsonb,
  position    integer not null default 0
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.blocks on delete cascade,
  section_id  uuid not null references public.sections on delete cascade,
  prompt_en   text not null,
  prompt_hi   text not null default '',
  image       text,
  choices     jsonb not null default '[]'::jsonb,
  -- NULL for the personality test, which has no answer key.
  correct     text,
  position    integer not null default 0
);

create index if not exists sections_test_idx    on public.sections (test_id, position);
create index if not exists blocks_section_idx   on public.blocks (section_id, position);
create index if not exists questions_block_idx  on public.questions (block_id, position);
create index if not exists questions_section_idx on public.questions (section_id, position);

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  test_id       uuid not null references public.tests on delete cascade,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  -- The live run (answers, timers, section progress) so a refresh resumes.
  state         jsonb not null default '{}'::jsonb,
  -- Written server-side on submit; never trusted from the browser.
  score         jsonb
);

create index if not exists attempts_user_idx on public.attempts (user_id, started_at desc);
create index if not exists attempts_test_idx on public.attempts (test_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.tests     enable row level security;
alter table public.sections  enable row level security;
alter table public.blocks    enable row level security;
alter table public.questions enable row level security;
alter table public.attempts  enable row level security;

-- Profiles: you see and edit your own; admins see everyone.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Deliberately no self-update policy. One that let a user update their own row
-- also let them set role = 'admin'. Profiles are changed by the admin panel
-- through the service-role client, never by the student.
drop policy if exists profiles_update_own on public.profiles;
revoke insert, update, delete on public.profiles from anon, authenticated;

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Paper content: signed-in users read published papers, admins do everything.
drop policy if exists tests_read on public.tests;
create policy tests_read on public.tests
  for select using (is_published or public.is_admin());

drop policy if exists tests_admin on public.tests;
create policy tests_admin on public.tests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists sections_read on public.sections;
create policy sections_read on public.sections
  for select using (
    public.is_admin()
    or exists (select 1 from public.tests t where t.id = test_id and t.is_published)
  );

drop policy if exists sections_admin on public.sections;
create policy sections_admin on public.sections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists blocks_read on public.blocks;
create policy blocks_read on public.blocks
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.sections s
      join public.tests t on t.id = s.test_id
      where s.id = section_id and t.is_published
    )
  );

drop policy if exists blocks_admin on public.blocks;
create policy blocks_admin on public.blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- Only admins may touch the questions table directly, because it holds the
-- answer key. Students read the key-free view below instead.
drop policy if exists questions_admin on public.questions;
create policy questions_admin on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Attempts: yours alone; admins can read every attempt for the results screen.
drop policy if exists attempts_own on public.attempts;
create policy attempts_own on public.attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists attempts_admin_read on public.attempts;
create policy attempts_admin_read on public.attempts
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Key-free question view
--
-- `correct` never leaves the server for a student. They read this view; the
-- API route scores their attempt with the service role key.
-- ---------------------------------------------------------------------------
create or replace view public.questions_public
with (security_invoker = true) as
  select id, block_id, section_id, prompt_en, prompt_hi, image, choices, position
  from public.questions;

-- The view is security_invoker, so it needs its own readable policy on the
-- base table for non-admins. This one exposes rows but never the key column,
-- because the view does not select it.
drop policy if exists questions_read_via_view on public.questions;
create policy questions_read_via_view on public.questions
  for select using (
    exists (
      select 1 from public.sections s
      join public.tests t on t.id = s.test_id
      where s.id = section_id and t.is_published
    )
  );

revoke select on public.questions from anon, authenticated;
grant  select on public.questions_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself an admin
--
-- Sign up through the site first, then run this with your email:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ---------------------------------------------------------------------------
