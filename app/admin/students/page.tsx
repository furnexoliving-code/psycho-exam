import { createClient } from "@/lib/supabase/server";
import { createStudent, resetPassword, setActive } from "./actions";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { BulkStudents } from "./BulkStudents";

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, created_at, is_active")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const { data: watchAttempts } = await supabase
    .from("watch_attempts")
    .select("id, paper_id, user_id, marks, total, attempted, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100);

  const { data: papers } = await supabase
    .from("watch_papers")
    .select("id, display_name");
  const paperName = new Map((papers ?? []).map((p) => [p.id, p.display_name]));
  const studentName = new Map(
    (students ?? []).map((s) => [s.id, s.full_name || s.roll_no || "Unnamed"]),
  );

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Students &amp; Results</h1>

      <section className="mt-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Add a student</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Students cannot sign themselves up. Give them the mobile number and
          password you set here — that is how they sign in.
        </p>

        <SaveForm
          action={createStudent}
          submitLabel="Create the account"
          className="mt-3"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
            <input name="full_name" required className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Roll no.</span>
            <input name="roll_no" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Mobile number</span>
            <input
              name="phone"
              required
              inputMode="numeric"
              placeholder="10 digits"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Password</span>
            <input
              name="password"
              required
              minLength={6}
              placeholder="at least 6 characters"
              className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]"
            />
          </label>
          </div>
        </SaveForm>
      </section>

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
                  <th className="border border-gray-300 px-3 py-2">Account</th>
                  <th className="border border-gray-300 px-3 py-2">New password</th>
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
                    <td className="border border-gray-300 px-3 py-2">
                      <RowForm action={setActive}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={String(!s.is_active)} />
                        <button
                          type="submit"
                          className={`rounded px-2 py-1 text-[11px] font-semibold ${
                            s.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {s.is_active ? "On — switch off" : "Off — switch on"}
                        </button>
                      </RowForm>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <RowForm action={resetPassword} className="flex gap-1">
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          name="password"
                          required
                          minLength={6}
                          placeholder="new password"
                          className="w-[130px] rounded border border-gray-400 px-2 py-1 text-[12px]"
                        />
                        <button
                          type="submit"
                          className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100"
                        >
                          Set
                        </button>
                      </RowForm>
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

      <BulkStudents />

      <section className="mt-8">
        <h2 className="mb-2 text-[15px] font-bold text-gray-900">
          Recent attempts ({watchAttempts?.length ?? 0})
        </h2>
        {watchAttempts?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">Student</th>
                  <th className="border border-gray-300 px-3 py-2">Paper</th>
                  <th className="border border-gray-300 px-3 py-2">Marks</th>
                  <th className="border border-gray-300 px-3 py-2">Attempted</th>
                  <th className="border border-gray-300 px-3 py-2">Accuracy</th>
                  <th className="border border-gray-300 px-3 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {watchAttempts.map((a) => (
                  <tr key={a.id} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                      {/* Null when the paper was sat without signing in. */}
                      {a.user_id ? studentName.get(a.user_id) ?? "—" : "Not signed in"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {paperName.get(a.paper_id) ?? "—"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {a.marks} / {a.total}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{a.attempted}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {a.attempted > 0
                        ? `${((a.marks / a.attempted) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(a.submitted_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
            No attempts yet.
          </p>
        )}
      </section>

    </>
  );
}
