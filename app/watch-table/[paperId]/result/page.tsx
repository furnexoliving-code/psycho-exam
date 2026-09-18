import { notFound } from "next/navigation";
import { isConfigured } from "@/lib/auth";
import { loadPaperForCandidate } from "@/lib/wt/db";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // Deliberately the CANDIDATE view — it carries no answer key. The marks come
  // from /api/watch-table/score, which looks the key up server-side.
  const paper =
    (isConfigured() ? await loadPaperForCandidate(paperId) : null) ??
    getBundledPaper(paperId);

  if (!paper) notFound();
  return (
    <ResultView
      paperId={paperId}
      displayName={paper.displayName}
      allowedSec={paper.timeLimitMin * 60}
    />
  );
}
