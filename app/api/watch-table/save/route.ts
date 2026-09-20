import { NextResponse } from "next/server";
import { getProfile, isConfigured } from "@/lib/auth";
import { saveSnapshot } from "@/lib/wt/session";
import { isOptionValue } from "@/lib/wt/parse-questions";
import type { OptionValue } from "@/lib/wt/types";

/** No paper has this many questions; anything past it is not an answer sheet. */
const MAX_ANSWERS = 500;

/**
 * The sheet as it stands, sent by the exam page while the clock runs. A
 * browser that dies mid-paper has then lost nothing, and a late submit is
 * marked from this copy rather than from a blank. Refused once the paper's
 * time is up.
 */
export async function POST(request: Request) {
  if (!isConfigured()) return NextResponse.json({ ok: true });

  let body: { paperId?: unknown; answers?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
  const paperId = typeof body.paperId === "string" ? body.paperId : "";
  if (!paperId) return NextResponse.json({ error: "paperId is required" }, { status: 400 });

  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const responses: Record<string, OptionValue> = {};
  if (body.answers && typeof body.answers === "object") {
    for (const [key, value] of Object.entries(body.answers as Record<string, unknown>)) {
      if (Object.keys(responses).length >= MAX_ANSWERS) break;
      if (key.length > 64) continue;
      if (isOptionValue(value)) {
        responses[key] = value;
      }
    }
  }

  const saved = await saveSnapshot(paperId, profile.id, responses);
  return NextResponse.json({ ok: saved });
}
