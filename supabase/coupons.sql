-- ---------------------------------------------------------------------------
-- Coupon codes (run once in the Supabase SQL editor, after packages.sql)
--
-- A code typed on the packages page takes a percentage or a fixed amount
-- off a package's price. A code may be limited to one package, to a
-- number of uses, and to a date. The order keeps the code and the
-- discount it gave.
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  /* percent: value is 1..100; amount: value is rupees off. */
  kind          text not null check (kind in ('percent', 'amount')),
  value         integer not null check (value > 0),
  /* Null: any package. Else only that package's slug. */
  package_slug  text,
  /* Null: no limit. */
  max_uses      integer check (max_uses is null or max_uses > 0),
  used_count    integer not null default 0,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  note          text not null default '',
  created_at    timestamptz not null default now()
);
alter table public.coupons enable row level security;
/* Codes are checked by the server only; nobody reads the table directly. */

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_inr integer not null default 0;
