import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { allowanceFor } from "@/lib/wt/attempts";
import { openSitting } from "@/lib/wt/session";
import { loadPaperForCandidate, loadPaperLive } from "@/lib/wt/db";
import { getBundledPaper, withoutAnswerKey } from "@/lib/wt/paper";

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
    ? await Promise.all([requireUser(`/watch-table/${paperId}`), loadPaperForCandidate(paperId)])
    : [null, getBundledPaper(paperId)];
  const paper =
    (await isVerifiedEditor()) ? await loadPaperLive(paperId) : cached;

  if (!paper) notFound();
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
  if (who && paper.dbId) {
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
  return (
    <WatchTableExam
      paper={withoutAnswerKey(paper)}
      candidateName={who?.full_name || "Candidate"}
      rollNo={who?.roll_no || ""}
      elapsedSec={sitting?.elapsedSec ?? null}
      questionElapsedSec={sitting?.questionElapsedSec ?? null}
      storageOwner={who?.id ?? "guest"}
    />
  );
}
