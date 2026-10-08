"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveFeatures, type WatchPaper } from "@/lib/wt/types";
import { useAttempt } from "@/lib/wt/state";
import { useScrollLock } from "@/lib/wt/useKeyboardOnly";
import { phaseAt, scheduleOf, shownTimeLimitMin } from "@/lib/wt/schedule";
import { defaultPictureScale, sheetOf } from "@/lib/wt/figure-sample";
import { PortalBanner } from "./PortalBanner";
import { ExamTop, SectionChip } from "./ExamTop";
import { Instructions, InstructionsDialog } from "./Instructions";
import { ConfirmBox } from "./ConfirmBox";
import { ExamSummaryList } from "./ExamSummary";
import { useExamChrome } from "./ExamChrome";
import { testNameOf } from "@/lib/wt/categories";
import { ScrollRail } from "./ScrollRail";
import { splitGroups } from "@/lib/wt/find";

/**
 * The Perceptual Speed Test screen: the paper in parts, each question a
 * figure with its options beneath, answered with the mouse.
 *
 * The real test shows the questions a part at a time, with Part tabs on the
 * left and Save & Next moving to the next part. Everything behind the
 * screen — the attempt, its clocks, the snapshot sent to the server, the
 * submit — is the same machinery as the Following Directions paper; only
 * what is on screen differs, so that engine is left exactly as it is.
 */
export function FigureExam({
  paper,
  candidateName = "Candidate",
  rollNo = "—",
  elapsedSec = null,
  questionElapsedSec = null,
  storageOwner = "guest",
}: {
  paper: WatchPaper;
  candidateName?: string;
  rollNo?: string;
  elapsedSec?: number | null;
  questionElapsedSec?: number | null;
  storageOwner?: string;
}) {
  const { state, dispatch, answered, clearSaved } = useAttempt(
    paper,
    elapsedSec,
    questionElapsedSec,
    storageOwner,
  );
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  // Power of Observation: "Set A" and "Set B" stand over the two halves of
  // the pictures, as in the real test. The headings are as wide as the
  // first picture on screen, so they sit over its halves whatever size
  // the pictures were uploaded at.
  const twoSets = paper.category === "observation";
  // The Octagonal and Same Circle Tests, as the RDSO mock draws them: one
  // row per question, the number at the left, then the figure, then the
  // five option pictures with their letters beneath, then the radios; no
  // "Question No" heading. The Same Figure Test keeps its figure above.
  const sideBySide = paper.category === "octagonal" || paper.category === "circle";
  // The sheet tests (Brick, Similarity), as the RDSO mock draws the Brick
  // Test: the part's picture at the left, its questions at the right, each
  // a row of radios.
  const brick = sheetOf(paper.category) !== null;
  // A paper of text questions only (the Yes or No Test): the rows are
  // short, so they sit closer than picture questions do.
  const textPaper = paper.questions.length > 0 && paper.questions.every((q) => !q.image && !q.optionImages);
  const [setsWidth, setSetsWidth] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const column = useRef<HTMLDivElement | null>(null);
  // The Brick Test's question pane, which scrolls sideways under its own rail.
  const brickPane = useRef<HTMLOListElement | null>(null);

  const onTest = state.phase === "test";
  const features = resolveFeatures(paper.features);
  const { battery, mockSummary, goToResult } = useExamChrome();
  const testName = testNameOf(battery, paper.title);
  const fontScale = paper.fontScale ?? 1;
  // How large the pictures are drawn: the paper's own setting, else the
  // test's usual size.
  const scale = (features.pictureScale > 0 ? features.pictureScale : defaultPictureScale(paper.category)) / 100;
  const figureH = Math.round(72 * scale);
  const optionH = Math.round(64 * scale);
  const stripH = Math.round(52 * scale);

  // The same switch as the Following Directions paper: with the wheel off,
  // the scrollbar still drags and the Part tabs still move; only the wheel
  // and the Space/PageDown keys are refused, as in the hall.
  useScrollLock(features.lockScroll && onTest && !state.submitted);

  // The parts: a fixed number of questions each. Which part is open is kept
  // as the attempt's current question, so a reload lands on the same part.
  const perPart = Math.max(1, Math.floor(features.questionsPerPart) || 1);
  const partCount = Math.max(1, Math.ceil(paper.questions.length / perPart));
  const parts = useMemo(
    () =>
      Array.from({ length: partCount }, (_, p) => paper.questions.slice(p * perPart, (p + 1) * perPart)),
    [paper.questions, partCount, perPart],
  );

  // The Memory Test runs on the clock alone: each part is a study screen
  // for the study time, then its questions for the part time, then a break
  // with a summary, and the next part takes over by itself — no button
  // moves between them, and nothing goes back. Everything is read off the
  // test's elapsed time, which the server vouches for, so a reload lands
  // exactly where the clock says.
  const limitSec = paper.timeLimitMin * 60;
  const timetable = scheduleOf(features, paper.questions.length, limitSec);
  const scheduled = timetable !== null;
  // Named apart from the elapsedSec prop, which is the sitting's age on arrival.
  const spentSec = Math.max(0, limitSec - state.remainingSec);
  const at = timetable ? phaseAt(timetable, spentSec) : null;
  const inStudy = at?.phase === "study";
  const inBreak = at?.phase === "break";
  const phaseLeftSec = at?.leftSec ?? 0;

  const part = at ? at.part : Math.min(partCount - 1, Math.floor(state.currentIndex / perPart));
  const goToPart = useCallback(
    (p: number) => {
      if (scheduled) return;
      dispatch({ type: "goto", index: Math.min(Math.max(0, p), partCount - 1) * perPart });
      column.current?.scrollTo({ top: 0 });
    },
    [dispatch, partCount, perPart, scheduled],
  );

  const finish = useCallback(() => {
    dispatch({ type: "submit" });
  }, [dispatch]);

  // Submitted — by the button, by the clock, or by the server — means the
  // result, at once.
  useEffect(() => {
    if (state.submitted && state.startedAt !== 0) {
      // A full load on its own, a client-side move inside a Full Mock; see ExamChrome.
      goToResult(paper.id);
    }
  }, [state.submitted, state.startedAt, paper.id, goToResult]);

  // The sheet goes up to the server as it changes, so a browser that dies
  // mid-paper has lost nothing. The same as the Following Directions paper.
  const answersRef = useRef(state.answers);
  answersRef.current = state.answers;
  const sentRef = useRef<string>("");
  // The Save button sends the sheet up at once; the effect below keeps the
  // sender current.
  const sendRef = useRef<(keepalive: boolean) => void>(() => undefined);
  useEffect(() => {
    if (!onTestPhase(state)) return;
    const send = (keepalive: boolean) => {
      const answers = answersRef.current;
      const serialised = JSON.stringify(answers);
      if (serialised === sentRef.current) return;
      sentRef.current = serialised;
      void fetch("/api/watch-table/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id, answers }),
        keepalive,
      }).catch(() => {
        sentRef.current = "";
      });
    };
    sendRef.current = send;
    const timer = window.setTimeout(() => send(false), 1500);
    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [state, paper.id]);

  // Tell the server the moment the questions open, once: that is where the
  // time on the paper is measured from.
  const announcedStart = useRef(false);
  useEffect(() => {
    if (!onTestPhase(state) || announcedStart.current) return;
    announcedStart.current = true;
    void fetch("/api/watch-table/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId: paper.id }),
      keepalive: true,
    }).catch(() => undefined);
  }, [state, paper.id]);

  // The lines above the questions: the way back to the instructions, and
  // the prompt to answer. Drawn once here, since the Brick Test's two-column
  // screen puts them in its left column.
  const reminderLines = (
    <>
            {features.showInstructionsButton && (
              <p className="mb-2 text-[0.85em] text-[#333]">
                <span lang="hi">
                  यदि आप परीक्षण के निर्देशों को पुनः देखना चाहते हैं तो{" "}
                  <GroupInstructionsLink onClick={() => setInstructionsOpen(true)} /> पर क्लिक करें
                </span>
                {" / "}
                If you want to see the test instructions again please click on{" "}
                <GroupInstructionsLink onClick={() => setInstructionsOpen(true)} />
              </p>
            )}
            <p className="text-[0.9em] text-[#494949]">
              Please Select Correct Answer /{" "}
              <span lang="hi">कृपया सही उत्तर चुनें</span>
            </p>
    </>
  );

  const unanswered = paper.questions.length - answered;
  const lastPart = part >= partCount - 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <PortalBanner
        disabled={!onTest}
        showInstructions={features.showInstructionsButton}
        showQuestionPaper={false}
        onInstructions={() => setInstructionsOpen(true)}
      />
      <ExamTop
        title={testName}
        paperName={paper.displayName}
        label={
          !onTest
            ? "Instruction Time Left"
            : inStudy
              ? "Instruction Timer"
              : inBreak
                ? "Break Time Left"
                : "Time Left"
        }
        // On a schedule the panel counts the phase on screen — the study
        // time, this part's question time, or the break — as the real test
        // does; the whole sitting's clock is the server's concern.
        secondsLeft={!onTest ? state.instructionRemainingSec : scheduled ? phaseLeftSec : state.remainingSec}
        paused={state.paused}
        showPause={features.allowPause}
        showFullscreen={features.allowFullscreen}
        onTogglePause={() => dispatch({ type: "pause", paused: !state.paused, now: Date.now() })}
        onToggleFullscreen={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen().catch(() => {});
        }}
        rollNo={rollNo}
        name={candidateName}
        // On a schedule, a tab per part — "Memory Test-1", "Memory Test-2" —
        // as the real test's top strip has one per group.
        activeId={scheduled && onTest ? `part-${part}` : state.phase}
        tabs={[
          { id: "instructions", label: `${testName} Instructions` },
          ...(scheduled
            ? parts.map((_, p) => ({ id: `part-${p}`, label: `${testName}-${p + 1}` }))
            : [{ id: "test", label: testName }]),
        ]}
        // The Sections row: on a schedule the one group on screen, as the
        // real test names it ("Memory Test (Part 1)"); otherwise a chip per
        // part. No counts: the hall shows none.
        sections={
          onTest
            ? (scheduled ? [parts[part] ?? []] : parts).map((_, i) => {
                const p = scheduled ? part : i;
                return (
                  <SectionChip key={p} active={p === part} disabled={scheduled} onClick={() => goToPart(p)}>
                    {scheduled ? `${testName} (Part ${p + 1})` : `Part ${p + 1}`}
                  </SectionChip>
                );
              })
            : undefined
        }
      />

      {onTest ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* The rail is always drawn, as on the Following Directions paper:
              a browser that hides its scrollbar until the wheel moves would
              otherwise show no way down a paper whose wheel is off. */}
          <div className="relative min-h-0 flex-1">
          <div
            ref={column}
            className="wt-scroll-host h-full px-5 py-4 pr-[14px]"
            style={{ fontSize: `${16 * fontScale}px` }}
          >
            {inStudy ? (
              // The study screen, as the real portal shows it: the group
              // instructions bar, the picture in its box, and the study
              // timer in the toolbar above.
              <div className="-mx-5 -mt-4">
                <div className="border-b border-[#dcdcdc] bg-[#e9ecef] px-5 py-2 text-center text-[1.05em] text-[#333]">
                  Group Instructions: {testName} (Part {part + 1})
                </div>
                <div className="px-5 pt-3">
                  <p className="text-[0.85em] text-[#333]">
                    Study Screen Part {part + 1}/{" "}
                    <span lang="hi">अध्ययन स्क्रीन भाग -{part + 1}</span>
                  </p>
                  {features.studyImages[part] && (
                    <div className="mt-1 inline-block border border-[#555] bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={features.studyImages[part]}
                        alt={`Study screen for part ${part + 1}`}
                        className="h-auto max-w-full"
                        style={{ maxHeight: `${features.studyScale}vh` }}
                        draggable={false}
                      />
                    </div>
                  )}
                  <p className="mt-3 text-[0.8em] text-[#666]">
                    Memorise the picture; the test screen opens by itself in{" "}
                    <strong className="font-mono tabular-nums">{clock(phaseLeftSec)}</strong>.
                    <span className="ml-2" lang="hi">चित्र को याद करें; परीक्षण स्क्रीन स्वतः खुलेगी।</span>
                  </p>
                </div>
              </div>
            ) : inBreak ? (
              // Between parts: the break and a summary of the part just done.
              <div className="-mx-5 -mt-4">
                <div className="border-b border-[#dcdcdc] px-5 py-2 text-center text-[0.8em] font-semibold text-[#222]">
                  Break Time Left : {clock(phaseLeftSec)}
                </div>
                <h3 className="mt-3 text-center text-[1em] font-semibold text-[#222]">Exam Summary</h3>
                <div className="px-5 pt-3">
                  <p className="text-[0.8em] font-semibold text-[#222]">
                    {testName} (Part {part + 1}) : ( Attempted Group ; View not allowed; Edit not allowed )
                  </p>
                  <table className="mt-2 w-full border-collapse text-center text-[0.8em]">
                    <thead>
                      <tr className="bg-[#cfe2f3] text-[#222]">
                        <th className="border border-[#999] px-3 py-1.5 font-semibold">Section Name</th>
                        <th className="border border-[#999] px-3 py-1.5 font-semibold">No. of Questions</th>
                        <th className="border border-[#999] px-3 py-1.5 font-semibold">Answered</th>
                        <th className="border border-[#999] px-3 py-1.5 font-semibold">Not Answered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const group = parts[part] ?? [];
                        const done = group.filter((q) => state.answers[q.id] !== null && state.answers[q.id] !== undefined).length;
                        return (
                          <tr className="bg-white text-[#222]">
                            <td className="border border-[#999] px-3 py-1.5">{testName} (Part {part + 1})</td>
                            <td className="border border-[#999] px-3 py-1.5">{group.length}</td>
                            <td className="border border-[#999] px-3 py-1.5">{done}</td>
                            <td className="border border-[#999] px-3 py-1.5">{group.length - done}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                  <p className="mt-4 text-[0.8em] font-semibold text-[#222]">
                    {testName} (Part {part + 2}) : ( Yet to attempt )
                  </p>
                  {mockSummary && (
                    <div className="mt-4">
                      <ExamSummaryList tests={mockSummary} skipBattery={battery ?? undefined} />
                    </div>
                  )}
                  <p className="mt-2 text-[0.75em] text-[#666]">
                    The next part&apos;s study screen opens by itself when the break ends.
                    <span className="ml-2" lang="hi">अवकाश समाप्त होते ही अगले भाग की अध्ययन स्क्रीन स्वतः खुलेगी।</span>
                  </p>
                </div>
              </div>
            ) : brick ? (
              // Two halves, as the hall's screen: the pile at the left, the
              // questions at the right. Ten options at the hall's spacing run
              // past the right edge; the pane scrolls sideways under its own
              // rail, as the hall's panes do, so no option is ever dropped
              // down a line.
              <div className="flex min-h-full flex-col gap-4 lg:flex-row lg:gap-0">
                <div className="lg:w-1/2 lg:shrink-0 lg:border-r lg:border-[#dcdcdc] lg:pr-4">
                  {reminderLines}
                  {parts[part]?.[0]?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={parts[part][0].image} alt={`${paper.category === "brick" ? "Pile" : "Sheet"} ${part + 1}`} className="mt-3 w-auto max-w-full" style={{ height: Math.round(figureH * 1.6) }} draggable={false} />
                  )}
                </div>
                <div className="relative min-w-0 flex-1 pb-3">
                {/* Each row padded and ruled as the Following Directions list is, so the
                    questions sit as far apart as on every other paper. */}
                <ol ref={brickPane} className="wt-scroll-host w-full lg:pl-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif", overflowY: "hidden" }}>
                  {parts[part]?.map((q, i) => {
                    const number = part * perPart + i + 1;
                    const chosen = state.answers[q.id];
                    return (
                      <li key={q.id} className="flex items-center gap-x-5 border-b border-[#ececec] py-5 first:pt-1">
                        <span className="w-[56px] shrink-0 whitespace-nowrap text-[1em] text-[#222]">{number}. {q.prompt.en} -</span>
                        <span className="flex items-center gap-x-[52px] whitespace-nowrap">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <ScrollRail target={brickPane} axis="horizontal" />
                </div>
              </div>
            ) : (
            <>
            {scheduled && (
              <p className="text-[0.95em] font-semibold text-[#222]">
                Test Screen Part {part + 1} /{" "}
                <span lang="hi">परीक्षण स्क्रीन भाग {part + 1}</span>
              </p>
            )}
            {reminderLines}

            {twoSets && (
              <div
                className="mt-3 flex text-[1.05em] text-[#222]"
                style={{ width: setsWidth > 0 ? setsWidth : undefined, fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                <span className="w-1/2 text-center">Set A</span>
                <span className="w-1/2 text-center">Set B</span>
              </div>
            )}

            <ol className={`mt-3 ${textPaper ? "space-y-3" : "space-y-10"}`}>
              {parts[part]?.map((q, i) => {
                const number = part * perPart + i + 1;
                const chosen = state.answers[q.id];
                // A question with no picture at all (the Yes or No Test's
                // pair of numbers): the text stands where the picture would,
                // and the radios follow it on the same line, at the same
                // distance, as on every other paper.
                const textOnly = !q.image && !q.optionImages;
                return (
                  <li key={q.id} className={`border-b border-[#ececec] ${textOnly ? "pb-3" : sideBySide ? "pb-4" : "pb-8"}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {!sideBySide && <p className="text-[0.95em] font-bold text-[#222]">Question No : {number}</p>}
                    {!textOnly && (q.prompt.en || q.prompt.hi) && (
                      <div className="mt-2 text-[1em] text-[#494949]">
                        {q.prompt.en && <p>{q.prompt.en}</p>}
                        {q.prompt.hi && <p lang="hi">{q.prompt.hi}</p>}
                      </div>
                    )}

                    {/* Three layouts, as the real portal draws them. Every
                        picture is drawn small, at a fixed height, whatever
                        size was uploaded. */}
                    {textOnly ? (
                      // The text in a column of one width, so the radios of
                      // every question stand in the same place down the page.
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-[52px] gap-y-2">
                        <TextQuestion en={q.prompt.en} hi={q.prompt.hi} />
                        <span className="flex flex-wrap items-center gap-x-[52px]">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                    ) : q.optionImages && !q.image ? (
                      // Option pictures with no figure (Memory): a strip of
                      // the pictures, each with its letter in the corner,
                      // then the radios in a row after the strip.
                      <div className="mt-2 flex flex-wrap items-center gap-x-[52px] gap-y-2">
                        <span className="flex flex-wrap gap-1.5">
                          {q.optionImages.map((picture, oi) => (
                            <span key={oi} className="relative inline-block border border-[#333] bg-white p-0.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={picture} alt={`Option ${String(q.options[oi])}`} className="w-auto" style={{ height: stripH }} draggable={false} />
                              <span className="absolute bottom-0 right-0.5 text-[9px] leading-none text-[#333]">
                                {String(q.options[oi])}
                              </span>
                            </span>
                          ))}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-[52px]">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                    ) : q.image && !q.optionImages ? (
                      // A figure with plain options (Depth Perception, Power
                      // of Observation): the picture and the radios on one line.
                      <div className="mt-2 flex flex-wrap items-center gap-x-[52px] gap-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.image}
                          alt={`Question ${number}`}
                          className="w-auto max-w-full"
                          style={{ height: figureH }}
                          draggable={false}
                          onLoad={twoSets && i === 0 ? (e) => setSetsWidth(e.currentTarget.clientWidth) : undefined}
                        />
                        <span className="flex flex-wrap items-center gap-x-[52px]">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                    ) : (
                      // A figure with option pictures (Perceptual Speed): the
                      // figure above, then "A [picture]" per option.
                      sideBySide ? (
                      <div className="flex flex-wrap items-center gap-x-[40px] gap-y-2">
                        <span className="w-[28px] shrink-0 text-[0.95em] text-[#222]">{number}.</span>
                        {q.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.image} alt={`Question ${number}`} className="w-auto max-w-full" style={{ height: figureH }} draggable={false} />
                        )}
                        <span className="flex items-end gap-x-3">
                          {q.options.map((option, oi) => {
                            const picture = q.optionImages?.[oi];
                            return (
                              <span key={oi} className="flex flex-col items-center gap-0.5">
                                {picture && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={picture} alt={`Option ${String(option)}`} className="w-auto" style={{ height: optionH }} draggable={false} />
                                )}
                                <span className="text-[0.8em] leading-none text-[#333]">{String(option)}</span>
                              </span>
                            );
                          })}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-[52px]">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                      ) : (
                      <>
                        {q.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.image} alt={`Question ${number}`} className="mt-2 w-auto max-w-full" style={{ height: figureH }} draggable={false} />
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-[52px] gap-y-2">
                          {q.options.map((option, oi) => {
                            const id = `${q.id}-opt-${oi}`;
                            const picture = q.optionImages?.[oi];
                            return (
                              <span key={id} className="flex items-center gap-1.5">
                                <Choice id={id} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                                {picture && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={picture} alt={`Option ${String(option)}`} className="w-auto" style={{ height: optionH }} draggable={false} />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </>
                      )
                    )}
                  </li>
                );
              })}
            </ol>
            </>
            )}
          </div>
          <ScrollRail target={column} axis="vertical" />
          </div>
        </div>
      ) : (
        <Instructions paper={paper} />
      )}

      <div className="flex items-center gap-4 border-t border-[#c9dcea] bg-[#e8f4fb] px-4 py-3">
        {!onTest && (
          <span className="text-[13px] text-gray-600">
            The test opens by itself when the instruction time runs out.
            <span className="ml-2 text-gray-500" lang="hi">
              निर्देश का समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा।
            </span>
          </span>
        )}

        {onTest ? (
          <div className="ml-auto flex items-center gap-3">
            {/* The answers are already saved as they are chosen; this button
                is the way to the next part, as in the real test. */}
            {scheduled ? (
              // The real Memory Test screen has a Save button; the answers
              // are already kept as they are chosen, so this sends them up
              // at once and otherwise changes nothing.
              <button
                type="button"
                data-allow-mouse="true"
                onClick={() => sendRef.current(false)}
                className="rounded bg-[#2a7fc0] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab]"
              >
                Save
              </button>
            ) : (
            <button
              type="button"
              data-allow-mouse="true"
              disabled={lastPart}
              onClick={() => goToPart(part + 1)}
              className="rounded bg-[#2a7fc0] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab] disabled:opacity-40"
            >
              Save &amp; Next
            </button>
            )}
            <button
              type="button"
              data-allow-mouse="true"
              onClick={() => setConfirmSubmit(true)}
              className="rounded bg-[#6fb6e6] px-8 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5ea8dc]"
            >
              Submit
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-allow-mouse="true"
            onClick={() => setConfirmSkip(true)}
            className="ml-auto rounded bg-[#2a7fc0] px-8 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab]"
          >
            Skip Instruction
          </button>
        )}
      </div>

      <InstructionsDialog
        paper={paper}
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />

      <ConfirmBox
        open={state.paused && !state.submitted}
        title="Test paused"
        body="The clock is stopped. Resume when you are ready."
        confirmLabel="Resume"
        cancelLabel="Stay paused"
        onConfirm={() => dispatch({ type: "pause", paused: false, now: Date.now() })}
        onCancel={() => undefined}
      />

      <ConfirmBox
        open={confirmSkip}
        title="Start the test now?"
        body={`The instruction screen closes and the test's own ${shownTimeLimitMin(paper)} minute clock starts. You cannot come back to the instructions.`}
        confirmLabel="Start test"
        cancelLabel="Keep reading"
        onConfirm={() => {
          setConfirmSkip(false);
          dispatch({ type: "begin-test" });
        }}
        onCancel={() => setConfirmSkip(false)}
      />

      <ConfirmBox
        open={confirmSubmit}
        title="Are you sure you want to submit the test?"
        body={`क्या आप वाकई परीक्षण जमा करना चाहते हैं?${
          unanswered > 0 ? ` (${unanswered} question${unanswered === 1 ? "" : "s"} still unanswered.)` : ""
        }`}
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          setConfirmSubmit(false);
          clearSaved();
          finish();
        }}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}

/**
 * A question that is text: a pair of numbers ("48426 = 38436"), or
 * lettered groups of digits ("A 7238   B 9873   C 1294   D 3958"), each
 * group in a column of one width. Either way the block is one width, so
 * the radios after it stand in the same place on every question.
 */
function TextQuestion({ en, hi }: { en: string; hi: string }) {
  const groups = splitGroups(en);
  const serif = { fontFamily: "'Times New Roman', Times, serif" };
  if (groups) {
    return (
      <span className="inline-flex text-[1.25em] tabular-nums text-[#222]" style={serif}>
        {groups.map((g) => (
          <span key={g.letter} className="inline-block w-[190px]">
            <b className="mr-2 font-bold">{g.letter}</b>
            {g.digits}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="inline-block min-w-[300px] text-[1.25em] tabular-nums text-[#222]" style={serif}>
      {en}
      {hi && <span className="ml-3 text-[#494949]" lang="hi">{hi}</span>}
    </span>
  );
}

/** One option's radio and its label, as "○ A". */
function Choice({
  id,
  name,
  option,
  checked,
  disabled,
  onPick,
}: {
  id: string;
  name: string;
  option: string | number;
  checked: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-1.5">
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        data-allow-mouse="true"
        onChange={onPick}
        className="h-[14px] w-[14px] cursor-pointer"
      />
      <span className="text-[1em] text-[#494949]">{String(option)}</span>
    </label>
  );
}

/** m:ss */
function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The test is on screen and the clock is running. */
function onTestPhase(state: { phase: string; submitted: boolean; startedAt: number }): boolean {
  return state.phase === "test" && !state.submitted && state.startedAt !== 0;
}

/** The header button, drawn inline in the reminder line above the questions. */
function GroupInstructionsLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-allow-mouse="true"
      onClick={onClick}
      className="mx-0.5 inline-flex items-center gap-1 rounded-sm bg-[#333333] px-1.5 py-0.5 align-middle text-[11px] font-bold text-white hover:bg-[#222]"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <span className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-[#2a8fd6] text-[9px] italic" aria-hidden="true">i</span>
      Group Instructions
    </button>
  );
}
