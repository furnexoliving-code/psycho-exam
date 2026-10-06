"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { continueMock, type MockNext } from "@/app/mock/actions";
import { clock } from "./PortalToolbar";
import { PortalBanner } from "./PortalBanner";
import { ExamSummaryList } from "./ExamSummary";

/**
 * The break between two tests of a Full Mock, laid out as the hall shows
 * it: the candidate's photo box top right, the break clock, and the Exam
 * Summary of every test. The next test opens by itself when the clock
 * runs out. After the last test the same screen says thank you and offers
 * the scorecard.
 *
 * It is reached from the result page of a test sat inside a mock, once
 * that test's attempt is on record; the first thing it does is move the
 * mock on, which is what fills the summary.
 */
export function MockBreak({
  paperId,
  mock,
  initial = null,
}: {
  paperId: string;
  mock: { name: string; step: number; total: number; gapSec: number; battery: number; candidate: string; rollNo: string };
  /** For a preview: the answer the server would give, so nothing is asked of it. */
  initial?: MockNext | null;
}) {
  const router = useRouter();
  const [next, setNext] = useState<MockNext | null>(initial);
  const [left, setLeft] = useState(mock.gapSec);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    continueMock(paperId)
      .then((n) => {
        if (cancelled) return;
        setNext(n);
        if (n.next === "none") router.replace("/dashboard");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [paperId, router, initial]);

  useEffect(() => {
    if (!next || next.next !== "paper") return;
    if (left <= 0) {
      router.replace(next.url);
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, next, router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-exam">
      <PortalBanner showInstructions={false} />

      <div className="flex items-start justify-end border-b border-[#dcdcdc] bg-[#f3f3f3] px-4 py-2">
        <div className="flex items-center gap-3 bg-white px-4 py-2">
          <div className="flex h-[64px] w-[64px] items-center justify-center border border-[#bbbbbb] bg-[#dfe6ee]">
            <svg viewBox="0 0 48 48" className="h-[50px] w-[50px]" aria-hidden="true">
              <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
              <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="max-w-[180px] truncate text-[15px] font-semibold text-gray-900">{mock.candidate}</div>
            {mock.rollNo && <div className="text-[10px] text-gray-600">Roll No: {mock.rollNo}</div>}
          </div>
        </div>
      </div>

      <div className="wt-scroll-host min-h-0 flex-1 overflow-y-auto px-6 py-4 text-[16px]">
        {failed ? (
          <div className="mx-auto max-w-xl py-10 text-center">
            <p className="text-[14px] text-red-700">The mock could not be moved on. Check the connection and try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded bg-[#2a7fc0] px-6 py-2 text-sm font-semibold text-white hover:bg-[#2470ab]"
            >
              Try again
            </button>
          </div>
        ) : !next ? (
          <p className="py-10 text-center text-[14px] text-gray-600">Saving your answers…</p>
        ) : next.next === "done" ? (
          <div className="mx-auto max-w-2xl py-12 text-center">
            <h1 className="text-[24px] font-bold text-[#222]">Thank you!</h1>
            <p className="mt-2 text-[15px] text-[#333]">
              Your responses to all {mock.total} tests have been submitted successfully. The aptitude test is over.
            </p>
            <p className="mt-1 text-[14px] text-[#555]" lang="hi">
              सभी {mock.total} परीक्षणों के आपके उत्तर सफलतापूर्वक जमा हो गए हैं। अभिवृत्ति परीक्षण समाप्त हुआ।
            </p>
            <a
              href={next.url}
              className="mt-8 inline-block rounded bg-[#2a7fc0] px-8 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab]"
            >
              View my scorecard
            </a>
            <div className="mx-auto mt-10 max-w-3xl text-left">
              <h2 className="text-center text-[1em] font-semibold text-[#222]">Exam Summary</h2>
              <div className="mt-3">
                <ExamSummaryList tests={next.summary} />
              </div>
            </div>
          </div>
        ) : next.next === "paper" ? (
          <div className="mx-auto max-w-4xl">
            <div className="border-b border-[#dcdcdc] pb-2 text-center text-[0.8em] font-semibold text-[#222]">
              Break Time Left : <span className="font-mono tabular-nums">{clock(left)}</span>
            </div>
            <h2 className="mt-3 text-center text-[1em] font-semibold text-[#222]">Exam Summary</h2>
            <div className="mt-3">
              <ExamSummaryList tests={next.summary} />
            </div>
            <p className="mt-4 text-[0.75em] text-[#666]">
              Test {next.step + 1} of {next.total} opens by itself when the break ends. Stay on this page.
              <span className="ml-2" lang="hi">अवकाश समाप्त होते ही परीक्षण {next.step + 1} स्वतः खुलेगा। इसी पेज पर रहें।</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
