import { notFound } from "next/navigation";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { headerOf, loadPaperHeader, loadPaperHeaderLive } from "@/lib/wt/db";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";
import { currentMockStep } from "@/lib/wt/mock";

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
    ? (await isVerifiedEditor())
      ? await loadPaperHeaderLive(paperId)
      : await loadPaperHeader(paperId)
    : (() => {
        const bundled = getBundledPaper(paperId);
        return bundled ? headerOf(bundled) : null;
      })();

  if (!paper) notFound();

  // A test just sat inside a Full Mock: the result page moves the mock on
  // instead of showing this test's own marks, which wait for the scorecard.
  const inMock = who ? await currentMockStep(who.id) : null;
  const mock =
    inMock && inMock.paper.slug === paperId
      ? {
          name: inMock.mock.name,
          step: inMock.step,
          total: inMock.papers.length,
          gapSec: inMock.mock.gapMin * 60,
          battery: inMock.paper.battery,
          candidate: who?.full_name || "Candidate",
          rollNo: who?.roll_no || "",
        }
      : undefined;
  return (
    <ResultView
      mock={mock}
      paperId={paperId}
      displayName={paper.displayName}
      allowedSec={paper.timeLimitMin * 60}
      // The review shows the same diagram the candidate sat with, so a question
      // can be re-read against it rather than from memory.
      table={paper.table}
      kind={paper.kind}
      imageUrl={paper.imageUrl}
      imageWidthPct={paper.imageWidthPct}
      studyImages={paper.studyImages}
      questionsPerPart={paper.questionsPerPart}
      storageOwner={who?.id ?? "guest"}
    />
  );
}
