import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { FigureExam } from "@/components/wt/FigureExam";
import { ExamChromeProvider } from "@/components/wt/ExamChrome";
import { NoPrint } from "@/components/NoPrint";
import { OneTab } from "@/components/wt/OneTab";
import type { Metadata } from "next";
import { CATEGORIES, testNameOf } from "@/lib/wt/categories";
import { headerOf, loadPaperHeader } from "@/lib/wt/db";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { allowanceFor } from "@/lib/wt/attempts";
import { openSitting } from "@/lib/wt/session";
import { loadPaperForCandidate, loadPaperLive } from "@/lib/wt/db";
import { getBundledPaper, withoutAnswerKey } from "@/lib/wt/paper";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
import { currentMockStep, mockSummary as mockSummaryOf, type MockStep } from "@/lib/wt/mock";
import { photoUrlOf } from "@/lib/photo";
import { accessFor, canPractice } from "@/lib/packages";


/** The window's title while a paper is open: the test's name, as the hall writes it. */
export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }): Promise<Metadata> {
  const { paperId } = await params;
  const header = isConfigured()
    ? await loadPaperHeader(paperId).catch(() => null)
    : (() => {
        const bundled = getBundledPaper(paperId);
        return bundled ? headerOf(bundled) : null;
      })();
  if (!header) return {};
  const battery = CATEGORIES.find((c) => c.id === header.category)?.battery ?? (header.kind === "figure" ? null : 2);
  const name = testNameOf(battery, header.displayName);
  return { title: `${battery ? `Test ${battery} - ` : ""}${name} | KAUTILYA CLASSES` };
}

export default async function WatchTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ paperId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { paperId } = await params;
  const { view } = await searchParams;

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
  // "Preview as student": the editor sees the paper under every rule a
  // student is under, and is told which rule shuts it instead of a 404.
  const preview = view === "student" && (await isVerifiedEditor());
  const editor = !preview && (await isVerifiedEditor());
  const paper = editor ? await loadPaperLive(paperId) : cached;

  if (!paper) {
    if (preview) return <PreviewShut reason="This paper is not published, so students cannot open it." paperId={paperId} />;
    notFound();
  }
  // A paper sat as a test of a Full Mock is open for that sitting whatever
  // the battery's switch and the paper's own attempt limit say: the mock
  // chose it, and the mock's own limit was checked when it began.
  const inMock = who && paper.dbId ? await currentMockStep(who.id) : null;
  const mockHere = inMock !== null && inMock.paper.id === paper.dbId;
  // A battery still under test is open to the admin and the editor for
  // trying out, and to nobody else — not even by typing the address.
  // (The bundled samples, served only before a database exists, are a demo
  // for whoever is setting the portal up, and stay reachable.)
  if (isConfigured() && !editor && !mockHere && !openToStudents(paper.category, await hiddenBatteries())) {
    if (preview) return <PreviewShut reason="This paper's battery is hidden from students (Test Papers → Show to students)." paperId={paperId} />;
    notFound();
  }
  // A paper kept for Full Mocks is no sectional test: outside its mock it is not there.
  if (isConfigured() && !editor && !mockHere && paper.mockOnly) {
    if (preview) return <PreviewShut reason="This paper is kept for Full Mocks only; students reach it inside a mock, not from the lists." paperId={paperId} />;
    notFound();
  }
  // A practice paper is in the sectional package; inside a mock the mock's
  // own package was checked when it began.
  if (who && isConfigured() && !editor && !mockHere && !canPractice(await accessFor(who.id, who.role), paper.exam ?? "alp")) {
    if (preview) return <PreviewShut reason="Students need the Sectional package for this paper (Packages)." paperId={paperId} />;
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-lg font-bold text-gray-900">This paper is in the Sectional package</h1>
        <p className="mt-2 text-[14px] text-gray-600">
          Practice papers open with the Sectional or the Sectional + Full Mock package.
          <span className="mt-1 block" lang="hi">प्रैक्टिस पेपर सेक्शनल या सेक्शनल + फुल मॉक पैकेज से खुलते हैं।</span>
        </p>
        <Link href="/packages#sectional" className="mt-5 inline-block rounded bg-[#0d2a6b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0a2158]">
          See packages and prices
        </Link>
      </main>
    );
  }
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
    <OneTab paperId={paper.id} />
    {preview && (
      <div className="fixed bottom-3 left-3 z-[90] rounded bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-950 shadow">
        Student preview · <Link href={`/admin/papers/${paperId}`} className="underline">back to the paper</Link>
      </div>
    )}
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

/** What the editor sees in a student preview of a paper a student cannot open. */
function PreviewShut({ reason, paperId }: { reason: string; paperId: string }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Student preview</p>
      <h1 className="mt-2 text-lg font-bold text-gray-900">A student cannot open this paper right now</h1>
      <p className="mt-2 text-[14px] text-gray-600">{reason}</p>
      <Link href={`/admin/papers/${paperId}`} className="mt-6 inline-block rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900">
        Back to the paper
      </Link>
    </main>
  );
}
