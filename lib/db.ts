import type { Block, Question, Section, Test } from "./types";
import { createClient } from "./supabase/server";

/**
 * Loads papers out of Supabase and maps them onto the same `Test` shape the
 * exam engine already renders, so the UI does not care where a paper came from.
 *
 * Students read `questions_public`, a view that omits the answer key. Scoring
 * happens server-side in the submit route with the service-role client.
 */

export interface TestSummary {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  display_name: string;
  is_published: boolean;
  is_free: boolean;
  question_count: number;
  total_minutes: number;
}

interface SectionRow {
  id: string;
  kind: string;
  name_en: string;
  name_hi: string;
  time_limit_min: number;
  scored: boolean;
  position: number;
  instructions: { en: string; hi: string }[];
  example: Section["example"] | null;
  study_phase: Section["studyPhase"] | null;
}

interface BlockRow {
  id: string;
  section_id: string;
  title_en: string;
  title_hi: string;
  stimulus: Block["stimulus"] | null;
  position: number;
}

interface QuestionRow {
  id: string;
  block_id: string;
  section_id: string;
  prompt_en: string;
  prompt_hi: string;
  image: string | null;
  choices: Question["choices"];
  correct?: string | null;
  position: number;
}

export async function listTests(includeUnpublished = false): Promise<TestSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tests")
    .select("id, slug, name_en, name_hi, display_name, is_published, is_free, position")
    .order("position")
    .order("created_at");

  if (!includeUnpublished) query = query.eq("is_published", true);

  const { data: tests, error } = await query;
  if (error || !tests) return [];

  // One extra round trip gives the per-test counts shown on the cards.
  const { data: sections } = await supabase
    .from("sections")
    .select("test_id, time_limit_min");
  const { data: counts } = await supabase.from("questions_public").select("section_id");
  const { data: sectionTests } = await supabase.from("sections").select("id, test_id");

  const minutesByTest = new Map<string, number>();
  for (const s of sections ?? []) {
    minutesByTest.set(s.test_id, (minutesByTest.get(s.test_id) ?? 0) + s.time_limit_min);
  }

  const testOfSection = new Map((sectionTests ?? []).map((s) => [s.id, s.test_id]));
  const questionsByTest = new Map<string, number>();
  for (const q of counts ?? []) {
    const testId = testOfSection.get(q.section_id);
    if (!testId) continue;
    questionsByTest.set(testId, (questionsByTest.get(testId) ?? 0) + 1);
  }

  return tests.map((t) => ({
    ...t,
    question_count: questionsByTest.get(t.id) ?? 0,
    total_minutes: minutesByTest.get(t.id) ?? 0,
  }));
}

/**
 * Builds a full paper for the exam engine. `withKey` is only ever true on the
 * server, in the scoring route.
 */
export async function loadTest(slug: string, withKey = false): Promise<Test | null> {
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("tests")
    .select("id, slug, name_en, name_hi, display_name")
    .eq("slug", slug)
    .single();
  if (!test) return null;

  const { data: sectionRows } = await supabase
    .from("sections")
    .select(
      "id, kind, name_en, name_hi, time_limit_min, scored, position, instructions, example, study_phase",
    )
    .eq("test_id", test.id)
    .order("position");
  if (!sectionRows?.length) return null;

  const sectionIds = sectionRows.map((s) => s.id);

  const { data: blockRows } = await supabase
    .from("blocks")
    .select("id, section_id, title_en, title_hi, stimulus, position")
    .in("section_id", sectionIds)
    .order("position");

  const { data: questionRows } = await supabase
    .from(withKey ? "questions" : "questions_public")
    .select("*")
    .in("section_id", sectionIds)
    .order("position");

  const sections: Section[] = (sectionRows as SectionRow[]).map((s) => {
    const blocks: Block[] = ((blockRows ?? []) as BlockRow[])
      .filter((b) => b.section_id === s.id)
      .map((b) => ({
        id: b.id,
        title: { en: b.title_en, hi: b.title_hi },
        stimulus: b.stimulus ?? undefined,
      }));

    const questions: Question[] = ((questionRows ?? []) as QuestionRow[])
      .filter((q) => q.section_id === s.id)
      .map((q) => ({
        id: q.id,
        blockId: q.block_id,
        prompt: { en: q.prompt_en, hi: q.prompt_hi },
        image: q.image ?? undefined,
        choices: q.choices,
        correct: withKey ? q.correct ?? undefined : undefined,
      }));

    return {
      id: s.id,
      kind: s.kind as Section["kind"],
      name: { en: s.name_en, hi: s.name_hi },
      timeLimitMin: s.time_limit_min,
      scored: s.scored,
      instructions: s.instructions ?? [],
      example: s.example ?? undefined,
      studyPhase: s.study_phase ?? undefined,
      blocks,
      questions,
    };
  });

  return {
    id: test.slug,
    name: { en: test.name_en, hi: test.name_hi },
    displayName: test.display_name,
    candidate: { name: "Candidate", rollNo: "" },
    generalInstructions: [],
    sections,
  };
}
