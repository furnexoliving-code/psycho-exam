import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/wt/cohort";
import { formatDateTime, indianDay } from "@/lib/format-time";
import { listPapersForAdmin } from "@/lib/wt/db";
import { listMocksForAdmin, mockStatus } from "@/lib/wt/mock";
import { recentActions } from "@/lib/audit";
import { openReportCount } from "@/lib/reports";
import { studentsWithoutPackage } from "@/lib/packages";
import { daysUntil, examSettings } from "@/lib/settings";
import { BATTERIES } from "@/lib/wt/categories";
import { sectionOf, sectionsOfBattery } from "@/lib/wt/sections";
import { AdminHomeView, type HomeData } from "@/components/admin/AdminHomeView";

/**
 * The panel's front page: the counts that matter, what is live now, what
 * needs a hand, which kinds of test have papers, and the things an admin
 * does most. Everything on it links to the page where it is done.
 */
export default async function AdminHome() {
  await requireAdmin("/admin");
  const supabase = createAdminClient();
  const now = Date.now();
  const today = indianDay(now);
  const dayStart = new Date(`${today}T00:00:00+05:30`).toISOString();
  const weekStart = new Date(now - 7 * 86400000).toISOString();
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00+05:30`).toISOString();
  const weekAhead = indianDay(now + 7 * 86400000);

  const [papers, mocks, log, exam, students, active, newWeek, attemptsToday, attemptsWeek, mockResults, openSittings, seenToday, satToday, mocksToday, mocksQualifiedToday, reportCount, missing, expiring, paidMonth, paidToday] =
    await Promise.all([
      listPapersForAdmin(),
      listMocksForAdmin(),
      recentActions(8),
      examSettings(),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").gte("created_at", weekStart),
      supabase.from("watch_attempts").select("id", { count: "exact", head: true }).gte("submitted_at", dayStart),
      supabase.from("watch_attempts").select("id", { count: "exact", head: true }).gte("submitted_at", weekStart),
      fetchAll<{ mock_id: string; user_id: string | null }>((from, to) => supabase.from("mock_results").select("mock_id, user_id").order("id").range(from, to)),
      supabase.from("mock_sittings").select("id", { count: "exact", head: true }).is("submitted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").gte("last_seen_at", dayStart),
      fetchAll<{ user_id: string | null }>((from, to) => supabase.from("watch_attempts").select("user_id").gte("submitted_at", dayStart).order("id").range(from, to)),
      supabase.from("mock_results").select("id", { count: "exact", head: true }).gte("submitted_at", dayStart),
      supabase.from("mock_results").select("id", { count: "exact", head: true }).gte("submitted_at", dayStart).eq("qualified", true),
      openReportCount(),
      studentsWithoutPackage(),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_active", true).gte("valid_until", today).lte("valid_until", weekAhead),
      fetchAll<{ amount_inr: number | string | null }>((from, to) => supabase.from("orders").select("amount_inr").eq("status", "paid").gte("paid_at", monthStart).order("id").range(from, to)),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid").gte("paid_at", dayStart),
    ]);

  const studentsSatToday = new Set(satToday.map((r) => r.user_id).filter((u): u is string => Boolean(u))).size;
  const live = mocks.filter((m) => mockStatus(m) === "live");
  const scheduled = mocks.filter((m) => mockStatus(m) === "scheduled");
  const closed = mocks.filter((m) => mockStatus(m) === "closed");
  const drafts = papers.filter((p) => !p.isPublished);
  const empty = papers.filter((p) => p.isPublished && p.questionCount === 0);
  const sat = new Map<string, Set<string>>();
  for (const r of mockResults) {
    const set = sat.get(r.mock_id) ?? new Set<string>();
    if (r.user_id) set.add(r.user_id);
    sat.set(r.mock_id, set);
  }
  const monthInr = paidMonth.reduce((sum, o) => sum + Number(o.amount_inr ?? 0), 0);

  // Published papers per kind of test, in the hall's order: where the
  // students still see "coming soon".
  const published = papers.filter((p) => p.isPublished && !p.mockOnly);
  const coverage = BATTERIES.map((b) => ({
    battery: b.id,
    title: b.title,
    kinds: sectionsOfBattery(b.id).map((s) => ({
      code: s.code,
      name: s.name,
      published: published.filter((p) => sectionOf(p.series, p.category)?.code === s.code).length,
    })),
  }));

  const attention: HomeData["attention"] = [];
  if (reportCount > 0) attention.push({ text: `${reportCount} question${reportCount === 1 ? "" : "s"} flagged by students as wrong`, href: "/admin/reports", label: "Reports →", tone: "warn" });
  if (missing.length) attention.push({ text: `${missing.length} active student${missing.length === 1 ? " has" : "s have"} no package, so their tests are locked`, href: "/admin/students", label: "Students →", tone: "warn" });
  if (empty.length) attention.push({ text: `${empty.length} published paper${empty.length === 1 ? " has" : "s have"} no questions: ${empty.slice(0, 3).map((p) => p.displayName).join(", ")}${empty.length > 3 ? " …" : ""}`, href: "/admin/papers", label: "Papers →", tone: "warn" });
  if ((expiring.count ?? 0) > 0) attention.push({ text: `${expiring.count} account${expiring.count === 1 ? "" : "s"} expire${expiring.count === 1 ? "s" : ""} within 7 days`, href: "/admin/students", label: "Students →", tone: "info" });
  if (drafts.length) attention.push({ text: `${drafts.length} paper${drafts.length === 1 ? " is" : "s are"} still a draft`, href: "/admin/papers", label: "Papers →", tone: "info" });
  const emptyMocks = mocks.filter((m) => m.isPublished && m.paperIds.length < 5);
  if (emptyMocks.length) attention.push({ text: `${emptyMocks.map((m) => m.name).join(", ")}: fewer than 5 tests`, href: "/admin/mocks", label: "Mocks →", tone: "warn" });
  if ((openSittings.count ?? 0) > 0) attention.push({ text: `${openSittings.count} Full Mock sitting${openSittings.count === 1 ? "" : "s"} in progress right now`, href: "/admin/mocks", label: "Mocks →", tone: "info" });

  const data: HomeData = {
    today,
    examDate: exam.examDate,
    examIn: exam.examDate ? daysUntil(exam.examDate, today) : null,
    students: {
      total: students.count ?? 0,
      active: active.count ?? 0,
      newWeek: newWeek.count ?? 0,
      seenToday: seenToday.count ?? 0,
      satToday: studentsSatToday,
      withoutPackage: missing.length,
      expiring7: expiring.count ?? 0,
    },
    papers: { total: papers.length, published: papers.length - drafts.length, drafts: drafts.length, empty: empty.length },
    mocks: {
      total: mocks.length,
      live: live.length,
      scheduled: scheduled.length,
      closed: closed.length,
      openSittings: openSittings.count ?? 0,
      finishedToday: mocksToday.count ?? 0,
      qualifiedToday: mocksQualifiedToday.count ?? 0,
    },
    attempts: { today: attemptsToday.count ?? 0, week: attemptsWeek.count ?? 0 },
    money: { monthInr, monthOrders: paidMonth.length, todayOrders: paidToday.count ?? 0 },
    reports: reportCount,
    passT: exam.passT,
    liveMocks: [...live, ...scheduled].map((m) => ({
      slug: m.slug,
      name: m.name,
      window: m.closesAt ? `till ${formatDateTime(m.closesAt)}` : m.opensAt && mockStatus(m) === "scheduled" ? `from ${formatDateTime(m.opensAt)}` : "open",
      satBy: sat.get(m.id)?.size ?? 0,
      status: mockStatus(m) === "live" ? "live" : "scheduled",
    })),
    coverage,
    attention,
    log: log.map((row) => ({ id: String(row.id), at: row.at, actor: row.actor_name || "", action: row.action, details: row.details })),
  };

  return <AdminHomeView d={data} />;
}
