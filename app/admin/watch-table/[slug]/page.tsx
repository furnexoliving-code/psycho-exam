import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableDiagram } from "@/components/wt/WatchTableDiagram";
import { loadPaperForAdmin } from "@/lib/wt/db";
import { createClient } from "@/lib/supabase/server";
import { DIRECTIONS, DIRECTION_NAME, resolveFeatures } from "@/lib/wt/types";
import { deletePaper, saveDiagram, saveSettings } from "../actions";
import { QuestionsPanel } from "./QuestionsPanel";
import { FEATURE_LABELS } from "./labels";

export default async function EditWatchPaper({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = await loadPaperForAdmin(slug);
  if (!paper) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("watch_papers")
    .select(
      "is_published, image_url, reference_mean, reference_sd, stats_min_attempts",
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">{paper.displayName}</h1>
        <Link
          href={`/watch-table/${slug}`}
          target="_blank"
          className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          Preview the exam ↗
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

          <h3 className="mt-5 text-[13px] font-bold text-gray-900">
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

            <label className="mt-4 block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">
                Or show your own image instead (paste a link)
              </span>
              <input
                name="image_url"
                defaultValue={row?.image_url ?? ""}
                placeholder="https://…/watch-table.png"
                className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
              />
              <span className="mt-1 block text-[11px] text-gray-500">
                When set, the exam shows this picture in place of the drawing. Keep
                the eight positions above filled in anyway — they are what the
                answers are checked against.
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
