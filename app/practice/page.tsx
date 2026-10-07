import { redirect } from "next/navigation";
import { PracticeView } from "@/components/student/PracticeView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress } from "@/lib/wt/progress";
import { groupPapers } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { STAGES } from "@/lib/wt/plan";

export default async function PracticePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/practice");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const [allPapers, hidden, progress, attempts, exam] = await Promise.all([
    listPublishedPapers(),
    hiddenBatteries(),
    batteryProgress(profile.id),
    attemptsFor(profile.id, 1000),
    examSettings(),
  ]);
  const papers = allPapers.filter((p) => openToStudents(p.category, hidden));
  const satSlugs = new Set(attempts.map((a) => a.paperSlug));
  const sat = new Set(papers.filter((p) => satSlugs.has(p.slug)).map((p) => p.id));

  return (
    <PracticeView
      profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }}
      groups={groupPapers(papers)}
      hidden={hidden}
      progress={progress}
      sat={sat}
      stages={{ pass: exam.passT, average: STAGES.average, target: exam.targetT }}
    />
  );
}
