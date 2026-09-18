import Link from "next/link";
import { listTests } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const tests = await listTests(true);
  const supabase = await createClient();

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  const { count: attemptCount } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .not("submitted_at", "is", null);

  const published = tests.filter((t) => t.is_published).length;
  const questions = tests.reduce((n, t) => n + t.question_count, 0);

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Overview</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Stat label="Tests" value={`${published} / ${tests.length}`} note="published" />
        <Stat label="Questions" value={String(questions)} note="across all tests" />
        <Stat label="Students" value={String(studentCount ?? 0)} note="registered" />
        <Stat label="Attempts" value={String(attemptCount ?? 0)} note="submitted" />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/tests/new"
          className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Create a test
        </Link>
        <Link
          href="/admin/tests"
          className="rounded border border-gray-400 bg-white px-5 py-2 text-sm font-semibold
                     text-gray-800 hover:bg-gray-100"
        >
          Manage tests
        </Link>
      </div>

      {tests.length === 0 && (
        <div className="mt-8 rounded border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900">
          <p className="font-semibold">No tests yet.</p>
          <p className="mt-1">
            Create your first test, add a section, then add questions to it. Publish it when
            you are ready for students to see it.
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
