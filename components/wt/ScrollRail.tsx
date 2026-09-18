"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A scrollbar drawn by the app rather than the browser.
 *
 * The reference portal shows a thin grey strip down the right of the question
 * column, and it matters here: with the wheel disabled, that strip is the only
 * thing telling a candidate how much of the paper is left. Native scrollbars
 * could not be relied on — an overlay scrollbar collapses to a hairline and
 * `scrollbar-width: thin` makes Chromium ignore any width you set — so the rail
 * is rendered directly. Colours are sampled from the reference screenshots.
 *
 * It is draggable, because dragging is a deliberate act; only the wheel is off.
 */
export function ScrollRail({
  target,
  className = "",
}: {
  target: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const [metrics, setMetrics] = useState({ top: 0, height: 0, visible: false });
  const dragging = useRef<{ startY: number; startScroll: number } | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const el = target.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 1) {
      setMetrics({ top: 0, height: 0, visible: false });
      return;
    }

    const railHeight = rail.clientHeight;
    // A thumb shorter than this is impossible to grab.
    const MIN_THUMB = 28;
    const height = Math.max(
      MIN_THUMB,
      (el.clientHeight / el.scrollHeight) * railHeight,
    );
    const top = (el.scrollTop / scrollable) * (railHeight - height);

    setMetrics({ top, height, visible: true });
  }, [target]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure, target]);

  const onPointerDown = (event: React.PointerEvent) => {
    const el = target.current;
    if (!el) return;
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragging.current = { startY: event.clientY, startScroll: el.scrollTop };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const el = target.current;
    const rail = railRef.current;
    const drag = dragging.current;
    if (!el || !rail || !drag) return;

    const scrollable = el.scrollHeight - el.clientHeight;
    const travel = rail.clientHeight - metrics.height;
    if (travel <= 0) return;

    const delta = event.clientY - drag.startY;
    el.scrollTop = drag.startScroll + (delta / travel) * scrollable;
  };

  const endDrag = (event: React.PointerEvent) => {
    dragging.current = null;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  };

  /** Clicking the track jumps a page, as a real scrollbar does. */
  const onTrackPointerDown = (event: React.PointerEvent) => {
    const el = target.current;
    const rail = railRef.current;
    if (!el || !rail || dragging.current) return;

    const y = event.clientY - rail.getBoundingClientRect().top;
    const direction = y < metrics.top ? -1 : 1;
    el.scrollBy({ top: direction * el.clientHeight * 0.9, behavior: "smooth" });
  };

  return (
    <div
      ref={railRef}
      onPointerDown={onTrackPointerDown}
      className={`absolute right-0 top-0 h-full w-[9px] bg-[#eeeeee] ${className}`}
      aria-hidden="true"
    >
      {metrics.visible && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute left-0 w-full cursor-grab bg-[#878787] active:cursor-grabbing hover:bg-[#6f6f6f]"
          style={{ top: `${metrics.top}px`, height: `${metrics.height}px` }}
        />
      )}
    </div>
  );
}
