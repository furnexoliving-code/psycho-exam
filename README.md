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

Attempts are recorded once, on the first visit to the result after submitting —
reloading does not enter the same candidate twice. Until a paper has enough
submissions (5 by default, set per paper) the mean and standard deviation an
admin enters are used instead, and the result says so. With neither, the
T-score reports that it is not available rather than showing a fictional 50.

A standard deviation of zero would divide by zero; that case returns 50, since
everyone scoring the same means everyone is exactly average.

### Where the answer key lives

The key never reaches a candidate's browser. The exam page is served with the
answers stripped, candidates read a database view that omits the key column,
and `/api/watch-table/score` marks the paper server-side with the service-role
client. Without that, anyone could open the result page in a second tab and
read every answer out of the page source.

Run `supabase/schema.sql` first, then `supabase/watch-table-schema.sql`.



A mock exam portal for the **RRB ALP Computer Based Aptitude Test (CBAT)** — the
"psycho test" — rebuilt as a Next.js application. It reproduces the exam-hall
experience candidates actually sit: per-test timers, a bilingual question paper,
the standard question palette, and a section-wise result.

## What's in the paper

| # | Test | Questions | Time | Format |
|---|------|-----------|------|--------|
| 1 | Track Memory Test | 24 | 8 min | Study page → test page, railway map relabelled A–E |
| 2 | Intelligence Test | 20 | 15 min | Series, analogies, coding, logic |
| 3 | Selective Attention Test | 24 | 6 min | Count a target symbol in a numbered grid row |
| 4 | Spatial Scanning Test | 20 | 8 min | Spot the odd figure among five |
| 5 | Personality Test | 20 | 20 min | Five-point Likert, not scored |

**108 questions, 57 minutes.**

## Exam engine

- **Per-section timers.** Each test runs its own countdown and closes itself when
  time runs out. The clock does not start until the candidate leaves the
  section's instruction page.
- **Two-phase memory test.** The study page runs on a separate memorisation clock
  and cannot be returned to once the test page opens.
- **Question palette** with the five official states — not visited, not answered,
  answered, marked for review, and answered *and* marked (which is still
  evaluated) — each drawn in the shape the real portal uses.
- **Bilingual paper.** English and Hindi side by side on wide screens, single
  column with a language selector below that.
- **Screen zoom** (A+ / A-) scaling the whole exam body, pause, skip
  confirmation, clear response, and mark-for-review.
- **Crash-safe.** The run is persisted to `localStorage` on every change, so a
  refresh mid-exam restores answers, timers and section progress.
- **Section-wise result** with score, attempts, accuracy and time taken. The
  Personality Test has no answer key and is excluded from the score.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
npm run typecheck                # tsc --noEmit
```

The root path redirects to the instructions page of the default test.

## Testing

### Automated smoke test

Drives a real browser through the whole paper and checks 21 behaviours —
timers, the study-page flip, palette states, reload persistence, pause,
zoom, the skip dialog, and scoring.

```bash
npm install -D playwright
npx playwright install chromium

npm run build && npm run start   # terminal 1
npm run test:e2e                 # terminal 2
```

It exits non-zero on failure, so it drops straight into CI.

| Variable | Use |
|---|---|
| `BASE_URL` | Test a different host/port (default `http://localhost:3000`) |
| `CHROMIUM_PATH` | Reuse a Chrome/Chromium already on the machine |

### Static checks

```bash
npm run build      # must end with "Compiled successfully"
npm run typecheck  # must print nothing
```

### Manual pass

1. Open `/` — it redirects to the instructions page.
2. **Start Test → Begin Section** — the toolbar clock starts counting down.
3. On the study page, click *"I have memorised it"* — the map relabels from
   station codes to A–E.
4. Tick an answer — that number in the palette turns green, the rest of the
   block turns red.
5. Refresh mid-exam — answers and timers are still there.
6. Click another section tab — the skip confirmation appears.
7. Finish on the Personality Test and submit — the result excludes it from
   the score.

## Adding or editing a test

Papers live in `data/tests/*.json` and are registered in `lib/tests.ts`. The
shape is documented by the types in `lib/types.ts`.

`data/tests/alp-psycho-1.json` is **generated** — do not hand-edit it. Its answer
keys are derived from the same structures that get rendered (the station letters
on the track map, the real symbol counts in the grid, the odd polygon in each
figure row), so a stimulus can never drift out of sync with its key. Edit the
generator and re-run it:

```bash
python3 scripts/build-test-data.py
```

The generator uses a fixed random seed, so the paper is reproducible.

## Layout

```
app/
  exam/[testId]/
    instructions/   general instructions, palette legend, paper summary
    page.tsx        the exam runner
    result/         section-wise result, recomputed in the browser
components/         banner, toolbar, tabs, palette, stimuli, answer grid
lib/
  types.ts          domain model for all five test formats
  exam-store.tsx    reducer + timers + localStorage persistence
  scoring.ts        per-section and overall scoring
scripts/
  build-test-data.py
```

## Notes

- There is no backend. The paper is bundled as JSON and a run never leaves the
  browser, which is why the result page recomputes the score from local storage.
- Track maps, figures and symbol grids are drawn as inline SVG/HTML rather than
  shipped as scans, so the repo carries no third-party exam artwork.
