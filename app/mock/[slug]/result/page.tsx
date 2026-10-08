import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentHeader } from "@/components/StudentHeader";
import { photoUrlOf } from "@/lib/photo";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { BATTERIES } from "@/lib/wt/categories";
import { latestMockResult, loadMock, mockLeaderboard, mockMinutes, mockStanding } from "@/lib/wt/mock";
import { MockScorecard } from "@/components/MockScorecard";
import { ScorecardOffer } from "@/components/ScorecardOffer";
import { accessFor, canPractice, listPackages } from "@/lib/packages";
import { listPublishedPapers } from "@/lib/wt/db";
import { batteryOf } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";

/** The scorecard: every test's T-score, the composite, the verdict and the rank. */
export default async function MockResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const who = await requireUser(`/mock/${slug}/result`);
  const loaded = await loadMock(slug);
  if (!loaded) notFound();
  const { mock, papers } = loaded;

  const result = await latestMockResult(mock.id, who.id);
  const [standing, leaders, access] = result
    ? await Promise.all([mockStanding(mock.id, who.id), mockLeaderboard(mock.id, 10), accessFor(who.id, who.role)])
    : [null, [], null];

  // Without the practice papers, the scorecard ends with the way to them:
  // the weakest test by name, and how many papers the portal has for it.
  let offer: React.ReactNode = null;
  if (result && access && !canPractice(access, "alp")) {
    const [packages, papers, hidden] = await Promise.all([listPackages("alp"), listPublishedPapers(), hiddenBatteries()]);
    const measured = result.tests.filter((t) => t.tScore !== null);
    const weakest = (measured.length ? measured : result.tests).reduce<(typeof result.tests)[number] | null>((w, t) => (w === null || (t.tScore ?? 0) < (w.tScore ?? 0) ? t : w), null);
    const battery = weakest?.battery ?? null;
    const papersForIt = battery === null ? 0 : papers.filter((p) => !p.mockOnly && openToStudents(p.category, hidden) && batteryOf(p.category) === battery).length;
    const sectional = packages.find((p) => p.kind === "sectional") ?? null;
    const combo = packages.find((p) => p.kind === "combo") ?? null;
    const name = battery === null ? weakest?.name ?? "" : (BATTERIES.find((b) => b.id === battery)?.title ?? weakest?.name ?? "");
    offer = (
      <ScorecardOffer
        weakest={weakest ? { name, tScore: weakest.tScore } : null}
        papersForIt={papersForIt}
        cutOffT={mock.cutOffT}
        sectional={sectional ? { name: sectional.name, priceInr: sectional.priceInr } : null}
        combo={combo ? { name: combo.name, priceInr: combo.priceInr } : null}
        hasFull={access.all || access.full.has("alp")}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="no-print">
        <StudentHeader name={who.full_name || "Candidate"} active="mocks" photoUrl={photoUrlOf(who)} />
      </div>
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
        {offer}
      </main>
    </div>
  );
}
