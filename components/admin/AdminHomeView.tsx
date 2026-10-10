import Link from "next/link";
import { formatDateTime, formatDayMonth } from "@/lib/format-time";
import { rupees } from "@/lib/packages";
import { examOf, LIVE_EXAM } from "@/lib/exams";

/** Everything the front page shows, worked out by the page and drawn here. */
export interface HomeData {
  today: string;
  examDate: string | null;
  examIn: number | null;
  students: { total: number; active: number; newWeek: number; seenToday: number; satToday: number; withoutPackage: number; expiring7: number };
  papers: { total: number; published: number; drafts: number; empty: number };
  mocks: { total: number; live: number; scheduled: number; closed: number; openSittings: number; finishedToday: number; qualifiedToday: number };
  attempts: { today: number; week: number };
  money: { monthInr: number; monthOrders: number; todayOrders: number };
  reports: number;
  passT: number;
  liveMocks: { slug: string; name: string; window: string; satBy: number; status: "live" | "scheduled" }[];
  coverage: { battery: number; title: string; kinds: { code: string; name: string; published: number }[] }[];
  attention: { text: string; href: string; label: string; tone: "warn" | "info" }[];
  log: { id: string; at: string; actor: string; action: string; details: string }[];
}

export function AdminHomeView({ d }: { d: HomeData }) {
  const exam = examOf(LIVE_EXAM);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">Home</h1>
          <p className="mt-0.5 text-[13px] text-gray-600">
            <span className="rounded bg-[#0d2a6b] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">{exam.name}</span>
            <span className="ml-2">{exam.note} · every tile opens the page where it is managed.</span>
          </p>
        </div>
        {d.examDate && d.examIn !== null && (
          <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-right">
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#92400e]">Exam date · {formatDayMonth(d.examDate)}</div>
            <div className="text-[20px] font-extrabold tabular-nums leading-tight text-[#b45309]">{d.examIn > 0 ? `${d.examIn} days to go` : d.examIn === 0 ? "today" : `${-d.examIn} days ago`}</div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi href="/admin/students" label="Students" value={d.students.total} note={`${d.students.active} active · ${d.students.newWeek} new this week`} ink="text-[#1d4ed8]" bar="bg-[#3b82f6]" />
        <Kpi href="/admin/results" label="Attempts today" value={d.attempts.today} note={`${d.attempts.week} in the last 7 days`} ink="text-[#0f766e]" bar="bg-[#14b8a6]" />
        <Kpi href="/admin/papers" label="Test papers" value={d.papers.published} note={`published · ${d.papers.drafts} draft${d.papers.drafts === 1 ? "" : "s"}${d.papers.empty ? ` · ${d.papers.empty} empty` : ""}`} ink="text-[#6d28d9]" bar="bg-[#8b5cf6]" />
        <Kpi href="/admin/mocks" label="Full Mocks" value={d.mocks.total} note={`${d.mocks.live} live · ${d.mocks.scheduled} upcoming · ${d.mocks.closed} closed`} ink="text-[#be123c]" bar="bg-[#fb7185]" />
        <Kpi href="/admin/orders" label="Revenue this month" value={rupees(d.money.monthInr)} note={`${d.money.monthOrders} paid order${d.money.monthOrders === 1 ? "" : "s"} · ${d.money.todayOrders} today`} ink="text-[#15803d]" bar="bg-[#22c55e]" />
        <Kpi href="/admin/students" label="Without a package" value={d.students.withoutPackage} note="active students who cannot open a test" ink={d.students.withoutPackage ? "text-[#c2410c]" : "text-gray-700"} bar={d.students.withoutPackage ? "bg-[#f97316]" : "bg-gray-300"} />
        <Kpi href="/admin/students" label="Expiring in 7 days" value={d.students.expiring7} note="accounts whose validity ends this week" ink={d.students.expiring7 ? "text-[#b45309]" : "text-gray-700"} bar={d.students.expiring7 ? "bg-[#f59e0b]" : "bg-gray-300"} />
        <Kpi href="/admin/reports" label="Open question reports" value={d.reports} note="flagged by students as wrong" ink={d.reports ? "text-[#b91c1c]" : "text-gray-700"} bar={d.reports ? "bg-[#ef4444]" : "bg-gray-300"} />
      </div>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">Today <span className="font-normal text-gray-500">· since midnight, India time</span></h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Today label="On the portal" value={d.students.seenToday} note="students signed in" />
          <Today label="Sat a paper" value={d.students.satToday} note={`${d.attempts.today} papers submitted`} />
          <Today label="Full Mocks finished" value={d.mocks.finishedToday} note="today" />
          <Today label="Mocks qualified" value={d.mocks.qualifiedToday} note={`every battery T ≥ ${d.passT}`} />
          <Today label="Sittings open now" value={d.mocks.openSittings} note="Full Mocks in progress" />
          <Today label="Orders paid" value={d.money.todayOrders} note="today" href="/admin/orders" />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Needs a look</h2>
          {d.attention.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-500">✅ Nothing waiting.</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 text-[13px]">
              {d.attention.map((a, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="flex-1 text-gray-800">{a.tone === "warn" ? "⚠️" : "📝"} {a.text}</span>
                  <Link href={a.href} className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${a.tone === "warn" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-800"}`}>{a.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">
            Live now
            <Link href="/admin/mocks" className="float-right text-[12px] font-semibold text-rrb-banner hover:underline">Full Mocks →</Link>
          </h2>
          {d.liveMocks.length === 0 ? (
            <p className="mt-2 text-[13px] text-gray-500">No Full Mock is live or scheduled.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-gray-500"><th className="py-1 font-semibold">Mock</th><th className="py-1 font-semibold">Window</th><th className="py-1 font-semibold">Sat by</th><th className="py-1" /></tr>
              </thead>
              <tbody>
                {d.liveMocks.map((m) => (
                  <tr key={m.slug} className="border-t border-gray-100">
                    <td className="py-1.5 font-semibold text-gray-900"><Link href={`/admin/mocks/${m.slug}`} className="hover:underline">{m.name}</Link></td>
                    <td className="py-1.5 text-gray-600">{m.window}</td>
                    <td className="py-1.5 tabular-nums">{m.satBy}</td>
                    <td className="py-1.5 text-right">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${m.status === "live" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{m.status === "live" ? "● Live" : "Scheduled"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">
          Paper coverage <span className="font-normal text-gray-500">· published papers per kind of test, in the hall&apos;s order</span>
          <Link href="/admin/papers" className="float-right text-[12px] font-semibold text-rrb-banner hover:underline">Test Papers →</Link>
        </h2>
        <div className="mt-2 divide-y divide-gray-100">
          {d.coverage.map((b) => (
            <div key={b.battery} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
              <span className="w-[200px] shrink-0 text-[12.5px] font-semibold text-gray-800">Test {b.battery} · {b.title}</span>
              <div className="flex flex-wrap gap-1.5">
                {b.kinds.map((k) => (
                  <span
                    key={k.code}
                    title={`${k.name}: ${k.published} published`}
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${k.published > 0 ? "border-green-200 bg-green-50 text-green-800" : "border-dashed border-gray-300 bg-gray-50 text-gray-400"}`}
                  >
                    {k.code} <span className={k.published > 0 ? "text-green-700" : "text-gray-400"}>{k.published}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-gray-500">A grey code has no published paper yet: students see it as “coming soon”.</p>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">Quick actions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Action href="/admin/students" primary>+ Add a student</Action>
          <Action href="/admin/students#bulk">+ Add many (CSV)</Action>
          <Action href="/admin/papers">+ New test paper</Action>
          <Action href="/admin/mocks">+ New Full Mock</Action>
          <Action href="/admin/packages">Packages &amp; prices</Action>
          <Action href="/admin/results">Results</Action>
          <Action href="/admin/analytics">Analytics</Action>
          <Action href="/admin/team">Settings &amp; notices</Action>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">
          Recent activity
          <Link href="/admin/team" className="float-right text-[12px] font-semibold text-rrb-banner hover:underline">Full log →</Link>
        </h2>
        {d.log.length === 0 ? (
          <p className="mt-2 text-[13px] text-gray-500">Nothing logged yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 text-[12px]">
            {d.log.map((row) => (
              <li key={row.id} className="flex flex-wrap gap-x-3 py-1.5">
                <span className="w-[130px] shrink-0 text-gray-500">{formatDateTime(row.at)}</span>
                <span className="font-semibold text-gray-900">{row.actor || "—"}</span>
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

function Kpi({ href, label, value, note, ink, bar }: { href: string; label: string; value: number | string; note: string; ink: string; bar: string }) {
  return (
    <Link href={href} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#0d2a6b] hover:shadow-md">
      <div className={`h-1 ${bar}`} />
      <div className="px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        <div className={`text-[24px] font-extrabold tabular-nums leading-tight ${ink}`}>{typeof value === "number" ? value.toLocaleString("en-IN") : value}</div>
        <div className="text-[11px] text-gray-500">{note}</div>
      </div>
    </Link>
  );
}

function Today({ label, value, note, href }: { label: string; value: number; note: string; href?: string }) {
  const body = (
    <>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-[22px] font-extrabold tabular-nums text-gray-900">{value.toLocaleString("en-IN")}</div>
      <div className="text-[11px] text-gray-500">{note}</div>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-lg border border-gray-200 bg-gray-50 p-3 hover:border-rrb-banner">{body}</Link>
  ) : (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">{body}</div>
  );
}

function Action({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link href={href} className={`rounded-md px-4 py-2 text-[13px] font-semibold ${primary ? "bg-indigo-800 text-white hover:bg-indigo-900" : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100"}`}>
      {children}
    </Link>
  );
}
