import Link from "next/link";
import { formatDateTime, formatDayMonth } from "@/lib/format-time";
import { StudentHeader } from "@/components/StudentHeader";
import { scoreOutOf30, type MockResult, type MockStatus, type MockTest } from "@/lib/wt/mock";

/**
 * Every Full Mock, sorted into what matters now: the one in progress, the
 * ones open, the ones coming, the ones done, the ones over. Built for
 * fifty and more: each group is a compact list, and a filter row narrows
 * it to one group.
 */
export interface MockCard {
  mock: MockTest;
  status: MockStatus;
  /** How many times this student has finished it. */
  used: number;
  /** The student's best result, if any. */
  best: (MockResult & { mockName: string; mockSlug: string }) | null;
  /** The newest result, if any. */
  latest: (MockResult & { mockName: string; mockSlug: string }) | null;
  unlocked: boolean;
  inProgress: boolean;
  /** False when the student's packages do not cover this mock (and it is not the free one). */
  inPackage: boolean;
}

export interface MocksInput {
  profile: { full_name: string; photoUrl: string | null };
  cards: MockCard[];
  passT: number;
  /** The filter in force: all | open | upcoming | done | closed. */
  filter: string;
  /** True when a package covers the Full Mocks; false shows the way to buy one. */
  hasPackage?: boolean;
}

const GROUPS: { id: string; label: string; hindi: string; pick: (c: MockCard) => boolean }[] = [
  // Every mock sits in exactly one group.
  { id: "open", label: "Open now", hindi: "अभी खुले", pick: (c) => c.status === "live" && c.latest === null },
  { id: "upcoming", label: "Upcoming", hindi: "आने वाले", pick: (c) => c.status === "scheduled" },
  { id: "done", label: "Completed by you", hindi: "आपने पूरे किए", pick: (c) => c.latest !== null },
  { id: "closed", label: "Closed", hindi: "बंद", pick: (c) => c.status === "closed" && c.latest === null },
];

export function MocksView({ profile, cards, passT, filter, hasPackage = true }: MocksInput) {
  const inProgress = cards.find((c) => c.inProgress) ?? null;
  const groups = GROUPS.map((g) => ({ ...g, cards: cards.filter(g.pick) })).filter((g) => filter === "all" ? g.cards.length > 0 : g.id === filter);
  const done = cards.filter((c) => c.latest).length;
  const bestOut30 = cards.map((c) => (c.best ? scoreOutOf30(c.best.tests) : null)).filter((x): x is number => x !== null);
  const topScore = bestOut30.length ? Math.max(...bestOut30) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f5f9]">
      <StudentHeader name={profile.full_name || "Candidate"} photoUrl={profile.photoUrl} active="mocks" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
              Full Mock Tests <span className="text-[15px] font-normal text-gray-500" lang="hi">/ पूर्ण मॉक टेस्ट</span>
            </h1>
            <p className="mt-1 text-[13px] text-gray-600">
              All five tests in the hall&apos;s order, one sitting, one scorecard out of 30. A mock opens once every battery is at T-Score: {passT}+ in practice.
            </p>
          </div>
          <div className="flex gap-2">
            <Tile big={String(cards.length)} label="mocks" />
            <Tile big={String(done)} label="completed" />
            <Tile big={topScore === null ? "—" : topScore.toFixed(1)} label="best / 30" tone="blue" />
          </div>
        </div>

        {inProgress && (
          <section className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-blue-300 bg-blue-50 px-4 py-3">
            <span className="rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-[11px] font-bold text-white">⏵ In progress</span>
            <span className="text-[14px] font-bold text-gray-900">{inProgress.mock.name}</span>
            <span className="text-[12px] text-gray-600">The clock is running. Pick up where you were.</span>
            <Link href={`/mock/${inProgress.mock.slug}`} className="ml-auto rounded-lg bg-[#1d4ed8] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#1e40af]">
              Continue →
            </Link>
          </section>
        )}

        <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Show">
          <Chip href="/mocks" active={filter === "all"} label="All" count={cards.length} />
          {GROUPS.map((g) => (
            <Chip key={g.id} href={`/mocks?show=${g.id}`} active={filter === g.id} label={g.label} count={cards.filter(g.pick).length} />
          ))}
        </nav>

        {!hasPackage && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[14px] border border-amber-300 bg-amber-50 px-5 py-4">
            <span className="text-[22px]" aria-hidden="true">🔒</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-amber-900">Full Mocks are in the Full Mock package.{cards.some((c) => c.mock.isFree) ? " The free mock is open to try." : " Ask at the institute to add it."}</p>
              <p className="text-[12px] text-amber-800" lang="hi">फुल मॉक टेस्ट फुल मॉक पैकेज में हैं।{cards.some((c) => c.mock.isFree) ? " फ्री मॉक अभी खोल सकते हैं।" : " संस्थान से पूछें।"}</p>
            </div>
            <Link href="/packages#full" className="rounded-lg bg-[#0d2a6b] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#0a2158]">See packages →</Link>
          </div>
        )}

        {cards.length === 0 && (
          <p className="mt-6 rounded-[14px] border border-dashed border-gray-300 bg-white p-10 text-center text-[14px] text-gray-500">
            Full Mocks will appear here when the institute opens them.
          </p>
        )}

        {groups.map((g) => (
          <section key={g.id} className="mt-5">
            <h2 className="flex items-baseline gap-2 border-b border-gray-200 pb-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500">
              {g.label} <span className="font-semibold normal-case tracking-normal" lang="hi">· {g.hindi}</span>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-600 ring-1 ring-gray-200">{g.cards.length}</span>
            </h2>
            {g.cards.length === 0 ? (
              <p className="mt-2 text-[13px] text-gray-500">Nothing here.</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-100 rounded-[14px] border border-gray-200 bg-white shadow-sm">
                {g.cards.map((c) => (
                  <MockRow key={c.mock.id} card={c} passT={passT} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}

function MockRow({ card, passT }: { card: MockCard; passT: number }) {
  const { mock, status, latest, best, used, unlocked, inProgress, inPackage } = card;
  const out30 = latest ? scoreOutOf30(latest.tests) : null;
  const bestOut = best ? scoreOutOf30(best.tests) : null;
  const left = mock.maxAttempts === null ? null : Math.max(0, mock.maxAttempts - used);
  const when =
    status === "scheduled" && mock.opensAt ? `Opens ${formatDateTime(mock.opensAt)}` : status === "live" && mock.closesAt ? `Till ${formatDateTime(mock.closesAt)}` : status === "closed" ? "Over" : "Open now";
  return (
    <li className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[44px_1fr_220px_auto]">
      <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#eef2fb] to-[#dbe7ff] text-[11px] font-extrabold text-[#0d2a6b]">
        M{mock.sortOrder || ""}
      </span>
      <div className="min-w-0">
        <Link href={`/mock/${mock.slug}`} className="block truncate text-[14px] font-bold text-gray-900 hover:underline">
          {mock.name}
          {mock.isFree && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-800">Free</span>}
        </Link>
        <div className="text-[11px] text-gray-500">
          {mock.paperIds.length} tests · {when}
          {left !== null && <> · {left} of {mock.maxAttempts} attempt{mock.maxAttempts === 1 ? "" : "s"} left</>}
        </div>
      </div>
      <div className="hidden text-[12px] sm:block">
        {latest ? (
          <>
            <span className="text-[16px] font-extrabold tabular-nums text-gray-900">{out30 === null ? "—" : out30.toFixed(1)}</span>
            <span className="text-[10px] font-semibold text-gray-500"> / 30 · {formatDayMonth(latest.submittedAt)}</span>
            {best && best.id !== latest.id && bestOut !== null && <span className="block text-[11px] text-gray-500">best {bestOut.toFixed(1)}</span>}
            <span className="ml-2 inline-flex gap-0.5 align-middle">
              {[1, 2, 3, 4, 5].map((b) => {
                const t = latest.tests.find((x) => x.battery === b)?.tScore ?? null;
                return <span key={b} className={`h-2 w-2 rounded-full ${t === null ? "bg-gray-300" : t >= passT ? "bg-green-500" : "bg-red-500"}`} title={`Test ${b}: ${t === null ? "—" : t.toFixed(0)}`} />;
              })}
            </span>
          </>
        ) : (
          <span className="text-gray-400">Not attempted yet</span>
        )}
      </div>
      <div className="text-right">
        {inProgress ? (
          <Link href={`/mock/${mock.slug}`} className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#1e40af]">Continue</Link>
        ) : latest ? (
          <span className="flex flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${latest.qualified === true ? "bg-green-50 text-green-700" : latest.qualified === false ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
              {latest.qualified === true ? "✓ Qualified" : latest.qualified === false ? "✕ Not qualified" : "? Pending"}
            </span>
            <span className="flex gap-2">
              {status === "live" && unlocked && (left === null || left > 0) && (
                <Link href={`/mock/${mock.slug}`} className="text-[11px] font-semibold text-[#1d4ed8] hover:underline">Reattempt</Link>
              )}
              <Link href={`/mock/${mock.slug}/result`} className="text-[11px] font-semibold text-[#1d4ed8] hover:underline">Scorecard →</Link>
            </span>
          </span>
        ) : status === "live" && !inPackage ? (
          <Link href="/packages#full" className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-200">🔒 In the Full Mock package</Link>
        ) : status === "live" && !unlocked ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">🔒 Locked · {passT}+ needed</span>
        ) : status === "live" ? (
          <Link href={`/mock/${mock.slug}`} className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#1e40af]">Start</Link>
        ) : status === "scheduled" ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">⏱ Upcoming</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">Closed</span>
        )}
      </div>
    </li>
  );
}

function Tile({ big, label, tone = "gray" }: { big: string; label: string; tone?: "gray" | "blue" }) {
  return (
    <div className={`min-w-[84px] rounded-[12px] border px-3 py-2 text-center ${tone === "blue" ? "border-[#1d4ed8]/30 bg-[#eef2fb]" : "border-gray-200 bg-white"}`}>
      <div className={`text-[18px] font-extrabold tabular-nums ${tone === "blue" ? "text-[#0d2a6b]" : "text-gray-900"}`}>{big}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}

function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${active ? "border-[#1d4ed8] bg-[#1d4ed8] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#1d4ed8]"}`}>
      {label} <span className={active ? "text-white/80" : "text-gray-400"}>{count}</span>
    </Link>
  );
}
