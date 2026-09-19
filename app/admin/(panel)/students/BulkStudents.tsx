"use client";

import { useRef, useState } from "react";
import { SaveForm } from "@/components/admin/SaveForm";
import { importStudents } from "./actions";

const SAMPLE = `Name,Mobile,Password
Ram Kumar,9876543210,ram12345
Shyam Singh,9876543211,shyam12345`;

/** Many students at once, from a pasted block or a saved CSV. */
export function BulkStudents() {
  const [bulk, setBulk] = useState("");
  const file = useRef<HTMLInputElement | null>(null);

  const template = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-6 rounded border border-gray-300 bg-white p-5">
      <h2 className="text-[15px] font-bold text-gray-900">Add many students at once</h2>
      <p className="mt-1 text-[12px] text-gray-600">
        Paste straight out of Excel, or choose a CSV file. Three columns: name,
        mobile, password.
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

      <SaveForm action={importStudents} submitLabel="Create these accounts" className="mt-3">
        <textarea
          name="bulk"
          rows={8}
          required
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder="Paste your student list here, or choose a file above…"
          className="w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px]"
        />
      </SaveForm>
    </section>
  );
}
