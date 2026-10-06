"use client";

import { useState } from "react";
import { GeneralInstructionsDialog } from "./GeneralInstructions";

/**
 * The masthead, laid out as the real hall screen is: a white strip with
 * the institute's mark on the left, the board's name and the CEN line in
 * the middle between two drawn emblems, and the RDSO badge on the right;
 * then a charcoal bar with the test series' name in yellow and, at its
 * right end, the two buttons the hall gives: Group Instructions (this
 * test's own) and Instructions (the general ones, kept here).
 *
 * The two emblems are drawn here, in outline, as stylised stand-ins. The
 * State Emblem of India may not be used by a private body, and the
 * railway roundel is the railways' own mark, so neither is the real
 * artwork: the drawings give the screen its familiar shape, no more.
 */
export function PortalBanner({
  onInstructions,
  disabled = false,
  showInstructions = true,
}: {
  /** Opens this test's own instructions: the Group Instructions button. */
  onInstructions?: () => void;
  /** Kept for the callers that pass it; the hall screen has no such button. */
  onQuestionPaper?: () => void;
  /** Switched off per paper in the admin panel. */
  showInstructions?: boolean;
  showQuestionPaper?: boolean;
  /**
   * The Group Instructions button is off during the instruction screen:
   * the instructions are already on view there. The general Instructions
   * stay reachable throughout, as in the hall.
   */
  disabled?: boolean;
}) {
  const [generalOpen, setGeneralOpen] = useState(false);

  return (
    <header className="font-exam">
      <div className="flex h-[56px] items-center border-b border-[#d9d9d9] bg-white px-3">
        <div className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kautilya-logo.png" alt="Kautilya Classes" className="h-[44px] w-auto" draggable={false} />
          <div className="leading-none">
            <div className="text-[15px] font-bold text-[#0d2a6b]">KAUTILYA CLASSES</div>
            <div className="mt-1 text-[8.5px] font-bold tracking-[0.2em] text-[#c8102e]">
              PSYCHO TEST PORTAL
            </div>
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-3.5 md:flex">
          <LionCapital />
          <div className="leading-tight text-[#111]">
            <div className="text-[12.5px] font-bold">
              <span lang="hi">रेल भर्ती बोर्ड</span> / RAILWAY RECRUITMENT BOARDS
            </div>
            <div className="mt-0.5 text-[12.5px] font-bold tracking-wider">
              <span lang="hi">सी ई एन आर आर बी - ०१/२०२५</span> - CEN RRB - 01/2025
            </div>
          </div>
          <RailRoundel />
        </div>

        <div className="ml-auto hidden shrink-0 flex-col items-end sm:flex md:ml-0">
          <span className="text-[12px] font-extrabold tracking-wider text-[#0d2a6b]">
            AS PER RDSO PATTERN
          </span>
          <span
            className="my-0.5 h-[2px] w-full"
            style={{ background: "linear-gradient(90deg,#ff9933 33%,#ffffff 33% 66%,#138808 66%)" }}
            aria-hidden="true"
          />
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#c8102e]">RRB ALP · CBAT 2025</span>
        </div>
      </div>

      <div className="flex h-[30px] items-center gap-3 bg-[#333333] px-3.5">
        <span className="truncate text-[13px] font-bold text-[#ffd500]">RRB ALP Aptitude Test</span>
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          {showInstructions && (
            <BarButton onClick={onInstructions} disabled={disabled}>
              Group Instructions
            </BarButton>
          )}
          <BarButton onClick={() => setGeneralOpen(true)}>Instructions</BarButton>
        </div>
      </div>

      <GeneralInstructionsDialog open={generalOpen} onClose={() => setGeneralOpen(false)} />
    </header>
  );
}

function BarButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      data-allow-mouse="true"
      className={`flex items-center gap-1.5 whitespace-nowrap text-[12px] font-bold sm:text-[13px] ${
        disabled ? "cursor-not-allowed text-white/45" : "text-white hover:underline"
      }`}
    >
      <InfoDot dim={disabled} />
      {children}
    </button>
  );
}

function InfoDot({ dim = false }: { dim?: boolean }) {
  return (
    <span
      className={`flex h-[16px] w-[16px] items-center justify-center rounded-full text-[11px] font-bold italic text-white ${
        dim ? "bg-[#2a8fd6]/50" : "bg-[#2a8fd6]"
      }`}
      aria-hidden="true"
    >
      i
    </span>
  );
}

/** A stylised lion capital, in outline grey: a stand-in, not the State Emblem. */
function LionCapital() {
  return (
    <svg viewBox="0 0 60 70" className="h-[40px] w-[34px] shrink-0" aria-hidden="true">
      <g fill="#333333">
        <circle cx="22" cy="16" r="7" />
        <circle cx="38" cy="16" r="7" />
        <rect x="18" y="20" width="24" height="9" rx="3" />
        <rect x="14" y="30" width="32" height="5" rx="2" />
        <rect x="17" y="36" width="26" height="4" rx="1.5" />
        <circle cx="30" cy="43" r="3.4" fill="none" stroke="#333333" strokeWidth="1.4" />
        <rect x="20" y="48" width="20" height="3" rx="1" />
        <rect x="26" y="52" width="8" height="12" rx="1" />
      </g>
    </svg>
  );
}

/** A red roundel with a locomotive's face: a stand-in for the railways' mark. */
function RailRoundel() {
  return (
    <svg viewBox="0 0 60 60" className="ml-3 h-[40px] w-[40px] shrink-0" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill="#ffffff" />
      <circle cx="30" cy="30" r="28" fill="none" stroke="#c8102e" strokeWidth="3" />
      <circle cx="30" cy="30" r="21" fill="none" stroke="#c8102e" strokeWidth="1.4" />
      <g fill="#c8102e">
        <rect x="22" y="20" width="16" height="16" rx="2" />
        <rect x="25" y="37" width="10" height="3.5" rx="1" />
        <circle cx="25" cy="44" r="2.4" />
        <circle cx="35" cy="44" r="2.4" />
        <rect x="26" y="15" width="8" height="4" rx="1" />
      </g>
      <rect x="25" y="23" width="10" height="5" fill="#ffffff" />
    </svg>
  );
}
