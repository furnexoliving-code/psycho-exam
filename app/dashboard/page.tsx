import { redirect } from "next/navigation";
import { indianDay } from "@/lib/format-time";
import { examSettings } from "@/lib/settings";
import { activeNotices, listNotices } from "@/lib/notices";
import { SiteHeader } from "@/components/SiteHeader";
import { Suspense } from "react";
import { DashboardView, LeaderBoard } from "@/components/dashboard/DashboardView";
import { photoUrlOf } from "@/lib/photo";
import { isConfigured, panelHome, requireUser } from "@/lib/auth";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { listPublishedPapers } from "@/lib/wt/db";
import { allowancesFromRows } from "@/lib/wt/attempts";
import { batteryProgressWithAttempts } from "@/lib/wt/progress";
import { currentMockStep, listPublishedMocks, mockLeaderboard, mockResultsFor } from "@/lib/wt/mock";
import { accessFor, canPractice } from "@/lib/packages";

export default async function DashboardPage() {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
          <div className="rounded border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
            <p className="font-semibold">Accounts are not set up yet.</p>
          </div>
        </main>
      </div>
    );
  }

  const profile = await requireUser();
  // A helper account has one job, and its page is in the panel.
  if (profile.role !== "student" && profile.role !== "admin") redirect(panelHome(profile.role));

  const now = Date.now();
  const today = indianDay(now);
  const dayStart = new Date(`${today}T00:00:00+05:30`).toISOString();

  // Everything in one round. The student's attempts are read once and
  // serve both the progress figures and the attempts left per paper; the
  // mocks finished today are counted from the results already in hand.
  // The leaderboard streams in on its own after the page, under the
  // Suspense boundary.
  const allPapers = await listPublishedPapers();
  const [hidden, { progress, attempts }, mocks, mockResults, inMock, exam, allNotices, access] = await Promise.all([
    hiddenBatteries(),
    batteryProgressWithAttempts(profile.id),
    listPublishedMocks(),
    mockResultsFor(profile.id, 30),
    currentMockStep(profile.id),
    examSettings(),
    listNotices(),
    accessFor(profile.id, profile.role),
  ]);
  const allowances = allowancesFromRows(allPapers, attempts);
  const mocksToday = mockResults.filter((r) => Date.parse(r.submittedAt) >= Date.parse(dayStart)).length;
  // Papers of a battery the admin has not opened yet are not on offer, and
  // none are without the sectional package.
  const practice = canPractice(access, "alp");
  const papers = practice ? allPapers.filter((p) => openToStudents(p.category, hidden)) : [];
  const newest = mockResults[0] ?? null;

  return (
    <DashboardView
      profile={{ id: profile.id, full_name: profile.full_name, phone: profile.phone, photoUrl: photoUrlOf(profile) }}
      now={now}
      today={today}
      notices={activeNotices(allNotices, today)}
      papers={papers}
      hidden={hidden}
      progress={progress}
      mocks={mocks}
      mockResults={mockResults}
      inMock={inMock}
      exam={exam}
      mocksToday={mocksToday}
      allowances={allowances}
      leadersSlot={
        newest ? (
          <Suspense fallback={null}>
            <Leaders mockId={newest.mockId} mockName={newest.mockName} mockSlug={newest.mockSlug} myId={profile.id} />
          </Suspense>
        ) : null
      }
      access={{ sectional: practice, full: access.all || access.full.has("alp") }}
    />
  );
}

/** The newest mock's leaderboard, fetched after the page has gone out: it is the slowest read and the least urgent. */
async function Leaders({ mockId, mockName, mockSlug, myId }: { mockId: string; mockName: string; mockSlug: string; myId: string }) {
  const leaders = await mockLeaderboard(mockId, 5);
  if (leaders.length === 0) return null;
  return <LeaderBoard leaders={leaders} mockName={mockName} mockSlug={mockSlug} myId={myId} />;
}
