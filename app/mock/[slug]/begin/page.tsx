import { notFound, redirect } from "next/navigation";
import { MockBegin } from "@/components/MockBegin";
import { requireUser } from "@/lib/auth";
import { currentMockStep, loadMock, mockAttemptsUsed, mockStatus, mockUnlockedFor } from "@/lib/wt/mock";

/**
 * The general instructions and the declaration before a Full Mock's first
 * test, as the hall shows them. A sitting already open skips straight to
 * the test it is on; a mock that cannot be started goes back to its door,
 * which says why.
 */
export default async function MockBeginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const who = await requireUser(`/mock/${slug}/begin`);
  const loaded = await loadMock(slug);
  if (!loaded || !loaded.mock.isPublished) notFound();
  const { mock, papers } = loaded;

  const current = await currentMockStep(who.id);
  if (current && current.mock.id === mock.id) redirect(`/watch-table/${current.paper.slug}`);
  if (current) redirect(`/mock/${slug}`);

  const [used, unlocked] = await Promise.all([mockAttemptsUsed(mock.id, who.id), mockUnlockedFor(who.id, papers)]);
  const spent = mock.maxAttempts !== null && used >= mock.maxAttempts;
  if (mockStatus(mock) !== "live" || spent || !unlocked) redirect(`/mock/${slug}`);

  return <MockBegin slug={slug} candidate={who.full_name || "Candidate"} rollNo={who.roll_no || ""} />;
}
