"use client";

import { useState } from "react";
import { deleteQuestion, importQuestions, saveQuestion } from "../../actions";

interface Choice {
  key: string;
  label?: { en: string; hi: string };
}

interface QuestionRow {
  id: string;
  prompt_en: string;
  prompt_hi: string;
  choices: Choice[];
  correct: string | null;
  position: number;
}

/**
 * Question list plus the two ways of adding them: one at a time, or a pasted
 * block for bulk import — which is how a full paper actually gets loaded.
 */
export function QuestionManager({
  testId,
  sectionId,
  blockId,
  questions,
}: {
  testId: string;
  sectionId: string;
  blockId: string;
  questions: QuestionRow[];
}) {
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);

  if (!blockId) {
    return (
      <p className="mt-5 rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800">
        This section has no question group yet. Delete and re-add the section.
      </p>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-[14px] font-bold text-gray-900">
          Questions ({questions.length})
        </h3>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAdding((v) => !v);
              setEditing(null);
              setBulk(false);
            }}
            className="rounded bg-green-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-green-800"
          >
            + Add one
          </button>
          <button
            type="button"
            onClick={() => {
              setBulk((v) => !v);
              setAdding(false);
              setEditing(null);
            }}
            className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
          >
            Bulk import
          </button>
        </div>
      </div>

      {bulk && (
        <form
          action={importQuestions}
          className="mt-3 rounded border border-gray-300 bg-gray-50 p-4"
        >
          <input type="hidden" name="section_id" value={sectionId} />
          <input type="hidden" name="block_id" value={blockId} />
          <input type="hidden" name="test_id" value={testId} />

          <p className="text-[12px] text-gray-700">
            One question per line, fields separated by <code>|</code>. The last field is the
            correct option — leave it empty for an unscored question.
          </p>
          <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[11px] text-gray-600">
{`What is 2 + 2? | A. 3 | B. 4 | C. 5 | D. 6 | B
Which is a metal? | A. Wood | B. Iron | C. Glass | D. Paper | B`}
          </pre>

          <textarea
            name="bulk"
            rows={8}
            required
            placeholder="Paste your questions here…"
            className="mt-2 w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px]"
          />
          <button
            type="submit"
            className="mt-2 rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900"
          >
            Import questions
          </button>
        </form>
      )}

      {(adding || editing) && (
        <QuestionForm
          key={editing?.id ?? "new"}
          testId={testId}
          sectionId={sectionId}
          blockId={blockId}
          question={editing}
          onDone={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {questions.length === 0 ? (
        <p className="mt-3 rounded border border-gray-300 bg-white px-3 py-4 text-center text-[13px] text-gray-500">
          No questions in this section yet.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-gray-200 rounded border border-gray-300 bg-white">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-3 px-3 py-2.5">
              <span className="shrink-0 text-[12px] font-semibold text-gray-400">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-gray-900">{q.prompt_en}</p>
                {q.prompt_hi && (
                  <p className="text-[12px] text-gray-500" lang="hi">
                    {q.prompt_hi}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {q.choices.map((c) => c.key).join(" · ")}
                  {q.correct ? (
                    <span className="ml-2 font-semibold text-green-700">
                      Answer: {q.correct}
                    </span>
                  ) : (
                    <span className="ml-2 text-gray-400">no answer key</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(q);
                    setAdding(false);
                    setBulk(false);
                  }}
                  className="text-[12px] font-semibold text-rrb-banner hover:underline"
                >
                  Edit
                </button>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="test_id" value={testId} />
                  <button
                    type="submit"
                    className="text-[12px] font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function QuestionForm({
  testId,
  sectionId,
  blockId,
  question,
  onDone,
}: {
  testId: string;
  sectionId: string;
  blockId: string;
  question: QuestionRow | null;
  onDone: () => void;
}) {
  // Four option rows by default; existing questions show however many they have.
  const existing = question?.choices ?? [];
  const rows = Math.max(4, existing.length);

  return (
    <form
      action={async (formData) => {
        await saveQuestion(formData);
        onDone();
      }}
      className="mt-3 rounded border border-gray-300 bg-gray-50 p-4"
    >
      <input type="hidden" name="id" value={question?.id ?? ""} />
      <input type="hidden" name="section_id" value={sectionId} />
      <input type="hidden" name="block_id" value={blockId} />
      <input type="hidden" name="test_id" value={testId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Question (English) <span className="text-red-600">*</span>
          </span>
          <textarea
            name="prompt_en"
            rows={2}
            required
            defaultValue={question?.prompt_en}
            className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Question (Hindi)
          </span>
          <textarea
            name="prompt_hi"
            rows={2}
            defaultValue={question?.prompt_hi}
            className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
          />
        </label>
      </div>

      <p className="mt-3 text-[12px] font-semibold text-gray-700">Options</p>
      <div className="mt-1 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[70px_1fr_1fr] gap-2">
            <input
              name={`option_key_${i}`}
              placeholder={String.fromCharCode(65 + i)}
              defaultValue={existing[i]?.key ?? String.fromCharCode(65 + i)}
              className="rounded border border-gray-400 px-2 py-1.5 text-center text-[13px] font-semibold"
            />
            <input
              name={`option_label_en_${i}`}
              placeholder="Option text (English)"
              defaultValue={existing[i]?.label?.en ?? ""}
              className="rounded border border-gray-400 px-2 py-1.5 text-[13px]"
            />
            <input
              name={`option_label_hi_${i}`}
              placeholder="विकल्प (Hindi)"
              defaultValue={existing[i]?.label?.hi ?? ""}
              className="rounded border border-gray-400 px-2 py-1.5 text-[13px]"
            />
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Leave the key blank to drop an option. Leave the text blank to show just the letter.
      </p>

      <label className="mt-3 block max-w-[220px]">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          Correct option
        </span>
        <input
          name="correct"
          placeholder="B"
          defaultValue={question?.correct ?? ""}
          className="w-full rounded border border-gray-400 px-3 py-2 text-[14px] font-semibold"
        />
        <span className="mt-1 block text-[11px] text-gray-500">
          Blank = not scored (personality test)
        </span>
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900"
        >
          {question ? "Save changes" : "Add question"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-gray-400 bg-white px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
