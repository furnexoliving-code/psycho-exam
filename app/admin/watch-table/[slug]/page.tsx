import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableDiagram } from "@/components/wt/WatchTableDiagram";
import { loadPaperForAdmin } from "@/lib/wt/db";
import { createClient } from "@/lib/supabase/server";
import { DIRECTIONS, DIRECTION_NAME, resolveFeatures } from "@/lib/wt/types";
import { deletePaper, duplicatePaper, saveDiagram, saveSettings } from "../actions";
import { formatInstructionLines } from "@/lib/wt/parse-instructions";
import { DiagramImageField } from "./DiagramImageField";
import { InstructionsEditor } from "./InstructionsEditor";
import { QuestionsPanel } from "./QuestionsPanel";
import { FEATURE_LABELS, FONT_STEPS, IMAGE_WIDTHS } from "./labels";

export default async function EditWatchPaper({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { slug } = await params;
  const { error: saveError, saved } = await searchParams;
  const paper = await loadPaperForAdmin(slug);
  if (!paper) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("watch_papers")
    .select(
      "is_published, image_url, image_width_pct, font_scale, reference_mean, reference_sd, stats_min_attempts, cut_off_marks, cut_off_tscore, expert_comment",
    )
    .eq("slug", slug)
    .single();

  const { count: attemptCount } = await supabase
    .from("watch_attempts")
    .select("id", { count: "exact", head: true })
    .eq("paper_id", (await supabase.from("watch_papers").select("id").eq("slug", slug).single()).data?.id ?? "");

  const cells = paper.tables[0].cells;
  const features = resolveFeatures(paper.features);

  return (
    <>
      {saveError && (
        <p
          role="alert"
          className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-800"
        >
          Not saved — {saveError}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-800">
          {saved} saved.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">{paper.displayName}</h1>
        <Link
          href={`/watch-table/${slug}`}
          target="_blank"
          className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Preview the exam ↗
        </Link>
        <Link
          href={`/admin/watch-table/${slug}/results`}
          className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Results{typeof attemptCount === "number" ? ` (${attemptCount})` : ""}
        </Link>
        <Link
          href={`/admin/watch-table/${slug}/analysis`}
          className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Question analysis
        </Link>
      </div>

      {/* ------------------------------ Settings ------------------------------ */}
      <section className="mt-5 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Timers and controls</h2>

        <form action={saveSettings} className="mt-3">
          <input type="hidden" name="slug" value={slug} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name in the toolbar" name="display_name" defaultValue={paper.displayName} />
            <Field label="Test name on the tabs" name="title" defaultValue={paper.title} />

            <Number
              label="Instruction screen time"
              name="instruction_time_min"
              defaultValue={paper.instructionTimeLimitMin}
              min={1}
              max={120}
              hint="Minutes to read the instructions. The test opens by itself when this runs out."
            />
            <Number
              label="Test time"
              name="time_limit_min"
              defaultValue={paper.timeLimitMin}
              min={1}
              max={300}
              hint="Minutes for the questions. The paper submits itself when this runs out."
            />
          </div>

          <h3 className="mt-6 text-[13px] font-bold text-gray-900">
            Question text size
          </h3>
          <label className="mt-2 block max-w-xs">
            <select
              name="font_scale"
              defaultValue={String(row?.font_scale ?? 1)}
              className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
            >
              {FONT_STEPS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-gray-500">
              The size the questions are shown at for every candidate.
            </span>
          </label>

          <h3 className="mt-6 text-[13px] font-bold text-gray-900">
            What the candidate can use
          </h3>
          <div className="mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {FEATURE_LABELS.map((f) => (
              <label key={f.name} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name={f.name}
                  defaultChecked={features[f.name]}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="text-[13px] text-gray-800">
                  {f.label}
                  <span className="block text-[11px] text-gray-500">{f.hint}</span>
                </span>
              </label>
            ))}
          </div>

          <h3 className="mt-6 text-[13px] font-bold text-gray-900">Cut off</h3>
          <p className="mt-0.5 text-[11px] text-gray-600">
            Leave both blank for no qualifying bar. When both are set, a
            candidate must clear each of them. RRB&apos;s own bar is a T-score of 42.
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Cut off by marks
              </span>
              <input
                name="cut_off_marks"
                type="number"
                defaultValue={row?.cut_off_marks ?? ""}
                placeholder="e.g. 14"
                className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Cut off by T-score
              </span>
              <input
                name="cut_off_tscore"
                type="number"
                step="0.1"
                defaultValue={row?.cut_off_tscore ?? ""}
                placeholder="e.g. 42"
                className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">
              Expert&apos;s comment
            </span>
            <input
              name="expert_comment"
              defaultValue={row?.expert_comment ?? ""}
              placeholder="The level of the exam is easy-moderate"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Shown on every candidate&apos;s result for this paper. Leave blank to hide it.
            </span>
          </label>

          <h3 className="mt-6 text-[13px] font-bold text-gray-900">
            T-Score
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-600">
            T = 50 + 10 × (marks − mean) ÷ standard deviation. Once{" "}
            <strong>{row?.stats_min_attempts ?? 5}</strong> papers have been
            submitted the live figures are used. Until then these reference
            figures stand in — leave them blank and the T-score simply waits.
            {typeof attemptCount === "number" && (
              <span className="ml-1 font-semibold">
                {attemptCount} submitted so far.
              </span>
            )}
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Reference mean
              </span>
              <input
                name="reference_mean"
                type="number"
                step="0.01"
                defaultValue={row?.reference_mean ?? ""}
                placeholder="e.g. 11.5"
                className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Reference standard deviation
              </span>
              <input
                name="reference_sd"
                type="number"
                step="0.01"
                min="0"
                defaultValue={row?.reference_sd ?? ""}
                placeholder="e.g. 3.2"
                className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Switch to live figures after
              </span>
              <input
                name="stats_min_attempts"
                type="number"
                min={1}
                defaultValue={row?.stats_min_attempts ?? 5}
                className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
              />
              <span className="mt-1 block text-[11px] text-gray-500">papers</span>
            </label>
          </div>

          <label className="mt-5 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={row?.is_published ?? false}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-[13px] text-amber-900">
              Published — students can open this paper
              <span className="block text-[11px]">
                Leave it off while you are still editing.
              </span>
            </span>
          </label>

          <button
            type="submit"
            className="mt-4 rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            Save settings
          </button>
        </form>
      </section>

      {/* ---------------------------- Instructions ---------------------------- */}
      <section className="mt-6 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">
          The instruction screen
        </h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Every word the candidate reads before the test opens. One paragraph per
          line, English and Hindi separated by a bar.
        </p>

        <InstructionsEditor
          slug={slug}
          instructions={formatInstructionLines(paper.instructions)}
          exampleText={formatInstructionLines(paper.example.text)}
        />
      </section>

      {/* ------------------------------ Diagram ------------------------------- */}
      <section className="mt-6 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">The diagram</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Eight positions round the circle, clockwise from the top. Each carries a
          letter and the number inside its square.
        </p>

        <form action={saveDiagram} className="mt-3 flex flex-col gap-6 lg:flex-row">
          <input type="hidden" name="slug" value={slug} />

          <div className="min-w-0 flex-1">
            <div className="grid gap-2 sm:grid-cols-2">
              {DIRECTIONS.map((direction) => {
                const cell = cells.find((c) => c.direction === direction);
                return (
                  <div key={direction} className="flex items-center gap-2">
                    <span className="w-[86px] shrink-0 text-[12px] font-semibold text-gray-700">
                      {DIRECTION_NAME[direction].en}
                    </span>
                    <input
                      name={`cell_${direction}_letter`}
                      defaultValue={cell?.letter ?? ""}
                      maxLength={2}
                      required
                      aria-label={`${DIRECTION_NAME[direction].en} letter`}
                      className="w-[58px] rounded border border-gray-400 px-2 py-1.5 text-center text-[14px] font-bold uppercase"
                    />
                    <input
                      name={`cell_${direction}_value`}
                      type="number"
                      min={0}
                      defaultValue={cell?.value ?? 1}
                      required
                      aria-label={`${DIRECTION_NAME[direction].en} number`}
                      className="w-[72px] rounded border border-gray-400 px-2 py-1.5 text-center text-[14px]"
                    />
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              Letters must all differ. Use between two and five different numbers —
              a question shows five options, and they are these numbers.
            </p>

            <DiagramImageField defaultUrl={row?.image_url ?? ""} />

            <label className="mt-4 block max-w-xs">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                How wide the image is drawn
              </span>
              <select
                name="image_width_pct"
                defaultValue={String(row?.image_width_pct ?? 100)}
                className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
              >
                {IMAGE_WIDTHS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-gray-500">
                Shrinks the picture inside its own column — it never spills over.
                Use this when your image is too big, instead of re-cropping it.
              </span>
            </label>

            <button
              type="submit"
              className="mt-4 rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
            >
              Save diagram
            </button>
          </div>

          <div className="shrink-0 lg:w-[300px]">
            <p className="mb-2 text-[12px] font-semibold text-gray-700">
              Saved diagram
            </p>
            <WatchTableDiagram table={paper.tables[0]} />
          </div>
        </form>
      </section>

      {/* ----------------------------- Questions ------------------------------ */}
      <QuestionsPanel slug={slug} questions={paper.questions} />

      {/* ------------------------------- Copy -------------------------------- */}
      <section className="mt-6 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Make another test from this one</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Copies the diagram, the instructions, every setting and all{" "}
          {paper.questions.length} questions. The copy starts unpublished, so you
          can change the questions before any student sees it.
        </p>

        <form action={duplicatePaper} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">
              Name for the copy
            </span>
            <input
              name="display_name"
              placeholder={`${paper.displayName} (copy)`}
              className="w-[280px] rounded border border-gray-400 px-3 py-2 text-[13px]"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            Copy this test
          </button>
        </form>
      </section>

      <form action={deletePaper} className="mt-10 border-t border-gray-300 pt-4">
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className="text-[12px] font-semibold text-red-700 hover:underline">
          Delete this paper and all its questions
        </button>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-gray-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
      />
    </label>
  );
}

function Number({
  label,
  name,
  defaultValue,
  min,
  max,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: number;
  min: number;
  max: number;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          name={name}
          type="number"
          min={min}
          max={max}
          defaultValue={defaultValue}
          className="w-[110px] rounded border border-gray-400 px-3 py-2 text-[14px]"
        />
        <span className="text-[13px] text-gray-600">minutes</span>
      </div>
      <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>
    </label>
  );
}
