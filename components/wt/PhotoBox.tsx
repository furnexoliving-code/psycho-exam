"use client";

/** The candidate's photo box of the hall screen: their photo, or a silhouette. */
export function PhotoBox({ photoUrl, size = 64 }: { photoUrl: string | null | undefined; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden border border-[#bbbbbb] bg-[#dfe6ee]"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <svg viewBox="0 0 48 48" style={{ width: size * 0.78, height: size * 0.78 }} aria-hidden="true">
          <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
          <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
        </svg>
      )}
    </div>
  );
}
