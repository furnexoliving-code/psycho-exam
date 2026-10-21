import { redirect } from "next/navigation";
import { PracticeView } from "@/components/student/PracticeView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { listPublishedPapers } from "@/lib/wt/db";
import { batteryProgressWithAttempts, paperBestTFromRows } from "@/lib/wt/progress";
import { groupPapers } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { STAGES } from "@/lib/wt/plan";
import { accessFor, canPractice } from "@/lib/packages";

export default async function PracticePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/practice");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  // The student's attempts are read once, newest first, and serve the
  // progress figures, which papers were sat and when, and each paper's best.
  const [allPapers, hidden, { progress, attempts }, exam, access] = await Promise.all([listPublishedPapers(), hiddenBatteries(), batteryProgressWithAttempts(profile.id), examSettings(), accessFor(profile.id, profile.role)]);
  // Without the Sectional package the whole page still shows, every test
  // the hall gives with its count and clock, but each card leads to the
  // packages instead of its papers.
  const locked = !canPractice(access, "alp");
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const offered = new Set(papers.map((p) => p.id));
  const mine = attempts.filter((a) => offered.has(a.paper_id));
  const sat = new Set(mine.map((a) => a.paper_id));
  // When each paper was last sat: the attempts come newest first.
  const lastAt = new Map<string, string>();
  for (const a of mine) {
    if (!lastAt.has(a.paper_id)) lastAt.set(a.paper_id, a.submitted_at);
  }
  // The best T-score of each paper sat, so every test type can show its own.
  const bestT = await paperBestTFromRows(mine);

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
