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
      <div className="mt-2">
        <ImageUpload
          label="Upload a picture into the instructions…"
          hint="Adds a new paragraph at the end carrying the picture."
          onUploaded={(url) => setBody((b) => appendLine(b, ` | | ${url}`))}
        />
      </div>
      <PictureSizes text={body} onChange={setBody} />

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
          onUploaded={(url) => setExample((b) => appendLine(b, ` | | ${url}`))}
        />
      </div>
      <PictureSizes text={example} onChange={setExample} />
    </SaveForm>
  );
}

/** Adds a picture-only line at the end of the text, keeping earlier lines. */
function appendLine(text: string, line: string): string {
  return `${text.replace(/\s*$/, "")}\n${line}`.trimStart();
}

/** The pictures in the text: which line each is on and its chosen width. */
function picturesIn(text: string): { line: number; url: string; width: string }[] {
  return text.split(/\r?\n/).flatMap((raw, line) => {
    const parts = raw.split("|");
    const url = (parts[2] ?? "").trim();
    if (!/^https?:\/\//i.test(url)) return [];
    const width = (parts[3] ?? "").trim().replace(/%$/, "") || "100";
    return [{ line, url, width }];
  });
}

/** Rewrites one line's width field, leaving every other line untouched. */
function withWidth(text: string, line: number, width: string): string {
  const lines = text.split(/\r?\n/);
  const parts = lines[line].split("|").map((p) => p.trim());
  const kept = parts.slice(0, 3);
  lines[line] = (width === "100" ? kept : [...kept, width]).join(" | ");
  return lines.join("\n");
}

/**
 * A size picker for every picture already in the text.
 *
 * Choosing a size rewrites that picture's line, so the size is part of the
 * text that gets saved — the picker is a friendlier way to type the fourth
 * field, not a separate setting that could disagree with it.
 */
function PictureSizes({
  text,
  onChange,
}: {
  text: string;
  onChange: (next: string) => void;
}) {
  const pictures = picturesIn(text);
  if (pictures.length === 0) return null;

  return (
    <div className="mt-3 rounded border border-gray-300 bg-white p-3">
      <p className="text-[12px] font-semibold text-gray-700">
        Picture size — how wide each picture is drawn in its column. Save to apply.
      </p>
      <ul className="mt-2 space-y-2">
        {pictures.map((pic) => {
          const known = IMAGE_WIDTHS.some((w) => w.value === pic.width);
          return (
            <li key={pic.line} className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pic.url}
                alt=""
                className="h-12 w-12 rounded border border-gray-200 object-contain"
                draggable={false}
              />
              <span className="text-[11px] text-gray-500">Line {pic.line + 1}</span>
              <select
                value={pic.width}
                onChange={(e) => onChange(withWidth(text, pic.line, e.target.value))}
                className="rounded border border-gray-400 px-2 py-1 text-[12px]"
              >
                {!known && <option value={pic.width}>{pic.width}%</option>}
                {IMAGE_WIDTHS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
