-- ---------------------------------------------------------------------------
-- A note on a student's account, for the team's eyes only — run once in the
-- Supabase SQL editor. Written and read from the student's page in the panel.
-- Kept in its own table rather than on profiles: a student may read their
-- own profile row, and this table has no policy at all, so only the panel
-- (service role) can see it.
-- ---------------------------------------------------------------------------
create table if not exists public.student_notes (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  note        text not null default '',
  updated_at  timestamptz not null default now()
);
alter table public.student_notes enable row level security;
revoke all on public.student_notes from anon, authenticated;
