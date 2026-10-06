import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, indianDay } from "@/lib/format-time";
import { listPapersForAdmin } from "@/lib/wt/db";
import { listMocksForAdmin, mockStatus } from "@/lib/wt/mock";
import { recentActions } from "@/lib/audit";

/**
 * The panel's front page: the counts that matter, what is live now, what
 * needs a hand, and the four things an admin does most. Everything on it
 * links to the page where it is done.
 */
export default async function AdminHome() {
  await requireAdmin("/admin");
  const supabase = createAdminClient();
  const today = indianDay(Date.now());
  const soon = indianDay(Date.now() + 10 * 86400000);
  const dayStart = new Date(`${today}T00:00:00+05:30`).toISOString();

  const [papers, mocks, log, students, active, expiring, attemptsToday, mockResults, openSittings] = await Promise.all([
    listPapersForAdmin(),
    listMocksForAdmin(),
    recentActions(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_active", true).or(`valid_until.is.null,valid_until.gte.${today}`),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_active", true).gte("valid_until", today).lte("valid_until", soon),
    supabase.from("watch_attempts").select("id", { count: "exact", head: true }).gte("submitted_at", dayStart),
    supabase.from("mock_results").select("mock_id, user_id").limit(100000),
    supabase.from("mock_sittings").select("id", { count: "exact", head: true }).is("submitted_at", null),
  ]);

  const live = mocks.filter((m) => mockStatus(m) === "live");
  const scheduled = mocks.filter((m) => mockStatus(m) === "scheduled");
  const closed = mocks.filter((m) => mockStatus(m) === "closed");
  const drafts = papers.filter((p) => !p.isPublished);
  const sat = new Map<string, Set<string>>();
  for (const r of mockResults.data ?? []) {
    const set = sat.get(r.mock_id) ?? new Set<string>();
    if (r.user_id) set.add(r.user_id);
    sat.set(r.mock_id, set);
  }

  const attention: { text: string; href: string; label: string; tone: "warn" | "info" }[] = [];
  if ((expiring.count ?? 0) > 0) attention.push({ text: `${expiring.count} student account${expiring.count === 1 ? "" : "s"} expire within 10 days`, href: "/admin/students", label: "Students →", tone: "warn" });
  if (drafts.length) attention.push({ text: `${drafts.length} paper${drafts.length === 1 ? " is" : "s are"} still a draft`, href: "/admin/watch-table", label: "Papers →", tone: "info" });
  const emptyMocks = mocks.filter((m) => m.isPublished && m.paperIds.length < 5);
  if (emptyMocks.length) attention.push({ text: `${emptyMocks.map((m) => m.name).join(", ")}: fewer than 5 tests`, href: "/admin/mocks", label: "Mocks →", tone: "warn" });
  if ((openSittings.count ?? 0) > 0) attention.push({ text: `${openSittings.count} Full Mock sitting${openSittings.count === 1 ? "" : "s"} in progress right now`, href: "/admin/mocks", label: "Mocks →", tone: "info" });

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Home</h1>
      <p className="mt-1 text-[13px] text-gray-600">Ek nazar me sab kuch. Every tile opens the page where it is managed.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat href="/admin/students" label="Students" value={String(students.count ?? 0)} note={`${active.count ?? 0} active · ${expiring.count ?? 0} expiring soon`} />
        <Stat href="/admin/mocks" label="Full Mocks" value={String(mocks.length)} note={`${live.length} live · ${scheduled.length} upcoming · ${closed.length} closed`} />
        <Stat href="/admin/watch-table" label="Test Papers" value={String(papers.length)} note={`${papers.length - drafts.length} published · ${drafts.length} draft`} />
        <Stat href="/admin/results" label="Attempts today" value={String(attemptsToday.count ?? 0)} note="sectional papers submitted since midnight" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded border border-gray-300 bg-white p-4">
          <h2 className="text-[14px] font-bold text-gray-900">
            Live now
            <Link href="/admin/mocks" className="float-right text-[12px] font-semibold text-rrb-banner hover:underline">Full Mocks →</Link>
          </h2>
          {live.length + scheduled.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-500">No Full Mock is live or scheduled.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-gray-500"><th className="py-1 font-semibold">Mock</th><th className="py-1 font-semibold">Window</th><th className="py-1 font-semibold">Sat by</th><th className="py-1" /></tr>
              </thead>
              <tbody>
                {[...live, ...scheduled].map((m) => (
                  <tr key={m.id} className="border-t border-gray-100">
                    <td className="py-1.5 font-semibold text-gray-900"><Link href={`/admin/mocks/${m.slug}`} className="hover:underline">{m.name}</Link></td>
                    <td className="py-1.5 text-gray-600">{m.closesAt ? `till ${formatDateTime(m.closesAt)}` : m.opensAt && mockStatus(m) === "scheduled" ? `from ${formatDateTime(m.opensAt)}` : "open"}</td>
                    <td className="py-1.5 tabular-nums">{sat.get(m.id)?.size ?? 0}</td>
                    <td className="py-1.5 text-right">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${mockStatus(m) === "live" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                        {mockStatus(m) === "live" ? "● Live" : "Scheduled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded border border-gray-300 bg-white p-4">
          <h2 className="text-[14px] font-bold text-gray-900">Needs a look</h2>
          {attention.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-500">✅ Nothing waiting.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 text-[13px]">
              {attention.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="flex-1 text-gray-800">{a.tone === "warn" ? "⚠️" : "📝"} {a.text}</span>
                  <Link href={a.href} className={`rounded px-2 py-0.5 text-[11px] font-semibold ${a.tone === "warn" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-800"}`}>{a.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded border border-gray-300 bg-white p-4">
        <h2 className="text-[14px] font-bold text-gray-900">Quick actions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/admin/mocks" className="rounded bg-indigo-800 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-900">+ New Full Mock</Link>
          <Link href="/admin/students" className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100">+ Add students (CSV)</Link>
          <Link href="/admin/watch-table" className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100">+ New test paper</Link>
          <Link href="/admin/results" className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100">Results</Link>
        </div>
      </section>

      <section className="mt-4 rounded border border-gray-300 bg-white p-4">
        <h2 className="text-[14px] font-bold text-gray-900">
          Recent activity
          <Link href="/admin/team" className="float-right text-[12px] font-semibold text-rrb-banner hover:underline">Full log →</Link>
        </h2>
        {log.length === 0 ? (
          <p className="mt-2 text-[13px] text-gray-500">Nothing logged yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 text-[12px]">
            {log.map((row) => (
              <li key={row.id} className="flex flex-wrap gap-x-3 py-1.5">
                <span className="w-[130px] shrink-0 text-gray-500">{formatDateTime(row.at)}</span>
                <span className="font-semibold text-gray-900">{row.actor_name || "—"}</span>
                <span className="text-gray-800">{row.action}</span>
                <span className="text-gray-500">{row.details}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ href, label, value, note }: { href: string; label: string; value: string; note: string }) {
  return (
    <Link href={href} className="rounded border border-gray-300 bg-white px-4 py-3 transition hover:border-rrb-banner hover:shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500">{note}</div>
    </Link>
  );
}
