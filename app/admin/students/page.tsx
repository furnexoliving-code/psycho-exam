import { createClient } from "@/lib/supabase/server";
import { formatClock } from "@/lib/scoring";

interface AttemptScore {
  totalCorrect?: number;
  scoredQuestions?: number;
  totalAttempted?: number;
  overallAccuracy?: number;
}

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, user_id, test_id, started_at, submitted_at, score")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(200);

  const { data: tests } = await supabase.from("tests").select("id, display_name");
  const testName = new Map((tests ?? []).map((t) => [t.id, t.display_name]));
  const studentName = new Map(
    (students ?? []).map((s) => [s.id, s.full_name || s.roll_no || "Unnamed"]),
  );

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Students &amp; Results</h1>

      <section className="mt-5">
        <h2 className="mb-2 text-[15px] font-bold text-gray-900">
          Registered students ({students?.length ?? 0})
        </h2>
        {students?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">Name</th>
                  <th className="border border-gray-300 px-3 py-2">Roll no.</th>
                  <th className="border border-gray-300 px-3 py-2">Mobile</th>
                  <th className="border border-gray-300 px-3 py-2">Registered</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                      {s.full_name || "—"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{s.roll_no || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2">{s.phone || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(s.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
            No students have registered yet.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[15px] font-bold text-gray-900">
          Recent attempts ({attempts?.length ?? 0})
        </h2>
        {attempts?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">Student</th>
                  <th className="border border-gray-300 px-3 py-2">Test</th>
                  <th className="border border-gray-300 px-3 py-2">Score</th>
                  <th className="border border-gray-300 px-3 py-2">Accuracy</th>
                  <th className="border border-gray-300 px-3 py-2">Time taken</th>
                  <th className="border border-gray-300 px-3 py-2">Submitted</th>
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
                        {studentName.get(a.user_id) ?? "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
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
                          ? new Date(a.submitted_at).toLocaleString("en-IN")
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
            No submitted attempts yet.
          </p>
        )}
      </section>
    </>
  );
}
