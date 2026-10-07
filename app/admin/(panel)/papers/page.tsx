import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { hiddenBatteries } from "@/lib/wt/visibility";
import { RowForm } from "@/components/admin/RowForm";
import { listPapersForAdmin, type PaperSummary } from "@/lib/wt/db";
import { createPaper, deletePaper, setBatteryVisibility } from "./actions";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { PendingButton } from "@/components/admin/PendingButton";

/**
 * Every Following Directions paper, grouped by which of the three it is.
 *
 * One flat table hid which test a paper belonged to, and gave no sense of the
 * order a student would meet them in — both of which the institute decides.
 */
export default async function FollowingDirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  // On the page itself, not only in the layout, which a request can skip.
  const who = await requireEditor("/admin/papers");
  const isAdmin = who.role === "admin";
  const [papers, { error, saved }, hidden] = await Promise.all([
    listPapersForAdmin(),
    searchParams,
    hiddenBatteries(),
  ]);

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Tests</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Battery 2, Following Directions: three tests on one engine. Battery 5, Perceptual
        Speed: picture questions. Set the timers, upload your questions, and choose the
        order students meet them in.
      </p>

      <AdminNotice error={error} saved={saved} />

      {BATTERIES.map((battery) => (
        <div key={battery.id} className="mt-8">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-300 pb-1">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">
              Battery {battery.id} · {battery.title}
            </h2>
            {hidden.includes(battery.id) ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                Hidden from students — admin and test setter can still preview
              </span>
            ) : (
              <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                Shown on the student dashboard
              </span>
            )}
            {isAdmin && (
              <RowForm action={setBatteryVisibility} className="ml-auto">
                <input type="hidden" name="battery" value={battery.id} />
                <input type="hidden" name="hidden" value={String(!hidden.includes(battery.id))} />
                <PendingButton
                  pendingLabel="Saving…"
                  confirm={
                    hidden.includes(battery.id)
                      ? `Show Battery ${battery.id} (${battery.title}) to students? Its published papers appear on their dashboard at once.`
                      : `Hide Battery ${battery.id} (${battery.title}) from students? Its papers disappear from their dashboard at once; nothing is deleted.`
                  }
                  className={`rounded px-3 py-1 text-[12px] font-semibold ${
                    hidden.includes(battery.id)
                      ? "bg-indigo-800 text-white hover:bg-indigo-900"
                      : "border border-gray-400 bg-white text-gray-800 hover:bg-gray-100"
                  } disabled:opacity-60`}
                >
                  {hidden.includes(battery.id) ? "Show to students" : "Hide from students"}
                </PendingButton>
              </RowForm>
            )}
          </div>
      {CATEGORIES.filter((c) => c.battery === battery.id).map((category) => {
        const mine = papers.filter((p) => p.category === category.id);

        return (
          <section key={category.id} className="mt-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-gray-900">{category.title}</h2>
              <span className="text-[12px] text-gray-500" lang="hi">
                {category.hindi}
              </span>
              <span className="ml-auto text-[12px] text-gray-500">
                {mine.length} paper{mine.length === 1 ? "" : "s"}
              </span>
            </div>

            {mine.length === 0 ? (
              <p className="mt-2 rounded border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-[13px] text-gray-500">
                No paper here yet. Create one below and choose {category.title}.
              </p>
            ) : (
              <PaperTable papers={mine} canDelete={isAdmin} />
            )}
          </section>
        );
      })}
        </div>
      ))}

      <form
        action={createPaper}
        className="mt-8 max-w-xl space-y-3 rounded border border-dashed border-gray-400 bg-white p-5"
      >
        <h2 className="text-[15px] font-bold text-gray-900">New paper</h2>
        <p className="text-[12px] text-gray-600">
          A Following Directions paper starts with a sample diagram and twenty sample
          questions so you can see the format straight away; replace them with your own.
          A Perceptual Speed paper starts with the real test&apos;s instructions and no
          questions: add its pictures on the next page.
        </p>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Which test
          </span>
          <select
            name="category"
            defaultValue="watch"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                Battery {c.battery} · {c.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Name shown in the toolbar
          </span>
          <input
            name="display_name"
            required
            placeholder="Watch Table Test - 1 (Easy Level)"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">
            Web address (leave blank to generate)
          </span>
          <input
            name="slug"
            placeholder="watch-table-2"
            className="w-full rounded border border-gray-400 px-3 py-2 text-[14px]"
          />
        </label>

        <PendingButton
          pendingLabel="Creating…"
          className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900 disabled:opacity-60"
        >
          Create paper
        </PendingButton>
      </form>
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
