import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { isConfigured, requireUser } from "@/lib/auth";
import { listTests } from "@/lib/db";
import { listPublishedPapers } from "@/lib/wt/db";
import { allowanceFor } from "@/lib/wt/attempts";
import { CATEGORIES } from "@/lib/wt/categories";
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
  // What each paper still allows this student, so the card can say it before
  // they start rather than after they are turned away.
  const allowances = await Promise.all(
    watchPapers.map((p) => allowanceFor(p.slug, profile.id)),
  );
  const allowanceOf = new Map(watchPapers.map((p, i) => [p.slug, allowances[i]]));
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
        <div className="rounded-xl bg-gradient-to-r from-rrb-banner to-rrb-tealDark px-6 py-5 text-white shadow">
          <h1 className="text-[22px] font-bold">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="mt-0.5 text-[13px] text-white/85">
            {profile.roll_no ? `Roll no. ${profile.roll_no} · ` : ""}
            KAUTILYA CLASSES — RRB ALP psycho test practice
          </p>
        </div>

        <h2 className="mt-7 text-[17px] font-bold text-gray-900">
          Following Directions Test
        </h2>
        <p className="mt-0.5 text-[13px] text-gray-600">
          निर्देश पालन परीक्षण — choose a test to begin.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const papers = watchPapers.filter((p) => p.category === category.id);

            return (
              <section
                key={category.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-[15px] font-bold text-gray-900">{category.title}</h3>
                <p className="text-[12px] text-rrb-tealDark" lang="hi">
                  {category.hindi}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
                  {category.blurb}
                </p>

                {papers.length === 0 ? (
                  <p className="mt-4 rounded-lg bg-gray-50 px-3 py-6 text-center text-[12px] text-gray-500">
                    No test published yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {papers.map((paper) => {
                      const allowance = allowanceOf.get(paper.slug)!;
                      return (
                        <li
                          key={paper.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <p className="text-[13px] font-semibold text-gray-900">
                            {paper.displayName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {paper.questionCount} questions · {paper.timeLimitMin} min
                          </p>

                          {allowance.max !== null && (
                            <p
                              className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                                allowance.exhausted
                                  ? "bg-red-50 text-red-800"
                                  : "bg-green-50 text-green-800"
                              }`}
                            >
                              {allowance.exhausted
                                ? `No attempts left (${allowance.used} of ${allowance.max})`
                                : `${allowance.remaining} of ${allowance.max} left`}
                            </p>
                          )}

                          <div className="mt-3 flex gap-2">
                            {allowance.exhausted ? (
                              <span className="flex-1 cursor-not-allowed rounded bg-gray-200 px-3 py-2 text-center text-[12px] font-semibold text-gray-500">
                                Attempts finished
                              </span>
                            ) : (
                              <Link
                                href={`/watch-table/${paper.slug}`}
                                className="flex-1 rounded bg-indigo-800 px-3 py-2 text-center text-[12px] font-semibold text-white hover:bg-indigo-900"
                              >
                                {allowance.used > 0 ? "Re-attempt" : "Start test"}
                              </Link>
                            )}
                            {allowance.used > 0 && (
                              <Link
                                href={`/watch-table/${paper.slug}/result`}
                                className="flex-1 rounded border border-indigo-800 px-3 py-2 text-center text-[12px] font-semibold text-indigo-800 hover:bg-indigo-50"
                              >
                                Result
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <h2 className="mt-9 text-[17px] font-bold text-gray-900">Your past results</h2>
        {attempts?.length ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-700">
                  <th className="px-4 py-2 font-semibold">Test</th>
                  <th className="px-4 py-2 font-semibold">Score</th>
                  <th className="px-4 py-2 font-semibold">Taken</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const score = (a.score ?? {}) as AttemptScore;
                  const seconds = a.submitted_at
                    ? (new Date(a.submitted_at).getTime() -
                        new Date(a.started_at).getTime()) / 1000
                    : 0;
                  return (
                    <tr key={a.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">{testName.get(a.test_id) ?? "—"}</td>
                      <td className="px-4 py-2">
                        {score.totalCorrect ?? 0} / {score.scoredQuestions ?? 0}
                      </td>
                      <td className="px-4 py-2 font-mono tabular-nums">
                        {formatClock(seconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-[13px] text-gray-500">
            You have not completed any test yet.
          </p>
        )}
      </main>
    </div>
  );
}
