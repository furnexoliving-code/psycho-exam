# SEO plan: making kautilyaonline.com the first result for the railway psycho test

What is built into the site, what the team does once, and what the team does every week. Written for the Kautilya Classes team; no code knowledge needed.

## 1. What the site already does (built in)

| Area | What is in place |
|---|---|
| Public pages | The guide (/rrb-alp-psycho-test), the list of all 19 kinds (/psycho-test), 5 test pages, 19 kind pages, the packages page, the blog, the policies. 31 pages search engines may index. |
| Titles and descriptions | Every page has its own title (40 to 60 characters), description (120 to 158), keywords in English and Hinglish, a canonical address, and a share picture made for it. |
| Structured data | Article, FAQ and breadcrumb data on every content page; a collection list on the kinds page; the institute as an EducationalOrganization on the home page. Google can show the FAQ and breadcrumbs under the result. |
| Internal links | Guide → tests → kinds, kinds → siblings and the other tests, every page → the guide and the full list, the header and footer → the five tests. Every public page carries the free Full Mock offer. |
| Sitemap and robots | /sitemap.xml lists every public page with the date its words were revised; /robots.txt keeps the portal behind the login out of search. |
| Speed | Pages are built once and served from Vercel's cache (rebuilt hourly), no web fonts, images sized and lazy-loaded, no third-party scripts unless analytics is switched on. |
| Search Console | The verification tag is read from GOOGLE_SITE_VERIFICATION in Vercel. |
| Analytics | Google Analytics 4 loads only when NEXT_PUBLIC_GA_ID is set in Vercel. |

## 2. One-time setup (the team, about an hour)

1. **Google Search Console.** search.google.com/search-console → Add property → "URL prefix" → https://kautilyaonline.com → verify by "HTML tag": copy only the content value (the long code), paste it into Vercel → Settings → Environment Variables as GOOGLE_SITE_VERIFICATION, redeploy, then press Verify. Then Sitemaps → add `sitemap.xml`.
2. **Bing Webmaster Tools.** bing.com/webmasters → Import from Google Search Console (one click). Bing also feeds DuckDuckGo and Yahoo.
3. **Google Analytics 4.** analytics.google.com → create a property for kautilyaonline.com → copy the Measurement ID (G-…) → Vercel environment variable NEXT_PUBLIC_GA_ID → redeploy.
4. **Google Business Profile** for Kautilya Classes (business.google.com): address, hours, phone, website link, photos. Local searches ("psycho test coaching near me") come from here.
5. **Open sign-up** when ready: with the free Full Mock, a visitor who cannot make an account cannot try it. The switch is in the code (LAUNCH.signup); ask for it to be turned on.

## 3. Every week (20 minutes)

- Search Console → Performance: which queries bring clicks, which pages. Sort by impressions: a page with many impressions and few clicks needs a better title or description (tell the team which page; the words are in content/seo).
- Search Console → Pages (indexing): every public page should be "Indexed". A page marked "Crawled, not indexed" needs more words or more links to it.
- One new article on the blog (the panel's Blog page): a question students actually ask, 600 to 1000 words, in the same plain style, with the free Full Mock link. Ideas: "ALP psycho test me kitne sawal aate hain", "T-Score 42 kaise paaye", "Psycho test ke liye laptop zaroori hai?", "CBT 2 ke baad kya hota hai", results of a Full Mock explained with a scorecard.
- Core Web Vitals: Vercel → Speed Insights. Keep LCP under 2.5 s and CLS under 0.1 on the public pages; tell the team if a page goes red.

## 4. Keywords to watch (track these in Search Console)

Primary: rrb alp psycho test, alp cbat, alp psycho test online, railway psycho test practice, alp aptitude test.
Test names: memory test alp, following directions test, depth perception test alp, power of observation test, perceptual speed test alp.
Kinds: house position test, figure to number test, railway track route test, figure to figure test, figure find test, letter table test, watch table test, number table test, brick test alp, hidden cube test, yes or no test alp, find 6 test, find 9 test, figure placement test, similarity test alp, octagonal test, same circle test, same figure test.
Hinglish: alp psycho test kaise hota hai, psycho test me kya aata hai, t score 42 kya hai, psycho test ki taiyari kaise kare.

## 5. Links from other sites (backlinks and outreach)

Search engines trust a site that other sites point to. The free Full Mock is the thing to offer in exchange for a link.

1. **Telegram and WhatsApp groups** for RRB ALP: post the kind pages when a question comes up (not the home page): "House Position Test kaise solve karein" with the link. Once a week, never spam.
2. **YouTube**: a 5-minute video per kind of test on the institute's channel, the page link in the description and pinned comment. Embed the video on the matching page later.
3. **Quora and Reddit (r/RRB, r/IndianRailways… the exam communities)**: answer "how is the ALP psycho test" questions properly, link the guide.
4. **Other coaching and exam sites**: offer a guest article ("The 19 kinds of question in the ALP CBAT, explained") to railway exam blogs and Telegram channels, with a link back to the guide.
5. **Directories and listings**: JustDial, Sulekha, UrbanPro, Google Business Profile, Shiksha (if listed), the institute's own social profiles: each with the website link.
6. **Student results**: after the exam, a page with students' CBAT results (with permission) and their Full Mock scores: the most shared page a coaching site can have.
7. **Press release** at launch of the free mock: local Hindi papers and education portals (Jagran Josh, Amar Ujala's education desk) take short items with a link.
8. **Partner institutes**: coaching centres without a psycho portal can resell packages; each partner page links here.

Never buy links and never use link exchanges; one real mention from a railway exam channel is worth a hundred bought ones.

## 6. What good looks like

- Month 1: all 31 pages indexed; impressions for "alp psycho test" queries in Search Console.
- Month 2: the guide and 5 test pages in the top 20 for their test names; 10 blog articles.
- Month 3 onward: the kind pages ranking for each kind's name; a growing share of visitors who make an account and sit the free Full Mock.

## 7. Changing the words on a page

The text of the guide, the five test pages and the 19 kind pages lives in three files, not in code: `content/seo/guide.json`, `content/seo/batteries.json`, `content/seo/kinds.json`. Each page is one block with its title, description, keywords, the paragraphs, the steps, tips, mistakes, the 7-day plan, the FAQ and the Hindi summary. Counts and clocks are not there on purpose: they come from the hall pattern in `lib/wt/sections.ts`, so one change there updates every page and every paper. After a change, a push rebuilds the pages; nothing else is needed.
