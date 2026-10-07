import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { recentActions } from "@/lib/audit";
import { examSettings } from "@/lib/settings";
import { listNotices } from "@/lib/notices";
import { addNotice, removeNotice, updateExamSettings } from "./actions";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { createStaff, removeStaff } from "../students/actions";
import { HELPER_ROLES, isHelperRole } from "../students/helpers";

/**
 * The people in the panel and what they have done: helper accounts, each
 * with whether their authenticator is set up, and the audit log.
 */
export default async function TeamPage() {
  await requireAdmin("/admin/team");
  const supabase = createAdminClient();

  const exam = await examSettings();
  const notices = await listNotices();
  const [{ data: helpers }, log] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .in("role", Object.keys(HELPER_ROLES))
      .order("created_at", { ascending: false }),
    recentActions(150),
  ]);

  // Whether each helper has a verified authenticator: asked of the auth
  // server one account at a time, so only for the handful of helpers.
  const mfa = new Map<string, boolean>();
  await Promise.all(
    (helpers ?? []).map(async (h) => {
      try {
        const { data } = await supabase.auth.admin.mfa.listFactors({ userId: h.id as string });
        mfa.set(h.id as string, (data?.factors ?? []).some((f) => f.status === "verified"));
      } catch {
        // Unknown stays unknown.
      }
    }),
  );

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Team, settings &amp; activity</h1>
      <p className="mt-1 text-[13px] text-gray-600">
        Who may open the panel, the exam settings every student&apos;s dashboard is built around, and a record of what everyone in it has done.
      </p>

      <section className="mt-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Exam settings</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          The dashboard counts down to the exam date and pushes every student towards the target T-score in every battery.
          Passing needs 42 in each; the target is where a good rank starts.
        </p>
        <SaveForm action={updateExamSettings} submitLabel="Save exam settings" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Exam date</span>
              <input name="exam_date" type="date" defaultValue={exam.examDate ?? ""} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Target T-score, every battery</span>
              <input name="target_t" type="number" min={42} max={90} defaultValue={exam.targetT} className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
          </div>
        </SaveForm>
      </section>

      {/* ----------------------------- Notice board ----------------------------- */}
      <section className="mt-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Notice board</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Shown at the top of every student&apos;s dashboard until its last day. Keep it short: a date, a mock, a change.
        </p>
        <SaveForm action={addNotice} submitLabel="Put on the board" className="mt-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Notice (English)</span>
              <textarea name="en" rows={2} maxLength={400} placeholder="Full Mock 3 opens on Sunday at 10 am." className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Notice (Hindi)</span>
              <textarea name="hi" rows={2} maxLength={400} placeholder="फुल मॉक 3 रविवार सुबह 10 बजे खुलेगा।" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" lang="hi" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-gray-700">Show until</span>
              <input name="until" type="date" className="w-full rounded border border-gray-400 px-3 py-2 text-[13px]" />
              <span className="mt-1 block text-[11px] text-gray-500">Blank: until removed.</span>
            </label>
          </div>
        </SaveForm>
        {notices.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
            {notices.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1">
                  {n.en && <span className="block text-gray-900">{n.en}</span>}
                  {n.hi && <span className="block text-gray-700" lang="hi">{n.hi}</span>}
                  <span className="block text-[11px] text-gray-500">
                    Added {formatDate(n.createdAt)}{n.until ? ` · shown until ${formatDate(n.until)}` : " · until removed"}
                  </span>
                </span>
                <RowForm action={removeNotice}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-[12px] font-semibold text-red-700 hover:underline">Remove</button>
                </RowForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------- Helper accounts --------------------------- */}
      <section className="mt-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="text-[15px] font-bold text-gray-900">Helper accounts</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Each kind of helper opens one part of this panel and nothing else. Staff can
          reset a student&apos;s password. A test setter can create, write and publish
          papers, but sees no results and no student accounts. A result viewer sees
          results and nothing else. All sign in at{" "}
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
                <th className="border border-gray-300 px-3 py-2">Authenticator</th>
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
                  <td className="border border-gray-300 px-3 py-2">
                    {mfa.get(m.id) === true ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">On</span>
                    ) : mfa.get(m.id) === false ? (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Not set up</span>
                    ) : (
                      <span className="text-[11px] text-gray-500">?</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{formatDate(m.created_at)}</td>
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
        <h2 className="text-[15px] font-bold text-gray-900">Activity log</h2>
        <p className="mt-1 text-[12px] text-gray-600">
          Every change made in the panel over the last 7 days, newest first: papers, mocks, accounts, passwords, battery switches. Older lines are dropped.
        </p>
        {log.length === 0 ? (
          <p className="mt-3 rounded border border-dashed border-gray-300 bg-white p-6 text-center text-[13px] text-gray-500">
            Nothing logged yet. (If the newest SQL has not been run, the log table does not exist yet.)
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Who</th>
                  <th className="px-3 py-2 font-semibold">What</th>
                  <th className="px-3 py-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {log.map((row) => (
                  <tr key={row.id} className="border-t border-gray-200 bg-white">
                    <td className="whitespace-nowrap px-3 py-1.5 text-gray-600">{formatDateTime(row.at)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 font-semibold text-gray-900">
                      {row.actor_name || "—"}
                      {row.actor_role && row.actor_role !== "admin" && <span className="ml-1 text-[10px] font-normal text-gray-500">({row.actor_role})</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-gray-900">{row.action}</td>
                    <td className="px-3 py-1.5 text-gray-600">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
