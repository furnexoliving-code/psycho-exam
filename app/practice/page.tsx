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
import { accessFor, canPractice } from "@/lib/packages";
import { LockedView } from "@/components/student/LockedView";

export default async function PracticePage() {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/practice");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const [allPapers, hidden, progress, attempts, exam, access] = await Promise.all([
    listPublishedPapers(),
    hiddenBatteries(),
    batteryProgress(profile.id),
    attemptsFor(profile.id, 1000),
    examSettings(),
    accessFor(profile.id, profile.role),
  ]);
  if (!canPractice(access, "alp")) {
    return (
      <LockedView
        profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }}
        active="practice"
        title="Practice Tests are in the Sectional package"
        titleHi="प्रैक्टिस टेस्ट सेक्शनल पैकेज में हैं"
        what="Every practice paper of all 5 tests, up to 3 attempts each, with your best T-Score per paper and Today's plan on the dashboard."
        whatHi="पाँचों टेस्ट के सभी प्रैक्टिस पेपर, हर पेपर 3 बार, हर पेपर का best T-Score और डैशबोर्ड पर आज का प्लान।"
        packageKind="sectional"
      />
    );
  }
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
