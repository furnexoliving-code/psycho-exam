import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/ExamRunner";
import { ExamProvider } from "@/lib/exam-store";
import { getTest } from "@/lib/tests";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = getTest(testId);
  if (!test) notFound();

  return (
    <ExamProvider test={test}>
      <ExamRunner />
    </ExamProvider>
  );
}
