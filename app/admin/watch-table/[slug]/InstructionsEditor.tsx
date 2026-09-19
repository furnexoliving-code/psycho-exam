"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { saveInstructions } from "../actions";

const SAMPLE = `Read every question carefully. | हर प्रश्न ध्यान से पढ़ें।
Look at the picture below. | नीचे दिया चित्र देखें। | https://…/example.png`;

/**
 * The instruction screen's wording and pictures.
 *
 * Words and picture live on the same line so a paragraph and its illustration
 * cannot drift apart — reordering the text reorders the pictures with it.
 */
export function InstructionsEditor({
  slug,
  instructions,
  exampleText,
}: {
  slug: string;
  instructions: string;
  exampleText: string;
}) {
  const [body, setBody] = useState(instructions);
  const [example, setExample] = useState(exampleText);

  return (
    <form action={saveInstructions} className="mt-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="rounded border border-gray-300 bg-gray-50 p-3">
        <p className="text-[13px] font-semibold text-gray-800">
          One paragraph per line: <code>English | Hindi</code>, and a picture link
          after a third bar when the paragraph needs one.
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-[11px] leading-relaxed text-gray-700">
{SAMPLE}
        </pre>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[11px] text-gray-600">
          <li>Leave the Hindi side empty if you do not need it — but keep the bar.</li>
          <li>
            For a picture on its own, leave both text sides empty and give only the
            link: <code>| | https://…</code>
          </li>
          <li>Nothing is saved until every line is valid, so one typo cannot half-save.</li>
        </ul>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          Instructions
        </span>
        <textarea
          name="instructions"
          rows={9}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px]"
        />
      </label>
      <div className="mt-2">
        <ImageUpload
          label="Upload a picture into the instructions…"
          hint="Adds a new paragraph at the end carrying the picture."
          onUploaded={(url) =>
            setBody((b) => `${b.replace(/\s*$/, "")}\n | | ${url}`.trimStart())
          }
        />
      </div>

      <label className="mt-6 block">
        <span className="mb-1 block text-[12px] font-semibold text-gray-700">
          The worked example, below the instructions
        </span>
        <textarea
          name="example_text"
          rows={5}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          className="w-full rounded border border-gray-400 px-3 py-2 font-mono text-[12px]"
        />
      </label>
      <div className="mt-2">
        <ImageUpload
          label="Upload a picture into the example…"
          onUploaded={(url) =>
            setExample((b) => `${b.replace(/\s*$/, "")}\n | | ${url}`.trimStart())
          }
        />
      </div>

      <button
        type="submit"
        className="mt-5 rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
      >
        Save the instructions
      </button>
    </form>
  );
}
