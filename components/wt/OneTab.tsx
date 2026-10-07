"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A paper open in two tabs of the same browser would run one sitting from
 * two places, each unaware of the other. The tabs talk over a channel: a
 * new tab asks, any tab already on this paper answers, and the newer one
 * covers itself with a notice instead of the paper.
 */
export function OneTab({ paperId }: { paperId: string }) {
  const [blocked, setBlocked] = useState(false);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`kc-test-${paperId}`);
    const me = Math.random().toString(36).slice(2);
    channel.onmessage = (event: MessageEvent<{ type: string; from?: string; to?: string }>) => {
      const m = event.data;
      if (m.type === "ping" && m.from !== me && !blockedRef.current) channel.postMessage({ type: "pong", to: m.from });
      if (m.type === "pong" && m.to === me) {
        blockedRef.current = true;
        setBlocked(true);
      }
    };
    channel.postMessage({ type: "ping", from: me });
    return () => channel.close();
  }, [paperId]);

  if (!blocked) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6 text-center font-exam" role="alertdialog" aria-modal="true">
      <h1 className="text-[22px] font-bold text-[#222]">This test is already open in another tab</h1>
      <p className="mt-2 max-w-md text-[15px] text-[#444]">
        Continue there and close this tab. A test runs in one place only, so that the clock and the answers stay one.
      </p>
      <p className="mt-1 max-w-md text-[14px] text-[#666]" lang="hi">
        यह परीक्षण दूसरे टैब में पहले से खुला है। वहीं जारी रखें और इस टैब को बंद कर दें।
      </p>
      <a href="/dashboard" className="mt-6 rounded bg-[#2a7fc0] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab]">
        Go to my dashboard
      </a>
    </div>
  );
}
