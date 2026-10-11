import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format-time";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteStudent, resetPassword, setActive } from "./actions";
import { RowForm } from "@/components/admin/RowForm";
import { PendingButton } from "@/components/admin/PendingButton";
import { Admissions } from "./Admissions";
import { BulkGrant } from "./BulkGrant";
import { filterOf, listHref, loadStudents, type Held, type ListFilter } from "./list";
import { defaultPackage, listPackages, studentsWithoutPackage } from "@/lib/packages";

/** Forty seconds for this page's actions, as the admin layout allows; the default is fifteen. */
export const maxDuration = 40;

/** Students shown per page. Thousands on one page is a page nobody can use. */
const PAGE_SIZE = 50;

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; quiet?: string; pkg?: string }> }) {
  // On the page itself, not only in the layout: a request can ask for the
  // page segment alone, and the layout then never runs.
  await requireAdmin("/admin/students");
  const supabase = await createClient();

  const params = await searchParams;
  const filter = filterOf(params);
  const page = Math.max(1, Math.floor(Number(params.page ?? "1")) || 1);
  const from = (page - 1) * PAGE_SIZE;

  // The list is searched, filtered and paged in the loader; the recent
  // attempts and the package lists do not depend on it, so all go out together.
  const [{ rows: students, total, held }, { data: watchAttempts }, { data: papers }, packages, starter, missing] = await Promise.all([
    loadStudents(filter, page, PAGE_SIZE),
    supabase.from("watch_attempts").select("id, paper_id, user_id, marks, total, attempted, submitted_at").order("submitted_at", { ascending: false }).limit(50),
    supabase.from("watch_papers").select("id, display_name"),
    listPackages("alp"),
    defaultPackage(),
    studentsWithoutPackage(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paperName = new Map((papers ?? []).map((p) => [p.id, p.display_name]));

  // Names for the recent attempts only — never the whole student table.
  const recentIds = [...new Set((watchAttempts ?? []).map((a) => a.user_id).filter(Boolean))] as string[];
  const { data: recentProfiles } = recentIds.length ? await supabase.from("profiles").select("id, full_name").in("id", recentIds) : { data: [] };
  const studentName = new Map((recentProfiles ?? []).map((s) => [s.id, s.full_name || "Unnamed"]));

  const pkgName = new Map(packages.map((p) => [p.slug, p.name]));
  const filterLabel = [
    filter.pkg === "none" ? "no package" : filter.pkg === "self" ? "self sign-ups" : filter.pkg ? (pkgName.get(filter.pkg) ?? filter.pkg) : "all students",
    filter.quietDays ? `quiet ${filter.quietDays} days` : "",
    filter.q ? `search "${filter.q}"` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const chip = (pkg: string, label: string) => (
    <Link
      key={pkg || "all"}
      href={listHref({ ...filter, pkg })}
      className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${filter.pkg === pkg ? "border-indigo-800 bg-indigo-800 text-white" : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900">Students</h1>

      <Admissions packages={packages} defaultSlug={starter?.slug ?? ""} missing={missing} />

      <section className="mt-6" id="list">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-bold text-gray-900">
            Registered students ({total.toLocaleString("en-IN")}
            {filter.pkg || filter.q || filter.quietDays ? ` · ${filterLabel}` : ""})
          </h2>
          <form method="get" action="/admin/students#list" className="ml-auto flex flex-wrap gap-2">
            {filter.pkg && <input type="hidden" name="pkg" value={filter.pkg} />}
            {filter.quietDays ? <input type="hidden" name="quiet" value={filter.quietDays} /> : null}
            <input name="q" defaultValue={filter.q} placeholder="Search by mobile number or name" className="w-[260px] max-w-full rounded border border-gray-400 px-3 py-1.5 text-[13px]" />
            <button type="submit" className="rounded bg-indigo-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-900">
              Search
            </button>
            <Link
              href={listHref({ ...filter, quietDays: filter.quietDays === 7 ? 0 : 7 })}
              className={`rounded border px-3 py-1.5 text-[12px] font-semibold ${filter.quietDays === 7 ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"}`}
              title="Active accounts not seen on the portal for 7 days (or never)"
            >
              Quiet 7 days
            </Link>
            <Link
              href={listHref({ ...filter, quietDays: filter.quietDays === 30 ? 0 : 30 })}
              className={`rounded border px-3 py-1.5 text-[12px] font-semibold ${filter.quietDays === 30 ? "border-amber-500 bg-amber-100 text-amber-900" : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"}`}
            >
              Quiet 30 days
            </Link>
            {filter.q || filter.pkg || filter.quietDays ? (
              <Link href="/admin/students#list" className="rounded border border-gray-400 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-100">
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Package filter">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">Package</span>
          {chip("", "All")}
          {chip("none", "No package")}
          {packages.map((p) => chip(p.slug, p.name))}
          {chip("self", "Self sign-ups")}
        </div>

        <BulkGrant packages={packages} filter={filter} filterLabel={filterLabel} matchCount={total} />

        {students.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-rrb-banner text-left text-white">
                  <th className="border border-gray-300 px-3 py-2">Name</th>
                  <th className="border border-gray-300 px-3 py-2">Mobile</th>
                  <th className="border border-gray-300 px-3 py-2">Package</th>
                  <th className="border border-gray-300 px-3 py-2">Registered</th>
                  <th className="border border-gray-300 px-3 py-2">Last seen</th>
                  <th className="border border-gray-300 px-3 py-2">Account</th>
                  <th className="border border-gray-300 px-3 py-2">New password</th>
                  <th className="border border-gray-300 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-semibold text-gray-900">
                      <Link href={`/admin/students/${s.id}`} className="text-rrb-banner hover:underline">
                        {s.full_name || "—"}
                      </Link>
                      {s.signup_source === "self" && (
                        <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-800" title="Made their own account on the website">
                          self
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{s.phone || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <HeldCell held={held.get(s.id) ?? []} />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{formatDate(s.created_at)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-[12px]">{s.last_seen_at ? formatDateTime(s.last_seen_at) : <span className="text-gray-400">never</span>}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <RowForm action={setActive}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={String(!s.is_active)} />
                        <button type="submit" className={`rounded px-2 py-1 text-[11px] font-semibold ${s.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}>
                          {s.is_active ? "On — switch off" : "Off — switch on"}
                        </button>
                      </RowForm>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <RowForm action={resetPassword} className="flex gap-1">
                        <input type="hidden" name="id" value={s.id} />
                        <input name="password" required minLength={6} placeholder="new password" className="w-[130px] rounded border border-gray-400 px-2 py-1 text-[12px]" />
                        <button type="submit" className="rounded border border-gray-400 px-2 py-1 text-[11px] font-semibold text-gray-800 hover:bg-gray-100">
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
                  <Link href={listHref(filter, page - 1)} className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100">
                    ← Previous
                  </Link>
                )}
                <span>
                  Page {page} of {pages} · showing {from + 1}–{Math.min(total, from + PAGE_SIZE)} of {total.toLocaleString("en-IN")}
                </span>
                {page < pages && (
                  <Link href={listHref(filter, page + 1)} className="rounded border border-gray-400 bg-white px-3 py-1 font-semibold hover:bg-gray-100">
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </div>
        ) : (
          <p className="mt-3 rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">
            {filter.q ? <>No student matches &ldquo;{filter.q}&rdquo;.</> : filter.pkg || filter.quietDays ? `No student in this filter (${filterLabel}).` : "No students have registered yet."}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[15px] font-bold text-gray-900">Recent attempts (latest {watchAttempts?.length ?? 0})</h2>
        <p className="mb-2 text-[12px] text-gray-600">
          Every attempt of a paper, with search and filters, is under that paper&apos;s{" "}
          <Link href="/admin/papers" className="font-semibold text-rrb-banner hover:underline">
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
                      {a.user_id ? (studentName.get(a.user_id) ?? "—") : "Not signed in"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{paperName.get(a.paper_id) ?? "—"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {a.marks} / {a.total}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{a.attempted}</td>
                    <td className="border border-gray-300 px-3 py-2">{a.attempted > 0 ? `${((a.marks / a.attempted) * 100).toFixed(1)}%` : "—"}</td>
                    <td className="border border-gray-300 px-3 py-2">{formatDateTime(a.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded border border-gray-300 bg-white p-5 text-center text-[13px] text-gray-500">No attempts yet.</p>
        )}
      </section>
    </>
  );
}

/** What a student holds: each running package with its end, or none in red. */
function HeldCell({ held }: { held: Held[] }) {
  if (held.length === 0) return <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-800">No package</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {held.map((h) => (
        <span key={h.slug} className="text-[12px]">
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${h.kind === "combo" ? "bg-indigo-100 text-indigo-900" : h.kind === "full" ? "bg-blue-100 text-blue-900" : "bg-teal-100 text-teal-900"}`}>{h.name}</span>
          <span className="ml-1 text-[11px] text-gray-500">{h.expiresAt ? `till ${formatDate(h.expiresAt)}` : "no expiry"}</span>
        </span>
      ))}
    </span>
  );
}
