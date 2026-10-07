import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { FigureExam } from "@/components/wt/FigureExam";
import { ExamChromeProvider } from "@/components/wt/ExamChrome";
import { NoPrint } from "@/components/NoPrint";
import { CATEGORIES } from "@/lib/wt/categories";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { allowanceFor } from "@/lib/wt/attempts";
import { openSitting } from "@/lib/wt/session";
import { loadPaperForCandidate, loadPaperLive } from "@/lib/wt/db";
import { getBundledPaper, withoutAnswerKey } from "@/lib/wt/paper";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { currentMockStep, mockSummary as mockSummaryOf, type MockStep } from "@/lib/wt/mock";
import { photoUrlOf } from "@/lib/photo";

export default async function WatchTablePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // Every paper is sat from an account. There is no public paper: the
  // institute issues the accounts, and a paper reachable without one is the
  // institute's content open to anyone with the link.
  //
  // Papers come from the admin panel. The bundled sample exists only so the
  // portal runs before a database is connected — once one is, it is not a
  // paper any student can reach, or its key would be marked on demand.
  //
  // The two lookups do not depend on each other, so they run together. A
  // student's paper comes from the shared cache; an admin previewing sees the
  // paper as it is right now, draft or not.
  const [who, cached] = isConfigured()
    ? await Promise.all([requireUser(`/test/${paperId}`), loadPaperForCandidate(paperId)])
    : [null, getBundledPaper(paperId)];
  const editor = await isVerifiedEditor();
  const paper = editor ? await loadPaperLive(paperId) : cached;

  if (!paper) notFound();
  // A paper sat as a test of a Full Mock is open for that sitting whatever
  // the battery's switch and the paper's own attempt limit say: the mock
  // chose it, and the mock's own limit was checked when it began.
  const inMock = who && paper.dbId ? await currentMockStep(who.id) : null;
  const mockHere = inMock !== null && inMock.paper.id === paper.dbId;
  // A battery still under test is open to the admin and the editor for
  // trying out, and to nobody else — not even by typing the address.
  // (The bundled samples, served only before a database exists, are a demo
  // for whoever is setting the portal up, and stay reachable.)
  if (isConfigured() && !editor && !mockHere && !openToStudents(paper.category, await hiddenBatteries())) notFound();
  // A paper kept for Full Mocks is no sectional test: outside its mock it is not there.
  if (isConfigured() && !editor && !mockHere && paper.mockOnly) notFound();
  if (paper.questions.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-lg font-bold text-gray-900">This paper has no questions yet</h1>
        <p className="mt-2 text-[14px] text-gray-600">
          Upload them in the admin panel, then publish the paper.
        </p>
      </main>
    );
  }

  // The limit is checked here, on the server, before the paper is handed over.
  // Hiding the button on the dashboard is a courtesy; this is the rule.
  if (who && paper.dbId && !mockHere) {
    const allowance = await allowanceFor(paper.dbId, paper.maxAttempts ?? null, who.id);

    if (allowance.exhausted) {
      return (
        <main className="mx-auto max-w-lg px-5 py-16 text-center">
          <h1 className="text-lg font-bold text-gray-900">No attempts left</h1>
          <p className="mt-2 text-[14px] text-gray-600">
            This paper allows {allowance.max} attempt{allowance.max === 1 ? "" : "s"}, and
            you have used {allowance.used}. Ask at the institute if you need another.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            Back to my tests
          </Link>
        </main>
      );
    }
  }

  // Start the sitting, or join the one already running. The elapsed time comes
  // back from the server's clock, so a second tab cannot buy a fresh
  // countdown and a reload cannot rewind one.
  const sitting = who && paper.dbId ? await openSitting(paper.dbId, who.id) : null;

  // The key never goes to the browser; /api/watch-table/score marks the paper.
  // A Perceptual Speed paper has its own screen; everything else is the
  // Following Directions engine, unchanged.
  const Screen = paper.kind === "figure" ? FigureExam : WatchTableExam;
  // The header's tab strip shows the whole test series around this paper's
  // battery, as the hall screen does; the screens themselves need not know.
  const battery =
    CATEGORIES.find((c) => c.id === paper.category)?.battery ??
    // A paper with no category is a Following Directions one from before
    // the categories existed, or the bundled sample.
    (paper.kind === "figure" ? null : 2);
  // Inside a mock the break between this paper's parts lists every test of
  // the mock, as the hall's Exam Summary does.
  const mockSummary = mockHere && inMock ? await mockSummary_(inMock) : null;
  return (
    <NoPrint>
    <ExamChromeProvider battery={battery} mockSummary={mockSummary} photoUrl={photoUrlOf(who)}>
      <Screen
        paper={withoutAnswerKey(paper)}
        candidateName={who?.full_name || "Candidate"}
        rollNo={who?.roll_no || ""}
        elapsedSec={sitting?.elapsedSec ?? null}
        questionElapsedSec={sitting?.questionElapsedSec ?? null}
        storageOwner={who?.id ?? "guest"}
      />
    </ExamChromeProvider>
    </NoPrint>
  );
}

function mockSummary_(step: MockStep) {
  return mockSummaryOf(step.papers, step.attemptIds, step.step);
}
