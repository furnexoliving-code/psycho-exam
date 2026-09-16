# ALP Psycho Test Portal

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
