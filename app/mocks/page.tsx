import { redirect } from "next/navigation";
import { MocksView, type MockCard } from "@/components/student/MocksView";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { photoUrlOf } from "@/lib/photo";
import { examSettings } from "@/lib/settings";
import { currentMockStep, listPublishedMocks, mockResultsFor, mockSizes, mockStatus, scoreOutOf30 } from "@/lib/wt/mock";
import { accessFor, canSitMock } from "@/lib/packages";

export default async function MocksPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!isConfigured()) redirect("/dashboard");
  const profile = await requireUser("/mocks");
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));
  const { show } = await searchParams;
  const filter = ["open", "upcoming", "done", "closed"].includes(show ?? "") ? (show as string) : "all";

  const [mocks, results, inMock, exam, access] = await Promise.all([
    listPublishedMocks(),
    mockResultsFor(profile.id, 500),
    currentMockStep(profile.id),
    examSettings(),
    accessFor(profile.id, profile.role),
  ]);
  // Each mock's questions and minutes, for its line in the list.
  const sizes = await mockSizes(mocks);

  const cards: MockCard[] = mocks.map((mock) => {
    const mine = results.filter((r) => r.mockId === mock.id);
    const best = mine.reduce<(typeof mine)[number] | null>((b, r) => {
      const s = scoreOutOf30(r.tests) ?? -1;
      return b === null || s > (scoreOutOf30(b.tests) ?? -1) ? r : b;
    }, null);
    return {
      mock,
      status: mockStatus(mock),
      used: mine.length,
      latest: mine[0] ?? null,
      best,
      inProgress: inMock?.mock.id === mock.id,
      inPackage: canSitMock(access, mock),
      size: sizes.get(mock.id) ?? null,
    };
  });

  return <MocksView profile={{ full_name: profile.full_name, photoUrl: photoUrlOf(profile) }} cards={cards} passT={exam.passT} filter={filter} hasPackage={access.all || access.full.has("alp")} />;
}
