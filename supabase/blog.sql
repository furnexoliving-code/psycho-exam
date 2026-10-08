-- ---------------------------------------------------------------------------
-- Blog (run once in the Supabase SQL editor, after packages.sql)
--
-- Articles written in the panel for search engines to find. Each article
-- names the packages shown beside it, in order, and may mark one as the
-- recommended (up-sell) one. An article is reachable at /blog/<slug> and
-- listed in the sitemap; nothing in the portal's menus points at it.
-- ---------------------------------------------------------------------------

create table if not exists public.blog_posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  /* The one-line summary under the title and in search results. */
  excerpt           text not null default '',
  /* Markdown: headings, paragraphs, lists, links, pictures, bold. */
  content           text not null default '',
  cover_image_url   text,
  /* Which exam's readers it is for: alp, asm ... Picks the related articles. */
  exam              text not null default 'alp',
  /* Search-engine title and description; blank = the title and the excerpt. */
  meta_title        text not null default '',
  meta_description  text not null default '',
  keywords          text not null default '',
  /* The packages beside the article, in this order (package slugs). */
  package_slugs     text[] not null default '{}',
  /* The package to push: shown first with a "Recommended" mark and the saving. */
  upsell_slug       text,
  /* Questions and answers at the end, also given to search engines as FAQ. */
  faq               jsonb not null default '[]'::jsonb,
  is_published      boolean not null default false,
  published_at      timestamptz,
  author            text not null default 'Kautilya Classes',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
drop policy if exists blog_posts_read on public.blog_posts;
create policy blog_posts_read on public.blog_posts
  for select using (is_published or public.is_admin());
grant select on public.blog_posts to authenticated, anon;
create index if not exists blog_posts_published_idx on public.blog_posts (is_published, published_at desc);
