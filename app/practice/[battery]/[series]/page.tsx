import { notFound, redirect } from "next/navigation";
import { SeriesView, type PaperStat } from "@/components/student/SeriesView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { allowancesFor } from "@/lib/wt/attempts";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptsFor } from "@/lib/wt/history";
import { paperBestT } from "@/lib/wt/progress";
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

  const [allowances, attempts, bestT, exam] = await Promise.all([
    allowancesFor(series.papers, profile.id),
    attemptsFor(profile.id, 1000),
    paperBestT(profile.id, series.papers.map((p) => p.id)),
    examSettings(),
  ]);
  const stats = new Map<string, PaperStat>();
  for (const p of series.papers) {
    const mine = attempts.filter((a) => a.paperSlug === p.slug);
    stats.set(p.id, {
      sat: mine.length,
      bestMarks: mine.length ? Math.max(...mine.map((a) => a.marks)) : null,
      total: mine[0]?.total ?? null,
      lastAt: mine[0]?.submittedAt ?? null,
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
