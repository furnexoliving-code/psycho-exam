import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { photoUrlOf } from "@/lib/photo";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress } from "@/lib/wt/progress";
import { mockResultsFor } from "@/lib/wt/mock";
import { STAGES } from "@/lib/wt/plan";
import { examSettings } from "@/lib/settings";
import { enrollmentsOf, listAllPackages } from "@/lib/packages";
import { tScoresOf } from "@/lib/wt/cohorts";
import { listPublishedPapers } from "@/lib/wt/db";
import { batteryOf } from "@/lib/wt/series";
import { StudentDetailView } from "@/components/admin/StudentDetailView";

/** One student's page: the data, then the view. */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/students/${id}`);
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!row || row.role !== "student") notFound();
  const student = {
    valid_until: null,
    photo_path: null,
    last_seen_at: null,
    session_id: null,
    ...row,
  } as {
    id: string;
    full_name: string;
    roll_no: string;
    phone: string;
    created_at: string;
    is_active: boolean;
    valid_until: string | null;
    photo_path: string | null;
    last_seen_at: string | null;
    session_id: string | null;
  };

  const [progress, attempts, mocks, held, packages, exam, papers, noteRow] = await Promise.all([
    batteryProgress(id),
    attemptsFor(id, 1000),
    mockResultsFor(id, 50),
    enrollmentsOf(id),
    listAllPackages(),
    examSettings(),
    listPublishedPapers(),
    // Until supabase/admin-note.sql has been run there is no table: no note.
    supabase.from("student_notes").select("note").eq("user_id", id).maybeSingle(),
  ]);
  const idBySlug = new Map(papers.map((p) => [p.slug, p.id]));
  // The T-score each attempt earns today, from the cached cohorts.
  const ts = await tScoresOf(
    attempts.map((a) => ({
      paperId: idBySlug.get(a.paperSlug) ?? "",
      marks: a.marks,
      total: a.total,
    })),
  );

  return (
    <StudentDetailView
      s={{
        id: student.id,
        fullName: student.full_name || "",
        rollNo: student.roll_no || "",
        phone: student.phone || "",
        createdAt: student.created_at,
        isActive: student.is_active,
        validUntil: student.valid_until,
        photoUrl: photoUrlOf(student),
        lastSeenAt: student.last_seen_at,
        note: (noteRow.data?.note as string | undefined) ?? "",
        hasDevice: Boolean(student.session_id),
        now: Date.now(),
        progress,
        attempts: attempts.map((a, i) => ({
          ...a,
          battery: batteryOf(a.category),
          t: ts[i] ?? null,
        })),
        mocks,
        enrollments: held ?? [],
        packages,
        stages: {
          pass: exam.passT,
          average: STAGES.average,
          target: exam.targetT,
        },
      }}
    />
  );
}
