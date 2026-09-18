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

-- ---------------------------------------------------------------------------
-- Key-free view. Candidates read this; `answer` never leaves the server for
-- them, and scoring happens in the submit route with the service-role client.
-- ---------------------------------------------------------------------------
create or replace view public.watch_questions_public
with (security_invoker = true) as
  select id, paper_id, position, prompt_en, prompt_hi, options
  from public.watch_questions;

drop policy if exists watch_questions_read_via_view on public.watch_questions;
create policy watch_questions_read_via_view on public.watch_questions
  for select using (
    exists (
      select 1 from public.watch_papers p
      where p.id = paper_id and p.is_published
    )
  );

revoke select on public.watch_questions from anon, authenticated;
grant  select on public.watch_questions_public to anon, authenticated;

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
