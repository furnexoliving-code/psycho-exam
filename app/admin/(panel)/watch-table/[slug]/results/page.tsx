import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tScore } from "@/lib/wt/tscore";
import {
  aggregateFromRows,
  cohortFromMoments,
  cohortMarks,
  fetchAll,
  momentsFromAggregate,
  type AttemptMark,
  type CohortAggregate,
} from "@/lib/wt/cohort";
import { decideCutOff } from "@/lib/wt/cutoff";
import { resolveResultView } from "@/lib/wt/types";
import { ResultsTable, type ResultRow } from "./ResultsTable";

interface AttemptRow extends AttemptMark {
  id: string;
  attempted: number;
  duration_sec: number | null;
}

export default async function PaperResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // On the page itself, not only in the layout, which a request can skip.
  await requireAdmin(`/admin/watch-table/${slug}/results`);
  const supabase = await createClient();

  const { data: paper } = await supabase
    .from("watch_papers")
    .select("id, display_name, cut_off_marks, cut_off_tscore, reference_mean, reference_sd, stats_min_attempts, result_view")
    .eq("slug", slug)
    .maybeSingle();
  if (!paper) notFound();

  const { count: questionCount } = await supabase
    .from("watch_questions_public")
    .select("id", { count: "exact", head: true })
    .eq("paper_id", paper.id);
  const total = questionCount ?? 0;

  // Every attempt, page by page — a plain select stops at a thousand — and
  // the cohort summed by the database, the same function the candidate's
  // own result uses, so the two can never disagree.
  const [rows, aggregate] = await Promise.all([
    fetchAll<AttemptRow>((from, to) =>
      supabase
        .from("watch_attempts")
        .select("id, user_id, marks, total, attempted, duration_sec, submitted_at")
        .eq("paper_id", paper.id)
        .order("submitted_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    supabase
      .rpc("watch_cohort", { p_paper: paper.id, p_total: total, p_user: null, p_marks: 0 })
      .maybeSingle(),
  ]);

  const view = resolveResultView(paper.result_view ?? undefined);

  // One mark per candidate, their latest, over the paper's current length.
  // Without the database function (schema file not re-run yet) the same sum
  // is taken here from the rows.
  const agg =
    aggregate.error || !aggregate.data
      ? aggregateFromRows(rows, null, total, 0)
      : (aggregate.data as CohortAggregate);
  const cohort = cohortFromMoments(momentsFromAggregate(agg, null), paper);
  const enough = cohort?.source === "cohort";
  const { mean, sd } = cohort ?? { mean: 0, sd: 0 };
  // For the rank column: everyone's latest, in memory.
  const marks = cohortMarks(rows, total);

  // Names come from profiles; an attempt taken without signing in has none.
  const userIds = [...new Set(rows.map((a) => a.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, roll_no")
        .in("id", userIds)
    : { data: [] };

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const sortedMarks = [...marks].sort((a, b) => b - a);
  const result: ResultRow[] = rows.map((a) => {
    const t = tScore(a.marks as number, cohort);
    const profile = a.user_id ? byId.get(a.user_id) : undefined;

    return {
      id: a.id,
      name: profile?.full_name || "Not signed in",
      rollNo: profile?.roll_no || "—",
      marks: a.marks,
      total: a.total,
      attempted: a.attempted,
      durationSec: a.duration_sec,
      tScore: t ? Number(t.value.toFixed(1)) : null,
      rank: sortedMarks.filter((m) => m > a.marks).length + 1,
      // The same decision the candidate saw — same module, same switches — so
      // staff and student can never be shown opposite verdicts.
      qualified:
        decideCutOff(
          { marks: paper.cut_off_marks, tScore: paper.cut_off_tscore },
          a.marks,
          t?.value ?? null,
          { useMarks: view.cutOffMarks, showTScore: true },
        )?.qualified ?? null,
      submittedAt: a.submitted_at,
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Results</h1>
        <span className="text-[13px] text-gray-600">{paper.display_name}</span>
        <Link
          href={`/admin/watch-table/${slug}`}
          className="ml-auto rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
        >
          ← Back to the paper
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-5">
        <Stat label="Attempts" value={String(rows.length)} />
        <Stat label="Candidates" value={String(marks.length)} />
        <Stat label="Mean" value={cohort ? mean.toFixed(2) : "—"} />
        <Stat label="Standard deviation" value={cohort ? sd.toFixed(2) : "—"} />
        <Stat
          label="T-score source"
          value={cohort ? (cohort.source === "cohort" ? "Live cohort" : "Reference") : "None"}
        />
      </div>

      {!enough && cohort?.source === "reference" && (
        <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          Fewer than {paper.stats_min_attempts ?? 5} candidates so far, so T-scores use
          the reference figures rather than this cohort. Each candidate counts once,
          by their latest attempt.
        </p>
      )}

      <ResultsTable rows={result} slug={slug} />
    </>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
