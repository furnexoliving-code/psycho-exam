"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A scrollbar drawn by the app rather than the browser, for either axis.
 *
 * The reference portal shows a thin grey strip down the right of the question
 * column and another along its bottom edge, and they matter here: with the
 * wheel disabled, those strips are the only thing telling a candidate how much
 * of the paper is left. Native scrollbars could not be relied on — an overlay
 * scrollbar collapses to a hairline and `scrollbar-width: thin` makes Chromium
 * ignore any width set on ::-webkit-scrollbar — so the rails are rendered
 * directly. Colours are sampled from the reference screenshots.
 *
 * Both rails drag, because dragging is a deliberate act; only the wheel is off.
 */
export function ScrollRail({
  target,
  axis = "vertical",
}: {
  target: React.RefObject<HTMLElement | null>;
  axis?: "vertical" | "horizontal";
}) {
  const vertical = axis === "vertical";
  const [metrics, setMetrics] = useState({ offset: 0, size: 0, scrollable: false });
  const dragging = useRef<{ start: number; startScroll: number } | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const el = target.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const content = vertical ? el.scrollHeight : el.scrollWidth;
    const viewport = vertical ? el.clientHeight : el.clientWidth;
    const railSize = vertical ? rail.clientHeight : rail.clientWidth;
    const scrollPos = vertical ? el.scrollTop : el.scrollLeft;
    const scrollable = content - viewport;

    // With nothing to scroll the rail still shows, with a full-length thumb —
    // the strip is part of the portal's chrome, not just an indicator.
    if (scrollable <= 1) {
      setMetrics({ offset: 0, size: railSize, scrollable: false });
      return;
    }

    // A thumb shorter than this is impossible to grab.
    const MIN_THUMB = 28;
    const size = Math.max(MIN_THUMB, (viewport / content) * railSize);
    const offset = (scrollPos / scrollable) * (railSize - size);

    setMetrics({ offset, size, scrollable: true });
  }, [target, vertical]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // The thumb length depends on content height, which changes as answers
    // wrap onto new lines, so watch the content too.
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure, target]);

  const coord = (event: React.PointerEvent) => (vertical ? event.clientY : event.clientX);

  const onThumbPointerDown = (event: React.PointerEvent) => {
    const el = target.current;
    if (!el || !metrics.scrollable) return;
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragging.current = {
      start: coord(event),
      startScroll: vertical ? el.scrollTop : el.scrollLeft,
    };
  };

  const onThumbPointerMove = (event: React.PointerEvent) => {
    const el = target.current;
    const rail = railRef.current;
    const drag = dragging.current;
    if (!el || !rail || !drag) return;

    const content = vertical ? el.scrollHeight : el.scrollWidth;
    const viewport = vertical ? el.clientHeight : el.clientWidth;
    const railSize = vertical ? rail.clientHeight : rail.clientWidth;
    const travel = railSize - metrics.size;
    if (travel <= 0) return;

    const moved = ((coord(event) - drag.start) / travel) * (content - viewport);
    if (vertical) el.scrollTop = drag.startScroll + moved;
    else el.scrollLeft = drag.startScroll + moved;
  };

  const endDrag = (event: React.PointerEvent) => {
    dragging.current = null;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  };

  /** Clicking the track jumps a page, as a real scrollbar does. */
  const onTrackPointerDown = (event: React.PointerEvent) => {
    const el = target.current;
    const rail = railRef.current;
    if (!el || !rail || dragging.current || !metrics.scrollable) return;

    const box = rail.getBoundingClientRect();
    const at = coord(event) - (vertical ? box.top : box.left);
    const direction = at < metrics.offset ? -1 : 1;
    const page = (vertical ? el.clientHeight : el.clientWidth) * 0.9;

    el.scrollBy(
      vertical
        ? { top: direction * page, behavior: "smooth" }
        : { left: direction * page, behavior: "smooth" },
    );
  };

  return (
    <div
      ref={railRef}
      onPointerDown={onTrackPointerDown}
      data-scroll-rail={axis}
      className={`absolute bg-[#eeeeee] ${
        vertical ? "right-0 top-0 h-full w-[9px]" : "bottom-0 left-0 h-[9px] w-full"
      }`}
      aria-hidden="true"
    >
      <div
        onPointerDown={onThumbPointerDown}
        onPointerMove={onThumbPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`absolute ${vertical ? "bg-[#878787]" : "bg-[#4e4e4e]"} ${
          metrics.scrollable ? "cursor-grab active:cursor-grabbing hover:brightness-90" : ""
        } ${vertical ? "left-0 w-full" : "top-0 h-full"}`}
        style={
          vertical
            ? { top: `${metrics.offset}px`, height: `${metrics.size}px` }
            : { left: `${metrics.offset}px`, width: `${metrics.size}px` }
        }
      />
    </div>
  );
}
