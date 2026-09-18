import { notFound } from "next/navigation";
import { WatchTableExam } from "@/components/wt/WatchTableExam";
import { getBundledPaper } from "@/lib/wt/paper";

export default async function WatchTablePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = getBundledPaper(paperId);
  if (!paper) notFound();

  return <WatchTableExam paper={paper} />;
}
