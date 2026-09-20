import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listPapersForAdmin } from "@/lib/wt/db";

export default async function AdminHome() {
  // On the page itself, not only in the layout, which a request can skip.
  await requireAdmin("/admin");
  const papers = await listPapersForAdmin();
  const supabase = await createClient();

  const [{ count: studentCount }, { count: attemptCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase.from("watch_attempts").select("id", { count: "exact", head: true }),
  ]);

  const published = papers.filter((p) => p.isPublished).length;
  const questions = papers.reduce((n, p) => n + p.questionCount, 0);

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Overview</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Stat label="Papers" value={`${published} / ${papers.length}`} note="published" />
        <Stat label="Questions" value={String(questions)} note="across all papers" />
        <Stat label="Students" value={String(studentCount ?? 0)} note="registered" />
        <Stat label="Attempts" value={String(attemptCount ?? 0)} note="submitted" />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/watch-table"
          className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Papers
        </Link>
        <Link
          href="/admin/students"
          className="rounded border border-gray-400 bg-white px-5 py-2 text-sm font-semibold
                     text-gray-800 hover:bg-gray-100"
        >
          Students &amp; Results
        </Link>
      </div>

      {papers.length === 0 && (
        <div className="mt-8 rounded border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900">
          <p className="font-semibold">No papers yet.</p>
          <p className="mt-1">
            Create a paper, upload its questions, then tick Published when it is ready
            for students.
          </p>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded border border-gray-300 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500">{note}</div>
    </div>
  );
}
