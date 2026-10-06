import { NextResponse } from "next/server";
import { getProfile, PANEL_ROLES } from "@/lib/auth";
import { readPhoto } from "@/lib/photo";

export const dynamic = "force-dynamic";

/**
 * Serves a candidate's photo to the candidate themself and to the panel.
 * Everyone else, signed in or not, gets nothing: the bucket is private and
 * this is the only door to it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const who = await getProfile();
  if (!who) return new NextResponse(null, { status: 401 });
  if (who.id !== userId && !PANEL_ROLES.includes(who.role)) return new NextResponse(null, { status: 403 });

  const photo = await readPhoto(userId);
  if (!photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(photo.bytes, {
    headers: {
      "Content-Type": photo.type,
      // Private: a shared computer's cache must not hand the next student
      // this one's picture. The address changes with every upload.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
