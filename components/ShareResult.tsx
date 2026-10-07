"use client";

import { useState } from "react";
import { toBlob } from "html-to-image";

/**
 * Download and share for a result: the scorecard is drawn into a picture
 * in the browser and either saved or handed to the phone's share sheet. Nothing is posted anywhere and no
 * public link is made: the picture leaves only by the student's own hand.
 */
export function ShareResult({ targetId, fileName, title }: { targetId: string; fileName: string; title: string }) {
  const [busy, setBusy] = useState<"image" | "share" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const picture = async (): Promise<Blob> => {
    const node = document.getElementById(targetId);
    if (!node) throw new Error("Nothing to capture");
    const blob = await toBlob(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
      filter: (el) => !(el instanceof HTMLElement && el.classList.contains("no-capture")),
    });
    if (!blob) throw new Error("The picture could not be drawn");
    return blob;
  };

  const download = async () => {
    setNote(null);
    setBusy("image");
    try {
      const blob = await picture();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNote("Saved as a picture.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setNote(null);
    setBusy("share");
    try {
      const blob = await picture();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title });
        setNote("Shared.");
      } else {
        // A desktop browser without a share sheet: save the picture instead.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setNote("Sharing is a phone feature; the picture was saved instead.");
      }
    } catch (error) {
      // The share sheet closed without sending: not an error worth a word.
      if (error instanceof Error && error.name === "AbortError") setNote(null);
      else setNote(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const button = "rounded-lg border border-white/50 bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-white/25 disabled:opacity-60";

  return (
    <div className="no-print no-capture flex flex-wrap items-center gap-2">
      <button type="button" onClick={download} disabled={busy !== null} className={button}>
        {busy === "image" ? "Drawing…" : "⬇ Download"}
      </button>
      <button type="button" onClick={share} disabled={busy !== null} className={button}>
        {busy === "share" ? "Drawing…" : "↗ Share"}
      </button>
      {note && (
        <span role="status" className="text-[11px] text-white/90">
          {note}
        </span>
      )}
    </div>
  );
}
