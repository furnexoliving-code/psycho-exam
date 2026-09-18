import { notFound } from "next/navigation";
import { getBundledPaper } from "@/lib/wt/paper";
import { ResultView } from "./ResultView";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = getBundledPaper(paperId);
  if (!paper) notFound();

  return <ResultView paper={paper} />;
}
