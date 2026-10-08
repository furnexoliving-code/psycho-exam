import Link from "next/link";
import { rupees } from "@/lib/packages";

/**
 * The card under a Full Mock scorecard for a student whose packages do
 * not cover the practice papers: the weakest test by name, how many
 * papers the portal has for it, and the package that opens them. Shown
 * at the one moment the student knows exactly what they need.
 */
export function ScorecardOffer({
  weakest,
  papersForIt,
  cutOffT,
  sectional,
  combo,
  hasFull,
}: {
  weakest: { name: string; tScore: number | null } | null;
  papersForIt: number;
  cutOffT: number;
  sectional: { name: string; priceInr: number } | null;
  combo: { name: string; priceInr: number } | null;
  /** True when the Full Mocks are already open to this student. */
  hasFull: boolean;
}) {
  const pick = hasFull ? sectional : combo ?? sectional;
  if (!pick) return null;
  return (
    <section className="no-print no-capture mt-5 rounded-2xl border-2 border-[#ff9933] bg-[#fff7ed] p-5 sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">Your next step · अगला कदम</p>
      {weakest ? (
        <>
          <h2 className="mt-1 text-[20px] font-extrabold text-gray-900">
            {weakest.name} is your weakest test{weakest.tScore !== null ? ` (T-Score ${weakest.tScore.toFixed(1)})` : ""}
          </h2>
          <p className="mt-1 text-[14px] text-gray-800">
            {papersForIt > 0 ? <>The portal has <b>{papersForIt} practice papers</b> for it, </>: <>Practice papers for it are </>}
            with up to 3 attempts each and your best T-Score per paper. Students who practise the weakest test daily cross {cutOffT} in about two weeks.
          </p>
          <p className="text-[13px] text-gray-600" lang="hi">
            {weakest.name} आपका सबसे कमज़ोर टेस्ट है। {papersForIt > 0 ? `इसके ${papersForIt} प्रैक्टिस पेपर` : "इसके प्रैक्टिस पेपर"} पैकेज के साथ खुलते हैं।
          </p>
        </>
      ) : (
        <h2 className="mt-1 text-[20px] font-extrabold text-gray-900">Practise every test daily until all five are at {cutOffT}+</h2>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/packages" className="rounded-md bg-[#0d2a6b] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#0a2158]">
          Get {pick.name} · {rupees(pick.priceInr)}
        </Link>
        {!hasFull && sectional && combo && (
          <span className="text-[13px] text-gray-600">or only the practice papers: <Link href="/packages#sectional" className="font-semibold text-[#0d2a6b] underline">{sectional.name} · {rupees(sectional.priceInr)}</Link></span>
        )}
      </div>
    </section>
  );
}
