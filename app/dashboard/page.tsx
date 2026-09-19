import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, requireUser } from "@/lib/auth";
import { listTests } from "@/lib/db";
import { listPublishedPapers } from "@/lib/wt/db";
import { createClient } from "@/lib/supabase/server";
import { formatClock } from "@/lib/scoring";

interface AttemptScore {
  totalCorrect?: number;
  scoredQuestions?: number;
  overallAccuracy?: number;
}

export default async function DashboardPage() {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
          <div className="rounded border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
            <p className="font-semibold">Accounts are not set up yet.</p>
            <p className="mt-2">
              The sample test still works without signing in:
            </p>
            <Link
              href="/exam/alp-psycho-1/instructions"
              className="mt-3 inline-block rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
            >
              Open the sample test
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const profile = await requireUser();
  const tests = await listTests();
  // Watch Table papers live in their own tables, so they need listing too —
  // otherwise a published paper is reachable only by someone who already has
  // its link.
  const watchPapers = await listPublishedPapers();
  const supabase = await createClient();

  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, test_id, started_at, submitted_at, score")
    .eq("user_id", profile.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(20);

  const testName = new Map(tests.map((t) => [t.id, t.display_name]));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">
              {profile.full_name || "Candidate"}
            </span>
            <SignOutButton />
          </div>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            {profile.roll_no && (
              <p className="text-[12px] text-gray-500">Roll no. {profile.roll_no}</p>
            )}
          </div>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="rounded border border-gray-400 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-100"
            >
              Admin panel
            </Link>
          )}
        </div>

        {watchPapers.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-[15px] font-bold text-gray-900">
              Watch Table tests
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex flex-col rounded border border-gray-300 bg-white p-4"
                >
                  <h3 className="text-[14px] font-bold text-gray-900">
                    {paper.displayName}
                  </h3>
                  <p className="mt-1 text-[12px] text-gray-500">
                    {paper.questionCount} questions · {paper.timeLimitMin} min
                    <span className="block">
                      {paper.instructionTimeMin} min to read the instructions first
                    </span>
                  </p>
                  <Link href={`/watch-table/${paper.slug}`} className="mt-auto pt-4">
                    <span className="block rounded bg-indigo-800 px-4 py-2 text-center text-[13px] font-semibold text-white hover:bg-indigo-900">
                      Start test
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">Available tests</h2>
          {tests.length === 0 ? (
            <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
              {watchPapers.length > 0
                ? "No other tests have been published yet."
                : "No tests have been published yet. Please check back later."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-col rounded border border-gray-300 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-bold text-gray-900">
                      {test.display_name}
                    </h3>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        test.is_free
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {test.is_free ? "Free" : "Paid"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-gray-500">
                    {test.question_count} questions · {test.total_minutes} min
                  </p>
                  <Link
                    href={`/exam/${test.slug}/instructions`}
                    className="mt-auto pt-4"
                  >
                    <span className="block rounded bg-indigo-800 px-4 py-2 text-center text-[13px] font-semibold text-white hover:bg-indigo-900">
                      Start test
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-gray-900">Your past results</h2>
          {attempts?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-rrb-banner text-left text-white">
                    <th className="border border-gray-300 px-3 py-2">Test</th>
                    <th className="border border-gray-300 px-3 py-2">Score</th>
                    <th className="border border-gray-300 px-3 py-2">Accuracy</th>
                    <th className="border border-gray-300 px-3 py-2">Time taken</th>
                    <th className="border border-gray-300 px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const score = (a.score ?? {}) as AttemptScore;
                    const seconds = a.submitted_at
                      ? (new Date(a.submitted_at).getTime() -
                          new Date(a.started_at).getTime()) /
                        1000
                      : 0;
                    return (
                      <tr key={a.id} className="bg-white even:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                          {testName.get(a.test_id) ?? "—"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {score.totalCorrect ?? 0} / {score.scoredQuestions ?? 0}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {(score.overallAccuracy ?? 0).toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-mono tabular-nums">
                          {formatClock(seconds)}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {a.submitted_at
                            ? new Date(a.submitted_at).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
              You have not completed any test yet.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
