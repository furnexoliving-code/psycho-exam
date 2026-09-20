import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalisePhone } from "@/lib/phone";
import { createStaff, createStudent, deleteStudent, removeStaff, resetPassword, setActive } from "./actions";
import { HELPER_ROLES, isHelperRole } from "./helpers";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { BulkStudents } from "./BulkStudents";

/** Students shown per page. Thousands on one page is a page nobody can use. */
const PAGE_SIZE = 50;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // On the page itself, not only in the layout: a request can ask for the
  // page segment alone, and the layout then never runs.
  await requireAdmin("/admin/students");
  const supabase = await createClient();

  const { q = "", page: pageRaw = "1" } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Math.floor(Number(pageRaw)) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // The list is searched and paged in the database, never read whole: with
  // thousands of accounts a full read is slow for the admin and a strain on
  // everyone sitting a paper at that moment.
  let request = supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, is_active", { count: "exact" })
    .eq("role", "student");
  if (query) {
    const digits = normalisePhone(query);
    request = /^\d{4,}$/.test(digits)
      ? request.like("phone", `%${digits}%`)
      : request.ilike("full_name", `%${query.replace(/[%_]/g, "")}%`);
  }
  const { data: students, count: studentCount } = await request
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + PAGE_SIZE - 1);
  const total = studentCount ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: helpers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .in("role", Object.keys(HELPER_ROLES))
    .order("created_at", { ascending: false });

  const { data: watchAttempts } = await supabase
    .from("watch_attempts")
    .select("id, paper_id, user_id, marks, total, attempted, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(50);

  const { data: papers } = await supabase.from("watch_papers").select("id, display_name");
  const paperName = new Map((papers ?? []).map((p) => [p.id, p.display_name]));

  // Names for the recent attempts only — never the whole student table.
  const recentIds = [...new Set((watchAttempts ?? []).map((a) => a.user_id).filter(Boolean))] as string[];
  const { data: recentProfiles } = recentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", recentIds)
    : { data: [] };
  const studentName = new Map((recentProfiles ?? []).map((s) => [s.id, s.full_name || "Unnamed"]));

  const pageLink = (n: number) =>
    `/admin/students?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(n) })}`;

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
          <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
            <input name="full_name" required className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
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

      <BulkStudents />

      <section className="mt-6" id="list">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-bold text-gray-900">
            Registered students ({total.toLocaleString("en-IN")})
          </h2>
          <form method="get" action="/admin/students#list" className="ml-auto flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by mobile number or name"
              className="w-[260px] max-w-full rounded border border-gray-400 px-3 py-1.5 text-[13px]"
            />
            <button
              type="submit"
              className="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900"
            >
              Search
            </button>
            {query && (
              <Link
                href="/admin/students#list"
                className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {students?.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">Name</th>
                  <th className="border border-gray-300 px-3 py-2">Mobile</th>
                  <th className="border border-gray-300 px-3 py-2">Registered</th>
                  <th className="border border-gray-300 px-3 py-2">Account</th>
                  <th className="border border-gray-300 px-3 py-2">New password</th>
                  <th className="border border-gray-300 px-3 py-2" />
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
                    <td className="border border-gray-300 px-3 py-2">
                      <RowForm action={deleteStudent}>
                        <input type="hidden" name="id" value={s.id} />
                        <PendingButton
                          pendingLabel="Deleting…"
                          confirm={`Delete ${s.full_name || s.phone}'s account?\n\nTheir results for every paper go with it. This cannot be undone.\n\nTo keep the results, switch the account off instead.`}
                          className="text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-60"
                        >
                          Delete
                        </PendingButton>
                      </RowForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <nav className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-gray-700" aria-label="Pages">
                {page > 1 && (
                  <Link href={pageLink(page - 1)} className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100">
                    ← Previous
                  </Link>
                )}
                <span>
                  Page {page} of {pages} · showing {from + 1}–{Math.min(total, from + PAGE_SIZE)} of {total.toLocaleString("en-IN")}
                </span>
                {page < pages && (
                  <Link href={pageLink(page + 1)} className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100">
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </div>
        ) : (
          <p className="mt-2 rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
            {query ? <>No student matches &ldquo;{query}&rdquo;.</> : "No students have registered yet."}
          </p>
        )}
      </section>

      {/* --------------------------- Helper accounts --------------------------- */}
      <section className="mt-8 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Helper accounts</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Each kind of helper opens one part of this panel and nothing else. Staff can
          reset a student&apos;s password. A test setter can create, write and publish
          papers, but sees no results and no student accounts. Both sign in at{" "}
          <code className="rounded bg-gray-200 px-1">/admin</code> and use an
          authenticator app like the admin does.
        </p>

        <SaveForm action={createStaff} submitLabel="Create the helper account" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">What for</span>
              <select name="role" defaultValue="staff" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]">
                {Object.entries(HELPER_ROLES).map(([role, r]) => (
                  <option key={role} value={role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Name</span>
              <input name="full_name" required className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Mobile number</span>
              <input name="phone" required inputMode="numeric" placeholder="10 digits" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Password</span>
              <input name="password" required minLength={8} placeholder="at least 8 characters" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
          </div>
        </SaveForm>

        {helpers?.length ? (
          <table className="mt-4 w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Name</th>
                <th className="border border-gray-300 px-3 py-2">Mobile</th>
                <th className="border border-gray-300 px-3 py-2">Can</th>
                <th className="border border-gray-300 px-3 py-2">Since</th>
                <th className="border border-gray-300 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {helpers.map((m) => (
                <tr key={m.id} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">{m.full_name || "—"}</td>
                  <td className="border border-gray-300 px-3 py-2">{m.phone || "—"}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {isHelperRole(m.role) ? HELPER_ROLES[m.role].label : m.role}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{new Date(m.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <RowForm action={removeStaff}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-[12px] font-semibold text-red-700 hover:underline">
                        Remove
                      </button>
                    </RowForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-[12px] text-gray-500">No helper account yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[15px] font-bold text-gray-900">
          Recent attempts (latest {watchAttempts?.length ?? 0})
        </h2>
        <p className="mb-2 text-[12px] text-gray-600">
          Every attempt of a paper, with search and filters, is under that paper&apos;s{" "}
          <Link href="/admin/watch-table" className="font-semibold text-rrb-banner hover:underline">
            Results
          </Link>{" "}
          button.
        </p>
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
