import Link from "next/link";
import { formatDate, formatDateTime, indianDay } from "@/lib/format-time";
import { daysUntil } from "@/lib/settings";
import { RowForm } from "@/components/admin/RowForm";
import { SaveForm } from "@/components/admin/SaveForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { Sparkline } from "@/components/admin/Charts";
import { deleteStudent, removeStudentPhoto, resetPassword, setActive, setNote, setStudentPhoto, setValidity, signOutEverywhere } from "@/app/admin/(panel)/students/actions";
import { enrollStudent, unenrollStudent } from "@/app/admin/(panel)/packages/actions";
import { enrollmentActive, KIND_LABEL, type Enrollment, type Package } from "@/lib/packages";
import type { BatteryProgress } from "@/lib/wt/progress";
import { scoreOutOf30, type MockResult } from "@/lib/wt/mock";

/** One attempt of a paper, with the T-score it earns today. */
export interface AttemptRow {
  id: string;
  paperSlug: string;
  paperName: string;
  category: string;
  battery: number;
  marks: number;
  total: number;
  attempted: number;
  submittedAt: string;
  t: number | null;
}

export interface StudentDetail {
  id: string;
  fullName: string;
  rollNo: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
  validUntil: string | null;
  photoUrl: string | null;
  lastSeenAt: string | null;
  note: string;
  /** Stamped by a sign-in since the one-device rule came in. */
  hasDevice: boolean;
  now: number;
  progress: BatteryProgress[];
  attempts: AttemptRow[];
  mocks: (MockResult & { mockName: string; mockSlug: string })[];
  enrollments: Enrollment[];
  packages: Package[];
  stages: { pass: number; average: number; target: number };
}

/**
 * One student, in full: the account and its switches, what the team
 * should remember about them, how they stand in every battery and how
 * their T-scores have moved, every paper sat, the Full Mocks and the
 * packages. The place the team goes when a student rings.
 */
export function StudentDetailView({ s }: { s: StudentDetail }) {
  const today = indianDay(s.now);
  const validIn = s.validUntil ? daysUntil(s.validUntil, today) : null;
  const papersSat = new Set(s.attempts.map((a) => a.paperSlug)).size;
  const ts = s.attempts.map((a) => a.t).filter((t): t is number => t !== null);
  const bestT = ts.length ? Math.max(...ts) : null;
  const last = s.attempts[0] ?? null;
  const digits = s.phone.replace(/\D/g, "");
  const wa = digits.length === 10 ? `https://wa.me/91${digits}?text=${encodeURIComponent(`Namaste ${s.fullName || ""}, Kautilya Classes se. `)}` : null;
  const plus = (days: number) => indianDay(s.now + days * 86400000);
  const passed = s.progress.filter((b) => (b.bestT ?? 0) >= s.stages.pass).length;

  return (
    <>
      <Link href="/admin/students" className="text-[13px] font-semibold text-rrb-banner hover:underline">
        ← Students
      </Link>

      <div className="mt-3 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:gap-5">
        <div className="flex h-[128px] w-[108px] shrink-0 items-center justify-center overflow-hidden border border-[#bbbbbb] bg-[#dfe6ee]">
          {s.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 48 48" className="h-[80px] w-[80px]" aria-hidden="true">
              <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
              <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{s.fullName || "Unnamed"}</h1>
            <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${s.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{s.isActive ? "Account on" : "Account off"}</span>
            {validIn !== null && validIn < 0 && <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Validity over</span>}
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="rounded-md bg-[#25D366] px-3 py-1 text-[11.5px] font-bold text-white hover:brightness-95">
                WhatsApp
              </a>
            )}
          </div>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Mobile">{s.phone || "—"}</Row>
            <Row label="Roll no">{s.rollNo || "—"}</Row>
            <Row label="Registered">{formatDateTime(s.createdAt)}</Row>
            <Row label="Last seen">{s.lastSeenAt ? formatDateTime(s.lastSeenAt) : "Never"}</Row>
            <Row label="Valid till">{s.validUntil ? `${formatDate(s.validUntil)}${validIn !== null ? (validIn >= 0 ? ` · ${validIn} days left` : ` · ${-validIn} days ago`) : ""}` : "No end date"}</Row>
            <Row label="Batteries passed">
              {passed} of {s.progress.length} at T-Score {s.stages.pass}+
            </Row>
          </dl>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Papers sat" value={String(papersSat)} note={`${s.attempts.length} attempts`} />
        <Kpi
          label="Best T-Score"
          value={bestT === null ? "—" : bestT.toFixed(1)}
          note={bestT === null ? "not measured yet" : bestT >= s.stages.target ? "at target" : bestT >= s.stages.pass ? "above pass mark" : "below pass mark"}
          tone={bestT === null ? "" : bestT >= s.stages.pass ? "text-green-700" : "text-red-700"}
        />
        <Kpi label="Full Mocks" value={String(s.mocks.length)} note={`${s.mocks.filter((m) => m.qualified).length} qualified`} />
        <Kpi label="Last paper" value={last ? formatDate(last.submittedAt) : "—"} note={last ? last.paperName : "none yet"} small />
        <Kpi label="Days left" value={validIn === null ? "∞" : String(Math.max(0, validIn))} note={s.validUntil ? `till ${formatDate(s.validUntil)}` : "no end date"} tone={validIn !== null && validIn <= 7 ? "text-amber-700" : ""} />
        <Kpi label="Device stamp" value={s.hasDevice ? "Set" : "—"} note={s.hasDevice ? "from the last sign-in · one device at a time" : "no sign-in since the one-device rule"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Validity</h2>
          <p className="mt-1 text-[12px] text-gray-500">The last day the student may sign in. Past it the account is refused like a switched-off one; the results stay.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[30, 90, 180].map((d) => (
              <RowForm key={d} action={setValidity}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="valid_until" value={plus(d)} />
                <PendingButton pendingLabel="…" className="rounded border border-gray-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
                  +{d} days
                </PendingButton>
              </RowForm>
            ))}
            <RowForm action={setValidity}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="valid_until" value="" />
              <PendingButton pendingLabel="…" className="rounded border border-gray-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
                No end date
              </PendingButton>
            </RowForm>
          </div>
          <RowForm action={setValidity} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="id" value={s.id} />
            <input type="date" name="valid_until" defaultValue={s.validUntil ?? ""} className="rounded border border-gray-400 px-2 py-1 text-[12px]" />
            <PendingButton pendingLabel="…" className="rounded bg-indigo-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-900">
              Set date
            </PendingButton>
          </RowForm>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Team note</h2>
          <p className="mt-1 text-[12px] text-gray-500">Fees, calls, anything to remember. The student never sees it.</p>
          <RowForm action={setNote} className="mt-2">
            <input type="hidden" name="id" value={s.id} />
            <textarea name="note" defaultValue={s.note} rows={3} maxLength={2000} placeholder="e.g. Fees ₹500 pending · called on 5 Oct" className="w-full rounded border border-gray-400 px-2 py-1.5 text-[12px]" />
            <PendingButton pendingLabel="Saving…" className="mt-1.5 rounded bg-indigo-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-900">
              Save note
            </PendingButton>
          </RowForm>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Account</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <RowForm action={setActive}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="active" value={String(!s.isActive)} />
              <button type="submit" className={`rounded px-3 py-1 text-[11px] font-semibold ${s.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}>
                {s.isActive ? "Account on — switch off" : "Account off — switch on"}
              </button>
            </RowForm>
            <RowForm action={signOutEverywhere}>
              <input type="hidden" name="id" value={s.id} />
              <PendingButton pendingLabel="…" confirm="Sign this student out of every device? They sign in again with their password." className="rounded border border-gray-400 bg-white px-3 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
                Sign out everywhere
              </PendingButton>
            </RowForm>
          </div>
          <RowForm action={resetPassword} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={s.id} />
            <input name="password" required minLength={6} placeholder="new password" className="w-[150px] rounded border border-gray-400 px-2 py-1 text-[12px]" />
            <button type="submit" className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
              Set
            </button>
          </RowForm>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SaveForm action={setStudentPhoto} submitLabel={s.photoUrl ? "Replace photo" : "Upload photo"} buttonClassName="rounded border border-gray-400 bg-white px-3 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
              <input type="hidden" name="id" value={s.id} />
              <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="block w-full text-[11px] text-gray-700" />
            </SaveForm>
            {s.photoUrl && (
              <RowForm action={removeStudentPhoto}>
                <input type="hidden" name="id" value={s.id} />
                <PendingButton pendingLabel="…" confirm="Remove this student's photo?" className="text-[11px] font-semibold text-red-700 hover:underline">
                  Remove photo
                </PendingButton>
              </RowForm>
            )}
          </div>
          <RowForm action={deleteStudent} className="mt-3">
            <input type="hidden" name="id" value={s.id} />
            <PendingButton
              pendingLabel="Deleting…"
              confirm={`Delete ${s.fullName || s.phone}'s account?\n\nTheir results for every paper go with it. This cannot be undone.\n\nTo keep the results, switch the account off instead.`}
              className="text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-60"
            >
              Delete this account
            </PendingButton>
          </RowForm>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">
          Batteries <span className="font-normal text-gray-500">· best T-score, and how it has moved</span>
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-rrb-banner text-left text-white">
                <th className="border border-gray-300 px-3 py-2">Battery</th>
                <th className="border border-gray-300 px-3 py-2">Best T</th>
                <th className="border border-gray-300 px-3 py-2">Stage</th>
                <th className="border border-gray-300 px-3 py-2">Trend</th>
                <th className="border border-gray-300 px-3 py-2">Attempts</th>
                <th className="border border-gray-300 px-3 py-2">Papers</th>
                <th className="border border-gray-300 px-3 py-2">Last</th>
              </tr>
            </thead>
            <tbody>
              {s.progress.map((b) => {
                const t = b.bestT;
                const stage = t === null ? "—" : t >= s.stages.target ? `At target (${s.stages.target})` : t >= s.stages.average ? `Above average (${s.stages.average})` : t >= s.stages.pass ? `Passed (${s.stages.pass})` : `Below ${s.stages.pass}`;
                const points = s.attempts
                  .filter((a) => a.battery === b.battery && a.t !== null)
                  .map((a) => ({ t: a.t as number, at: a.submittedAt }))
                  .reverse();
                return (
                  <tr key={b.battery} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                      Test {b.battery} · {b.title}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 tabular-nums">{t === null ? "—" : t.toFixed(1)}</td>
                    <td className={`border border-gray-300 px-3 py-2 ${t !== null && t < s.stages.pass ? "text-red-700" : "text-gray-800"}`}>{stage}</td>
                    <td className="border border-gray-300 px-1 py-1">{points.length ? <Sparkline points={points} pass={s.stages.pass} label={b.title} /> : <span className="px-2 text-gray-400">—</span>}</td>
                    <td className="border border-gray-300 px-3 py-2 tabular-nums">{b.attempts}</td>
                    <td className="border border-gray-300 px-3 py-2 tabular-nums">{b.papersSat}</td>
                    <td className="border border-gray-300 px-3 py-2">{b.lastAt ? formatDate(b.lastAt) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-gray-900">Packages</h2>
        <p className="mt-1 text-[12px] text-gray-600">What this student&apos;s account opens. A Kautilya student gets the package from here; an outside student buys it online.</p>
        {s.enrollments.length === 0 ? (
          <p className="mt-2 text-[12px] text-amber-800">No package: only the free mock is open.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="border border-gray-300 px-2 py-1.5">Package</th>
                  <th className="border border-gray-300 px-2 py-1.5">Opens</th>
                  <th className="border border-gray-300 px-2 py-1.5">From</th>
                  <th className="border border-gray-300 px-2 py-1.5">Till</th>
                  <th className="border border-gray-300 px-2 py-1.5">Source</th>
                  <th className="border border-gray-300 px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {s.enrollments.map((e) => (
                  <tr key={e.id} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">{e.package.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{KIND_LABEL[e.package.kind]}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{formatDate(e.startsAt)}</td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {e.expiresAt ? formatDate(e.expiresAt) : "No expiry"}
                      {!enrollmentActive(e) && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">EXPIRED</span>}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {e.source === "purchase" ? "Paid online" : "Institute"}
                      {e.note ? <span className="block text-[11px] text-gray-500">{e.note}</span> : null}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <RowForm action={unenrollStudent}>
                        <input type="hidden" name="enrollment_id" value={e.id} />
                        <input type="hidden" name="user_id" value={s.id} />
                        <PendingButton pendingLabel="…" confirm={`Remove ${e.package.name} from this student?`} className="text-[11px] font-semibold text-red-700 hover:underline">
                          Remove
                        </PendingButton>
                      </RowForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <RowForm action={enrollStudent} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="user_id" value={s.id} />
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Add a package</span>
            <select name="package" required className="rounded border border-gray-400 px-2 py-1.5 text-[12px]">
              <option value="">— choose —</option>
              {s.packages.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} · {KIND_LABEL[p.kind]}
                  {p.isPublished ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Till (blank: no expiry)</span>
            <input name="expires_on" type="date" className="rounded border border-gray-400 px-2 py-1.5 text-[12px]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-700">Note</span>
            <input name="note" placeholder="Paid at office ₹699" className="rounded border border-gray-400 px-2 py-1.5 text-[12px]" />
          </label>
          <PendingButton pendingLabel="Adding…" className="rounded bg-indigo-800 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900 disabled:opacity-60">
            Add
          </PendingButton>
        </RowForm>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">Full Mocks</h2>
          {s.mocks.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">No Full Mock finished yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700">
                    <th className="border border-gray-300 px-2 py-1.5">Mock</th>
                    <th className="border border-gray-300 px-2 py-1.5">When</th>
                    <th className="border border-gray-300 px-2 py-1.5">Out of 30</th>
                    <th className="border border-gray-300 px-2 py-1.5">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {s.mocks.map((m) => {
                    const out = scoreOutOf30(m.tests);
                    return (
                      <tr key={m.id} className="bg-white even:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                          {m.mockSlug ? (
                            <Link href={`/admin/mocks/${m.mockSlug}/results`} className="text-rrb-banner hover:underline">
                              {m.mockName}
                            </Link>
                          ) : (
                            m.mockName
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5">{formatDateTime(m.submittedAt)}</td>
                        <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{out === null ? "—" : out.toFixed(1)}</td>
                        <td className="border border-gray-300 px-2 py-1.5">{m.qualified === null ? "—" : m.qualified ? <span className="font-semibold text-green-700">Qualified</span> : <span className="font-semibold text-red-700">Not yet</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900">
            Every paper sat <span className="font-normal text-gray-500">· newest first, with the T-score it earns today</span>
          </h2>
          {s.attempts.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">No paper sat yet.</p>
          ) : (
            <div className="mt-2 max-h-[480px] overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0">
                  <tr className="bg-gray-100 text-left text-gray-700">
                    <th className="border border-gray-300 px-2 py-1.5">Paper</th>
                    <th className="border border-gray-300 px-2 py-1.5">When</th>
                    <th className="border border-gray-300 px-2 py-1.5">Marks</th>
                    <th className="border border-gray-300 px-2 py-1.5">Attempted</th>
                    <th className="border border-gray-300 px-2 py-1.5">T</th>
                  </tr>
                </thead>
                <tbody>
                  {s.attempts.map((a) => (
                    <tr key={a.id} className="bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                        <Link href={`/admin/papers/${a.paperSlug}/results`} className="text-rrb-banner hover:underline">
                          {a.paperName}
                        </Link>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{formatDateTime(a.submittedAt)}</td>
                      <td className="border border-gray-300 px-2 py-1.5 tabular-nums">
                        {a.marks} / {a.total}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 tabular-nums">{a.attempted}</td>
                      <td className={`border border-gray-300 px-2 py-1.5 font-semibold tabular-nums ${a.t === null ? "text-gray-400" : a.t >= s.stages.pass ? "text-green-700" : "text-red-700"}`}>{a.t === null ? "—" : a.t.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function Kpi({ label, value, note, tone = "", small = false }: { label: string; value: string; note: string; tone?: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`${small ? "text-[15px]" : "text-[22px]"} font-extrabold tabular-nums leading-tight text-gray-900 ${tone}`}>{value}</div>
      <div className="truncate text-[11px] text-gray-500" title={note}>
        {note}
      </div>
    </div>
  );
}
