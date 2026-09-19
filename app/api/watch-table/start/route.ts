import { NextResponse } from "next/server";
import { getProfile, isConfigured } from "@/lib/auth";
import { markQuestionsStarted } from "@/lib/wt/session";

/**
 * The candidate has left the instruction screen: the questions are open and
 * their clock has started. Called once by the exam page; the server keeps the
 * moment so the time reported back is the time spent on the questions.
 */
export async function POST(request: Request) {
  if (!isConfigured()) return NextResponse.json({ ok: true });

  let paperId = "";
  try {
    const body = (await request.json()) as { paperId?: unknown };
    if (typeof body.paperId === "string") paperId = body.paperId;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
  if (!paperId) return NextResponse.json({ error: "paperId is required" }, { status: 400 });

  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  await markQuestionsStarted(paperId, profile.id);
  return NextResponse.json({ ok: true });
}
