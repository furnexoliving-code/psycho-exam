import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createSection,
  deleteSection,
  deleteTest,
  updateSection,
  updateTest,
} from "../../actions";
import { QuestionManager } from "./QuestionManager";

const SECTION_KINDS = [
  ["following-directions", "Following Directions Test"],
  ["memory", "Track Memory Test"],
  ["intelligence", "Intelligence Test"],
  ["selective-attention", "Selective Attention Test"],
  ["spatial-scanning", "Spatial Scanning Test"],
  ["personality", "Personality Test"],
] as const;

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("tests")
    .select("id, slug, name_en, name_hi, display_name, is_free, is_published")
    .eq("id", id)
    .single();
  if (!test) notFound();

  const { data: sections } = await supabase
    .from("sections")
    .select("id, kind, name_en, name_hi, time_limit_min, scored, position, instructions")
    .eq("test_id", id)
    .order("position");

  const sectionIds = (sections ?? []).map((s) => s.id);

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, section_id, title_en, position")
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position");

  const { data: questions } = await supabase
    .from("questions")
    .select("id, section_id, block_id, prompt_en, prompt_hi, choices, correct, position")
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position");

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">{test.display_name}</h1>
      <p className="mt-1 text-[12px] text-gray-500">
        Students reach it at <code className="rounded bg-gray-200 px-1">/exam/{test.slug}</code>
      </p>

      {/* ---------------- Test settings ---------------- */}
      <section className="mt-5 rounded border border-gray-300 bg-white p-5">
        <h2 className="mb-3 text-[15px] font-bold text-gray-900">Test details</h2>
        <form action={updateTest} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={test.id} />
          <Text name="name_en" label="Name (English)" defaultValue={test.name_en} />
          <Text name="name_hi" label="Name (Hindi)" defaultValue={test.name_hi} />
          <Text
            name="display_name"
            label="Toolbar title"
            defaultValue={test.display_name}
          />
          <div className="flex items-end gap-5">
            <Check name="is_free" label="Free" defaultChecked={test.is_free} />
            <Check name="is_published" label="Published" defaultChecked={test.is_published} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
            >
              Save details
            </button>
          </div>
        </form>

        {!test.is_published && (
          <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            This test is a draft — students cannot see it. Tick <strong>Published</strong> and
            save when it is ready.
          </p>
        )}
      </section>

      {/* ---------------- Sections ---------------- */}
      <section className="mt-6">
        <h2 className="text-[15px] font-bold text-gray-900">
          Sections ({sections?.length ?? 0})
        </h2>

        {(sections ?? []).map((section) => {
          const sectionBlocks = (blocks ?? []).filter((b) => b.section_id === section.id);
          const sectionQuestions = (questions ?? []).filter(
            (q) => q.section_id === section.id,
          );
          const instructions = (section.instructions ?? []) as { en: string; hi: string }[];

          return (
            <details
              key={section.id}
              className="mt-3 rounded border border-gray-300 bg-white"
              open={(sections ?? []).length === 1}
            >
              <summary className="cursor-pointer list-none px-5 py-3 hover:bg-gray-50">
                <span className="text-[14px] font-bold text-gray-900">{section.name_en}</span>
                <span className="ml-3 text-[12px] text-gray-500">
                  {sectionQuestions.length} questions · {section.time_limit_min} min ·{" "}
                  {section.scored ? "scored" : "not scored"}
                </span>
              </summary>

              <div className="border-t border-gray-200 px-5 py-4">
                <form action={updateSection} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="test_id" value={test.id} />
                  <Text name="name_en" label="Section name (English)" defaultValue={section.name_en} />
                  <Text name="name_hi" label="Section name (Hindi)" defaultValue={section.name_hi} />
                  <Text
                    name="time_limit_min"
                    label="Time limit (minutes)"
                    type="number"
                    defaultValue={String(section.time_limit_min)}
                  />
                  <div className="flex items-end">
                    <Check name="scored" label="Scored" defaultChecked={section.scored} />
                  </div>

                  <Area
                    name="instructions_en"
                    label="Instructions (English) — one paragraph per line"
                    defaultValue={instructions.map((i) => i.en).join("\n")}
                  />
                  <Area
                    name="instructions_hi"
                    label="Instructions (Hindi) — same order"
                    defaultValue={instructions.map((i) => i.hi).join("\n")}
                  />

                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
                    >
                      Save section
                    </button>
                  </div>
                </form>

                <QuestionManager
                  testId={test.id}
                  sectionId={section.id}
                  blockId={sectionBlocks[0]?.id ?? ""}
                  questions={sectionQuestions}
                />

                <form action={deleteSection} className="mt-6 border-t border-gray-200 pt-3">
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="test_id" value={test.id} />
                  <button
                    type="submit"
                    className="text-[12px] font-semibold text-red-700 hover:underline"
                  >
                    Delete this section and all its questions
                  </button>
                </form>
              </div>
            </details>
          );
        })}

        {/* Add a section */}
        <form
          action={createSection}
          className="mt-4 grid gap-3 rounded border border-dashed border-gray-400 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="test_id" value={test.id} />
          <div className="sm:col-span-2 text-[14px] font-bold text-gray-900">Add a section</div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Type</span>
            <select
              name="kind"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
            >
              {SECTION_KINDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <Text name="name_en" label="Name (English)" required placeholder="Following Directions Test" />
          <Text name="name_hi" label="Name (Hindi)" placeholder="निर्देश पालन परीक्षण" />
          <Text name="time_limit_min" label="Time limit (minutes)" type="number" defaultValue="10" />

          <div className="flex items-end gap-5">
            <Check name="scored" label="Scored" defaultChecked />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              + Add section
            </button>
          </div>
        </form>
      </section>

      <form action={deleteTest} className="mt-10 border-t border-gray-300 pt-4">
        <input type="hidden" name="id" value={test.id} />
        <button type="submit" className="text-[12px] font-semibold text-red-700 hover:underline">
          Delete this entire test
        </button>
      </form>
    </>
  );
}

function Text({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
      />
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-gray-700">{label}</span>
      <textarea
        name={name}
        rows={5}
        defaultValue={defaultValue}
        className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
      />
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      <span className="text-[13px] text-gray-800">{label}</span>
    </label>
  );
}
