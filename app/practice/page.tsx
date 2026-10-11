import { redirect } from "next/navigation";
import { PracticeView } from "@/components/student/PracticeView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress, paperBestT } from "@/lib/wt/progress";
import { groupPapers } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { STAGES } from "@/lib/wt/plan";
import { accessFor, canPractice } from "@/lib/packages";

export default async function PracticePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/practice");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const [allPapers, hidden, progress, attempts, exam, access] = await Promise.all([listPublishedPapers(), hiddenBatteries(), batteryProgress(profile.id), attemptsFor(profile.id, 1000), examSettings(), accessFor(profile.id, profile.role)]);
  // Without the Sectional package the whole page still shows, every test
  // the hall gives with its count and clock, but each card leads to the
  // packages instead of its papers.
  const locked = !canPractice(access, "alp");
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const satSlugs = new Set(attempts.map((a) => a.paperSlug));
  const sat = new Set(papers.filter((p) => satSlugs.has(p.slug)).map((p) => p.id));
  // When each paper was last sat: the attempts come newest first.
  const idBySlug = new Map(papers.map((p) => [p.slug, p.id]));
  const lastAt = new Map<string, string>();
  for (const a of attempts) {
    const id = idBySlug.get(a.paperSlug);
    if (id && !lastAt.has(id)) lastAt.set(id, a.submittedAt);
  }
  // The best T-score of each paper sat, so every test type can show its own.
  const bestT = await paperBestT(profile.id, [...sat]);

  return (
    <PracticeView
      profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }}
      groups={groupPapers(papers)}
      hidden={hidden}
      progress={progress}
      sat={sat}
      bestT={bestT}
      lastAt={lastAt}
      now={Date.now()}
      examDate={exam.examDate}
      stages={{ pass: exam.passT, average: STAGES.average, target: exam.targetT }}
      locked={locked}
    />
  );
}
