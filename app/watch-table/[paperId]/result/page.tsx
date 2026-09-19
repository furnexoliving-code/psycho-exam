import { notFound } from "next/navigation";
import { isConfigured, requireUser } from "@/lib/auth";
import { headerOf, loadPaperHeader, loadPaperHeaderLive } from "@/lib/wt/db";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // A result belongs to the account that sat the paper.
  const who = isConfigured() ? await requireUser(`/watch-table/${paperId}/result`) : null;

  // Only the paper's name and diagram: no questions, and no answer key. The
  // marks come from /api/watch-table/score, which looks the key up server-side.
  const paper = isConfigured()
    ? who?.role === "admin"
      ? await loadPaperHeaderLive(paperId)
      : await loadPaperHeader(paperId)
    : (() => {
        const bundled = getBundledPaper(paperId);
        return bundled ? headerOf(bundled) : null;
      })();

  if (!paper) notFound();
  return (
    <ResultView
      paperId={paperId}
      displayName={paper.displayName}
      allowedSec={paper.timeLimitMin * 60}
      // The review shows the same diagram the candidate sat with, so a question
      // can be re-read against it rather than from memory.
      table={paper.table}
      imageUrl={paper.imageUrl}
      imageWidthPct={paper.imageWidthPct}
      storageOwner={who?.id ?? "guest"}
    />
  );
}
