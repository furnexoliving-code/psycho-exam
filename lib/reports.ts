import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Question reports: a student's flag on a question from the review, and
 * the panel's view of the open flags, grouped per question.
 */
export interface OpenReport {
  paperId: string;
  paperName: string;
  paperSlug: string;
  questionId: string;
  position: number;
  count: number;
  notes: string[];
  latestAt: string;
}

export const MAX_NOTE = 300;

/** Files the flag; a student flags a question once. Returns a message for the student. */
export async function fileReport(userId: string, paperId: string, questionId: string, note: string): Promise<string> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("question_reports")
    .select("id")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .is("resolved_at", null)
    .limit(1);
  if (existing?.length) return "You have already reported this question. The institute will look at it.";
  const { error } = await supabase.from("question_reports").insert({
    paper_id: paperId,
    question_id: questionId,
    user_id: userId,
    note: note.slice(0, MAX_NOTE),
  });
  if (error) {
    throw new Error(
      /relation .* does not exist|schema cache|PGRST205/i.test(error.message)
        ? "Reporting is not switched on yet. Tell the institute directly."
        : error.message,
    );
  }
  return "Reported. Thank you; the institute will check this question.";
}

/** Every open flag, newest question first, with the paper and the question's number. */
export async function openReports(): Promise<OpenReport[]> {
  const supabase = createAdminClient();
  let rows: { paper_id: string; question_id: string; note: string; created_at: string }[] = [];
  try {
    const { data } = await supabase
      .from("question_reports")
      .select("paper_id, question_id, note, created_at")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(2000);
    rows = (data ?? []) as typeof rows;
  } catch {
    return [];
  }
  if (rows.length === 0) return [];

  const paperIds = [...new Set(rows.map((r) => r.paper_id))];
  const questionIds = [...new Set(rows.map((r) => r.question_id))];
  const [{ data: papers }, { data: questions }] = await Promise.all([
    supabase.from("watch_papers").select("id, display_name, slug").in("id", paperIds),
    supabase.from("watch_questions").select("id, position").in("id", questionIds),
  ]);
  const paperOf = new Map((papers ?? []).map((p) => [p.id as string, p]));
  const positionOf = new Map((questions ?? []).map((q) => [q.id as string, Number(q.position)]));

  const grouped = new Map<string, OpenReport>();
  for (const r of rows) {
    const key = r.question_id;
    const paper = paperOf.get(r.paper_id);
    const g = grouped.get(key) ?? {
      paperId: r.paper_id,
      paperName: (paper?.display_name as string) ?? "(deleted paper)",
      paperSlug: (paper?.slug as string) ?? "",
      questionId: r.question_id,
      position: positionOf.get(r.question_id) ?? 0,
      count: 0,
      notes: [],
      latestAt: r.created_at,
    };
    g.count += 1;
    if (r.note && g.notes.length < 5) g.notes.push(r.note);
    grouped.set(key, g);
  }
  return [...grouped.values()];
}

/** How many questions have open flags; 0 on a database without the table. */
export async function openReportCount(): Promise<number> {
  try {
    const { data } = await createAdminClient().from("question_reports").select("question_id").is("resolved_at", null).limit(5000);
    return new Set((data ?? []).map((r) => r.question_id as string)).size;
  } catch {
    return 0;
  }
}

/** Clears every open flag on a question. */
export async function resolveQuestion(questionId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("question_reports")
    .update({ resolved_at: new Date().toISOString() })
    .eq("question_id", questionId)
    .is("resolved_at", null);
  if (error) throw new Error(error.message);
}
