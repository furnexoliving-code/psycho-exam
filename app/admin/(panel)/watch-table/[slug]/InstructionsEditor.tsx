"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { SaveForm } from "@/components/admin/SaveForm";
import { saveInstructions } from "../actions";
import { IMAGE_WIDTHS } from "./labels";

const SAMPLE = `Read every question carefully. | हर प्रश्न ध्यान से पढ़ें।
Look at the picture below. | नीचे दिया चित्र देखें। | https://…/example.png | 60`;

/**
 * The instruction screen's wording and pictures.
 *
 * Words and picture live on the same line so a paragraph and its illustration
 * cannot drift apart — reordering the text reorders the pictures with it. The
 * picture's width rides on the same line too, as a fourth field, so it can be
 * changed later by editing the number without uploading again.
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
    <SaveForm action={saveInstructions} submitLabel="Save the instructions" className="mt-4">
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
          <li>
            Picture size: a number after a fourth bar is the width in percent of the
            column (10–100), e.g. <code>| 60</code>. Leave it out for full width. Change
            the number any time to resize without uploading again.
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
      <PictureAdder
        label="Upload a picture into the instructions…"
        hint="Adds a new paragraph at the end carrying the picture."
        onLine={(line) => setBody((b) => appendLine(b, line))}
      />

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
      <PictureAdder
        label="Upload a picture into the example…"
        onLine={(line) => setExample((b) => appendLine(b, line))}
      />
    </SaveForm>
  );
}

/** Adds a picture-only line at the end of the text, keeping earlier lines. */
function appendLine(text: string, line: string): string {
  return `${text.replace(/\s*$/, "")}\n${line}`.trimStart();
}

/**
 * The upload button with the size the new picture should be drawn at.
 *
 * The size is chosen before uploading and written into the new line, so the
 * admin never has to know the fourth-field syntax to get a smaller picture —
 * but it is plain text, so it can still be changed by hand later.
 */
function PictureAdder({
  label,
  hint,
  onLine,
}: {
  label: string;
  hint?: string;
  onLine: (line: string) => void;
}) {
  const [width, setWidth] = useState("100");

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <ImageUpload
        label={label}
        hint={hint}
        onUploaded={(url) => onLine(width === "100" ? ` | | ${url}` : ` | | ${url} | ${width}`)}
      />
      <label className="flex items-center gap-2 text-[12px] text-gray-700">
        <span className="font-semibold">Picture size</span>
        <select
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          className="rounded border border-gray-400 px-2 py-1 text-[12px]"
        >
          {IMAGE_WIDTHS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
