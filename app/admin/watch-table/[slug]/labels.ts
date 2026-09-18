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
