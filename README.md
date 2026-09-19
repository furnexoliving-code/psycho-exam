# ALP Psycho Test Portal

## Watch Table Test

The portal's main paper is the RRB **Watch Table Test** (the following-directions
test): eight letter-and-number positions round a circle with a compass at the
centre, and twenty questions that walk a path between two compass points.

- `/watch-table/<slug>` — the exam
- `/admin/watch-table` — the panel

### The admin panel

Everything about a paper is set there, with no code change:

| | |
|---|---|
| **Timers** | Instruction screen and test clock, separately, in minutes |
| **Controls** | Instructions button, Question Paper button, Pause, Fullscreen, mouse-wheel lock, and whether questions run past the right edge |
| **Diagram** | The eight positions, or a link to your own image |
| **Questions** | Upload your own, edit one inline, or download what is saved |
| **Publish** | Papers stay drafts until you tick Published |

Questions upload one per line:

```
English question | Hindi question | 1,5,4,3,2 | 4
```

Nothing is written until every line parses, so one typo cannot leave half a
paper. "Build a sample set" fills a new paper from its diagram so you can see
the format, then download it as a starting file.

### The T-score

The result reports

```
T = 50 + 10 × (marks − mean) ÷ standard deviation
```

against everyone who has sat that paper. 50 is the average candidate and every
10 points is one standard deviation. The arithmetic is printed under the figure
so it can be checked.

Attempts are recorded once, when the sitting is closed by the submit —
reloading does not enter the same candidate twice. Until a paper has enough
submissions (5 by default, set per paper) the mean and standard deviation an
admin enters are used instead, and the result says so. With neither, the
T-score reports that it is not available rather than showing a fictional 50.

A standard deviation of zero would divide by zero; that case returns 50, since
everyone scoring the same means everyone is exactly average.

### What else the result shows

- **Rank and percentile** against everyone who has sat the paper. Equal marks
  share a rank, and the percentile counts candidates scoring strictly less.
- **Cut off** by marks, by T-score, or both — a candidate must clear each bar
  that is set. RRB's own bar is a T-score of 42.
- **Expert's comment**, set per paper.
- **Where the marks went** — a per-topic tally, weakest first. Questions carry
  an optional topic as their fifth upload field; the generated sample labels
  itself.
- **Time** — taken against allowed, what was left, and the average per
  attempted question.
- **Your attempts** — earlier attempts at the same paper with the change in
  marks, from the database, so it is the same on every device.

Admins get every attempt for a paper at
`/admin/watch-table/<slug>/results`, with rank, T-score and cut-off per row,
and a CSV download that opens correctly in Excel including Hindi names.

### Where the answer key lives

The key never reaches a candidate's browser. The exam page is served with the
answers stripped, candidates read a database view that omits the key column,
and `/api/watch-table/score` marks the paper server-side with the service-role
client. Without that, anyone could open the result page in a second tab and
read every answer out of the page source.

Run `supabase/schema.sql` first, then `supabase/watch-table-schema.sql`.

### Accounts

There is no sign-up. The institute issues accounts from `/admin/students` —
one at a time or from a pasted list — and a student signs in with the mobile
number and password they were given. An account can be switched off without
deleting its results.

Every candidate page needs an account: `/dashboard`, the three test lists
under `/tests/<kind>`, the exam and its result. The admin panel is reached
only by typing `/admin`; nothing links to it, and it opens with the admin's
password AND a six-digit code from an authenticator app (TOTP, via Supabase
MFA). The first visit sets the app up at `/admin/setup-2fa`; every later
session enters its code at `/admin/verify`. Every admin page and every admin
action checks both. A lost phone is recovered from the Supabase dashboard
(Authentication → Users → the account → remove the factor), after which the
panel asks for a new setup.

### What is cached

Published papers, their questions (never the key — the cached read selects
only the public columns) and the published list are served from a shared
cache tagged per paper, emptied by every admin save and in any case every
five minutes. A thousand students opening a paper together cost the database
one read. Anything about one student — profile, attempts, sitting — is read
live.

### The sitting

Opening a paper starts a sitting on the server. Its clock is the server's, so
a second tab joins the running sitting instead of starting a fresh countdown,
a reload cannot rewind the clock, and the time reported on the result is
measured rather than claimed. The submit closes the sitting, stores what was
answered, and records the attempt; later visits to the result are marked from
that stored copy. An attempt limit set on a paper is checked both when the
paper is handed out and when the attempt is written.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in the Supabase keys
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm run start   # production
npm run typecheck                # tsc --noEmit
```

Without the Supabase variables the site still builds and serves the bundled
sample paper, with every account-backed page reporting that accounts are not
set up yet.

## Layout

```
app/
  login/                    mobile + password sign-in
  dashboard/                the candidate's home: three tests, past results
  tests/[category]/         every published paper of one kind
  watch-table/[paperId]/    the exam, and result/ beneath it
  api/watch-table/score/    marks a closed sitting server-side
  api/watch-table/start/    notes when the questions opened
  admin/                    papers, questions, students, results, analysis
components/wt/              the exam screen and the result panels
lib/wt/                     paper model, sittings, T-score, cut off, attempts
lib/auth.ts                 profile lookup; requireUser / requireAdmin
supabase/                   schema.sql, then watch-table-schema.sql
```
