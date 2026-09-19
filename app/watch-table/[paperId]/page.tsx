import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { getProfile, isConfigured } from "@/lib/auth";
import { allowanceFor } from "@/lib/wt/attempts";
import { openSitting } from "@/lib/wt/session";
import { loadPaperForCandidate } from "@/lib/wt/db";
import { getBundledPaper, withoutAnswerKey } from "@/lib/wt/paper";

export default async function WatchTablePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // A paper made in the admin panel wins; the bundled sample is the fallback,
  // so the portal still runs before any database is connected.
  const paper =
    (isConfigured() ? await loadPaperForCandidate(paperId) : null) ??
    getBundledPaper(paperId);

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
  if (isConfigured()) {
    const profile = await getProfile();
    const allowance = await allowanceFor(paperId, profile?.id ?? null);

    if (allowance.exhausted) {
      return (
        <main className="mx-auto max-w-lg px-5 py-16 text-center">
          <h1 className="text-lg font-bold text-gray-900">
            {profile ? "No attempts left" : "Please sign in to take this test"}
          </h1>
          <p className="mt-2 text-[14px] text-gray-600">
            {profile
              ? `This paper allows ${allowance.max} attempt${
                  allowance.max === 1 ? "" : "s"
                }, and you have used ${allowance.used}. Ask at the institute if you need another.`
              : "This paper limits how many times it may be taken, so it can only be opened from your own account."}
          </p>
          <Link
            href={profile ? "/dashboard" : "/login"}
            className="mt-5 inline-block rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            {profile ? "Back to my tests" : "Sign in"}
          </Link>
        </main>
      );
    }
  }

  // The key never goes to the browser; /api/watch-table/score marks the paper.
  const who = isConfigured() ? await getProfile() : null;

  // Start the sitting, or join the one already running. The elapsed time comes
  // back from the server's clock, so a second tab cannot buy a fresh
  // countdown and a reload cannot rewind one.
  const sitting = who ? await openSitting(paperId, who.id) : null;

  return (
    <WatchTableExam
      paper={withoutAnswerKey(paper)}
      candidateName={who?.full_name || "Candidate"}
      rollNo={who?.roll_no || "—"}
      elapsedSec={sitting?.elapsedSec ?? null}
    />
  );
}
