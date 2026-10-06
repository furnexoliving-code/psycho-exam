"use client";

import { useRef, useState } from "react";
import { PortalBanner } from "@/components/wt/PortalBanner";
import { GeneralInstructionsBody } from "@/components/wt/GeneralInstructions";
import { ScrollRail } from "@/components/wt/ScrollRail";
import { startMock } from "@/app/mock/actions";

/**
 * The two pages the hall shows before the first test of the aptitude
 * test: the general instructions, then "Other Important Instructions"
 * with the declaration to tick and the button that begins. Only the
 * button starts the mock's sitting; reading costs nothing.
 */
export function MockBegin({ slug, candidate, rollNo }: { slug: string; candidate: string; rollNo: string }) {
  const [page, setPage] = useState<1 | 2>(1);
  const [agreed, setAgreed] = useState(false);
  const body = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-exam">
      <PortalBanner showInstructions={false} />

      <div className="flex items-center justify-between border-b border-[#dcdcdc] bg-[#cfe3f5] px-5 py-2">
        <h1 className="text-[17px] font-bold text-[#333]">{page === 1 ? "General Instructions" : "Other Important Instructions"}</h1>
        <div className="flex items-center gap-3">
          <div className="flex h-[40px] w-[40px] items-center justify-center border border-[#bbbbbb] bg-[#dfe6ee]">
            <svg viewBox="0 0 48 48" className="h-[32px] w-[32px]" aria-hidden="true">
              <circle cx="24" cy="17" r="10" fill="#8fa3b8" />
              <path d="M6 46c2-12 10-16 18-16s16 4 18 16z" fill="#8fa3b8" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="max-w-[180px] truncate text-[14px] font-semibold text-gray-900">{candidate}</div>
            {rollNo && <div className="text-[10px] text-gray-600">Roll No: {rollNo}</div>}
          </div>
        </div>
      </div>

      {page === 1 ? (
        <>
          <div className="relative min-h-0 flex-1">
            <div ref={body} className="wt-scroll-host h-full pr-[9px]">
              <GeneralInstructionsBody />
            </div>
            <ScrollRail target={body} axis="vertical" />
          </div>
          <div className="flex items-center justify-end border-t border-[#c9dcea] bg-[#e8f4fb] px-5 py-3">
            <button
              type="button"
              onClick={() => setPage(2)}
              className="rounded bg-[#2a7fc0] px-8 py-2.5 text-[14px] font-semibold text-white hover:bg-[#2470ab]"
            >
              Next ›
            </button>
          </div>
        </>
      ) : (
        <form action={startMock} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="slug" value={slug} />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-3xl border-2 border-[#333] px-6 py-4 text-center">
              <p className="text-[22px] text-[#222]">Please tick the check box below to start the exam.</p>
              <p className="mt-1 text-[21px] text-[#222]" lang="hi">कृपया परीक्षण आरम्भ करने हेतु नीचे दिये चेक बाक्स को टिक करें।</p>
            </div>
          </div>
          <div className="border-t border-[#dcdcdc] px-5 py-4">
            <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[#222]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block">
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working
                  condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like
                  mobile phone, Bluetooth devices, etc. / any prohibited material with me into the Examination Hall. I agree
                  that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to
                  disciplinary action, which may include ban from future Tests / Examinations.
                </span>
                <span className="mt-3 block" lang="hi">
                  मैंने निर्देशों को पढ़ और समझ लिया है। मुझे आवंटित सभी कंप्यूटर हार्डवेयर उचित कार्यशील स्थिति में हैं। मैं घोषणा
                  करता हूँ कि मैं परीक्षा हॉल में अपने साथ कोई प्रतिबंधित गैजेट जैसे मोबाइल फोन, ब्लूटूथ डिवाइस आदि नहीं रखूँगा /
                  नहीं पहनूँगा / नहीं ले जाऊँगा। मैं सहमत हूँ कि निर्देशों का पालन न करने की स्थिति में, मुझे इस परीक्षा से वंचित
                  किया जा सकता है और/या अनुशासनात्मक कार्रवाई की जा सकती है, जिसमें भविष्य की परीक्षाओं से प्रतिबंध भी शामिल
                  हो सकता है।
                </span>
              </span>
            </label>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="rounded border border-[#bbb] bg-white px-6 py-2.5 text-[14px] font-semibold text-[#333] hover:bg-gray-50"
              >
                ‹ Previous
              </button>
              <button
                type="submit"
                disabled={!agreed}
                className="rounded bg-[#6fb6e6] px-8 py-2.5 text-[14px] font-semibold text-white hover:bg-[#5ea8dc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                I am ready to begin
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
