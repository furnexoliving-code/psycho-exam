import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { indianLocalInput } from "@/lib/format-time";
import { BATTERIES, CATEGORIES } from "@/lib/wt/categories";
import { listPapersForAdmin } from "@/lib/wt/db";
import { loadMock, mockMinutes, mockStatus } from "@/lib/wt/mock";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { deleteMock, saveMock } from "../actions";

export default async function MockEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const who = await requireEditor(`/admin/mocks/${slug}`);
  const [loaded, papers, { error }] = await Promise.all([loadMock(slug), listPapersForAdmin(), searchParams]);
  if (!loaded) notFound();
  const { mock, papers: chosen } = loaded;
  const chosenByBattery = new Map(chosen.map((p) => [p.battery, p.id]));
  const status = mockStatus(mock);
  const minutes = mockMinutes(mock, chosen);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/mocks" className="text-[13px] font-semibold text-rrb-banner hover:underline">← Full Mocks</Link>
        <h1 className="text-xl font-bold text-gray-900">{mock.name}</h1>
        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
          status === "live" ? "bg-green-100 text-green-800" : status === "scheduled" ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700"
        }`}>
          {status === "live" ? "● Live" : status[0].toUpperCase() + status.slice(1)}
        </span>
        {who.role === "admin" && (
          <Link href={`/admin/mocks/${slug}/results`} className="ml-auto rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
            Results
          </Link>
        )}
        {mock.isPublished && (
          <Link href={`/mock/${slug}`} className="rounded border border-gray-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100" target="_blank">
            Preview as student ↗
          </Link>
        )}
      </div>
      {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 px-4 py-2 text-[13px] text-red-800">{error}</p>}

      <SaveForm action={saveMock} submitLabel="Save the mock" className="mt-4 rounded border border-gray-300 bg-white p-5">
        <input type="hidden" name="slug" value={slug} />

        <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-500">Step 1 · The five tests, in the hall&apos;s order</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          One paper per battery. Only a published paper with questions can go into a published mock; a battery left blank is left out.
          Prefer papers marked <b>MOCK ONLY</b> (tick &ldquo;Only for Full Mocks&rdquo; in the paper&apos;s settings): students cannot practise
          those, so the mock tests them fresh. A paper &ldquo;also in practice&rdquo; may already have been sat.
        </p>
        <table className="mt-3 w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Battery</th>
              <th className="px-3 py-2 font-semibold">Paper</th>
            </tr>
          </thead>
          <tbody>
            {BATTERIES.map((battery) => {
              const ids: string[] = CATEGORIES.filter((c) => c.battery === battery.id).map((c) => c.id);
              const options = papers.filter((p) => ids.includes(p.category));
              return (
                <tr key={battery.id} className="border-t border-gray-200">
                  <td className="px-3 py-2 font-bold text-gray-700">{battery.id}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900">{battery.title}</td>
                  <td className="px-3 py-2">
                    <select name={`paper_${battery.id}`} defaultValue={chosenByBattery.get(battery.id) ?? ""} className="w-full max-w-md rounded border border-gray-400 px-3 py-2 text-[13px]">
                      <option value="">— not in this mock —</option>
                      {options.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} · {p.questionCount} Q · {p.instructionTimeMin}+{p.timeLimitMin} min{p.mockOnly ? " · MOCK ONLY" : " · also in practice"}{p.isPublished ? "" : " · DRAFT"}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-gray-600">
          As saved: <strong>{chosen.length} tests · about {minutes} minutes</strong> with the gaps. Save to update this line.
        </p>

        <h2 className="mt-6 text-[13px] font-bold uppercase tracking-wide text-gray-500">Step 2 · When it runs, and the rules</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
            <input name="name" required defaultValue={mock.name} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Opens (India time)</span>
            <input name="opens_at" type="datetime-local" defaultValue={indianLocalInput(mock.opensAt)} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            <span className="mt-1 block text-[11px] text-gray-500">Blank: open as soon as published.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Closes (India time)</span>
            <input name="closes_at" type="datetime-local" defaultValue={indianLocalInput(mock.closesAt)} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            <span className="mt-1 block text-[11px] text-gray-500">Blank: stays open.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Gap between tests</span>
            <input name="gap_min" type="number" min={0} max={30} defaultValue={mock.gapMin} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            <span className="mt-1 block text-[11px] text-gray-500">Minutes. The hall gives about 1.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Attempts per student</span>
            <input name="max_attempts" type="number" min={1} max={100} defaultValue={mock.maxAttempts ?? ""} placeholder="no limit" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Qualify: T-score needed in every battery</span>
            <input name="cut_off_tscore" type="number" step="0.1" min={0} max={100} defaultValue={mock.cutOffT} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            <span className="mt-1 block text-[11px] text-gray-500">RRB&apos;s own bar is 42.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Order in the list</span>
            <input name="sort_order" type="number" defaultValue={mock.sortOrder} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
        </div>

        <h2 className="mt-6 text-[13px] font-bold uppercase tracking-wide text-gray-500">Step 3 · Publish</h2>
        <label className="mt-2 flex items-center gap-2 text-[13px] text-gray-800">
          <input type="checkbox" name="is_published" defaultChecked={mock.isPublished} className="h-4 w-4" />
          Published — students see it on their dashboard (within the window above)
        </label>
        <label className="mt-2 flex items-center gap-2 text-[13px] text-gray-800">
          <input type="checkbox" name="is_free" defaultChecked={mock.isFree} className="h-4 w-4" />
          Free mock — open to every signed-in student without a package, and without the practice bar (the one to try before buying)
        </label>
      </SaveForm>

      {who.role === "admin" && (
        <form action={deleteMock} className="mt-6">
          <input type="hidden" name="slug" value={slug} />
          <PendingButton
            pendingLabel="Deleting…"
            confirm={`Delete "${mock.name}"?\n\nEvery student's scorecard for it goes with it. The papers themselves stay. This cannot be undone.`}
            className="rounded border border-red-300 bg-white px-4 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Delete this mock
          </PendingButton>
        </form>
      )}
    </>
  );
}
