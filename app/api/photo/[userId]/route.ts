import { NextResponse } from "next/server";
import { getProfile, PANEL_ROLES } from "@/lib/auth";
import { readPhoto } from "@/lib/photo";

export const dynamic = "force-dynamic";

/**
 * Serves a candidate's photo to the candidate themself and to the panel.
 * Everyone else, signed in or not, gets nothing: the bucket is private and
 * this is the only door to it. The small copy unless "?full=1" asks for
 * the original.
 */
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const who = await getProfile();
  if (!who) return new NextResponse(null, { status: 401 });
  if (who.id !== userId && !PANEL_ROLES.includes(who.role)) return new NextResponse(null, { status: 403 });

  const full = new URL(req.url).searchParams.get("full") === "1";
  const photo = await readPhoto(userId, full ? "full" : "thumb");
  if (!photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.type,
      "Content-Length": String(photo.bytes.byteLength),
      // Private, and a day at most: on a shared computer the browser's own
      // cache outlives a sign-out, so the picture must not stay for long.
      // The address changes with every upload.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
