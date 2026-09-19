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
