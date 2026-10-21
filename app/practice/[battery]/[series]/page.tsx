import { notFound, redirect } from "next/navigation";
import { SeriesView, type PaperStat } from "@/components/student/SeriesView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { allowancesFromRows } from "@/lib/wt/attempts";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptRecordsFor } from "@/lib/wt/history";
import { paperBestTFromRows } from "@/lib/wt/progress";
import { examSettings } from "@/lib/settings";
import { STAGES } from "@/lib/wt/plan";
import { findSeries, groupPapers } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { accessFor, canPractice } from "@/lib/packages";

export default async function SeriesPage({ params }: { params: Promise<{ battery: string; series: string }> }) {
  if (!isConfigured()) redirect("/dashboard");
  const { battery: rawBattery, series: slug } = await params;
  const battery = Number(rawBattery);
  const profile = await requireUser(`/practice/${rawBattery}/${slug}`);
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const [allPapers, hidden, access] = await Promise.all([listPublishedPapers(), hiddenBatteries(), accessFor(profile.id, profile.role)]);
  if (!canPractice(access, "alp")) redirect("/practice");
  if (hidden.includes(battery)) notFound();
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const list = groupPapers(papers).get(battery) ?? [];
  const series = findSeries(list, slug);
  if (!series) notFound();

  // The student's attempts on this series are read once, newest first, and
  // serve the attempts left, each paper's figures and its best T-score.
  const [attempts, exam] = await Promise.all([
    attemptRecordsFor(profile.id, 3000, series.papers.map((p) => p.id)),
    examSettings(),
  ]);
  const allowances = allowancesFromRows(series.papers, attempts);
  const bestT = await paperBestTFromRows(attempts);
  const stats = new Map<string, PaperStat>();
  for (const p of series.papers) {
    const mine = attempts.filter((a) => a.paper_id === p.id);
    stats.set(p.id, {
      sat: mine.length,
      bestMarks: mine.length ? Math.max(...mine.map((a) => a.marks)) : null,
      total: mine[0]?.total ?? null,
      lastAt: mine[0]?.submitted_at ?? null,
      bestT: bestT.get(p.id) ?? null,
    });
  }

  return (
    <SeriesView
      profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }}
      series={series}
      allowances={allowances}
      stats={stats}
      siblings={list.map((s) => ({ name: s.name, slug: s.slug }))}
      stages={{ pass: exam.passT, average: STAGES.average, target: exam.targetT }}
    />
  );
}
