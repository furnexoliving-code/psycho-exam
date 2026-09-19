import type { WatchFeatures } from "@/lib/wt/types";

/** The switches shown in the admin panel, with what each one actually does. */
export const FEATURE_LABELS: {
  name: keyof WatchFeatures;
  label: string;
  hint: string;
}[] = [
  {
    name: "showInstructionsButton",
    label: "Instructions button",
    hint: "Reopens the instructions during the test.",
  },
  {
    name: "showQuestionPaperButton",
    label: "Question Paper button",
    hint: "Shows the whole paper on one page, read only.",
  },
  {
    name: "allowPause",
    label: "Pause button",
    hint: "Lets the candidate stop the clock.",
  },
  {
    name: "allowFullscreen",
    label: "Switch Fullscreen button",
    hint: "Lets the candidate fill the screen.",
  },
  {
    name: "lockScroll",
    label: "Turn the mouse wheel off",
    hint: "The scrollbar still drags and the keys still move.",
  },
  {
    name: "overflowQuestions",
    label: "Run questions past the right edge",
    hint: "Matches the real portal, where part of each line is hidden until you scroll sideways.",
  },
];

/**
 * The text sizes offered, as multipliers.
 *
 * Named steps rather than a free number box: an admin picking "Large" cannot
 * accidentally type 12 and make a paper unreadable for a whole batch.
 */
export const FONT_STEPS = [
  { value: "0.85", label: "Small (85%)" },
  { value: "1", label: "Normal (100%) — default" },
  { value: "1.15", label: "Large (115%)" },
  { value: "1.3", label: "Extra large (130%)" },
  { value: "1.5", label: "Huge (150%)" },
];

/** How wide an uploaded diagram may be drawn, as a share of its column. */
export const IMAGE_WIDTHS = [
  { value: "100", label: "Full width (100%) — default" },
  { value: "85", label: "Slightly smaller (85%)" },
  { value: "70", label: "Medium (70%)" },
  { value: "55", label: "Small (55%)" },
  { value: "40", label: "Very small (40%)" },
];

/** What the candidate's result may show, and what each switch means. */
export const RESULT_VIEW_LABELS: { name: string; label: string; hint: string }[] = [
  { name: "tScore", label: "T-Score", hint: "The main figure." },
  { name: "tScoreFormula", label: "…with the working", hint: "T = 50 + 10 × (marks − mean) ÷ sd" },
  { name: "tScoreStats", label: "…with mean and SD", hint: "Your marks · Mean · Standard deviation · Papers compared" },
  { name: "cutOff", label: "Qualified / Not qualified", hint: "The cut off verdict." },
  { name: "cutOffMarks", label: "…naming the marks needed", hint: 'Adds "2 of 14 marks needed" to the verdict.' },
  { name: "rank", label: "Rank", hint: "Position in the cohort." },
  { name: "percentile", label: "Percentile", hint: "How many scored below." },
  { name: "accuracy", label: "Accuracy", hint: "Correct as a share of attempted." },
  { name: "expertComment", label: "Expert's comment", hint: "The note you wrote above." },
  { name: "topicBreakdown", label: "Where the marks went", hint: "Accuracy per topic." },
  { name: "timeAnalysis", label: "Time", hint: "Taken, allowed, per question." },
  { name: "attemptHistory", label: "Your attempts", hint: "The trend across attempts." },
  { name: "review", label: "Question review", hint: "Every question with the diagram beside it." },
  { name: "correctAnswers", label: "…showing the correct answer", hint: "Off keeps the key out of the result entirely." },
];
