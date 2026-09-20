"use client";

import { useRef, useState } from "react";
import { IMPORT_BATCH, parseStudentLines } from "@/lib/parse-students";
import { importStudentBatch, type ImportOutcome } from "./actions";

const SAMPLE = `Name,Mobile,Password
Ram Kumar,9876543210,ram12345
Shyam Singh,9876543211,shyam12345`;

interface Progress {
  sent: number;
  total: number;
  made: number;
  skipped: string[];
  failed: string[];
  error: string | null;
  running: boolean;
}

/**
 * Many students at once, from a pasted block or a saved CSV.
 *
 * The whole list is checked here first, so a bad line stops everything
 * before a single account exists. Then it goes to the server a batch at a
 * time, and the running total is shown, so a list of thousands neither
 * outlives one request nor leaves the admin staring at a spinner.
 */
export function BulkStudents() {
  const [bulk, setBulk] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const file = useRef<HTMLInputElement | null>(null);

  const template = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const start = async () => {
    let students;
    try {
      students = parseStudentLines(bulk);
    } catch (e) {
      setProgress({ sent: 0, total: 0, made: 0, skipped: [], failed: [], running: false,
        error: e instanceof Error ? e.message : String(e) });
      return;
    }
    if (students.length === 0) {
      setProgress({ sent: 0, total: 0, made: 0, skipped: [], failed: [], running: false,
        error: "The list is empty" });
      return;
    }

    const state: Progress = {
      sent: 0, total: students.length, made: 0, skipped: [], failed: [], error: null, running: true,
    };
    setProgress({ ...state });

    // One batch at a time, in order: a failure stops the run at a known
    // point, and the auth server is never asked for thousands at once.
    for (let i = 0; i < students.length; i += IMPORT_BATCH) {
      const batch = students.slice(i, i + IMPORT_BATCH);
      const lines = batch.map((s) => `${s.fullName}\t${s.phone}\t${s.password}`).join("\n");
      let outcome: ImportOutcome;
      try {
        outcome = await importStudentBatch(lines, i + IMPORT_BATCH >= students.length);
      } catch (e) {
        outcome = { made: 0, skipped: [], failed: [], error: e instanceof Error ? e.message : String(e) };
      }
      state.made += outcome.made;
      state.skipped.push(...outcome.skipped);
      state.failed.push(...outcome.failed);
      state.sent = Math.min(students.length, i + batch.length);
      if (outcome.error) {
        state.error = `Stopped at student ${i + 1}: ${outcome.error}`;
        state.running = false;
        setProgress({ ...state });
        return;
      }
      setProgress({ ...state });
    }
    state.running = false;
    setProgress({ ...state });
  };

  const busy = progress?.running ?? false;

  return (
    <section className="mt-6 rounded border border-gray-300 bg-white p-5">
      <h2 className="text-[15px] font-bold text-gray-900">Add many students at once</h2>
      <p className="mt-1 text-[12px] text-gray-600">
        Paste straight out of Excel, or choose a CSV file. Three columns: name,
        mobile, password. Thousands at a time are fine: the accounts are made in
        batches of {IMPORT_BATCH} and the count below keeps moving.
      </p>

      <div className="mt-3 rounded border border-gray-300 bg-gray-50 p-3">
        <pre className="overflow-x-auto rounded bg-white p-3 text-[11px] leading-relaxed text-gray-700">
{SAMPLE}
        </pre>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>Commas or tabs both work — an Excel paste gives tabs.</li>
          <li>A header row like the one above is skipped automatically.</li>
          <li>
            Every line is checked before any account is made, so one bad line
            cannot leave half a batch created.
          </li>
          <li>A number that already has an account is reported, not overwritten.</li>
          <li>Keep this page open until the count says it has finished.</li>
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
          >
            Choose a CSV file…
          </button>
          <input
            ref={file}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setBulk(await f.text());
            }}
          />
          <button
            type="button"
            onClick={template}
            className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
          >
            Download a template
          </button>
        </div>
      </div>

      <textarea
        rows={8}
        value={bulk}
        disabled={busy}
        onChange={(e) => setBulk(e.target.value)}
        placeholder="Paste your student list here, or choose a file above…"
        className="mt-3 w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px] disabled:bg-gray-100"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !bulk.trim()}
          onClick={start}
          className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create these accounts"}
        </button>
        {progress && progress.total > 0 && (
          <span className="text-[12px] text-gray-700" aria-live="polite">
            {progress.sent} of {progress.total} sent · {progress.made} created
            {progress.skipped.length > 0 && ` · ${progress.skipped.length} already had accounts`}
            {progress.failed.length > 0 && ` · ${progress.failed.length} failed`}
            {!progress.running && !progress.error && " · finished"}
          </span>
        )}
      </div>

      {progress && progress.total > 0 && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-200">
          <div
            className={`h-full ${progress.error ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${Math.round((progress.sent / progress.total) * 100)}%` }}
          />
        </div>
      )}

      {progress?.error && (
        <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-800">
          {progress.error}
        </p>
      )}
      {progress && !progress.running && progress.skipped.length > 0 && (
        <details className="mt-2 text-[12px] text-gray-700">
          <summary className="cursor-pointer font-semibold">
            Already had accounts ({progress.skipped.length}) — not changed
          </summary>
          <p className="mt-1 break-all">{progress.skipped.join(", ")}</p>
        </details>
      )}
      {progress && !progress.running && progress.failed.length > 0 && (
        <details className="mt-2 text-[12px] text-red-800" open>
          <summary className="cursor-pointer font-semibold">Failed ({progress.failed.length})</summary>
          <p className="mt-1 break-all">{progress.failed.join("; ")}</p>
        </details>
      )}
    </section>
  );
}
