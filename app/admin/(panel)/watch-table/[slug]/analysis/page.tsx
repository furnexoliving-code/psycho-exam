import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/wt/cohort";
import { questionStats } from "@/lib/wt/question-stats";
import type { OptionValue } from "@/lib/wt/types";

/**
 * Question by question, how the batch did.
 *
 * The page exists to answer one teaching question — what should be gone over
 * again — so the weakest question is first and the most-chosen wrong option is
 * shown beside it, because which wrong answer they picked usually says what
 * they misunderstood.
 */
export default async function PaperAnalysisPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireAdmin();
  // Reading questions needs the service-role client: SELECT on that table is
  // revoked from `authenticated`, admins included, to keep the answer column
  // away from candidates.
  const supabase = createAdminClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id, display_name")
    .eq("slug", slug)
    .maybeSingle();
  if (!paper) notFound();

  const { data: questions } = await supabase
    .from("watch_questions")
    .select("id, position, prompt_en, answer, topic")
    .eq("paper_id", paper.id)
    .order("position");

  // Page by page: a plain select stops at a thousand attempts without saying so.
  const attempts = await fetchAll<{ responses: Record<string, number> | null }>((from, to) =>
    supabase
      .from("watch_attempts")
      .select("responses")
      .eq("paper_id", paper.id)
      .order("submitted_at", { ascending: true })
      .order("id")
      .range(from, to),
  );

  const ids = new Set((questions ?? []).map((q) => q.id));
  const sheets = attempts
    .map((a) => (a.responses ?? {}) as Record<string, OptionValue>)
    // Attempts recorded before responses were kept arrive empty, and attempts
    // of an earlier question set answer ids that no longer exist; counting
    // either would report every question as skipped.
    .filter((r) => Object.keys(r).some((k) => ids.has(k)));

  const stats = questionStats(
    (questions ?? []).map((q) => ({
      id: q.id,
      position: q.position,
      promptEn: q.prompt_en,
      topic: q.topic ?? "",
      answer: q.answer,
    })),
    sheets,
  );

  const older = attempts.length - sheets.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Question analysis</h1>
        <Link
          href={`/admin/watch-table/${slug}`}
          className="text-[12px] font-semibold text-rrb-banner hover:underline"
        >
          ← Back to the paper
        </Link>
        <Link
          href={`/admin/watch-table/${slug}/results`}
          className="text-[12px] font-semibold text-rrb-banner hover:underline"
        >
          Student results
        </Link>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        {paper.display_name} · {sheets.length} attempt{sheets.length === 1 ? "" : "s"} counted
        · weakest question first
      </p>

      {older > 0 && (
        <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          {older} earlier attempt{older === 1 ? " is" : "s are"} not counted here — they
          were recorded before per-question answers were kept, or on an earlier set
          of questions. New attempts will all appear.
        </p>
      )}

      {sheets.length === 0 ? (
        <p className="mt-6 rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
          No attempts to analyse yet.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Q.</th>
                <th className="border border-gray-300 px-3 py-2">Question</th>
                <th className="border border-gray-300 px-3 py-2">Topic</th>
                <th className="border border-gray-300 px-3 py-2">Correct</th>
                <th className="border border-gray-300 px-3 py-2">Accuracy</th>
                <th className="border border-gray-300 px-3 py-2">Skipped</th>
                <th className="border border-gray-300 px-3 py-2">Answer</th>
                <th className="border border-gray-300 px-3 py-2">Most common mistake</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((q) => {
                const weak = q.attempted > 0 && q.accuracy < 50;
                return (
                  <tr key={q.id} className={weak ? "bg-red-50" : "bg-white even:bg-gray-50"}>
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      {q.position + 1}
                    </td>
                    <td className="max-w-[420px] border border-gray-300 px-3 py-2">
                      {q.promptEn}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600">
                      {q.topic || "—"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {q.correct} / {q.attempted}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      {q.attempted === 0 ? "—" : `${q.accuracy.toFixed(0)}%`}
                      {weak && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                          reteach
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{q.skipped}</td>
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      {q.answer}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {q.topWrong
                        ? `chose ${q.topWrong.option} — ${q.topWrong.count} time${
                            q.topWrong.count === 1 ? "" : "s"
                          }`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
