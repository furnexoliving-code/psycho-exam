"use client";

import { useRef, useState } from "react";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { sortByName, uploadPicture } from "@/components/admin/upload";
import { groupFigureFiles } from "@/lib/wt/figure-files";
import type { WatchQuestion } from "@/lib/wt/types";
import {
  FIGURE_BATCH,
  MAX_NUMBER_OPTIONS,
  MAX_OPTION_COUNT,
  OPTION_LETTERS,
  defaultOptionsFor,
  optionValues,
  mapOf,
  sheetOf,
  type OptionStyle,
} from "@/lib/wt/figure-sample";
import { deleteQuestion } from "../actions";
import {
  addFigureQuestions,
  applyAnswerKey,
  replaceFigureImage,
  replacePromptImage,
  setFigureAnswer,
  setOptionImages,
} from "../figure-actions";

interface Run {
  done: number;
  total: number;
  error: string | null;
  running: boolean;
}

/**
 * The questions of a Perceptual Speed paper: one picture each, answered by
 * a letter.
 *
 * The quick way in is to pick every question's picture at once — the files
 * are taken in the order their names sort, so q01 … q60 become questions
 * 1 … 60 — and then type the answer key as one line of letters. Each
 * question can also be corrected on its own: its answer, its picture, or
 * a picture for each option when the options are drawings rather than
 * letters.
 */
/** Every option set on offer: A–B up to A–H, and 1–2 up to 1–12. */
const OPTION_CHOICES: { style: OptionStyle; count: number }[] = [
  ...Array.from({ length: MAX_OPTION_COUNT - 1 }, (_, i) => ({ style: "letters" as const, count: i + 2 })),
  ...Array.from({ length: MAX_NUMBER_OPTIONS - 1 }, (_, i) => ({ style: "numbers" as const, count: i + 2 })),
];
const choiceKey = (c: { style: OptionStyle; count: number }) => `${c.style}:${c.count}`;

export function FigureQuestionsPanel({
  slug,
  questions,
  category = "figure",
}: {
  slug: string;
  questions: WatchQuestion[];
  /** Which test the paper is: sets the options offered by default. */
  category?: string;
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [choice, setChoice] = useState(choiceKey(defaultOptionsFor(category)));
  const [optionStyle, optionCount] = (() => {
    const [style, count] = choice.split(":");
    return [style as OptionStyle, Number(count)] as const;
  })();
  const picker = useRef<HTMLInputElement | null>(null);

  const unanswered = questions.filter((q) => q.answer === "").length;
  // A sheet test (Brick, Similarity): one picture makes several questions.
  const sheet = sheetOf(category);
  const piles = sheet !== null;
  // A map test (House Position, Railway Track Route): one picture per part,
  // with the part's questions typed as labels beside it.
  const map = mapOf(category);
  const [labels, setLabels] = useState((map?.defaultLabels ?? []).join("\n"));
  const mapPicker = useRef<HTMLInputElement | null>(null);
  // A house test: the part's questions are pictures, chosen before the map.
  const [housePictures, setHousePictures] = useState<File[]>([]);
  const housePicker = useRef<HTMLInputElement | null>(null);

  const addMapPart = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file || !map) return;
    const pictures = map.pictureQuestions ? sortByName(housePictures) : [];
    // A picture question is numbered, not named: the number is its label in
    // the key and the topic breakdown, and the screen shows the picture.
    const names = map.pictureQuestions
      ? pictures.map((_, i) => String(i + 1))
      : labels.split("\n").map((l) => l.trim()).filter(Boolean);
    const state: Run = { done: 0, total: 1 + pictures.length, error: null, running: true };
    setRun({ ...state });
    try {
      if (map.pictureQuestions && pictures.length === 0) throw new Error(`Choose the ${map.item} pictures of this part first (step 1), one per question`);
      if (names.length === 0) throw new Error(`Type the ${map.item}s of this part first, one per line`);
      if (names.length > 60) throw new Error("At most 60 questions on one map");
      const promptImages: string[] = [];
      for (const picture of pictures) {
        promptImages.push(await uploadPicture(picture));
        state.done += 1;
        setRun({ ...state });
      }
      const url = await uploadPicture(file);
      state.done += 1;
      setRun({ ...state });
      const outcome = await addFigureQuestions(slug, [{ image: url }], optionCount, optionStyle, {
        prompts: names,
        topicPrefix: map.topicPrefix,
        ...(map.pictureQuestions ? { promptImages } : {}),
      });
      if (outcome.error) throw new Error(outcome.error);
      if (!map.defaultLabels) setLabels("");
      setHousePictures([]);
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
    } finally {
      state.running = false;
      setRun({ ...state });
      if (mapPicker.current) mapPicker.current.value = "";
      if (housePicker.current) housePicker.current.value = "";
    }
  };

  const addPictures = async (list: FileList | null) => {
    const files = sortByName(Array.from(list ?? []));
    if (files.length === 0) return;
    const state: Run = { done: 0, total: files.length, error: null, running: true };
    setRun({ ...state });

    try {
      // The files are sorted into questions by name first, and a pile that
      // does not add up is refused before a single upload: half a paper's
      // pictures in storage with no questions would be worse than none.
      // Option pictures are named by letter, so they go with lettered
      // options; a numbered paper (Depth Perception) has one picture per
      // question and nothing to group.
      const { groups, problems } = groupFigureFiles(files, optionStyle === "letters" ? optionCount : 0);
      if (problems.length) throw new Error(problems.slice(0, 5).join(" · "));
      const withOptions = groups.filter((g) => g.options.length > 0 && g.options.every(Boolean)).length;
      if (withOptions > 0 && withOptions < groups.length) {
        throw new Error(
          `${withOptions} question${withOptions === 1 ? " has" : "s have"} option pictures and ${groups.length - withOptions} do${groups.length - withOptions === 1 ? "es" : ""} not. Give every question its ${optionCount} option pictures, or none.`,
        );
      }

      // Uploaded one after another, then written in batches: a run of sixty
      // questions is one upload per file from the browser and two short
      // calls to the server, with the count moving the whole way.
      const upload = async (file: File) => {
        const url = await uploadPicture(file);
        state.done++;
        setRun({ ...state });
        return url;
      };
      const items: { image?: string; options?: string[] }[] = [];
      for (const g of groups) {
        const image = g.figure ? await upload(g.figure) : undefined;
        if (g.options.length > 0 && g.options.every(Boolean)) {
          const options: string[] = [];
          for (const f of g.options) options.push(await upload(f!));
          items.push({ image, options });
        } else {
          items.push({ image });
        }
      }
      for (let i = 0; i < items.length; i += FIGURE_BATCH) {
        const outcome = await addFigureQuestions(slug, items.slice(i, i + FIGURE_BATCH), optionCount, optionStyle, sheet ? { prompts: sheet.prompts, topicPrefix: sheet.topicPrefix } : null);
        if (outcome.error) throw new Error(outcome.error);
      }
      state.total = groups.length;
      state.done = groups.length;
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
    } finally {
      state.running = false;
      setRun({ ...state });
      if (picker.current) picker.current.value = "";
    }
  };

  return (
    <section className="mt-6 rounded border border-gray-300 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[15px] font-bold text-gray-900">Questions ({questions.length})</h2>
        {unanswered > 0 && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-[12px] font-semibold text-red-800">
            {unanswered} without an answer — the paper cannot be published until every answer is set
          </span>
        )}
      </div>

      {/* --------------------------- Add a map part --------------------------- */}
      {map ? (
      <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-4">
        <p className="text-[13px] font-semibold text-gray-800">Add a part: the test map and its {map.item}s</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>
            Each part has two pictures: the <strong>study map</strong> (set in the Study screens section above){map.pictureQuestions ? `, with the ${map.item}s drawn on it,` : ""} and the
            <strong> test map</strong>, the same map with the letters A to E in place of the {map.item}s.
          </li>
          {map.pictureQuestions ? (
            <li>
              The questions are the {map.item}s themselves, one picture each. <strong>Step 1:</strong> choose the part&apos;s {map.item} pictures, named in the
              order the questions should come ({map.item}01.png, {map.item}02.png …). <strong>Step 2:</strong> choose the test map. Each picture becomes a
              question, shown beside the map with the options A to E; {map.perPart} per part in the hall.
            </li>
          ) : (
            <li>
              Type the {map.item}s of this part below, one per line, in the order the questions should come (the station names, as the candidate reads them);
              then choose the test map. The part&apos;s questions are made on it, {map.perPart} per part in the hall.
            </li>
          )}
          <li>Afterwards type the answer key in one line (one letter per question, in order), or set each answer by hand.</li>
        </ul>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {map.pictureQuestions ? (
            <div className="flex flex-col gap-2">
              <span className="block text-[12px] font-semibold text-gray-700">Step 1 · {map.item[0].toUpperCase() + map.item.slice(1)} pictures of this part, one per question</span>
              <button
                type="button"
                disabled={run?.running}
                onClick={() => housePicker.current?.click()}
                className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-60"
              >
                Choose the {map.item} pictures…
              </button>
              <input ref={housePicker} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setHousePictures(sortByName(Array.from(e.target.files ?? [])))} />
              <span className="max-w-[300px] text-[12px] text-gray-600">
                {housePictures.length === 0
                  ? `None chosen yet; ${map.perPart} per part in the hall.`
                  : `${housePictures.length} chosen, in this order: ${housePictures.slice(0, 4).map((f) => f.name).join(", ")}${housePictures.length > 4 ? " …" : ""}`}
              </span>
            </div>
          ) : (
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">{map.item[0].toUpperCase() + map.item.slice(1)}s of this part, one per line</span>
            <textarea
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              rows={6}
              disabled={run?.running}
              placeholder="SOK\nDET\nPIR …"
              className="w-[220px] rounded border border-gray-400 px-2 py-1.5 font-mono text-[12px]"
            />
          </label>
          )}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[12px] text-gray-700">
              Options
              <select value={choice} disabled={run?.running} onChange={(e) => setChoice(e.target.value)} className="rounded border border-gray-400 px-2 py-1 text-[12px]">
                {OPTION_CHOICES.filter((c) => c.style === "letters").map((c) => (
                  <option key={choiceKey(c)} value={choiceKey(c)}>Letters {OPTION_LETTERS.slice(0, c.count).join(" ")}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={run?.running}
              onClick={() => mapPicker.current?.click()}
              className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
            >
              {run?.running ? `Uploading… ${run.done}/${run.total}` : `${map.pictureQuestions ? "Step 2 · " : ""}Choose the test map…`}
            </button>
            <input ref={mapPicker} type="file" accept="image/*" className="hidden" onChange={(e) => void addMapPart(e.target.files)} />
            {run && !run.running && !run.error && <span className="text-[12px] font-semibold text-green-700">✓ part added</span>}
            {run?.error && <p className="text-[12px] font-semibold text-red-700">✕ {run.error}</p>}
          </div>
        </div>
      </div>
      ) : (
      <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-4">
        <p className="text-[13px] font-semibold text-gray-800">{sheet ? `Add ${sheet.noun}s from pictures` : "Add questions from pictures"}</p>
        {sheet ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>
            <strong>One picture per {sheet.noun}</strong>, with its {sheet.prompts.length} questions labelled {sheet.prompts.join(", ")} on it:
            name the files in order ({sheet.noun}01.png, {sheet.noun}02.png …) and choose them all at once. Each {sheet.noun} becomes
            {" "}{sheet.prompts.length} questions, {sheet.prompts[0]} to {sheet.prompts[sheet.prompts.length - 1]}, in that order; the hall gives {sheet.pictures} {sheet.noun}s,
            so {sheet.pictures * sheet.prompts.length} questions.
          </li>
          <li>
            Afterwards type the answer key in one line, {sheet.prompts.length} answers per {sheet.noun} in {sheet.prompts[0]} to {sheet.prompts[sheet.prompts.length - 1]} order
            (for example <code>{sheet.style === "numbers" ? "2 3 3 4 4  1 2 2 3 1 …" : "D C B A  B C A D …"}</code>), or set each question&apos;s answer by hand.
          </li>
          <li>Nothing is uploaded until the whole set of names adds up.</li>
        </ul>
        ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>
            <strong>One picture per question</strong>, showing the figure and its options
            as the candidate should see them: name the files in order (q01.png,
            q02.png …). They become questions in that order, each offering the letters
            A, B, C… set below.
          </li>
          <li>
            <strong>A figure plus a picture per option:</strong> name the figure q01.png
            and its options q01-A.png, q01-B.png … q01-E.png (q01_A, q01 A and q01A
            work too). Choose all the files at once; they are sorted by name. Every
            question must then have all its option pictures, and the count below must
            match.
          </li>
          <li>
            <strong>Option pictures alone</strong> (the Memory Test, where the figure was
            memorised): q01-A.png … q01-E.png with no q01.png.
          </li>
          <li>
            Afterwards type the answer key in one line, or set each question&apos;s
            answer by hand.
          </li>
          <li>Nothing is uploaded until the whole set of names adds up, so a missing file cannot leave half a paper behind.</li>
        </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-gray-700">
            Options
            <select
              value={choice}
              disabled={run?.running}
              onChange={(e) => setChoice(e.target.value)}
              className="rounded border border-gray-400 px-2 py-1 text-[12px]"
            >
              {OPTION_CHOICES.map((c) => (
                <option key={choiceKey(c)} value={choiceKey(c)}>
                  {c.style === "letters"
                    ? `Letters ${OPTION_LETTERS.slice(0, c.count).join(" ")}`
                    : `Numbers 1 to ${c.count}`}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={run?.running}
            onClick={() => picker.current?.click()}
            className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
          >
            {run?.running ? `Uploading ${run.done} of ${run.total} files…` : "Choose the pictures…"}
          </button>
          <input
            ref={picker}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void addPictures(e.target.files)}
          />
          {run && !run.running && !run.error && (
            <span className="text-[12px] font-semibold text-green-700">
              ✓ {run.total} {sheet ? sheet.noun : "question"}{run.total === 1 ? "" : "s"} added
            </span>
          )}
        </div>
        {run && run.total > 0 && (
          <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded bg-gray-200">
            <div
              className={`h-full ${run.error ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.round((run.done / run.total) * 100)}%` }}
            />
          </div>
        )}
        {run?.error && (
          <p className="mt-2 text-[12px] font-semibold text-red-700">✕ {run.error}</p>
        )}
      </div>

      )}

      {/* --------------------------- Answer key --------------------------- */}
      {questions.length > 0 && (
        <SaveForm action={applyAnswerKey} submitLabel="Apply the key" className="mt-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">
              Answer key — one answer per question, in order ({questions.length} answers)
            </span>
            <input
              name="key"
              placeholder={
                typeof questions[0]?.options[0] === "number"
                  ? "3 2 5 1 4 …"
                  : OPTION_LETTERS.slice(0, Math.min(questions.length, 5)).join("")
              }
              autoCapitalize="characters"
              className="w-full max-w-xl rounded border border-gray-400 px-3 py-2 font-mono text-[14px] tracking-[0.2em]"
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Letters may run together (ABDCE) or be separated by spaces or commas. Numbers
              need a space or comma between them (3 2 10 1). Nothing is saved unless every
              answer fits its question.
            </span>
          </label>
        </SaveForm>
      )}

      {/* ----------------------------- The list ----------------------------- */}
      {questions.length === 0 ? (
        <p className="mt-4 rounded border border-gray-300 px-3 py-6 text-center text-[13px] text-gray-500">
          No questions yet. Choose the pictures above.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-gray-200 rounded border border-gray-300">
          {questions.map((q, i) => (
            <FigureRow key={q.id} slug={slug} question={q} index={i} />
          ))}
        </ol>
      )}
    </section>
  );
}

function FigureRow({
  slug,
  question: q,
  index,
}: {
  slug: string;
  question: WatchQuestion;
  index: number;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const optionPicker = useRef<HTMLInputElement | null>(null);
  const figurePicker = useRef<HTMLInputElement | null>(null);
  const housePicker = useRef<HTMLInputElement | null>(null);
  const unanswered = q.answer === "";

  const withPictures = async (what: string, files: FileList | null, apply: (urls: string[]) => Promise<{ ok: boolean; error?: string }>) => {
    const list = sortByName(Array.from(files ?? []));
    if (list.length === 0) return;
    setError(null);
    setBusy(what);
    try {
      const urls: string[] = [];
      for (const file of list) urls.push(await uploadPicture(file));
      const outcome = await apply(urls);
      if (!outcome.ok) throw new Error(outcome.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      if (optionPicker.current) optionPicker.current.value = "";
      if (figurePicker.current) figurePicker.current.value = "";
      if (housePicker.current) housePicker.current.value = "";
    }
  };

  return (
    <li className={`px-3 py-3 ${unanswered ? "bg-red-50" : ""}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="w-[42px] shrink-0 text-[12px] font-semibold text-gray-700">Q. {index + 1}</span>

        {q.promptImage && (
          // A house test: the question is this picture; the map is the figure beside it.
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={q.promptImage} alt="" className="h-[64px] w-auto rounded border border-gray-300 bg-white" />
            <div className="mt-1">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => housePicker.current?.click()}
                className="text-[11px] font-semibold text-rrb-banner hover:underline disabled:opacity-50"
              >
                {busy === "house" ? "Uploading…" : "Replace question picture"}
              </button>
              <input
                ref={housePicker}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  void withPictures("house", e.target.files, (urls) => replacePromptImage(slug, q.id, urls[0]))
                }
              />
            </div>
          </div>
        )}

        <div className="shrink-0">
          {q.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.image} alt="" className="max-h-[120px] max-w-[320px] rounded border border-gray-300 bg-white" />
          ) : (
            <span className="text-[12px] text-gray-500">No figure (options only)</span>
          )}
          <div className="mt-1">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => figurePicker.current?.click()}
              className="text-[11px] font-semibold text-rrb-banner hover:underline disabled:opacity-50"
            >
              {busy === "figure" ? "Uploading…" : "Replace picture"}
            </button>
            <input
              ref={figurePicker}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                void withPictures("figure", e.target.files, (urls) => replaceFigureImage(slug, q.id, urls[0]))
              }
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <RowForm action={setFigureAnswer} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="id" value={q.id} />
            <label className="text-[12px] font-semibold text-gray-700">
              Answer
              <select
                name="answer"
                defaultValue={String(q.answer)}
                className={`ml-2 rounded border px-2 py-1 text-[13px] font-normal ${
                  unanswered ? "border-red-500" : "border-gray-400"
                }`}
              >
                {unanswered && <option value="">— not set —</option>}
                {q.options.map((o) => (
                  <option key={String(o)} value={String(o)}>
                    {String(o)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-gray-400 bg-white px-3 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100"
            >
              Save
            </button>
            <span className="text-[11px] text-gray-500">Options: {q.options.join(" · ")}</span>
          </RowForm>

          <div className="mt-2">
            {q.optionImages?.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {q.optionImages.map((url, oi) => (
                  <span key={url} className="flex items-center gap-1 text-[11px] text-gray-700">
                    {String(q.options[oi])}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-[48px] w-auto rounded border border-gray-300 bg-white" />
                  </span>
                ))}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setBusy("clear");
                    void setOptionImages(slug, q.id, null)
                      .then((r) => {
                        if (!r.ok) setError(r.error ?? "Failed");
                      })
                      .finally(() => setBusy(null));
                  }}
                  className="text-[11px] font-semibold text-gray-700 hover:underline disabled:opacity-50"
                >
                  Remove option pictures
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => optionPicker.current?.click()}
                className="text-[11px] font-semibold text-rrb-banner hover:underline disabled:opacity-50"
              >
                {busy === "options"
                  ? "Uploading…"
                  : `Options as pictures: choose ${q.options.length} files (named in order ${q.options.join(", ")})`}
              </button>
            )}
            <input
              ref={optionPicker}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                void withPictures("options", e.target.files, (urls) => setOptionImages(slug, q.id, urls))
              }
            />
          </div>

          {error && <p className="mt-1 text-[11px] font-semibold text-red-700">✕ {error}</p>}
        </div>

        <RowForm action={deleteQuestion}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="id" value={q.id} />
          <PendingButton
            pendingLabel="Deleting…"
            confirm={`Delete question ${index + 1}?`}
            className="text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-60"
          >
            Delete
          </PendingButton>
        </RowForm>
      </div>
    </li>
  );
}
