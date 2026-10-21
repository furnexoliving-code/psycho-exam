import { NextResponse } from "next/server";
import { getProfile, isConfigured } from "@/lib/auth";
import { markQuestionsStarted } from "@/lib/wt/session";

/**
 * The candidate has left the instruction screen: the questions are open and
 * their clock has started. Called once by the exam page; the server keeps the
 * moment so the time reported back is the time spent on the questions.
 *
 * The page sends the paper's row id along with its slug, so the sitting is
 * found without looking the slug up first. The account check stays: the
 * autosave skips it only because its database function makes the same
 * check itself, and this route has no such function.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isConfigured()) return NextResponse.json({ ok: true });

  let paperId = "";
  let paperDbId: string | undefined;
  try {
    const body = (await request.json()) as { paperId?: unknown; paperDbId?: unknown };
    if (typeof body.paperId === "string") paperId = body.paperId;
    if (typeof body.paperDbId === "string" && UUID.test(body.paperDbId)) paperDbId = body.paperDbId;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
  if (!paperId) return NextResponse.json({ error: "paperId is required" }, { status: 400 });

  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  await markQuestionsStarted(paperId, profile.id, paperDbId);
  return NextResponse.json({ ok: true });
}
