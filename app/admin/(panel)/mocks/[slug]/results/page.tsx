import Link from "next/link";
import { notFound } from "next/navigation";
import { requireResults } from "@/lib/auth";
import { formatDateTime } from "@/lib/format-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadMock, mockResultsOf } from "@/lib/wt/mock";
import { MockResultsTable, type MockResultRow } from "./MockResultsTable";

export default async function MockResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireResults(`/admin/mocks/${slug}/results`);
  const loaded = await loadMock(slug);
  if (!loaded) notFound();
  const { mock, papers } = loaded;
  const results = await mockResultsOf(mock.id);

  const ids = [...new Set(results.map((r) => r.userId).filter(Boolean))] as string[];
  const names = new Map<string, { name: string; phone: string }>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await createAdminClient().from("profiles").select("id, full_name, phone").in("id", ids.slice(i, i + 300));
    for (const p of data ?? []) names.set(p.id as string, { name: (p.full_name as string) || "Unnamed", phone: (p.phone as string) || "" });
  }

  // Rank each candidate by their best composite; earlier sittings are
  // listed under it, greyed, so a teacher sees the trend.
  const best = new Map<string, number>();
  for (const r of results) {
    if (!r.userId || r.composite === null) continue;
    if (!best.has(r.userId) || (best.get(r.userId) as number) < r.composite) best.set(r.userId, r.composite);
  }
  const ranked = [...best.entries()].sort((a, b) => b[1] - a[1]);
  const rankOf = new Map<string, number>();
  ranked.forEach(([u, c], i) => rankOf.set(u, i > 0 && ranked[i - 1][1] === c ? (rankOf.get(ranked[i - 1][0]) as number) : i + 1));
  const seen = new Set<string>();
  const rows: MockResultRow[] = results
    .slice()
    .sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1) || b.submittedAt.localeCompare(a.submittedAt))
    .map((r) => {
      const who = r.userId ? names.get(r.userId) : undefined;
      const latest = r.userId ? !seen.has(r.userId) : true;
      if (r.userId) seen.add(r.userId);
      return {
        rank: r.userId ? (rankOf.get(r.userId) ?? 0) : 0,
        name: who?.name ?? "Deleted account",
        phone: who?.phone ?? "",
        when: formatDateTime(r.submittedAt),
        tests: r.tests.map((t) => ({ battery: t.battery, marks: t.marks, total: t.total, tScore: t.tScore })),
        composite: r.composite,
        qualified: r.qualified,
        latest,
      };
    });
  const batteries = papers.map((p) => p.battery);
  const qualified = rows.filter((r) => r.latest && r.qualified === true).length;
  const candidates = rows.filter((r) => r.latest).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/mocks" className="text-[13px] font-semibold text-rrb-banner hover:underline">← Full Mocks</Link>
        <h1 className="text-xl font-bold text-gray-900">{mock.name} — results</h1>
      </div>
      <p className="mt-1 text-[13px] text-gray-600">
        {candidates} candidates · {results.length} sittings · {candidates ? Math.round((qualified / candidates) * 100) : 0}% qualified (every battery T ≥ {mock.cutOffT}).
        Rank is by each candidate&apos;s best composite.
      </p>
      {rows.length === 0 ? (
        <p className="mt-5 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-[13px] text-gray-500">Nobody has finished this mock yet.</p>
      ) : (
        <MockResultsTable rows={rows} batteries={batteries} />
      )}
    </>
  );
}
