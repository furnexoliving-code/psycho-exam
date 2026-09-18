import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { isConfigured } from "@/lib/auth";
import { loadPaperForCandidate } from "@/lib/wt/db";
import { getBundledPaper, withoutAnswerKey } from "@/lib/wt/paper";

export default async function WatchTablePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // A paper made in the admin panel wins; the bundled sample is the fallback,
  // so the portal still runs before any database is connected.
  const paper =
    (isConfigured() ? await loadPaperForCandidate(paperId) : null) ??
    getBundledPaper(paperId);

  if (!paper) notFound();
  if (paper.questions.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-lg font-bold text-gray-900">This paper has no questions yet</h1>
        <p className="mt-2 text-[14px] text-gray-600">
          Upload them in the admin panel, then publish the paper.
        </p>
      </main>
    );
  }

  // The key never goes to the browser; /api/watch-table/score marks the paper.
  return <WatchTableExam paper={withoutAnswerKey(paper)} />;
}
