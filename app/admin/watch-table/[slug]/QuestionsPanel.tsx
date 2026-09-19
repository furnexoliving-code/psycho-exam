"use client";

import { useRef, useState } from "react";
import { SaveForm } from "@/components/admin/SaveForm";
import type { WatchQuestion } from "@/lib/wt/types";
import {
  deleteQuestion,
  importQuestions,
  regenerateQuestions,
  saveQuestion,
} from "../actions";

const FORMAT_HELP = `# English question | Hindi question | options | answer | topic
Starting from West travel right-handedly up to South-West. Which number appears most? | पश्चिम से शुरू करके दाएं हाथ से दक्षिण-पश्चिम तक जाएँ। कौन सी संख्या सबसे अधिक बार आती है? | 1,2,3,4,5 | 3 | Most frequent number`;

/**
 * The questions half of the panel.
 *
 * Uploading is the main path — the questions are the institute's, not ours.
 * "Build a sample set" exists only so a new paper shows what the format looks
 * like before anyone has typed anything.
 */
export function QuestionsPanel({
  slug,
  questions,
}: {
  slug: string;
  questions: WatchQuestion[];
}) {
  const [tab, setTab] = useState<"upload" | "list">("upload");
  const [bulk, setBulk] = useState("");
  const [editing, setEditing] = useState<WatchQuestion | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  /** What is saved, written in exactly the format the box accepts back. */
  const asText = () =>
    [
      "# English question | Hindi question | options | answer | topic",
      "# One question per line. Lines starting with # are ignored.",
      ...questions.map((q) =>
        [q.prompt.en, q.prompt.hi, q.options.join(","), q.answer, q.topic ?? ""].join(
          " | ",
        ),
      ),
    ].join("\n");

  const download = () => {
    const url = URL.createObjectURL(new Blob([asText()], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-questions.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    setBulk(await file.text());
    setTab("upload");
  };

  return (
    <section className="mt-6 rounded border border-gray-300 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[15px] font-bold text-gray-900">
          Questions ({questions.length})
        </h2>

        <div className="ml-auto flex gap-2">
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
            Bulk upload / edit
          </TabButton>
          <TabButton active={tab === "list"} onClick={() => setTab("list")}>
            Saved questions
          </TabButton>
        </div>
      </div>

      {tab === "upload" ? (
        <div className="mt-4">
          <div className="rounded border border-gray-300 bg-gray-50 p-4">
            <p className="text-[13px] font-semibold text-gray-800">
              One question per line, four fields separated by <code>|</code>
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-[11px] leading-relaxed text-gray-700">
{FORMAT_HELP}
            </pre>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
              <li>Leave the Hindi field empty if you do not need it — keep the two bars.</li>
              <li>The options are shown in the order you write them.</li>
              <li>The answer must be one of the options, or the upload is refused.</li>
              <li>
                The fifth field, the topic, is optional but worth filling in — the
                result breaks the marks down by it, so a candidate can see what to
                revise.
              </li>
              <li>Nothing is saved until every line passes, so one typo cannot leave half a paper.</li>
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
              >
                Choose a file…
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void readFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => setBulk(asText())}
                disabled={questions.length === 0}
                className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              >
                Edit all {questions.length} in the box below
              </button>
              <button
                type="button"
                onClick={download}
                disabled={questions.length === 0}
                className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              >
                Download what is saved
              </button>
            </div>
          </div>

          <SaveForm action={importQuestions} submitLabel="Upload questions" className="mt-4">
            <input type="hidden" name="slug" value={slug} />
            <textarea
              name="bulk"
              rows={12}
              required
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder="Paste your questions here, or choose a file above…"
              className="w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px]"
            />

            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" name="append" className="h-4 w-4" />
              <span className="text-[12px] text-gray-700">
                Add to the existing questions instead of replacing them
                <span className="block text-[11px] text-gray-500">
                  Leave this off when you have loaded the saved questions above and
                  edited them — the edited set then replaces the old one.
                </span>
              </span>
            </label>

          </SaveForm>

          <form
            action={regenerateQuestions}
            className="mt-6 border-t border-gray-200 pt-4"
          >
            <input type="hidden" name="slug" value={slug} />
            <p className="text-[12px] font-semibold text-gray-800">
              Only need a sample to see the format?
            </p>
            <p className="mt-0.5 text-[11px] text-gray-600">
              Builds questions from the saved diagram and works out every answer
              itself. Replaces whatever is there. Use it to fill a new paper, then
              download it as a starting file.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                name="count"
                type="number"
                min={1}
                max={60}
                defaultValue={20}
                className="w-[80px] rounded border border-gray-400 px-2 py-1.5 text-center text-[13px]"
              />
              <button
                type="submit"
                className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
              >
                Build a sample set
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-4">
          {questions.length === 0 ? (
            <p className="rounded border border-gray-300 px-3 py-6 text-center text-[13px] text-gray-500">
              No questions yet. Upload some.
            </p>
          ) : (
            <ol className="divide-y divide-gray-200 rounded border border-gray-300">
              {questions.map((q, i) => (
                <li key={q.id} className="px-3 py-2.5">
                  {editing?.id === q.id ? (
                    <form
                      action={async (formData) => {
                        await saveQuestion(formData);
                        setEditing(null);
                      }}
                      className="space-y-2"
                    >
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <textarea
                        name="prompt_en"
                        rows={2}
                        defaultValue={q.prompt.en}
                        className="w-full rounded border border-gray-400 px-2 py-1.5 text-[13px]"
                      />
                      <textarea
                        name="prompt_hi"
                        rows={2}
                        defaultValue={q.prompt.hi}
                        className="w-full rounded border border-gray-400 px-2 py-1.5 text-[13px]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <label className="text-[11px] font-semibold text-gray-700">
                          Options
                          <input
                            name="options"
                            defaultValue={q.options.join(",")}
                            className="ml-2 w-[150px] rounded border border-gray-400 px-2 py-1 text-[13px] font-normal"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-gray-700">
                          Answer
                          <input
                            name="answer"
                            type="number"
                            defaultValue={q.answer}
                            className="ml-2 w-[70px] rounded border border-gray-400 px-2 py-1 text-[13px] font-normal"
                          />
                        </label>
                        <label className="text-[11px] font-semibold text-gray-700">
                          Topic
                          <input
                            name="topic"
                            defaultValue={q.topic ?? ""}
                            className="ml-2 w-[190px] rounded border border-gray-400 px-2 py-1 text-[13px] font-normal"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="w-[34px] shrink-0 text-[12px] font-semibold text-gray-400">
                        {i + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-gray-900">{q.prompt.en}</p>
                        {q.prompt.hi && (
                          <p className="text-[12px] text-gray-500" lang="hi">
                            {q.prompt.hi}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Options {q.options.join(" · ")}
                          <span className="ml-2 font-semibold text-green-700">
                            Answer: {q.answer}
                          </span>
                          {q.topic && (
                            <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700">
                              {q.topic}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(q)}
                          className="text-[12px] font-semibold text-rrb-banner hover:underline"
                        >
                          Edit
                        </button>
                        <form action={deleteQuestion}>
                          <input type="hidden" name="id" value={q.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <button
                            type="submit"
                            className="text-[12px] font-semibold text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-4 py-1.5 text-[12px] font-semibold ${
        active
          ? "bg-indigo-800 text-white"
          : "border border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
