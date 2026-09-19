import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { PaperCard } from "@/components/PaperCard";
import { requireUser } from "@/lib/auth";
import { allowancesFor } from "@/lib/wt/attempts";
import { CATEGORIES } from "@/lib/wt/categories";
import { listPublishedPapers } from "@/lib/wt/db";

/**
 * Every published paper of one kind.
 *
 * The three kinds sit on the dashboard as short cards rather than long lists,
 * because an institute uploads many papers per kind and three growing columns
 * would push everything else off the page.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: id } = await params;
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) notFound();

  // Who is asking and what is on offer are independent, so they load together.
  const [profile, papers] = await Promise.all([
    requireUser(`/tests/${id}`),
    listPublishedPapers(id),
  ]);
  // One query for the whole list, not one per paper.
  const allowances = await allowancesFor(papers, profile.id);

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
        <Link
          href="/dashboard"
          className="text-[13px] font-semibold text-rrb-banner hover:underline"
        >
          ← All tests
        </Link>

        <h1 className="mt-3 text-[22px] font-bold text-gray-900">{category.title}</h1>
        <p className="text-[14px] text-rrb-tealDark" lang="hi">
          {category.hindi}
        </p>
        <p className="mt-1 text-[13px] text-gray-600">{category.blurb}</p>

        {papers.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-[14px] text-gray-500">
            No test has been published here yet. Please check back later.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} allowance={allowances.get(paper.slug)!} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
