"use client";

import { useRef } from "react";
import { ScrollRail } from "./ScrollRail";

/**
 * The general instructions of the aptitude test, as the hall screen shows
 * them before the first test: Hindi first, then English, as the board's
 * own sample does. Reached from the Instructions button in the exam
 * header at any time, and read through at the start of a Full Mock.
 */
export function GeneralInstructionsBody() {
  return (
    <div className="px-6 py-5 text-[14.5px] leading-relaxed text-[#222]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <h2 className="text-center text-[17px] font-bold" lang="hi">अभिवृत्ति परीक्षण से सम्बंधित सामान्य निर्देश</h2>
      <h2 className="text-center text-[16px] font-bold">GENERAL INSTRUCTIONS REGARDING APTITUDE TEST</h2>

      <ol className="mt-4 list-decimal space-y-2 pl-7" lang="hi">
        <li>यह एक अभ्यास परीक्षण है। वास्तविक परीक्षा में प्रत्येक परीक्षण में प्रश्नों की संख्या एवं समय-सीमा अलग हो सकती है।</li>
        <li>यह एक कंप्यूटर आधारित परीक्षण है, जिसमे कुल पांच परीक्षण सम्मिलित हैं।</li>
        <li>प्रत्येक परीक्षण के प्रारंभ से पहले कंप्यूटर स्क्रीन पर उस परीक्षण से सम्बंधित निर्देश प्रदर्शित किए जायेंगे, जिनमें प्रश्नों की संख्या, परीक्षण हेतु निर्धारित समय-सीमा, प्रश्नों को हल करने की विधि तथा उदाहरणों के माध्यम से परीक्षण की प्रक्रिया को समझाया जाएगा।</li>
        <li>अभ्यर्थियों से अपेक्षा की जाती है कि वे इन निर्देशों को ध्यानपूर्वक पढ़ें और अच्छी तरह समझें, ताकि मुख्य परीक्षण के दौरान वे प्रश्नों का सही उत्तर दे सकें।</li>
        <li>निर्देश स्क्रीन के बाद निर्धारित समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा।</li>
        <li>पहला परीक्षण स्मृति परीक्षण (Memory Test) होगा।</li>
        <li>स्मृति परीक्षण को छोड़कर, अन्य सभी परीक्षण के दौरान यदि आप निर्देशों को दोबारा देखना चाहें, तो स्क्रीन के ऊपरी दाहिने कोने में स्थित <Btn>Group Instructions</Btn> बटन पर क्लिक करें। इससे सम्बंधित परीक्षण के निर्देश प्रदर्शित हो जाएंगे।</li>
        <li>आपको यह सुझाव दिया जाता है कि आप दिए गए उदाहरणों की सहायता से स्मृति परीक्षण को निर्धारित समय में भली-भांति समझ लें, जिससे आप परीक्षण के दौरान अपना समय बचा सकें।</li>
        <li>यदि आप को सामान्य निर्देशों को पुनः देखना हो, तो स्क्रीन के ऊपरी दाहिने कोने में स्थित <Btn>Instructions</Btn> बटन पर क्लिक करें।</li>
        <li>प्रत्येक परीक्षण के बाद 01 मिनट का विश्राम समय मिलेगा, ताकि आप अगले परीक्षण के लिए मानसिक रूप से तैयार हो सकें।</li>
        <li>परीक्षण के दौरान, आप अपने कंप्यूटर माउस की सहायता से प्रश्नों को ऊपर-नीचे अथवा दाएं-बाएं स्क्रॉल करके अपनी सुविधा अनुसार देख सकते हैं।</li>
        <li>सम्पूर्ण परीक्षण में स्क्रीन के ऊपरी दाहिने कोने में काउंटडाउन टाइमर प्रदर्शित होगा, जो शेष समय को मिनट और सेकंड में दिखाएगा।</li>
        <li>जब टाइमर शून्य (0) पर पहुँच जाएगा, तो सम्बंधित परीक्षण स्वतः समाप्त हो जाएगा।</li>
      </ol>

      <h3 className="mt-5 font-bold" lang="hi">परीक्षण से सम्बंधित विशिष्ट निर्देश</h3>
      <Section hi="परीक्षण 1 : स्मृति परीक्षण" items={[
        "यह परीक्षण दो भागों में विभाजित है। प्रत्येक भाग में एक स्मृति स्क्रीन और एक परीक्षण स्क्रीन है।",
        "निर्देश स्क्रीन के तुरंत बाद स्मृति स्क्रीन दिखाई जाएगी, फिर परीक्षण स्क्रीन आएगी।",
        "इसी प्रकार से दूसरा भाग भी प्रदर्शित होगा।",
        "दोनों भागों के मध्य 01 मिनट का विश्राम समय होगा।",
        "वास्तविक परीक्षण के समय प्रश्नों की संख्या तथा समय सीमा अलग होगी।",
      ]} />
      <Section hi="परीक्षण 2 : निर्देश अनुपालन परीक्षण" items={[
        "इस परीक्षण में आपको निर्देशों के अनुपालन पर आधारित प्रश्नों के उत्तर देने होंगे।",
        "ध्यान रखें की वास्तविक परीक्षण के समय परीक्षण में प्रश्नों की संख्या तथा समय सीमा अलग होगी।",
      ]} />
      <Section hi="परीक्षण 3 : गहराई प्रात्यक्षीकरण परीक्षण" items={[
        "ब्लॉक के समूह पर आधारित प्रश्न हैं।",
        "प्रश्न भागों में प्रदर्शित होंगे।",
        "प्रत्येक भाग के बाद Save & Next बटन होगा। जब आप इस बटन पर क्लिक करेंगे तभी अगला भाग खुलेगा।",
        "वास्तविक परीक्षण के समय परीक्षण में प्रश्नों की संख्या तथा समय सीमा अलग होगी।",
      ]} />
      <Section hi="परीक्षण 4 : अवलोकन क्षमता परीक्षण" items={[
        "इस परीक्षण में अवलोकन क्षमता पर आधारित प्रश्न हैं।",
        "प्रश्न भागों में प्रदर्शित होंगे।",
        "प्रत्येक भाग के बाद Save & Next बटन होगा। जब आप इस बटन पर क्लिक करेंगे, तभी अगला भाग खुलेगा।",
        "वास्तविक परीक्षण के समय परीक्षण में प्रश्नों की संख्या तथा समय-सीमा अलग होगी।",
      ]} />
      <Section hi="परीक्षण 5 : प्रत्यक्षिक गति परीक्षण" items={[
        "प्रत्यक्षिक गति पर आधारित प्रश्न हैं।",
        "प्रश्न भागों में प्रदर्शित होंगे।",
        "प्रत्येक भाग के बाद Save & Next बटन होगा। जब आप इस बटन पर क्लिक करेंगे, तभी अगला भाग खुलेगा।",
        "वास्तविक परीक्षण के समय परीक्षण में प्रश्नों की संख्या तथा समय-सीमा अलग होगी।",
      ]} />

      <h3 className="mt-5 font-bold" lang="hi">प्रश्नों को हल करने और उत्तर देने की विधि :</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-7" lang="hi">
        <li>उत्तर चयन करने के लिए माउस की सहायता से इच्छित विकल्प पर क्लिक करें।</li>
        <li>आपका उत्तर प्रत्येक क्लिक के बाद स्वतः सुरक्षित हो जाएगा।</li>
        <li>उत्तर बदलने के लिए किसी अन्य विकल्प पर क्लिक करें।</li>
        <li>प्रत्येक परीक्षण के विश्राम समय में स्क्रीन पर यह बताया जाएगा कि आपने कितने प्रश्न हल किए और कितने छोड़ दिए।</li>
      </ol>

      <h3 className="mt-5 font-bold" lang="hi">परीक्षण से पूर्व ध्यान देने योग्य महत्वपूर्ण बातें:</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-7" lang="hi">
        <li>मुख्य परीक्षा में अच्छे प्रदर्शन के लिए प्रत्येक परीक्षण के उदाहरण को ध्यानपूर्वक समझें।</li>
        <li>प्रत्येक प्रश्न पर पूरी एकाग्रता बनाए रखें, ताकि आप अधिकतम अंक प्राप्त कर सकें।</li>
        <li>समय सीमा का विशेष ध्यान रखें और निर्धारित समय में ही सभी प्रश्न हल करने का प्रयास करें।</li>
        <li>यदि कोई प्रश्न कठिन लगे, तो उस पर अधिक समय न दें; अगले प्रश्नों को हल करें।</li>
        <li>प्रत्येक परीक्षण के अंत में और अगले परीक्षण के प्रारंभ से पहले 1 मिनट का विश्राम समय मिलेगा, जिसमें स्क्रीन पर यह बताया जाएगा कि आपने कितने प्रश्न हल किए और कितने छोड़ दिए।</li>
        <li>विश्राम समय का उपयोग मानसिक रूप से विश्राम करने में करें, ताकि आप अगले परीक्षण में पुनः पूर्णतः ध्यान केंद्रित स्थिति में रह सकें।</li>
        <li>प्रत्येक परीक्षण पर समान रूप से ध्यान दें ताकि आप प्रत्येक परीक्षण पर बेहतर प्रदर्शन कर सकें।</li>
      </ol>
      <p className="mt-4 text-center" lang="hi">परीक्षण हेतु शुभकामनाएं !</p>

      <h2 className="mt-8 text-center text-[16px] font-bold">GENERAL INSTRUCTIONS REGARDING APTITUDE TEST</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-7">
        <li>This is a practice test. In the actual examination, the number of questions and the time limit in each test may vary.</li>
        <li>This is a computer-based aptitude test, which contains a total of five tests.</li>
        <li>Before the start of each test, instructions related to that specific test will be displayed on the computer screen which will have the number of questions, time limit, method of solving the questions and examples to explain the test process.</li>
        <li>Candidates are expected to read and understand these instructions carefully so that they can answer the questions correctly during the main examination.</li>
        <li>The test will begin automatically, once the allotted time of the instruction screen ends.</li>
        <li>The first test will be the Memory Test.</li>
        <li>Except for the Memory Test, during all other tests, if you wish to view the instructions again, click on the <Btn>Group Instructions</Btn> button located at the top-right corner of the screen. The relevant instructions for the respective test will be displayed.</li>
        <li>It is advised that you understand the Memory Test properly within the stipulated time using the given examples so that you can save time during the actual test.</li>
        <li>To revisit the general instructions, click on the <Btn>Instructions</Btn> button at the top-right corner of the screen.</li>
        <li>After each test, a 01 minute break will be provided so that you can prepare mentally for the next test.</li>
        <li>During the test, you can view the questions by scrolling up-down or left-right using your computer mouse, as per your convenience.</li>
        <li>A countdown timer will be displayed at the top-right corner of the screen throughout the test, showing the remaining time in minutes and seconds.</li>
        <li>When the timer reaches zero (0), the respective test will end automatically.</li>
      </ol>

      <h3 className="mt-5 font-bold">Specific Instructions Related to the Tests</h3>
      <Section hi="Test 1: Memory Test" items={[
        "This test is divided into two parts. Each part includes a memory screen followed by a test screen.",
        "After the instruction screen, the memory screen will be displayed, followed by the test screen.",
        "Similarly, the second part will also be displayed.",
        "There will be a 1-minute break between the two parts.",
        "The number of questions and time limit may vary in the actual test.",
      ]} en />
      <Section hi="Test 2: Following Directions Test" items={[
        "In this test, you will have to answer questions based on following the given instructions.",
        "Note that in the actual test, the number of questions and time limit may vary.",
      ]} en />
      <Section hi="Test 3: Depth Perception Test" items={[
        "There will be questions based on group of blocks.",
        "The questions are shown in parts.",
        "After each part, there will be a “Save & Next” button. Only upon clicking this button will the next part open.",
        "In the actual test, the number of questions and time limit may vary.",
      ]} en />
      <Section hi="Test 4: Power of Observation Test" items={[
        "This test contains questions based on power of observation.",
        "The questions are shown in parts.",
        "After each part, the “Save & Next” button will appear. Only after clicking this button will the next part open.",
        "In the actual test, the number of questions and time limit may vary.",
      ]} en />
      <Section hi="Test 5: Perceptual Speed Test" items={[
        "This test contains questions based on perceptual speed.",
        "The questions are shown in parts.",
        "After each part, the “Save & Next” button will appear. Only after clicking this button will the next part open.",
        "In the actual test, the number of questions and time limit may vary.",
      ]} en />

      <h3 className="mt-5 font-bold">Method of Solving and Answering Questions</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-7">
        <li>To select an answer, click on the desired option using the mouse.</li>
        <li>Your answer is saved automatically after each click.</li>
        <li>To change an answer, click on a different option.</li>
        <li>During the break after each test, the screen will show how many questions you answered and how many you left.</li>
      </ol>

      <h3 className="mt-5 font-bold">Important Points to Remember Before the Test</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-7">
        <li>To perform well in the main exam, understand example of each test carefully.</li>
        <li>Maintain absolute concentration on each question to score maximum marks.</li>
        <li>Pay special attention to the time limit and try to solve all questions within the allotted time.</li>
        <li>If any question seems difficult, do not spend too much time on it; move on to the next question.</li>
        <li>At the end of each test and before the next test starts, you will get a 1-minute break during which the screen will display how many questions you have answered and how many you have skipped.</li>
        <li>Use the break time to mentally relax so you can remain focused for the next test.</li>
        <li>Pay equal attention to each test to ensure optimal performance in all tests.</li>
      </ol>
      <p className="mt-4 text-center font-bold">Best wishes for the exam!</p>
    </div>
  );
}

function Section({ hi, items, en = false }: { hi: string; items: string[]; en?: boolean }) {
  return (
    <div className="mt-3" lang={en ? "en" : "hi"}>
      <h4 className="font-bold">{hi}</h4>
      <ol className="mt-1 list-decimal space-y-1 pl-7">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>
    </div>
  );
}

/** The dark button as drawn in the header, inline in the text. */
function Btn({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded-sm bg-[#333333] px-1.5 py-0.5 align-middle text-[11px] font-bold text-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <span className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-[#2a8fd6] text-[9px] italic">i</span>
      {children}
    </span>
  );
}

/** The general instructions reopened from the header during the test. */
export function GeneralInstructionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const body = useRef<HTMLDivElement | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Instructions">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-[#2a7fc0] px-5 py-2 text-white">
          <h2 className="text-[15px] font-bold">Instructions</h2>
          <span className="text-[12px] text-white/85">Note that the timer is ticking while you read the instructions. Close this page to return to answering the questions.</span>
          <button type="button" onClick={onClose} className="ml-auto rounded bg-white px-4 py-1 text-[13px] font-semibold text-[#2a7fc0] hover:bg-blue-50" data-allow-mouse="true">
            Close
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          <div ref={body} className="wt-scroll-host h-full pr-[9px]">
            <GeneralInstructionsBody />
          </div>
          <ScrollRail target={body} axis="vertical" />
        </div>
      </div>
    </div>
  );
}
