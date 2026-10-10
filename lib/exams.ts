/**
 * The exams the portal serves, or will. One is live today; the others are
 * the series to come, named so the panel, the packages and the blog can
 * already file things under them. Adding an exam is a line here, then its
 * kinds of test in the categories and sections.
 */
export interface Exam {
  id: string;
  name: string;
  short: string;
  status: "live" | "planned";
  /** One line on what the exam's psycho test is. */
  note: string;
}

export const EXAMS: readonly Exam[] = [
  { id: "alp", name: "RRB ALP", short: "ALP", status: "live", note: "CBAT · 5 tests · 19 kinds of question" },
  { id: "asm", name: "RRB ASM / Station Master", short: "ASM", status: "planned", note: "Psycho test series · coming" },
  { id: "train-operator", name: "Train Operator", short: "Train Op.", status: "planned", note: "Psycho test series · coming" },
];

/** The exam everything belongs to until another goes live. */
export const LIVE_EXAM = "alp";

export function examOf(id: string | null | undefined): Exam {
  return EXAMS.find((e) => e.id === id) ?? EXAMS[0];
}
