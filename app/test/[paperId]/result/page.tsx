import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, testNameOf } from "@/lib/wt/categories";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { headerOf, loadPaperHeader, loadPaperHeaderLive } from "@/lib/wt/db";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";
import { NoPrint } from "@/components/NoPrint";
import { currentMockStep } from "@/lib/wt/mock";
import { photoUrlOf } from "@/lib/photo";


/** The window's title on a result: the test's name, then Result. */
export async function generateMetadata({ params }: { params: Promise<{ paperId: string }> }): Promise<Metadata> {
  const { paperId } = await params;
  const header = isConfigured()
    ? await loadPaperHeader(paperId).catch(() => null)
    : (() => {
        const bundled = getBundledPaper(paperId);
        return bundled ? headerOf(bundled) : null;
      })();
  if (!header) return {};
  const battery = CATEGORIES.find((c) => c.id === header.category)?.battery ?? (header.kind === "figure" ? null : 2);
  const name = testNameOf(battery, header.displayName);
  return { title: `${battery ? `Test ${battery} - ` : ""}${name} · Result | KAUTILYA CLASSES` };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  // A result belongs to the account that sat the paper.
  const who = isConfigured() ? await requireUser(`/test/${paperId}/result`) : null;

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
          photoUrl: photoUrlOf(who),
        }
      : undefined;
  return (
    <NoPrint>
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
      category={paper.category}
      candidate={who ? { name: who.full_name || "", photoUrl: photoUrlOf(who) } : null}
      storageOwner={who?.id ?? "guest"}
    />
    </NoPrint>
  );
}
