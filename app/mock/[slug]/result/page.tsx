import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { photoUrlOf } from "@/lib/photo";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { BATTERIES } from "@/lib/wt/categories";
import { latestMockResult, loadMock, mockLeaderboard, mockMinutes, mockStanding } from "@/lib/wt/mock";
import { MockScorecard } from "@/components/MockScorecard";

/** The scorecard: every test's T-score, the composite, the verdict and the rank. */
export default async function MockResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const who = await requireUser(`/mock/${slug}/result`);
  const loaded = await loadMock(slug);
  if (!loaded) notFound();
  const { mock, papers } = loaded;

  const result = await latestMockResult(mock.id, who.id);
  const [standing, leaders] = result
    ? await Promise.all([mockStanding(mock.id, who.id), mockLeaderboard(mock.id, 10)])
    : [null, []];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StudentHeader name={who.full_name || "Candidate"} active="mocks" photoUrl={photoUrlOf(who)} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6">
        <Link href="/dashboard" className="text-[13px] font-semibold text-rrb-banner hover:underline">
          ← Dashboard
        </Link>

        {!result ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-[14px] text-gray-500">
            You have not finished this mock yet.{" "}
            <Link href={`/mock/${slug}`} className="font-semibold text-rrb-banner underline">Open it</Link>
          </div>
        ) : (
          <MockScorecard
            mockName={mock.name}
            mockSlug={slug}
            candidate={who.full_name || "Candidate"}
            rollNo={who.roll_no}
            when={formatDateTime(result.submittedAt)}
            cutOffT={mock.cutOffT}
            allowedMin={mockMinutes(mock, papers)}
            result={result}
            standing={standing}
            leaders={leaders}
            batteries={BATTERIES.map((b) => ({ id: b.id, title: b.title }))}
            myId={who.id}
          />
        )}
      </main>
    </div>
  );
}
