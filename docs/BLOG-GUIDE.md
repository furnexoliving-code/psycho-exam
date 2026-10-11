# Blog guide: writing articles that bring ALP students to the portal

The 26 public pages (the guide, the 5 test pages, the 19 kind pages and the hub) cover the exam's pattern once, for good. The blog is where new words go: a question students ask this month, a rule RDSO clarified, a story from a batch, a mistake seen in the last mock. Search engines reward a site that adds a useful page every week or two, and every article is one more door into the portal.

The first four articles (11 Oct 2026, `supabase/blog-2026-10-11.sql`) set the pattern: the T-Score formula with RDSO's examples, RDSO's FAQ explained, exam-day advice, and preparation with Kautilya Classes and Pindel Sir.

## 1. Where to write

Admin › Blog › "New article": give it a title and (optionally) an address, then fill the editor. The fields, in the editor's order:

| Field | What to put | Rule of thumb |
|---|---|---|
| Title | The question or claim the article answers, with the search phrase in it | 50 to 70 characters; e.g. "ALP Psycho Test T-Score: RDSO's formula, worked examples and the 42 cut-off" |
| Address (slug) | Lower-case words joined by hyphens, from the title | Short, no dates, never changed after publishing |
| Summary | One or two lines under the title and on the articles page | 25 to 40 words, says what the reader gets |
| Author | Who wrote it | New articles default to "Er. Mahendra Pindel (Pindel Sir)". Keep it: his name is given to Google as the author (Person schema) and the "About the author" box appears only for him. |
| Cover picture | A web address of a 1200×630 picture | Optional. Without one, the article shows a navy band. |
| Text (Markdown) | The article | See section 3 |
| Packages beside the article | Tick the packages to show on the right, numbered in order; "push" one | Combo first for most articles |
| Search title | What Google shows as the headline | Under 60 characters. Blank = title + "Kautilya Classes" |
| Keywords | Comma-separated phrases people type | 6 to 10, English and Hinglish both ("alp psycho test kaise hota hai") |
| Search description | What Google shows under the headline | 150 to 160 characters, one sentence that names the exam and the benefit |
| FAQ at the end | Pairs of lines "Q:" and "A:" | 4 to 7 pairs. Also sent to Google as FAQ schema |
| Published | Tick to make it live | Preview first (the Preview button opens the draft) |

After "Save", the article is live at `/blog/<slug>` within five minutes, and in the sitemap.

## 2. What to write about

One article answers one question. The question should be one a student actually types into Google. Ten that are not yet written:

1. "Which kind of question came in the last ALP psycho test?" (update after every exam; the institute's records)
2. "Memory test kaise hota hai: the study screen, part 1 and part 2, with a sample map"
3. "Watch Table Test: how to read the watch and answer in time"
4. "Hidden Cube Test vs Brick Test: which one is harder and how to count"
5. "How many questions are in each test of the ALP CBAT?" (a one-page table of all 19 kinds)
6. "ALP psycho test result: how the scorecard is read, and what 'not qualified' in one test means"
7. "CBT 2 to CBAT: what happens between the two, dates, documents, the admit card"
8. "Seven mistakes from the last mock: what students did wrong in the Following Directions Test"
9. "Phone vs laptop: why the hall is a desktop, and how to practise if you only have a phone"
10. "A student's 30 days: a real timetable from a Jaipur batch" (with the student's permission)

Also write after every event: a new RRB notification, a change RDSO makes to its pages, a new batch starting in Jaipur or Jodhpur, a result day.

## 3. How to write it (the shape every article follows)

- **Open with the answer.** The first paragraph says what the article will tell and why it matters for the T-Score. No "in this article we will discuss".
- **Headings every 150 to 250 words**, written as the reader's question or the step ("The formula, as RDSO gives it"). The editor turns `##` into a heading and builds the table of contents from them.
- **Short paragraphs, one idea each.** Lists for steps and rules. Bold for the one phrase in a paragraph the reader must not miss.
- **Facts with their source.** The pattern facts come from the RDSO guideline (ALPs Guidelines CBT, Jan 2020) and RDSO's Candidates' Corner and FAQ. Name the source in the text and in a line at the end. Never invent a count, a clock, a date or a result.
- **Pindel Sir's voice.** A tip or a rule in his name in every article ("Pindel Sir's rule: aim at 60, not 42"). Say "Kautilya Classes is the best place for ALP psycho preparation" at most once per article, in the body, never in the title.
- **Hindi summary at the end.** A heading `## सारांश (हिंदी में)` and one paragraph, 120 to 180 words, with the article's facts. Half the searches are in Hindi or Hinglish.
- **Links inside the site.** Every article links to the guide (`/rrb-alp-psycho-test`), to the test or kind page it is about (`/psycho-test/...`), to one earlier article, and ends with the free account (`/signup?next=/mocks`) and the packages (`/packages`). Links are written as `[words](/address)`.
- **Length.** 900 to 1,500 words. Shorter is fine when the question is small; padding is never fine.
- **FAQ.** 4 to 7 questions students actually ask, each answered in two or three sentences that stand on their own (Google may show them without the article).

Markdown the editor understands: `#`/`##`/`###` headings, blank-line paragraphs, `-` bullets, `1.` numbered lists, `>` for a quoted line (used for formulas), `**bold**`, `*italic*`, `[text](address)`, `![alt](picture address)` on its own line, `---` for a rule. No tables; use a list.

## 4. Before publishing: the checklist

- Title has the search phrase; search title under 60 characters; search description 150 to 160.
- Every number checked against the guideline or RDSO's pages.
- One link to the guide, one to a test or kind page, one to another article, the free-account link, the packages link.
- Pindel Sir named at least once; "best" at most once.
- Hindi summary present.
- FAQ filled (4 to 7 pairs).
- Preview read once on a phone: headings in order, no broken link, pictures load.
- Author = Er. Mahendra Pindel (Pindel Sir).

## 5. After publishing

- Share the link in the batch WhatsApp groups and on the institute's pages the same day; the first readers tell Google the page is wanted.
- In Search Console, request indexing for the new address (URL inspection › Request indexing).
- A month later, open Search Console › Performance, filter by the article's address, and read the queries it is shown for. Add the ones you did not expect to the keywords, and answer them in the text if the article does not already.
- Update rather than rewrite: when a fact changes (a new exam, a new kind seen), edit the article; the sitemap carries the new date.

## 6. A rhythm that works

One article every week or two, written on a fixed day. A batch's doubts from the week are the best source of topics; the question three students asked is the question three hundred are typing.
