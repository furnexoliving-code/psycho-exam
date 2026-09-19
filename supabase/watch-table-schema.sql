-- ============================================================================
-- KAUTILYA CLASSES — Watch Table Test
--
-- Run once in the Supabase SQL editor, AFTER supabase/schema.sql (which creates
-- profiles and the is_admin() helper). Safe to re-run.
-- ============================================================================

create table if not exists public.watch_papers (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null default 'Watch Table Test',
  display_name          text not null default 'Watch Table Test - 1 (Easy Level)',

  -- The two clocks, in minutes.
  instruction_time_min  integer not null default 5 check (instruction_time_min between 1 and 120),
  time_limit_min        integer not null default 10 check (time_limit_min between 1 and 300),

  is_published          boolean not null default false,

  /*
   * Which controls the candidate gets. Every key is optional; the app falls
   * back to its own default when one is missing, so adding a new switch here
   * needs no migration.
   *
   *   showInstructionsButton, showQuestionPaperButton,
   *   allowPause, allowFullscreen, lockScroll, overflowQuestions
   */
  features              jsonb not null default '{}'::jsonb,

  /* The eight rim positions: [{direction, letter, value}]. */
  cells                 jsonb not null default '[]'::jsonb,
  /* The worked example on the instruction screen. */
  example_cells         jsonb not null default '[]'::jsonb,
  /* When set, the exam shows this image instead of drawing the diagram. */
  image_url             text,

  /* Instruction paragraphs: [{en, hi}]. */
  instructions          jsonb not null default '[]'::jsonb,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.watch_questions (
  id          uuid primary key default gen_random_uuid(),
  paper_id    uuid not null references public.watch_papers on delete cascade,
  position    integer not null default 0,
  prompt_en   text not null,
  prompt_hi   text not null default '',
  /* The five numbers offered, in the order they are shown. */
  options     jsonb not null default '[]'::jsonb,
  /* Never sent to a candidate — see watch_questions_public below. */
  answer      integer not null,
  /* How the answer is reached, shown on the review screen after submitting. */
  working_en  text not null default '',
  working_hi  text not null default ''
);

create index if not exists watch_questions_paper_idx
  on public.watch_questions (paper_id, position);

alter table public.watch_papers    enable row level security;
alter table public.watch_questions enable row level security;

drop policy if exists watch_papers_read on public.watch_papers;
create policy watch_papers_read on public.watch_papers
  for select using (is_published or public.is_admin());

drop policy if exists watch_papers_admin on public.watch_papers;
create policy watch_papers_admin on public.watch_papers
  for all using (public.is_admin()) with check (public.is_admin());

-- Only admins touch the questions table directly: it holds the answer key.
drop policy if exists watch_questions_admin on public.watch_questions;
create policy watch_questions_admin on public.watch_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- The topic label is selected by the view below, so it must exist first. On a
-- database that already has it this is a no-op; on a fresh one, creating the
-- view before the column made the whole file fail at this point.
alter table public.watch_questions
  /* Free-form label used for the topic breakdown, e.g. "Opposite". */
  add column if not exists topic text not null default '';

-- ---------------------------------------------------------------------------
-- Key-free view. Candidates read this; `answer` never leaves the server for
-- them, and scoring happens in the submit route with the service-role client.
-- ---------------------------------------------------------------------------
drop view if exists public.watch_questions_public;
create view public.watch_questions_public
with (security_invoker = true) as
  select id, paper_id, position, prompt_en, prompt_hi, options, topic
  from public.watch_questions;

drop policy if exists watch_questions_read_via_view on public.watch_questions;
create policy watch_questions_read_via_view on public.watch_questions
  for select using (
    exists (
      select 1 from public.watch_papers p
      where p.id = paper_id and p.is_published
    )
  );

-- The view is security_invoker, so reading it checks the READER's rights on
-- the table underneath. A blanket revoke would therefore break the view as
-- well — including for the candidates it exists to serve. Grant the safe
-- columns instead: `answer` and the worked solution are simply not among them,
-- so no query can reach them, whatever it selects. Row level security still
-- decides WHICH rows, and the grants decide which columns; neither alone is
-- load-bearing.
revoke select on public.watch_questions from anon, authenticated;
grant select (id, paper_id, position, prompt_en, prompt_hi, options, topic)
  on public.watch_questions to anon, authenticated;
grant select on public.watch_questions_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage for uploaded diagrams.
-- Create a PUBLIC bucket named "watch-diagrams" in the Supabase dashboard
-- (Storage -> New bucket -> Public), then run these policies.
-- ---------------------------------------------------------------------------
drop policy if exists watch_diagrams_read on storage.objects;
create policy watch_diagrams_read on storage.objects
  for select using (bucket_id = 'watch-diagrams');

drop policy if exists watch_diagrams_write on storage.objects;
create policy watch_diagrams_write on storage.objects
  for all using (bucket_id = 'watch-diagrams' and public.is_admin())
  with check (bucket_id = 'watch-diagrams' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Attempts, and the cohort statistics the T-score needs
-- ---------------------------------------------------------------------------
create table if not exists public.watch_attempts (
  id            uuid primary key default gen_random_uuid(),
  paper_id      uuid not null references public.watch_papers on delete cascade,
  /* Null for a candidate who took the paper without signing in. */
  user_id       uuid references auth.users on delete set null,
  marks         integer not null,
  total         integer not null,
  attempted     integer not null default 0,
  submitted_at  timestamptz not null default now()
);

create index if not exists watch_attempts_paper_idx
  on public.watch_attempts (paper_id, submitted_at desc);

alter table public.watch_attempts enable row level security;

-- Candidates may see their own; admins see the cohort. Rows are written by the
-- scoring route with the service-role client, which bypasses these.
drop policy if exists watch_attempts_own on public.watch_attempts;
create policy watch_attempts_own on public.watch_attempts
  for select using (user_id = auth.uid() or public.is_admin());

/*
 * Reference statistics for the T-score.
 *
 * T = 50 + 10 * (marks - mean) / sd
 *
 * Early on there is no cohort to average, so an admin can enter the mean and
 * standard deviation from their own past data. Once at least
 * `stats_min_attempts` papers have been submitted, the live cohort is used
 * instead.
 */
alter table public.watch_papers
  add column if not exists reference_mean   numeric,
  add column if not exists reference_sd     numeric,
  add column if not exists stats_min_attempts integer not null default 5;

-- ---------------------------------------------------------------------------
-- Result-screen extras: cut off, expert comment, topics, timing
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  /* Marks needed to qualify. Null hides the badge entirely. */
  add column if not exists cut_off_marks   integer,
  /* RRB's own bar is a T-score of 42; either or both may be set. */
  add column if not exists cut_off_tscore  numeric,
  add column if not exists expert_comment  text;

alter table public.watch_attempts
  add column if not exists duration_sec integer;

-- Was added for a T-score at insert time that was never written; every row
-- carried a null that looked like missing data in an export.
alter table public.watch_attempts drop column if exists t_score;

-- ---------------------------------------------------------------------------
-- Presentation controls (added later)
--
-- These let an admin change how the paper LOOKS without touching code: the
-- size of the question text, and how wide the uploaded diagram is drawn.
-- Safe to re-run.
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  add column if not exists font_scale numeric not null default 1.0,
  add column if not exists image_width_pct integer not null default 100,
  add column if not exists example_text jsonb not null default '[]'::jsonb;

-- Keep them inside sane bounds, so a stray value cannot make a paper unreadable.
alter table public.watch_papers drop constraint if exists watch_papers_font_scale_ck;
alter table public.watch_papers
  add constraint watch_papers_font_scale_ck check (font_scale between 0.7 and 2.0);

alter table public.watch_papers drop constraint if exists watch_papers_image_width_ck;
alter table public.watch_papers
  add constraint watch_papers_image_width_ck check (image_width_pct between 30 and 100);

-- ---------------------------------------------------------------------------
-- Per-question responses (added later)
--
-- An attempt stored only its total, so nothing could answer "which question
-- did the batch get wrong?" — the question most worth reteaching. This keeps
-- what was chosen for each question: { "<question id>": <option chosen> }.
-- Safe to re-run. Attempts recorded before this arrive as {} and are simply
-- not counted in the breakdown.
-- ---------------------------------------------------------------------------
alter table public.watch_attempts
  add column if not exists responses jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Attempt limits (added later)
--
-- How many times one candidate may sit a paper. NULL means no limit, which is
-- the behaviour every existing paper already had, so adding the column changes
-- nothing until an admin sets a number.
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  add column if not exists max_attempts integer;

alter table public.watch_papers drop constraint if exists watch_papers_max_attempts_ck;
alter table public.watch_papers
  add constraint watch_papers_max_attempts_ck
  check (max_attempts is null or max_attempts between 1 and 100);

-- Counting a candidate's own attempts is the commonest query on this table
-- once limits exist.
create index if not exists watch_attempts_user_paper_idx
  on public.watch_attempts (user_id, paper_id);

-- ---------------------------------------------------------------------------
-- Accounts are issued, not self-created
--
-- Students sign in with a mobile number the institute gives them, so the
-- number has to identify exactly one account. Without this a second account on
-- the same number would make logins ambiguous.
-- ---------------------------------------------------------------------------
create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone <> '';

alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- What the candidate's result shows (added later)
--
-- Which panels appear is the institute's decision, not the code's. Stored as
-- flags rather than columns so a new panel does not need a migration. An
-- absent key means "show", so every existing paper keeps what it had.
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  add column if not exists result_view jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Which Following Directions test a paper belongs to (added later)
--
-- The same engine serves three: a watch table, a letter table and a number
-- table. Existing papers are watch tables, which is the default, so nothing
-- moves when this arrives.
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  add column if not exists category text not null default 'watch';

alter table public.watch_papers drop constraint if exists watch_papers_category_ck;
alter table public.watch_papers
  add constraint watch_papers_category_ck
  check (category in ('watch', 'letter', 'number'));

-- ---------------------------------------------------------------------------
-- The order papers are listed in (added later)
--
-- Without this the order was whatever the papers happened to be created in,
-- which is rarely the order a student should meet them. Equal numbers fall
-- back to creation order, so leaving every paper at 0 changes nothing.
-- ---------------------------------------------------------------------------
alter table public.watch_papers
  add column if not exists sort_order integer not null default 0;

create index if not exists watch_papers_order_idx
  on public.watch_papers (category, sort_order, created_at);

-- ---------------------------------------------------------------------------
-- One sitting of a paper (added later)
--
-- Two things were taken on trust from the browser: how long the candidate
-- spent, and that they were sitting the paper once. Both now have a row here.
--
-- started_at is the server's clock, so the time spent is measured rather than
-- reported. The partial unique index allows exactly ONE unsubmitted sitting
-- per candidate per paper, so a second tab joins the sitting already running
-- instead of starting a fresh one with a fresh clock.
-- ---------------------------------------------------------------------------
create table if not exists public.watch_sessions (
  id            uuid primary key default gen_random_uuid(),
  paper_id      uuid not null references public.watch_papers on delete cascade,
  user_id       uuid not null references auth.users on delete cascade,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz
);

alter table public.watch_sessions
  /* When the questions opened: the test clock starts here, not at page load. */
  add column if not exists questions_started_at timestamptz,
  /* What was answered, kept at submit. Later visits are marked from this copy,
     never from answers sent up afterwards — marking arbitrary answers on
     demand would hand the key out one guess at a time. */
  add column if not exists responses jsonb;

create unique index if not exists watch_sessions_one_open
  on public.watch_sessions (paper_id, user_id)
  where submitted_at is null;

create index if not exists watch_sessions_lookup
  on public.watch_sessions (user_id, paper_id, started_at desc);

alter table public.watch_sessions enable row level security;

-- Written only by the server with the service-role client. A candidate may
-- read their own, which is what the exam page needs; nobody writes through
-- this policy.
drop policy if exists watch_sessions_own on public.watch_sessions;
create policy watch_sessions_own on public.watch_sessions
  for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Question counts, grouped in the database (added later)
--
-- The dashboard used to fetch one row per question across the whole
-- catalogue just to count them, and past a thousand questions the count went
-- quietly wrong. security_invoker: a candidate counts only what they may
-- read, which is the published papers.
-- ---------------------------------------------------------------------------
drop view if exists public.watch_question_counts;
create view public.watch_question_counts
with (security_invoker = true) as
  select paper_id, count(*)::integer as question_count
  from public.watch_questions
  group by paper_id;

grant select on public.watch_question_counts to anon, authenticated;

-- ---------------------------------------------------------------------------
-- A cleared worked example stays cleared (added later)
--
-- The example paragraphs defaulted to an empty list, which the app read as
-- "never set" and replaced with the sample's wording — so an institute that
-- deleted the example got it straight back. Null now means never set; an
-- empty list is a choice.
-- ---------------------------------------------------------------------------
alter table public.watch_papers alter column example_text drop not null;
alter table public.watch_papers alter column example_text set default null;
update public.watch_papers set example_text = null where example_text = '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Accounts are the institute's to change, not the student's (added later)
--
-- The original profiles_update_own policy let a signed-in user update their
-- own row with no column restriction — including `role`. A student could set
-- role = 'admin' from the browser console and pass every admin check on the
-- next request. Nothing in the site lets a student edit their own profile, so
-- the policy goes, and the table-level UPDATE right goes with it: the admin
-- panel writes profiles through the service-role client, which is unaffected.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_update_own on public.profiles;
revoke insert, update, delete on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Accounts come only from the admin panel (added later)
--
-- The Supabase auth API is public, and the anon key is in every browser. Even
-- with sign-up turned off in the dashboard (do that too: Authentication →
-- Providers → Email → untick "Allow new users to sign up"), the profile row
-- for a new user is created here, and it must not be a working account unless
-- the admin panel made it. The panel marks the users it creates in
-- app_metadata, which only the service-role key can write; anything without
-- that mark starts switched off, and shows up as Off in the students list.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, roll_no, phone, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'roll_no', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_app_meta_data ->> 'issued')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
