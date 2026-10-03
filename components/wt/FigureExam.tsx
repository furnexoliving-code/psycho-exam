"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveFeatures, type WatchPaper } from "@/lib/wt/types";
import { useAttempt } from "@/lib/wt/state";
import { useScrollLock } from "@/lib/wt/useKeyboardOnly";
import { phaseAt, scheduleOf } from "@/lib/wt/schedule";
import { PortalBanner } from "./PortalBanner";
import { PortalToolbar } from "./PortalToolbar";
import { TestTabs } from "./TestTabs";
import { Instructions, InstructionsDialog } from "./Instructions";
import { ConfirmBox } from "./ConfirmBox";
import { ScrollRail } from "./ScrollRail";

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
  const router = useRouter();
  const { state, dispatch, answered, clearSaved } = useAttempt(
    paper,
    elapsedSec,
    questionElapsedSec,
    storageOwner,
  );
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const column = useRef<HTMLDivElement | null>(null);

  const onTest = state.phase === "test";
  const features = resolveFeatures(paper.features);
  const fontScale = paper.fontScale ?? 1;

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
      router.replace(`/watch-table/${paper.id}/result`);
    }
  }, [state.submitted, state.startedAt, router, paper.id]);

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
      <PortalToolbar
        title={paper.displayName}
        label={
          !onTest
            ? "Instruction Time Left"
            : inStudy
              ? "Instruction Timer"
              : inBreak
                ? "Break Time Left"
                : "Time Left"
        }
        secondsLeft={
          !onTest ? state.instructionRemainingSec : inStudy || inBreak ? phaseLeftSec : state.remainingSec
        }
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
      />
      <TestTabs
        activeId={state.phase}
        tabs={[
          { id: "instructions", label: `${paper.title} Instructions` },
          { id: "test", label: paper.title },
        ]}
      />

      {onTest ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* The parts, as the real portal's Sections strip. */}
          <div className="border-b border-[#dcdcdc] bg-white px-4 py-2">
            <div className="text-[12px] font-semibold text-gray-700">Sections</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {parts.map((group, p) => {
                const done = group.filter((q) => state.answers[q.id] !== null && state.answers[q.id] !== undefined).length;
                const active = p === part;
                return (
                  <button
                    key={p}
                    type="button"
                    data-allow-mouse="true"
                    disabled={scheduled}
                    onClick={() => goToPart(p)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded px-3 py-1 text-[12px] font-semibold ${
                      active ? "bg-wt-pill text-white" : "border border-wt-pill/40 bg-white text-wt-tealDark hover:bg-wt-bar"
                    } disabled:cursor-default disabled:hover:bg-white ${active ? "disabled:hover:bg-wt-pill" : ""}`}
                  >
                    Part {p + 1}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-wt-bar"}`}
                      aria-label={`${done} of ${group.length} answered`}
                    >
                      {done}/{group.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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
                  Group Instructions: {paper.title} (Part {part + 1})
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
                        className="h-auto max-h-[60vh] max-w-full"
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
                    {paper.title} (Part {part + 1}) : ( Attempted Group ; View not allowed; Edit not allowed )
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
                            <td className="border border-[#999] px-3 py-1.5">{paper.title} (Part {part + 1})</td>
                            <td className="border border-[#999] px-3 py-1.5">{group.length}</td>
                            <td className="border border-[#999] px-3 py-1.5">{done}</td>
                            <td className="border border-[#999] px-3 py-1.5">{group.length - done}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                  <p className="mt-4 text-[0.8em] font-semibold text-[#222]">
                    {paper.title} (Part {part + 2}) : ( Yet to attempt )
                  </p>
                  <p className="mt-2 text-[0.75em] text-[#666]">
                    The next part&apos;s study screen opens by itself when the break ends.
                    <span className="ml-2" lang="hi">अवकाश समाप्त होते ही अगले भाग की अध्ययन स्क्रीन स्वतः खुलेगी।</span>
                  </p>
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
            <p className="text-[0.9em] text-[#494949]">
              Please Select Correct Answer /{" "}
              <span lang="hi">कृपया सही उत्तर चुनें</span>
            </p>

            <ol className="mt-3 space-y-6">
              {parts[part]?.map((q, i) => {
                const number = part * perPart + i + 1;
                const chosen = state.answers[q.id];
                return (
                  <li key={q.id} className="border-b border-[#ececec] pb-5">
                    <p className="text-[0.95em] font-bold text-[#222]">Question No : {number}</p>
                    {(q.prompt.en || q.prompt.hi) && (
                      <div className="mt-2 text-[1em] text-[#494949]">
                        {q.prompt.en && <p>{q.prompt.en}</p>}
                        {q.prompt.hi && <p lang="hi">{q.prompt.hi}</p>}
                      </div>
                    )}

                    {/* Three layouts, as the real portal draws them. Every
                        picture is drawn small, at a fixed height, whatever
                        size was uploaded. */}
                    {q.optionImages && !q.image ? (
                      // Option pictures with no figure (Memory): a strip of
                      // the pictures, each with its letter in the corner,
                      // then the radios in a row after the strip.
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="flex flex-wrap gap-1.5">
                          {q.optionImages.map((picture, oi) => (
                            <span key={oi} className="relative inline-block border border-[#333] bg-white p-0.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={picture} alt={`Option ${String(q.options[oi])}`} className="h-[52px] w-auto" draggable={false} />
                              <span className="absolute bottom-0 right-0.5 text-[9px] leading-none text-[#333]">
                                {String(q.options[oi])}
                              </span>
                            </span>
                          ))}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-5">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                    ) : q.image && !q.optionImages ? (
                      // A figure with plain options (Depth Perception, Power
                      // of Observation): the picture and the radios on one line.
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={q.image} alt={`Question ${number}`} className="h-[72px] w-auto max-w-full" draggable={false} />
                        <span className="flex flex-wrap items-center gap-x-5">
                          {q.options.map((option, oi) => (
                            <Choice key={oi} id={`${q.id}-opt-${oi}`} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                          ))}
                        </span>
                      </div>
                    ) : (
                      // A figure with option pictures (Perceptual Speed): the
                      // figure above, then "A [picture]" per option.
                      <>
                        {q.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.image} alt={`Question ${number}`} className="mt-2 h-[72px] w-auto max-w-full" draggable={false} />
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                          {q.options.map((option, oi) => {
                            const id = `${q.id}-opt-${oi}`;
                            const picture = q.optionImages?.[oi];
                            return (
                              <span key={id} className="flex items-center gap-1.5">
                                <Choice id={id} name={q.id} option={option} checked={chosen === option} disabled={state.submitted} onPick={() => dispatch({ type: "answer", questionId: q.id, value: option })} />
                                {picture && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={picture} alt={`Option ${String(option)}`} className="h-[64px] w-auto" draggable={false} />
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </>
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

      <div className="flex items-center gap-4 border-t border-[#d3d3d3] bg-wt-bar px-4 py-3">
        <span className="text-[13px] text-gray-600">
          {onTest ? (
            <>
              Answered <strong className="text-gray-900">{answered}</strong> of{" "}
              {paper.questions.length}
              <span className="ml-3 text-gray-500">
                Part {part + 1} of {partCount}
                {scheduled && !inStudy && !inBreak && part < partCount - 1 && (
                  <> · this part closes in {clock(phaseLeftSec)}</>
                )}
              </span>
            </>
          ) : (
            <>
              The test opens by itself when the instruction time runs out.
              <span className="ml-2 text-gray-500" lang="hi">
                निर्देश का समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा।
              </span>
            </>
          )}
        </span>

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
                className="rounded border border-wt-pill bg-white px-6 py-2.5 text-[14px] font-semibold text-wt-tealDark hover:bg-wt-bar"
              >
                Save
              </button>
            ) : (
            <button
              type="button"
              data-allow-mouse="true"
              disabled={lastPart}
              onClick={() => goToPart(part + 1)}
              className="rounded border border-wt-pill bg-white px-6 py-2.5 text-[14px] font-semibold text-wt-tealDark hover:bg-wt-bar disabled:opacity-40"
            >
              Save &amp; Next
            </button>
            )}
            <button
              type="button"
              data-allow-mouse="true"
              onClick={() => setConfirmSubmit(true)}
              className="rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
            >
              Submit
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-allow-mouse="true"
            onClick={() => setConfirmSkip(true)}
            className="ml-auto rounded bg-wt-submit px-8 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
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
        body={`The instruction screen closes and the test's own ${paper.timeLimitMin} minute clock starts. You cannot come back to the instructions.`}
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
        title="Submit the test?"
        body={
          unanswered > 0
            ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} still unanswered. You cannot return after submitting.`
            : "All questions are answered. You cannot return after submitting."
        }
        confirmLabel="Submit"
        cancelLabel="Go back"
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
