import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, hallPosition, testNameOf } from "@/lib/wt/categories";
import { isConfigured, isVerifiedEditor, requireUser } from "@/lib/auth";
import { headerOf, loadPaperHeader, loadPaperHeaderLive } from "@/lib/wt/db";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";
import { listPublishedPapers } from "@/lib/wt/db";
import { groupPapers } from "@/lib/wt/series";
import { hiddenBatteries, openToStudents } from "@/lib/wt/visibility";
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
  return { title: `${battery ? `Test ${hallPosition(battery)} - ` : ""}${name} · Result | KAUTILYA CLASSES` };
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

  // Where to go next: the next paper of the same kind of test, and that
  // kind's page under Practice. Read from the published list; a result
  // still shows without it. A paper students can no longer open — its
  // battery hidden, or its kind kept off the portal — leads nowhere: the
  // result stays, the buttons to sit it again go.
  const open = !isConfigured() || openToStudents(paper.category, await hiddenBatteries());
  const nav = open ? await nextPaper(paperId).catch(() => null) : null;

  // A test just sat inside a Full Mock: the result page moves the mock on
  // instead of showing this test's own marks, which wait for the scorecard.
  // Any test of the mock not yet sat counts, not only the one it is on:
  // a candidate mid-test when the mock's order changed under the sitting
  // still moves it on.
  const inMock = who ? await currentMockStep(who.id) : null;
  const mockPaper = inMock?.papers.find((p) => p.slug === paperId && !inMock.done.includes(p.id));
  const mock =
    inMock && mockPaper
      ? {
          name: inMock.mock.name,
          step: inMock.step,
          total: inMock.papers.length,
          gapSec: inMock.mock.gapMin * 60,
          battery: mockPaper.battery,
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
      partImages={paper.partImages}
      questionsPerPart={paper.questionsPerPart}
      category={paper.category}
      candidate={who ? { name: who.full_name || "", photoUrl: photoUrlOf(who) } : null}
      nav={nav}
      reattempt={open}
      storageOwner={who?.id ?? "guest"}
    />
    </NoPrint>
  );
}

async function nextPaper(slug: string): Promise<{ nextSlug: string | null; nextName: string | null; seriesHref: string; seriesName: string } | null> {
  if (!isConfigured()) return null;
  const hidden = await hiddenBatteries();
  const papers = (await listPublishedPapers()).filter((p) => !p.mockOnly && openToStudents(p.category, hidden));
  for (const [battery, list] of groupPapers(papers)) {
    for (const series of list) {
      const at = series.papers.findIndex((p) => p.slug === slug);
      if (at < 0) continue;
      const next = series.papers[at + 1] ?? null;
      return { nextSlug: next?.slug ?? null, nextName: next?.displayName ?? null, seriesHref: `/practice/${battery}/${series.slug}`, seriesName: series.name };
    }
  }
  return null;
}
