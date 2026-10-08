-- ---------------------------------------------------------------------------
-- Packages, enrollments and orders (run once in the Supabase SQL editor)
--
-- A package is what a student buys, or is given by the institute: sectional
-- practice, Full Mocks, or both, for one exam's test series. An enrollment
-- is a student holding a package, with an end date or none. An order is a
-- purchase through the payment gateway; a paid order makes an enrollment.
--
-- Every student on the portal today is a Kautilya student and keeps
-- everything: the last statement enrolls each of them in the ALP combo
-- package, from the institute, with no end date.
-- ---------------------------------------------------------------------------

create table if not exists public.packages (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  /* Which exam's test series: alp, asm, train-operator ... */
  exam           text not null default 'alp',
  name           text not null,
  name_hi        text not null default '',
  /* sectional = practice papers; full = Full Mocks; combo = both. */
  kind           text not null check (kind in ('sectional', 'full', 'combo')),
  price_inr      integer not null default 0 check (price_inr >= 0),
  mrp_inr        integer check (mrp_inr is null or mrp_inr >= 0),
  /* How long a purchase lasts; null for no end. */
  validity_days  integer check (validity_days is null or validity_days > 0),
  description    text not null default '',
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.packages enable row level security;
drop policy if exists packages_read on public.packages;
create policy packages_read on public.packages
  for select using (is_published or public.is_admin());
grant select on public.packages to authenticated, anon;

create table if not exists public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  package_id  uuid not null references public.packages on delete cascade,
  /* institute = given by Kautilya Classes; purchase = paid online. */
  source      text not null default 'institute' check (source in ('institute', 'purchase')),
  starts_at   timestamptz not null default now(),
  /* Null: no end. */
  expires_at  timestamptz,
  order_id    uuid,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, package_id)
);
alter table public.enrollments enable row level security;
drop policy if exists enrollments_own on public.enrollments;
create policy enrollments_own on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());
grant select on public.enrollments to authenticated;
create index if not exists enrollments_user_idx on public.enrollments (user_id);

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  package_id          uuid not null references public.packages on delete cascade,
  amount_inr          integer not null check (amount_inr >= 0),
  status              text not null default 'created' check (status in ('created', 'paid', 'failed')),
  gateway             text not null default 'razorpay',
  gateway_order_id    text unique,
  gateway_payment_id  text,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
alter table public.orders enable row level security;
drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
grant select on public.orders to authenticated;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

/* A Full Mock open to every signed-in student, package or not: the free mock. */
alter table public.mock_tests add column if not exists is_free boolean not null default false;
/* Which exam's series a paper or mock belongs to. Everything so far is ALP. */
alter table public.watch_papers add column if not exists exam text not null default 'alp';
alter table public.mock_tests  add column if not exists exam text not null default 'alp';
/* How the account came to be: issued by the institute, or made by the student. */
alter table public.profiles add column if not exists signup_source text not null default 'institute';
/* The address a self-made account came from, to slow a script making many. */
alter table public.profiles add column if not exists signup_ip text;

-- The ALP packages. Prices and validity are starting values: change them in
-- the admin panel (Packages).
insert into public.packages (slug, exam, name, name_hi, kind, price_inr, mrp_inr, validity_days, description, is_published, sort_order)
values
  ('alp-sectional', 'alp', 'ALP Sectional Tests', 'ALP सेक्शनल टेस्ट', 'sectional', 499, 999, 180,
   'Every practice paper of all 5 tests: Memory, Following Directions, Depth Perception, Power of Observation, Perceptual Speed. Up to 3 attempts per paper. New papers every week.', true, 1),
  ('alp-full', 'alp', 'ALP Full Mock Tests', 'ALP फुल मॉक टेस्ट', 'full', 399, 799, 180,
   'Every Full Mock Test: all 5 tests in one sitting, in the hall''s order, with the real timing and break screens. Scorecard out of 30 and a batch leaderboard.', true, 2),
  ('alp-combo', 'alp', 'ALP Sectional + Full Mock', 'ALP सेक्शनल + फुल मॉक', 'combo', 699, 1499, 180,
   'Everything: all practice papers of the 5 tests and every Full Mock Test, with Today''s plan on the dashboard. The complete preparation for the CBAT.', true, 3)
on conflict (slug) do nothing;

-- Every student already on the portal keeps everything, from the institute.
insert into public.enrollments (user_id, package_id, source, note)
select p.id, k.id, 'institute', 'Kautilya Classes student (before packages)'
from public.profiles p
cross join public.packages k
where p.role = 'student' and k.slug = 'alp-combo'
on conflict (user_id, package_id) do nothing;
