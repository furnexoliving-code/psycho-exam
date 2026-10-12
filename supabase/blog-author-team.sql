-- The four articles of 11 Oct 2026 were seeded with Pindel Sir as the writer.
-- They describe his rules, so the team is the writer and he is the educator
-- (his box appears under every article). Run once.
update public.blog_posts set author = 'Team Kautilya' where author ilike '%pindel%';
