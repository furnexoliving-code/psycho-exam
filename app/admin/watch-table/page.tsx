import Link from "next/link";
import { listPapers } from "@/lib/wt/db";
import { createPaper } from "./actions";

export default async function WatchTablePapersPage() {
  const papers = await listPapers();

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Watch Table Test</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Set the timers, upload your questions, and switch on the controls the
        candidate gets.
      </p>

      {papers.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Paper</th>
                <th className="border border-gray-300 px-3 py-2">Questions</th>
                <th className="border border-gray-300 px-3 py-2">Instruction time</th>
                <th className="border border-gray-300 px-3 py-2">Test time</th>
                <th className="border border-gray-300 px-3 py-2">Status</th>
                <th className="border border-gray-300 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => (
                <tr key={paper.id} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-semibold text-gray-900">{paper.displayName}</div>
                    <div className="text-[11px] text-gray-500">
                      /watch-table/{paper.slug}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{paper.questionCount}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {paper.instructionTimeMin} min
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {paper.timeLimitMin} min
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        paper.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {paper.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <Link
                      href={`/admin/watch-table/${paper.slug}`}
                      className="font-semibold text-rrb-banner hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        action={createPaper}
        className="mt-6 max-w-xl space-y-3 rounded border border-dashed border-gray-400 bg-white p-5"
      >
        <h2 className="text-[15px] font-bold text-gray-900">New paper</h2>
        <p className="text-[12px] text-gray-600">
          It starts with a sample diagram and twenty sample questions so you can
          see the format straight away. Replace them with your own.
        </p>

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

        <button
          type="submit"
          className="rounded bg-indigo-800 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Create paper
        </button>
      </form>
    </>
  );
}
