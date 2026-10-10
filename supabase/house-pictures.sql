-- ---------------------------------------------------------------------------
-- House Position Test (1a): the questions are pictures — run once in the
-- Supabase SQL editor before adding a part with house pictures.
--
-- A question may carry a picture of its own (the house to find), shown in
-- place of the prompt's text; the part's map stays in image_url, as on
-- every map test. The key-free view and its grant carry the column too.
-- ---------------------------------------------------------------------------
alter table public.watch_questions
  add column if not exists prompt_image text;

drop view if exists public.watch_questions_public;
create view public.watch_questions_public
with (security_invoker = true) as
  select id, paper_id, position, prompt_en, prompt_hi, options, topic, image_url, option_images, prompt_image
  from public.watch_questions;

revoke select on public.watch_questions from anon, authenticated;
grant select (id, paper_id, position, prompt_en, prompt_hi, options, topic, image_url, option_images, prompt_image)
  on public.watch_questions to anon, authenticated;
grant select on public.watch_questions_public to anon, authenticated;
