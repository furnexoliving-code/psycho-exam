import Link from "next/link";
import { notFound } from "next/navigation";
import { hasExpired, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { photoUrlOf } from "@/lib/photo";
import { attemptsFor } from "@/lib/wt/history";
import { batteryProgress } from "@/lib/wt/progress";
import { mockResultsFor, scoreOutOf30 } from "@/lib/wt/mock";
import { STAGES } from "@/lib/wt/plan";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { deleteStudent, removeStudentPhoto, resetPassword, setActive, setStudentPhoto, setValidity } from "../actions";

/**
 * One student, in full: the account and its switches, the photo, how each
 * battery stands against the bar, the recent papers and the Full Mocks.
 * The place the team goes when a student rings.
 */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/students/${id}`);
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, phone, role, created_at, is_active, valid_until, photo_path")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.role !== "student") notFound();
  const student = row as {
    id: string;
    full_name: string;
    roll_no: string;
    phone: string;
    created_at: string;
    is_active: boolean;
    valid_until: string | null;
    photo_path: string | null;
  };

  const [progress, attempts, mocks] = await Promise.all([batteryProgress(id), attemptsFor(id, 40), mockResultsFor(id, 20)]);
  const photo = photoUrlOf(student);
  const expired = hasExpired(student.valid_until);
  const passed = progress.filter((b) => (b.bestT ?? 0) >= STAGES.pass).length;

  return (
    <>
      <Link href="/admin/students" className="text-[13px] font-semibold text-rrb-banner hover:underline">
        ← Students
      </Link>

      <div className="mt-3 flex flex-wrap items-start gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-[128px] w-[108px] shrink-0 items-center justify-center overflow-hidden border border-[#bbbbbb] bg-[#dfe6ee]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 48 48" className="h-[80px] w-[80px]" aria-hidden="true">
              <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
              <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">{student.full_name || "Unnamed"}</h1>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Mobile">{student.phone || "—"}</Row>
            <Row label="Roll No">{student.roll_no || "—"}</Row>
            <Row label="Registered">{formatDateTime(student.created_at)}</Row>
            <Row label="Account">
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${student.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {student.is_active ? "On" : "Off"}
              </span>
            </Row>
            <Row label="Valid till">
              {student.valid_until ? formatDate(student.valid_until) : "No end date"}
              {expired && <span className="ml-2 text-[11px] font-semibold text-red-700">Expired</span>}
            </Row>
            <Row label="Batteries passed">
              {passed} of {progress.length} at T-Score: {STAGES.pass}+
            </Row>
          </dl>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Photo</h2>
          <p className="mt-1 text-[12px] text-gray-500">Shown in the exam header. The student can change it from their dashboard; you can replace or remove it here.</p>
          <SaveForm action={setStudentPhoto} submitLabel={photo ? "Replace photo" : "Upload photo"} className="mt-2" buttonClassName="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">
            <input type="hidden" name="id" value={id} />
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="block w-full text-[12px] text-gray-700" />
          </SaveForm>
          {photo && (
            <RowForm action={removeStudentPhoto} className="mt-2">
              <input type="hidden" name="id" value={id} />
              <PendingButton pendingLabel="Removing…" confirm="Remove this student's photo?" className="text-[12px] font-semibold text-red-700 hover:underline">
                Remove photo
              </PendingButton>
            </RowForm>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Validity and account</h2>
          <RowForm action={setValidity} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <input
              name="valid_until"
              type="date"
              defaultValue={student.valid_until ?? ""}
              className={`rounded border px-2 py-1 text-[12px] ${expired ? "border-red-400 bg-red-50 text-red-800" : "border-gray-400"}`}
              title="Blank means no end date"
            />
            <button type="submit" className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
              Set validity
            </button>
          </RowForm>
          <RowForm action={setActive} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="active" value={String(!student.is_active)} />
            <button
              type="submit"
              className={`rounded px-3 py-1 text-[11px] font-semibold ${
                student.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              {student.is_active ? "Account on — switch off" : "Account off — switch on"}
            </button>
          </RowForm>
          <RowForm action={deleteStudent} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <PendingButton
              pendingLabel="Deleting…"
              confirm={`Delete ${student.full_name || student.phone}'s account?\n\nTheir results for every paper go with it. This cannot be undone.\n\nTo keep the results, switch the account off instead.`}
              className="text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-60"
            >
              Delete this account
            </PendingButton>
          </RowForm>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">New password</h2>
          <p className="mt-1 text-[12px] text-gray-500">Set one and tell the student; they can change it afterwards from their dashboard.</p>
          <RowForm action={resetPassword} className="mt-2 flex gap-2">
            <input type="hidden" name="id" value={id} />
            <input name="password" required minLength={6} placeholder="new password" className="w-[160px] rounded border border-gray-400 px-2 py-1 text-[12px]" />
            <button type="submit" className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
              Set
            </button>
          </RowForm>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">Batteries</h2>
        <table className="mt-2 w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-rrb-banner text-left text-white">
              <th className="border border-gray-300 px-3 py-2">Battery</th>
              <th className="border border-gray-300 px-3 py-2">Best T-Score</th>
              <th className="border border-gray-300 px-3 py-2">Stage</th>
              <th className="border border-gray-300 px-3 py-2">Attempts</th>
              <th className="border border-gray-300 px-3 py-2">Papers sat</th>
              <th className="border border-gray-300 px-3 py-2">Last attempt</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((b) => {
              const t = b.bestT;
              const stage = t === null ? "—" : t >= STAGES.target ? `At target (${STAGES.target})` : t >= STAGES.average ? `Above average (${STAGES.average})` : t >= STAGES.pass ? `Passed (${STAGES.pass})` : `Below ${STAGES.pass}`;
              return (
                <tr key={b.battery} className="bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">Test {b.battery} · {b.title}</td>
                  <td className="border border-gray-300 px-3 py-2 tabular-nums">{t === null ? "—" : t.toFixed(1)}</td>
                  <td className={`border border-gray-300 px-3 py-2 ${t !== null && t < STAGES.pass ? "text-red-700" : "text-gray-800"}`}>{stage}</td>
                  <td className="border border-gray-300 px-3 py-2">{b.attempts}</td>
                  <td className="border border-gray-300 px-3 py-2">{b.papersSat}</td>
                  <td className="border border-gray-300 px-3 py-2">{b.lastAt ? formatDateTime(b.lastAt) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Full Mocks</h2>
          {mocks.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">No Full Mock finished yet.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="border border-gray-300 px-2 py-1.5">Mock</th>
                  <th className="border border-gray-300 px-2 py-1.5">When</th>
                  <th className="border border-gray-300 px-2 py-1.5">Out of 30</th>
                  <th className="border border-gray-300 px-2 py-1.5">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {mocks.map((m) => {
                  const out = scoreOutOf30(m.tests);
                  return (
                    <tr key={m.id} className="bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                        {m.mockSlug ? <Link href={`/admin/mocks/${m.mockSlug}/results`} className="text-rrb-banner hover:underline">{m.mockName}</Link> : m.mockName}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5">{formatDateTime(m.submittedAt)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{out === null ? "—" : out.toFixed(1)}</td>
                      <td className="border border-gray-300 px-2 py-1.5">
                        {m.qualified === null ? "—" : m.qualified ? <span className="font-semibold text-green-700">Qualified</span> : <span className="font-semibold text-red-700">Not yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Recent papers</h2>
          {attempts.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">No paper sat yet.</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="border border-gray-300 px-2 py-1.5">Paper</th>
                  <th className="border border-gray-300 px-2 py-1.5">When</th>
                  <th className="border border-gray-300 px-2 py-1.5">Marks</th>
                  <th className="border border-gray-300 px-2 py-1.5">Attempted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                      <Link href={`/admin/watch-table/${a.paperSlug}/results`} className="text-rrb-banner hover:underline">{a.paperName}</Link>
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">{formatDateTime(a.submittedAt)}</td>
                    <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{a.marks} / {a.total}</td>
                    <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{a.attempted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-[110px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="min-w-0 text-gray-900">{children}</dd>
    </div>
  );
}
