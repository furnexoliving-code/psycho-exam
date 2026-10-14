import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProfile, isConfigured, signedInUserId } from "@/lib/auth";
import { DEVICE_COOKIE } from "@/lib/login-guard";
import { saveSnapshot, saveSnapshotFast } from "@/lib/wt/session";
import { isOptionValue } from "@/lib/wt/parse-questions";
import type { OptionValue } from "@/lib/wt/types";

/** No paper has this many questions; anything past it is not an answer sheet. */
const MAX_ANSWERS = 500;

/**
 * The sheet as it stands, sent by the exam page while the clock runs. A
 * browser that dies mid-paper has then lost nothing, and a late submit is
 * marked from this copy rather than from a blank. Refused once the paper's
 * time is up.
 *
 * The cheapest request the portal has, on purpose: every student sends it
 * every ten seconds. The token says who is asking, and the account check,
 * the paper, the sitting and the update are one database call.
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

  const userId = await signedInUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

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

  const device = (await cookies()).get(DEVICE_COOKIE)?.value ?? "";
  let saved = await saveSnapshotFast(paperId, userId, device, responses);
  if (saved === null) {
    // The database has no watch_save_snapshot yet: the older path, with the
    // full account check in front of it.
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
    saved = await saveSnapshot(paperId, profile.id, responses);
  }
  return NextResponse.json({ ok: saved });
}
