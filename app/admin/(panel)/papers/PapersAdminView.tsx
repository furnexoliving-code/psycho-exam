import Link from "next/link";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { sectionOf } from "@/lib/wt/sections";
import { RowForm } from "@/components/admin/RowForm";
import type { PaperSummary } from "@/lib/wt/db";
import { createPaper, deletePaper, setBatteryVisibility } from "./actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { PendingButton } from "@/components/admin/PendingButton";

/**
 * The Test papers page: every paper, by battery and then by the kind of
 * test, in the hall's order. The form for a new paper stands at the top,
 * since that is what the page is opened for most; each battery folds up,
 * with its counts on the fold, so nineteen kinds of test stay one screen.
 */
export function PapersAdminView({
  papers,
  hidden,
  isAdmin,
  error,
  saved,
}: {
  papers: PaperSummary[];
  hidden: readonly number[];
  isAdmin: boolean;
  error?: string;
  saved?: string;
}) {
  const published = papers.filter((p) => p.isPublished).length;
  /** The hall's code for a kind of test, e.g. "4a". */
  const codeOf = (categoryId: string, title: string) => sectionOf(title, categoryId)?.code ?? "";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Test papers</h1>
          <p className="mt-1 text-[13px] text-gray-600">
            {papers.length} paper{papers.length === 1 ? "" : "s"} · {published} published · {papers.length - published} draft, across the 5 tests of the ALP battery.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Jump to a battery">
          {BATTERIES.map((b) => {
            const n = papers.filter((p) => CATEGORIES.find((c) => c.id === p.category)?.battery === b.id).length;
            return (
              <a key={b.id} href={`#battery-${b.id}`} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[12px] font-semibold text-gray-700 hover:border-indigo-700 hover:text-indigo-800">
                Test {b.id} <span className="text-gray-400">· {n}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <AdminNotice error={error} saved={saved} />

      {/* ------------------------------ New paper ------------------------------ */}
      <form id="top" action={createPaper} className="mt-5 scroll-mt-4 rounded border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[260px] flex-1">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">New paper · which test</span>
            <select name="category" defaultValue="watch" className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-[14px]">
              {BATTERIES.map((b) => (
                <optgroup key={b.id} label={`Test ${b.id} · ${b.title}`}>
                  {CATEGORIES.filter((c) => c.battery === b.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {codeOf(c.id, c.title)} · {c.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block min-w-[240px] flex-1">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name shown in the toolbar</span>
            <input name="display_name" required placeholder="Yes or No Test - 1" className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]" />
          </label>
          <label className="block min-w-[180px]">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Web address (blank = automatic)</span>
            <input name="slug" placeholder="yes-or-no-test-1" className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]" />
          </label>
          <PendingButton pendingLabel="Creating…" className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">
            Create paper
          </PendingButton>
        </div>
        <p className="mt-2 text-[11px] text-gray-600">
          A Following Directions paper starts with a sample diagram and twenty questions; a Yes or No, Find 6 or Find 9 paper with all its questions built and ready;
          a picture paper (every Memory test, Brick, Hidden Cube, Observation, Similarity, Speed) with the real instructions and no questions, so add its pictures on the next page.
          Every new paper starts as a draft.
        </p>
      </form>

      {/* ------------------------------ Batteries ------------------------------ */}
      {BATTERIES.map((battery) => {
        const categories = CATEGORIES.filter((c) => c.battery === battery.id);
        const inBattery = papers.filter((p) => categories.some((c) => c.id === p.category));
        const isHidden = hidden.includes(battery.id);
        return (
          <details key={battery.id} id={`battery-${battery.id}`} open className="group mt-5 scroll-mt-4 rounded border border-gray-300 bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="text-gray-400 transition group-open:rotate-90" aria-hidden="true">▶</span>
              <h2 className="text-[14px] font-bold text-gray-900">
                Test {battery.id} · {battery.title} <span className="font-normal text-gray-500" lang="hi">/ {battery.hindi}</span>
              </h2>
              <span className="text-[12px] text-gray-500">
                {categories.length} kind{categories.length === 1 ? "" : "s"} of test · {inBattery.length} paper{inBattery.length === 1 ? "" : "s"} · {inBattery.filter((p) => p.isPublished).length} published
              </span>
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${isHidden ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-800"}`}>
                {isHidden ? "Hidden from students" : "Shown to students"}
              </span>
            </summary>

            <div className="border-t border-gray-200 px-4 pb-4">
              {isAdmin && (
                <RowForm action={setBatteryVisibility} className="mt-3 flex items-center gap-3">
                  <input type="hidden" name="battery" value={battery.id} />
                  <input type="hidden" name="hidden" value={String(!isHidden)} />
                  <span className="text-[12px] text-gray-600">
                    {isHidden ? "Students do not see this battery; admin and test setter can still preview its papers." : "Published papers of this battery are on the student portal."}
                  </span>
                  <PendingButton
                    pendingLabel="Saving…"
                    confirm={
                      isHidden
                        ? `Show Test ${battery.id} (${battery.title}) to students? Its published papers appear on their dashboard at once.`
                        : `Hide Test ${battery.id} (${battery.title}) from students? Its papers disappear from their dashboard at once; nothing is deleted.`
                    }
                    className={`rounded px-3 py-1 text-[12px] font-semibold ${isHidden ? "bg-indigo-800 text-white hover:bg-indigo-900" : "border border-gray-400 bg-white text-gray-800 hover:bg-gray-100"} disabled:opacity-60`}
                  >
                    {isHidden ? "Show to students" : "Hide from students"}
                  </PendingButton>
                </RowForm>
              )}

              {categories.map((category) => {
                const mine = papers.filter((p) => p.category === category.id);
                const code = codeOf(category.id, category.title);
                return (
                  <details key={category.id} open={mine.length > 0} className="group/kind mt-3 rounded border border-gray-200">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2 bg-gray-50 px-3 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="text-[11px] text-gray-400 transition group-open/kind:rotate-90" aria-hidden="true">▶</span>
                      {code && <span className="rounded bg-[#0d2a6b] px-1.5 py-0.5 text-[11px] font-bold text-white">{code}</span>}
                      <h3 className="text-[14px] font-bold text-gray-900">{category.title}</h3>
                      <span className="text-[12px] text-gray-500" lang="hi">{category.hindi}</span>
                      <span className="ml-auto text-[12px] text-gray-500">
                        {mine.length === 0 ? "no paper yet" : `${mine.length} paper${mine.length === 1 ? "" : "s"} · ${mine.filter((p) => p.isPublished).length} published`}
                      </span>
                    </summary>
                    <div className="px-3 pb-3">
                      {mine.length === 0 ? (
                        <p className="mt-2 rounded border border-dashed border-gray-300 px-4 py-3 text-center text-[12px] text-gray-500">
                          No paper here yet. Use <a href="#top" className="font-semibold text-indigo-800 underline">New paper</a> at the top and pick {code ? `${code} · ` : ""}{category.title}.
                        </p>
                      ) : (
                        <PaperTable papers={mine} canDelete={isAdmin} />
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </>
  );
}

function PaperTable({ papers, canDelete }: { papers: PaperSummary[]; canDelete: boolean }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-rrb-banner text-left text-white">
            <th className="border border-gray-300 px-3 py-2 w-[70px]">Order</th>
            <th className="border border-gray-300 px-3 py-2">Paper</th>
            <th className="border border-gray-300 px-3 py-2">Questions</th>
            <th className="border border-gray-300 px-3 py-2">Instruction</th>
            <th className="border border-gray-300 px-3 py-2">Test time</th>
            <th className="border border-gray-300 px-3 py-2">Status</th>
            <th className="border border-gray-300 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper.id} className="bg-white even:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 text-center font-semibold tabular-nums text-gray-700">
                {paper.sortOrder}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                <div className="font-semibold text-gray-900">{paper.displayName}</div>
                <div className="text-[11px] text-gray-500">/test/{paper.slug}</div>
              </td>
              <td className="border border-gray-300 px-3 py-2">{paper.questionCount}</td>
              <td className="border border-gray-300 px-3 py-2">
                {paper.instructionTimeMin} min
              </td>
              <td className="border border-gray-300 px-3 py-2">{paper.timeLimitMin} min</td>
              <td className="border border-gray-300 px-3 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    paper.isPublished
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {paper.isPublished ? "Published" : "Draft"}{paper.mockOnly ? " · Mock only" : ""}
                </span>
              </td>
              <td className="border border-gray-300 px-3 py-2">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/admin/papers/${paper.slug}`}
                    className="font-semibold text-rrb-banner hover:underline"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/test/${paper.slug}?view=student`}
                    className="text-[12px] font-semibold text-gray-700 hover:underline"
                    title="See the paper exactly as a student would, under every rule"
                  >
                    Preview as student
                  </Link>
                  {canDelete && (
                    <form action={deletePaper}>
                      <input type="hidden" name="slug" value={paper.slug} />
                      <PendingButton
                        pendingLabel="Deleting…"
                        confirm={`Delete "${paper.displayName}"?\n\nIts ${paper.questionCount} questions, every student's results for it, and any sitting in progress go with it. This cannot be undone.`}
                        className="text-[12px] font-semibold text-red-700 hover:underline disabled:opacity-60"
                      >
                        Delete
                      </PendingButton>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
