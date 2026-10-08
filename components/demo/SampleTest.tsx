"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CONTACT } from "@/lib/contact";

/**
 * A two-minute taste of the psycho test, with no login: a short Memory
 * Test and a short Perceptual Speed Test, scored in the browser. It is
 * not a paper from the bank (nothing here is the institute's content);
 * it is the screen, the clock and the feel, and at the end the way in.
 */
type Which = "memory" | "speed";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

/* ------------------------------ Memory ------------------------------ */

const PICTURES = ["🚂", "🔑", "🍎", "⚽", "🎸", "🪜", "🧭", "📘", "🕰️", "🪣", "🔔", "🧲", "🌂", "🪁", "🔦", "🧩", "🎈", "🪑", "🚲", "📷", "🧃", "🪙", "🔭", "🧸"];
const STUDY_SECONDS = 30;
const MEMORY_SECONDS = 60;

interface MemoryQuestion {
  prompt: string;
  options: string[];
  answer: number;
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeMemory(): { shown: string[]; questions: MemoryQuestion[] } {
  const pool = shuffle(PICTURES);
  const shown = pool.slice(0, 9);
  const absent = pool.slice(9, 24);
  const questions: MemoryQuestion[] = [];
  const asked = shuffle(shown).slice(0, 4);
  for (const pic of asked) {
    const options = shuffle([pic, ...shuffle(absent).slice(0, 3)]);
    questions.push({ prompt: "Which of these was in the picture?", options, answer: options.indexOf(pic) });
  }
  // Two the other way round: which was NOT there.
  for (let i = 0; i < 2; i++) {
    const notThere = absent[i + 3];
    const options = shuffle([notThere, ...shuffle(shown).slice(0, 3)]);
    questions.push({ prompt: "Which of these was NOT in the picture?", options, answer: options.indexOf(notThere) });
  }
  return { shown, questions: shuffle(questions) };
}

/* ------------------------------ Speed ------------------------------ */

const SPEED_SECONDS = 60;
const SPEED_COUNT = 10;

/** A figure: a shape in a box with a dot and a cross at two of the four corners, maybe mirrored. */
interface Figure {
  shape: "star" | "pentagon" | "triangle" | "hexagon" | "diamond";
  dot: number;
  cross: number;
  flip: boolean;
}

function randomFigure(): Figure {
  const shapes: Figure["shape"][] = ["star", "pentagon", "triangle", "hexagon", "diamond"];
  const dot = Math.floor(Math.random() * 4);
  let cross = Math.floor(Math.random() * 4);
  if (cross === dot) cross = (cross + 1) % 4;
  return { shape: shapes[Math.floor(Math.random() * shapes.length)], dot, cross, flip: Math.random() < 0.5 };
}

function same(a: Figure, b: Figure): boolean {
  return a.shape === b.shape && a.dot === b.dot && a.cross === b.cross && a.flip === b.flip;
}

/** A figure that differs from the given one in exactly one way. */
function variant(f: Figure, used: Figure[]): Figure {
  for (let tries = 0; tries < 50; tries++) {
    const g: Figure = { ...f };
    const r = Math.floor(Math.random() * 4);
    if (r === 0) g.flip = !g.flip;
    else if (r === 1) {
      g.dot = (g.dot + 1 + Math.floor(Math.random() * 3)) % 4;
      if (g.dot === g.cross) g.dot = (g.dot + 1) % 4;
    } else if (r === 2) {
      g.cross = (g.cross + 1 + Math.floor(Math.random() * 3)) % 4;
      if (g.cross === g.dot) g.cross = (g.cross + 1) % 4;
    } else {
      const shapes: Figure["shape"][] = ["star", "pentagon", "triangle", "hexagon", "diamond"];
      g.shape = shapes[(shapes.indexOf(g.shape) + 1 + Math.floor(Math.random() * 4)) % shapes.length];
    }
    if (!same(g, f) && !used.some((u) => same(u, g))) return g;
  }
  return { ...f, flip: !f.flip };
}

interface SpeedQuestion {
  given: Figure;
  options: Figure[];
  answer: number;
}

function makeSpeed(): SpeedQuestion[] {
  const out: SpeedQuestion[] = [];
  for (let i = 0; i < SPEED_COUNT; i++) {
    const given = randomFigure();
    const wrong: Figure[] = [];
    while (wrong.length < 4) wrong.push(variant(given, [given, ...wrong]));
    const answer = Math.floor(Math.random() * 5);
    const options = [...wrong];
    options.splice(answer, 0, given);
    out.push({ given, options, answer });
  }
  return out;
}

const CORNERS = [
  [14, 14],
  [66, 14],
  [66, 66],
  [14, 66],
];

function FigureSvg({ f, size = 72 }: { f: Figure; size?: number }) {
  const path =
    f.shape === "star"
      ? "M40 16 L46 32 L63 32 L49 42 L54 59 L40 49 L26 59 L31 42 L17 32 L34 32 Z"
      : f.shape === "pentagon"
        ? "M40 15 L62 31 L54 57 L26 57 L18 31 Z"
        : f.shape === "triangle"
          ? "M40 16 L62 58 L18 58 Z"
          : f.shape === "hexagon"
            ? "M28 18 L52 18 L64 40 L52 62 L28 62 L16 40 Z"
            : "M40 14 L62 40 L40 66 L18 40 Z";
  const [dx, dy] = CORNERS[f.dot];
  const [cx, cy] = CORNERS[f.cross];
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" className="rounded border border-gray-800 bg-white">
      <g transform={f.flip ? "translate(80 0) scale(-1 1)" : undefined}>
        <path d={path} fill="none" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={dx} cy={dy} r="3.5" fill="#111" />
        <path d={`M${cx - 4} ${cy - 4} L${cx + 4} ${cy + 4} M${cx - 4} ${cy + 4} L${cx + 4} ${cy - 4}`} stroke="#111" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

/* ------------------------------ The screen ------------------------------ */

type Phase = "choose" | "instructions" | "study" | "test" | "result";

export function SampleTest({ initial = null }: { initial?: Which | null }) {
  const [which, setWhich] = useState<Which | null>(initial);
  const [phase, setPhase] = useState<Phase>(initial ? "instructions" : "choose");
  const [memory, setMemory] = useState<ReturnType<typeof makeMemory> | null>(null);
  const [speed, setSpeed] = useState<SpeedQuestion[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [usedSec, setUsedSec] = useState(0);

  const total = which === "memory" ? (memory?.questions.length ?? 0) : (speed?.length ?? 0);

  function choose(w: Which) {
    setWhich(w);
    setPhase("instructions");
  }

  function begin() {
    if (which === "memory") {
      const m = makeMemory();
      setMemory(m);
      setAnswers(Array(m.questions.length).fill(null));
      setLeft(STUDY_SECONDS);
      setPhase("study");
    } else {
      const s = makeSpeed();
      setSpeed(s);
      setAnswers(Array(s.length).fill(null));
      setLeft(SPEED_SECONDS);
      setStartedAt(Date.now());
      setPhase("test");
    }
    setIndex(0);
  }

  function finish() {
    setUsedSec(Math.round((Date.now() - startedAt) / 1000));
    setPhase("result");
  }

  // The clocks.
  useEffect(() => {
    if (phase !== "study" && phase !== "test") return;
    if (left <= 0) {
      if (phase === "study") {
        setLeft(MEMORY_SECONDS);
        setStartedAt(Date.now());
        setPhase("test");
      } else finish();
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  // Keys A to E answer, as on the portal.
  useEffect(() => {
    if (phase !== "test") return;
    const onKey = (e: KeyboardEvent) => {
      const i = LETTERS.indexOf(e.key.toUpperCase() as (typeof LETTERS)[number]);
      const n = which === "memory" ? 4 : 5;
      if (i >= 0 && i < n) mark(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, which]);

  function mark(i: number) {
    setAnswers((a) => {
      const b = [...a];
      b[index] = i;
      return b;
    });
    if (index + 1 < total) setIndex(index + 1);
    else finish();
  }

  const correct = useMemo(() => {
    if (which === "memory" && memory) return answers.filter((a, i) => a === memory.questions[i].answer).length;
    if (which === "speed" && speed) return answers.filter((a, i) => a === speed[i].answer).length;
    return 0;
  }, [answers, which, memory, speed]);

  const title = which === "memory" ? "Test 1 - Memory Test / स्मृति परीक्षण" : "Test 5 - Perceptual Speed Test / प्रत्यक्ष गति परीक्षण";
  const clockLabel = phase === "study" ? "Study Time Left" : "Time Left";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-lg">
      {/* Hall-style top */}
      <div className="flex items-center justify-between bg-[#333] px-4 py-2 text-[13px] font-bold text-[#f5c342]">
        <span>RRB ALP Aptitude Test · Sample</span>
        <span className="text-white/80">Kautilya Classes · as per RDSO pattern</span>
      </div>
      {which && phase !== "choose" && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#dcdcdc] bg-[#eeeeee] px-4 py-2 text-[12px]">
          <span className="rounded bg-[#1d4ed8] px-3 py-1 font-bold text-white">{title}</span>
          {(phase === "study" || phase === "test") && (
            <span className={`ml-auto text-[13px] font-bold ${left <= 10 ? "text-red-700" : "text-[#222]"}`} role="timer">
              {clockLabel} : <span className="font-mono tabular-nums">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
            </span>
          )}
          {phase === "test" && <span className="text-gray-600">Question {index + 1} of {total}</span>}
        </div>
      )}

      <div className="px-5 py-6 sm:px-8">
        {phase === "choose" && (
          <div>
            <h2 className="text-[20px] font-extrabold text-gray-900">Pick a sample test</h2>
            <p className="mt-1 text-[14px] text-gray-600">Two minutes, no login, scored at once. <span lang="hi">दो मिनट, बिना लॉगिन।</span></p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => choose("memory")} className="rounded-xl border-2 border-gray-200 p-5 text-left hover:border-[#0d2a6b] hover:bg-[#eef2fb]">
                <div className="text-[28px]">🧠</div>
                <div className="mt-1 text-[17px] font-bold text-gray-900">Memory Test</div>
                <div className="text-[13px] text-gray-500" lang="hi">स्मृति परीक्षण</div>
                <p className="mt-2 text-[13px] text-gray-700">Study 9 pictures for 30 seconds, then answer 6 questions in 60 seconds.</p>
              </button>
              <button type="button" onClick={() => choose("speed")} className="rounded-xl border-2 border-gray-200 p-5 text-left hover:border-[#0d2a6b] hover:bg-[#eef2fb]">
                <div className="text-[28px]">🔍</div>
                <div className="mt-1 text-[17px] font-bold text-gray-900">Perceptual Speed Test</div>
                <div className="text-[13px] text-gray-500" lang="hi">प्रत्यक्ष गति परीक्षण</div>
                <p className="mt-2 text-[13px] text-gray-700">Find the identical figure among five, 10 questions in 60 seconds.</p>
              </button>
            </div>
          </div>
        )}

        {phase === "instructions" && which === "memory" && (
          <Instructions
            en={["A picture of 9 objects will be shown for 30 seconds. Look at it carefully; nothing can be written.", "Then the picture is hidden and 6 questions ask which objects were in it, or which were not. 60 seconds for the 6 questions.", "Press the option (A to D) or the key on the keyboard. There is no negative marking."]}
            hi={["9 वस्तुओं का चित्र 30 सेकंड के लिए दिखाया जाएगा। ध्यान से देखें।", "फिर चित्र छिप जाएगा और 6 सवाल पूछे जाएँगे कि कौन सी वस्तुएँ थीं, या नहीं थीं। 6 सवालों के लिए 60 सेकंड।", "विकल्प (A से D) दबाएँ। गलत उत्तर पर अंक नहीं कटते।"]}
            onStart={begin}
          />
        )}
        {phase === "instructions" && which === "speed" && (
          <Instructions
            en={["In each question a figure is given, below which there are five figures. Find the one identical to the figure given above: same shape, same marks, not mirrored.", "10 questions in 60 seconds. Press the option (A to E) or the key on the keyboard.", "There is no negative marking. Attempt every question."]}
            hi={["हर सवाल में एक आकृति दी गई है, नीचे पाँच आकृतियाँ। ऊपर वाली के बिल्कुल समान आकृति चुनें: वही आकार, वही निशान, उल्टी नहीं।", "60 सेकंड में 10 सवाल। विकल्प (A से E) दबाएँ।", "गलत उत्तर पर अंक नहीं कटते। हर सवाल का उत्तर दें।"]}
            onStart={begin}
          />
        )}

        {phase === "study" && memory && (
          <div className="text-center">
            <p className="text-[14px] font-semibold text-gray-700">Study the picture. <span lang="hi">चित्र को ध्यान से देखें।</span></p>
            <div className="mx-auto mt-4 grid w-fit grid-cols-3 gap-3 rounded-xl border-2 border-gray-800 bg-white p-4">
              {memory.shown.map((p, i) => (
                <div key={i} className="flex h-20 w-20 items-center justify-center rounded border border-gray-300 bg-gray-50 text-[44px]">{p}</div>
              ))}
            </div>
          </div>
        )}

        {phase === "test" && which === "memory" && memory && (
          <div>
            <p className="text-[15px] font-bold text-gray-900">Question No : {index + 1}</p>
            <p className="mt-1 text-[15px] text-gray-800">{memory.questions[index].prompt}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {memory.questions[index].options.map((o, i) => (
                <button key={i} type="button" onClick={() => mark(i)} className="flex items-center gap-3 rounded-lg border-2 border-gray-300 bg-white p-3 text-left hover:border-[#1d4ed8] hover:bg-blue-50">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[13px] font-bold text-gray-700">{LETTERS[i]}</span>
                  <span className="text-[36px]">{o}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "test" && which === "speed" && speed && (
          <div>
            <p className="text-[15px] font-bold text-gray-900">Question No : {index + 1}</p>
            <div className="mt-3">
              <FigureSvg f={speed[index].given} size={88} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {speed[index].options.map((o, i) => (
                <button key={i} type="button" onClick={() => mark(i)} className="flex flex-col items-center gap-1 rounded-lg border-2 border-gray-300 bg-white p-2 hover:border-[#1d4ed8] hover:bg-blue-50">
                  <FigureSvg f={o} />
                  <span className="text-[13px] font-bold text-gray-700">{LETTERS[i]}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-gray-500">Keys A to E answer too.</p>
          </div>
        )}

        {phase === "result" && (
          <div>
            <div className="rounded-xl bg-gradient-to-r from-[#0d2a6b] to-[#1d4ed8] px-6 py-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Sample result</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="text-[40px] font-extrabold">{correct} <span className="text-[20px] font-semibold text-white/80">of {total} correct</span></span>
                <span className="text-[15px] text-white/85">in {usedSec} seconds</span>
              </div>
              <p className="mt-1 text-[14px] text-white/90">
                {correct === total ? "Perfect. Now try it at full length, against the real clock." : correct >= Math.ceil(total * 0.7) ? "Good. The full paper is longer and faster; that is where the T-Score is won." : "This is where most students start. Daily practice on the real screen moves this quickly."}
              </p>
            </div>
            <p className="mt-4 text-[13px] text-gray-600">
              This sample is not scored as a T-Score: a T-Score compares you with everyone who sat the same paper. The portal&apos;s full papers and Full Mocks do that, with all five tests.
              <span className="block" lang="hi">यह सैंपल T-Score नहीं देता। पोर्टल के पूरे पेपर और फुल मॉक T-Score देते हैं।</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={CONTACT.whatsapp} className="rounded-md bg-[#0d2a6b] px-5 py-3 text-[14px] font-bold text-white hover:bg-[#0a2158]">Join · message our team on WhatsApp</a>
              <Link href="/packages" className="rounded-md border border-[#0d2a6b] px-5 py-3 text-[14px] font-bold text-[#0d2a6b] hover:bg-[#eef2fb]">See packages</Link>
              <Link href="/login" className="rounded-md border border-gray-300 px-5 py-3 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">Student Login</Link>
              <button type="button" onClick={() => { setPhase("choose"); setWhich(null); }} className="rounded-md border border-gray-300 px-5 py-3 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">Try the other test</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Instructions({ en, hi, onStart }: { en: string[]; hi: string[]; onStart: () => void }) {
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Instructions:-</h3>
          {en.map((p) => <p key={p} className="mt-2 text-[14px] leading-relaxed text-gray-800">{p}</p>)}
        </div>
        <div lang="hi">
          <h3 className="text-[16px] font-bold text-gray-900">निर्देश:-</h3>
          {hi.map((p) => <p key={p} className="mt-2 text-[14px] leading-relaxed text-gray-800">{p}</p>)}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <span className="text-[12px] text-gray-500">The clock starts when you press Start.</span>
        <button type="button" onClick={onStart} className="rounded bg-[#34226e] px-6 py-2.5 text-[14px] font-bold text-white hover:bg-[#2a1b58]">Start ▶</button>
      </div>
    </div>
  );
}
