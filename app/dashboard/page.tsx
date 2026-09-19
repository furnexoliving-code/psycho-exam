import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { ChangePassword } from "@/components/ChangePassword";
import { isConfigured, requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/wt/categories";
import { listPublishedPapers } from "@/lib/wt/db";
import { attemptsFor } from "@/lib/wt/history";

/** A tile's look, kept out of the markup so the three read as one set. */
const TONES: Record<string, { ring: string; chip: string; icon: string }> = {
  watch: { ring: "from-sky-500 to-indigo-600", chip: "bg-sky-50 text-sky-700", icon: "🧭" },
  letter: { ring: "from-emerald-500 to-teal-600", chip: "bg-emerald-50 text-emerald-700", icon: "🔤" },
  number: { ring: "from-amber-500 to-orange-600", chip: "bg-amber-50 text-amber-700", icon: "🔢" },
};

export default async function DashboardPage() {
  if (!isConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
          <div className="rounded border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
            <p className="font-semibold">Accounts are not set up yet.</p>
          </div>
        </main>
      </div>
    );
  }

  const [profile, papers] = await Promise.all([requireUser(), listPublishedPapers()]);
  const history = await attemptsFor(profile.id);

  const best = history.length
    ? Math.max(...history.map((h) => (h.total ? (h.marks / h.total) * 100 : 0)))
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader
        right={
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/80">
              {profile.full_name || "Candidate"}
            </span>
            <SignOutButton />
          </div>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {/* ------------------------------ Banner ------------------------------ */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-rrb-banner via-[#1668b0] to-rrb-tealDark shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6">
            <div>
              <h1 className="text-[24px] font-bold text-white">
                Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
              </h1>
              <p className="mt-0.5 text-[13px] text-white/80">
                {profile.roll_no ? `Roll no. ${profile.roll_no}` : "KAUTILYA CLASSES"}
              </p>
            </div>

            <div className="flex gap-3">
              <Tile label="Tests taken" value={String(history.length)} />
              <Tile
                label="Best score"
                value={best === null ? "—" : `${best.toFixed(0)}%`}
              />
              <Tile label="Tests open" value={String(papers.length)} />
            </div>
          </div>
        </div>

        {/* ---------------------------- The three ----------------------------- */}
        <h2 className="mt-8 text-[18px] font-bold text-gray-900">
          Following Directions Test
        </h2>
        <p className="mt-0.5 text-[13px] text-gray-600" lang="hi">
          निर्देश पालन परीक्षण
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const count = papers.filter((p) => p.category === category.id).length;
            const tone = TONES[category.id];

            return (
              <Link
                key={category.id}
                href={`/tests/${category.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone.ring} text-[22px]`}
                  aria-hidden="true"
                >
                  {tone.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gray-900">
                    {category.title}
                  </span>
                  <span className="block text-[11px] text-gray-500" lang="hi">
                    {category.hindi}
                  </span>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      count ? tone.chip : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count === 0
                      ? "Coming soon"
                      : `${count} test${count === 1 ? "" : "s"} available`}
                  </span>
                </span>

                <span
                  className="shrink-0 text-[20px] text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-rrb-banner"
                  aria-hidden="true"
                >
                  ›
                </span>
              </Link>
            );
          })}
        </div>

        {/* --------------------------- Past results --------------------------- */}
        <h2 className="mt-9 text-[18px] font-bold text-gray-900">Your past results</h2>

        {history.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-[14px] text-gray-500">
            You have not completed any test yet. Pick one above to begin.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-700">
                  <th className="px-4 py-2.5 font-semibold">Test</th>
                  <th className="px-4 py-2.5 font-semibold">Score</th>
                  <th className="px-4 py-2.5 font-semibold">Attempted</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-900">
                      {row.paperName}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {row.marks} / {row.total}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{row.attempted}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {new Date(row.submittedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {row.paperSlug && (
                        <Link
                          href={`/watch-table/${row.paperSlug}/result`}
                          className="font-semibold text-rrb-banner hover:underline"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {profile.phone && <ChangePassword phone={profile.phone} />}
      </main>
    </div>
  );
}

/** One figure in the banner. */
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur">
      <div className="text-[20px] font-bold leading-tight text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/75">{label}</div>
    </div>
  );
}
