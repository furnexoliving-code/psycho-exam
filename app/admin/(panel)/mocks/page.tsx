import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { listMocksForAdmin, mockStatus, type MockStatus } from "@/lib/wt/mock";
import { createMock } from "./actions";

const STATUS: Record<MockStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gray-200 text-gray-700" },
  scheduled: { label: "Scheduled", cls: "bg-blue-100 text-blue-800" },
  live: { label: "● Live", cls: "bg-green-100 text-green-800" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-600" },
};

export default async function MocksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const who = await requireEditor("/admin/mocks");
  const [mocks, { error, saved }] = await Promise.all([listMocksForAdmin(), searchParams]);

  // Attempted counts and the average composite, in one read.
  const { data: results } = await createAdminClient()
    .from("mock_results")
    .select("mock_id, user_id, composite, qualified")
    .limit(100000);
  const stats = new Map<string, { attempts: number; users: Set<string>; sum: number; n: number; qualified: number }>();
  for (const r of results ?? []) {
    const s = stats.get(r.mock_id) ?? { attempts: 0, users: new Set<string>(), sum: 0, n: 0, qualified: 0 };
    s.attempts++;
    if (r.user_id) s.users.add(r.user_id);
    if (r.composite !== null) {
      s.sum += Number(r.composite);
      s.n++;
    }
    if (r.qualified) s.qualified++;
    stats.set(r.mock_id, s);
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Full Mock Tests</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        A Full Mock strings one published paper from each battery into one sitting, in the hall&apos;s
        order, with a gap between tests and one scorecard at the end.
      </p>

      {error && <p role="alert" className="mt-3 rounded border border-red-300 bg-red-50 px-4 py-2 text-[13px] text-red-800">{error}</p>}
      {saved && <p className="mt-3 rounded border border-green-300 bg-green-50 px-4 py-2 text-[13px] text-green-800">{saved}</p>}

      <form action={createMock} className="mt-4 flex flex-wrap items-end gap-3 rounded border border-gray-300 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">New Full Mock — name</span>
          <input name="name" required placeholder="Full Mock 1" className="w-[260px] rounded border border-gray-400 px-3 py-2 text-[13px]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-gray-700">Web address (optional)</span>
          <input name="slug" placeholder="full-mock-1" className="w-[200px] rounded border border-gray-400 px-3 py-2 text-[13px]" />
        </label>
        <button type="submit" className="rounded bg-indigo-800 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900">
          + Create as draft
        </button>
      </form>

      {mocks.length === 0 ? (
        <p className="mt-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-[13px] text-gray-500">
          No Full Mock yet. Create one above, choose its five papers, then publish it.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Tests</th>
                <th className="px-3 py-2 font-semibold">Window</th>
                <th className="px-3 py-2 font-semibold">Attempted</th>
                <th className="px-3 py-2 font-semibold">Avg composite</th>
                <th className="px-3 py-2 font-semibold">Qualified</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {mocks.map((mock) => {
                const status = STATUS[mockStatus(mock)];
                const s = stats.get(mock.id);
                return (
                  <tr key={mock.id} className="border-t border-gray-200 bg-white">
                    <td className="px-3 py-2 font-semibold text-gray-900">{mock.name}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span></td>
                    <td className="px-3 py-2 tabular-nums">{mock.paperIds.length}</td>
                    <td className="px-3 py-2 text-[12px] text-gray-600">
                      {mock.opensAt || mock.closesAt
                        ? `${mock.opensAt ? formatDateTime(mock.opensAt) : "—"} → ${mock.closesAt ? formatDateTime(mock.closesAt) : "—"}`
                        : "Always open while published"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{s ? `${s.users.size} students · ${s.attempts} sittings` : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{s && s.n ? (s.sum / s.n).toFixed(1) : "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{s && s.attempts ? `${Math.round((s.qualified / s.attempts) * 100)}%` : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/mocks/${mock.slug}`} className="font-semibold text-rrb-banner hover:underline">Open</Link>
                      {who.role === "admin" && (
                        <Link href={`/admin/mocks/${mock.slug}/results`} className="ml-4 font-semibold text-rrb-banner hover:underline">Results</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
