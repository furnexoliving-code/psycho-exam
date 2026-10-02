"use client";

import { useRef, useState } from "react";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { sortByName, uploadPicture } from "@/components/admin/upload";
import type { WatchQuestion } from "@/lib/wt/types";
import {
  DEFAULT_OPTION_COUNT,
  FIGURE_BATCH,
  MAX_OPTION_COUNT,
  OPTION_LETTERS,
} from "@/lib/wt/figure-sample";
import { deleteQuestion } from "../actions";
import {
  addFigureQuestions,
  applyAnswerKey,
  replaceFigureImage,
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
export function FigureQuestionsPanel({
  slug,
  questions,
}: {
  slug: string;
  questions: WatchQuestion[];
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [optionCount, setOptionCount] = useState(DEFAULT_OPTION_COUNT);
  const picker = useRef<HTMLInputElement | null>(null);

  const unanswered = questions.filter((q) => q.answer === "").length;

  const addPictures = async (list: FileList | null) => {
    const files = sortByName(Array.from(list ?? []));
    if (files.length === 0) return;
    const state: Run = { done: 0, total: files.length, error: null, running: true };
    setRun({ ...state });

    try {
      // Uploaded one after another, then written in batches: a run of sixty
      // pictures is sixty uploads from the browser and two short calls to
      // the server, with the count moving the whole way.
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadPicture(file));
        state.done++;
        setRun({ ...state });
      }
      for (let i = 0; i < urls.length; i += FIGURE_BATCH) {
        const outcome = await addFigureQuestions(slug, urls.slice(i, i + FIGURE_BATCH), optionCount);
        if (outcome.error) throw new Error(outcome.error);
      }
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

      {/* ------------------------- Add pictures ------------------------- */}
      <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-4">
        <p className="text-[13px] font-semibold text-gray-800">Add questions from pictures</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>
            One picture per question, showing the figure and its options as the
            candidate should see them. Name the files in order (q01.png, q02.png …):
            they become questions in that order.
          </li>
          <li>Each question offers letters A, B, C… as its options. Set how many below.</li>
          <li>
            Afterwards type the answer key in one line, or set each question&apos;s
            answer by hand.
          </li>
          <li>
            Options can be pictures instead of letters: open a question below and
            give it one picture per option.
          </li>
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-gray-700">
            Options per question
            <select
              value={optionCount}
              disabled={run?.running}
              onChange={(e) => setOptionCount(Number(e.target.value))}
              className="rounded border border-gray-400 px-2 py-1 text-[12px]"
            >
              {Array.from({ length: MAX_OPTION_COUNT - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n} ({OPTION_LETTERS.slice(0, n).join(" ")})
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
            {run?.running ? `Uploading ${run.done} of ${run.total}…` : "Choose the pictures…"}
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
              ✓ {run.total} question{run.total === 1 ? "" : "s"} added
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

      {/* --------------------------- Answer key --------------------------- */}
      {questions.length > 0 && (
        <SaveForm action={applyAnswerKey} submitLabel="Apply the key" className="mt-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">
              Answer key — one letter per question, in order ({questions.length} letters)
            </span>
            <input
              name="key"
              placeholder={OPTION_LETTERS.slice(0, Math.min(questions.length, 5)).join("")}
              autoCapitalize="characters"
              className="w-full max-w-xl rounded border border-gray-400 px-3 py-2 font-mono text-[14px] tracking-[0.3em]"
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Spaces and commas are ignored, so ABDCE, A B D C E and A,B,D,C,E all work.
              Nothing is saved unless every letter fits its question.
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
    }
  };

  return (
    <li className={`px-3 py-3 ${unanswered ? "bg-red-50" : ""}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="w-[42px] shrink-0 text-[12px] font-semibold text-gray-700">Q. {index + 1}</span>

        <div className="shrink-0">
          {q.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.image} alt="" className="max-h-[120px] max-w-[320px] rounded border border-gray-300 bg-white" />
          ) : (
            <span className="text-[12px] text-gray-500">No picture</span>
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
