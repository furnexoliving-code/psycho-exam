import { notFound } from "next/navigation";
import { ExamBanner } from "@/components/ExamBanner";
import { getTest } from "@/lib/tests";
import { ResultView } from "./ResultView";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = getTest(testId);
  if (!test) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <ExamBanner />
      <ResultView test={test} />
    </div>
  );
}
