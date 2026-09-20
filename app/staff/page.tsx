import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { RowForm } from "@/components/admin/RowForm";
import { normalisePhone } from "@/lib/phone";
import { resetStudentPassword } from "./actions";

/**
 * Find a student, set a new password. Nothing else lives here: no results,
 * no papers, no account creation, no switching off.
 */
export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff("/staff");
  const { q = "" } = await searchParams;
  const query = q.trim();

  // Read through the service role — a staff account has no row-level rights
  // of its own — and only the columns the page shows.
  const supabase = createAdminClient();
  let students: { id: string; full_name: string; phone: string; is_active: boolean }[] = [];
  if (query) {
    const digits = normalisePhone(query);
    let request = supabase
      .from("profiles")
      .select("id, full_name, phone, is_active")
      .eq("role", "student")
      .order("full_name")
      .limit(50);
    request = /^\d{4,}$/.test(digits)
      ? request.like("phone", `%${digits}%`)
      : request.ilike("full_name", `%${query.replace(/[%_]/g, "")}%`);
    const { data } = await request;
    students = data ?? [];
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Reset a student&apos;s password</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Search by mobile number or name, then set a new password and tell the student.
      </p>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Mobile number or name"
          autoFocus
          className="w-full max-w-md rounded border border-gray-400 px-3 py-2 text-[14px]"
        />
        <button
          type="submit"
          className="rounded bg-indigo-800 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
        >
          Search
        </button>
      </form>

      {query && (
        <section className="mt-5">
          {students.length === 0 ? (
            <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
              No student matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-rrb-banner text-left text-white">
                    <th className="border border-gray-300 px-3 py-2">Name</th>
                    <th className="border border-gray-300 px-3 py-2">Mobile</th>
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
                      <td className="border border-gray-300 px-3 py-2">{s.phone || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                            s.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.is_active ? "On" : "Off"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <RowForm action={resetStudentPassword} className="flex gap-1">
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            name="password"
                            required
                            minLength={6}
                            placeholder="new password"
                            className="w-[150px] rounded border border-gray-400 px-2 py-1 text-[12px]"
                          />
                          <button
                            type="submit"
                            className="rounded bg-indigo-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-900"
                          >
                            Set
                          </button>
                        </RowForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 50 && (
                <p className="mt-2 text-[12px] text-gray-500">Showing the first 50 — narrow the search.</p>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
