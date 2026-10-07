import { redirect } from "next/navigation";
import { ResultsView } from "@/components/dashboard/ResultsView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { attemptsFor } from "@/lib/wt/history";
import { mockResultsFor } from "@/lib/wt/mock";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ battery?: string }> }) {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/results");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));
  const { battery: raw } = await searchParams;
  const battery = [1, 2, 3, 4, 5].includes(Number(raw)) ? Number(raw) : 0;

  const [mockResults, attempts, exam] = await Promise.all([mockResultsFor(profile.id, 100), attemptsFor(profile.id, 300), examSettings()]);
  return (
    <ResultsView
      profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }}
      mockResults={mockResults}
      attempts={attempts}
      battery={battery}
      passT={exam.passT}
    />
  );
}
