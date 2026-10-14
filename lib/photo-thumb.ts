/**
 * The small copy of a candidate's photo that the portal shows almost
 * everywhere: the header, the exam screen, the scorecard. A phone photo
 * runs to 2 MB; this is 20 to 40 KB, so a page no longer streams megabytes
 * through a function for a picture shown at 32 to 80 pixels.
 */
export const THUMB_PX = 320;
export const THUMB_TYPE = "image/jpeg";

/**
 * Shrinks a JPG, PNG or WEBP to at most THUMB_PX on its longer side,
 * upright, on a white background, as a JPEG. Throws when the picture
 * cannot be decoded at all; a merely imperfect file (a truncated JPEG a
 * browser still shows) is accepted, as it was before copies existed.
 */
export async function makeThumb(original: Buffer | ArrayBuffer): Promise<Buffer> {
  // Loaded here, not at the top: sharp brings a 16 MB native library, and
  // every student page imports lib/photo for the URL helper alone.
  const { default: sharp } = await import("sharp");
  const input = Buffer.isBuffer(original) ? original : Buffer.from(original);
  return sharp(input, { failOn: "none" })
    .rotate() // honour the phone's orientation tag, then drop it
    .resize(THUMB_PX, THUMB_PX, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // a transparent PNG keeps a light backdrop, not black
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}
