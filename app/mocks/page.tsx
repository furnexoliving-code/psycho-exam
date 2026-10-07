import { redirect } from "next/navigation";
import { MocksView, type MockCard } from "@/components/student/MocksView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { batteryOf } from "@/lib/wt/series";
import { batteryProgress, clearedBar } from "@/lib/wt/progress";
import { currentMockStep, listPublishedMocks, mockResultsFor, mockStatus, scoreOutOf30 } from "@/lib/wt/mock";

export default async function MocksPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/mocks");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));
  const { show } = await searchParams;
  const filter = ["open", "upcoming", "done", "closed"].includes(show ?? "") ? (show as string) : "all";

  const [mocks, results, inMock, progress, exam] = await Promise.all([
    listPublishedMocks(),
    mockResultsFor(profile.id, 500),
    currentMockStep(profile.id),
    batteryProgress(profile.id),
    examSettings(),
  ]);

  // Which batteries each mock holds, in one query over every paper named.
  const ids = [...new Set(mocks.flatMap((m) => m.paperIds))];
  const { data: paperRows } = ids.length
    ? await createAdminClient().from("watch_papers").select("id, category").in("id", ids)
    : { data: [] as { id: string; category: string | null }[] };
  const categoryOf = new Map((paperRows ?? []).map((r) => [r.id as string, (r.category as string) ?? "watch"]));

  const cards: MockCard[] = mocks.map((mock) => {
    const mine = results.filter((r) => r.mockId === mock.id);
    const best = mine.reduce<(typeof mine)[number] | null>((b, r) => {
      const s = scoreOutOf30(r.tests) ?? -1;
      return b === null || s > (scoreOutOf30(b.tests) ?? -1) ? r : b;
    }, null);
    const batteries = [...new Set(mock.paperIds.map((id) => batteryOf(categoryOf.get(id) ?? "watch")))];
    return {
      mock,
      status: mockStatus(mock),
      used: mine.length,
      latest: mine[0] ?? null,
      best,
      unlocked: batteries.length > 0 && clearedBar(progress, batteries, exam.passT),
      inProgress: inMock?.mock.id === mock.id,
    };
  });

  return <MocksView profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }} cards={cards} passT={exam.passT} filter={filter} />;
}
