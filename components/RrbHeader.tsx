/**
 * The white masthead the Digialm exam screens carry: national emblem on the
 * left, the board name in Hindi and English with the CEN notice underneath,
 * and the RRB roundel on the right.
 */
export function RrbHeader({ cen = "CEN RRB - 01/2024" }: { cen?: string }) {
  return (
    <div className="flex items-center justify-center gap-6 border-b border-gray-300 bg-white px-4 py-2">
      <Emblem />

      <div className="text-center leading-tight">
        <div className="text-[15px] font-bold text-gray-900">
          रेल भर्ती बोर्ड <span className="font-normal">/</span> RAILWAY RECRUITMENT BOARDS
        </div>
        <div className="mt-0.5 text-[13px] font-semibold tracking-wide text-gray-800">
          सी ई एन आर आर बी - ०१/२०२४ &nbsp;-&nbsp; {cen}
        </div>
      </div>

      <Roundel />
    </div>
  );
}

/** Lion capital of Ashoka, drawn simply so no third-party asset is needed. */
function Emblem() {
  return (
    <svg viewBox="0 0 60 70" className="h-[46px] w-[40px] shrink-0" aria-hidden="true">
      <g fill="#4a4a4a">
        <circle cx="22" cy="16" r="7" />
        <circle cx="38" cy="16" r="7" />
        <rect x="18" y="20" width="24" height="9" rx="3" />
        <rect x="14" y="30" width="32" height="5" rx="2" />
        <rect x="17" y="36" width="26" height="4" rx="1.5" />
        <circle cx="30" cy="43" r="3.4" fill="none" stroke="#4a4a4a" strokeWidth="1.4" />
        <rect x="20" y="48" width="20" height="3" rx="1" />
        <rect x="26" y="52" width="8" height="10" rx="1" />
      </g>
      <text x="30" y="69" textAnchor="middle" fontSize="6" fill="#4a4a4a">
        सत्यमेव जयते
      </text>
    </svg>
  );
}

/** The Indian Railways roundel. */
function Roundel() {
  return (
    <svg viewBox="0 0 60 60" className="h-[44px] w-[44px] shrink-0" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill="none" stroke="#b02020" strokeWidth="3" />
      <circle cx="30" cy="30" r="22" fill="none" stroke="#b02020" strokeWidth="1.5" />
      <g fill="#b02020">
        <rect x="22" y="20" width="16" height="16" rx="2" />
        <rect x="25" y="37" width="10" height="4" rx="1" />
        <circle cx="25" cy="43" r="2.4" />
        <circle cx="35" cy="43" r="2.4" />
      </g>
    </svg>
  );
}
