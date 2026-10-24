import type { InstructionBlock } from "./types";
import { yesNoQuestions } from "./yesno";
import { findDigitOf, findQuestions } from "./find";

/**
 * The instruction screen a new Perceptual Speed paper starts with: the
 * wording of the real test, with this paper's timing written in. The
 * institute edits it like any other paper's instructions.
 */
export function figureInstructions(testMin: number, instructionMin: number): InstructionBlock[] {
  const min = (n: number, en: boolean) => (en ? `${n} minute${n === 1 ? "" : "s"}` : `${n} मिनट`);
  return [
    {
      en: "This is a test of your ability to match figures quickly and accurately. In each question, a figure is given, below which there are five figures. You are required to find out which of the five figures is identical to the figure given above.",
      hi: "यह आकृतियों को शीघ्रता से सही मिलान करने की योग्यता का परीक्षण है। प्रत्येक प्रश्न में एक आकृति दी गई है, जिसके नीचे पाँच आकृतियाँ हैं। आपको यह बताना है कि नीचे दी गई पाँचों आकृतियों में से कौन-सी आकृति ऊपर दी गई आकृति के समान (एक जैसी) है।",
    },
    {
      en: `The time limit for the test is ${min(testMin, true)}.`,
      hi: `इस परीक्षण हेतु समय सीमा ${min(testMin, false)} है।`,
    },
    {
      en: "Give answer by clicking on the appropriate answer option through the mouse.",
      hi: "अपना उत्तर माउस की सहायता से उपयुक्त विकल्प पर क्लिक करके दें।",
    },
    {
      en: `You have ${min(instructionMin, true)} to read these instructions. When that time is over the test begins by itself. Press Skip Instruction to begin sooner.`,
      hi: `इन निर्देशों को पढ़ने के लिए आपके पास ${min(instructionMin, false)} हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।`,
    },
  ];
}

/**
 * The instruction screen each picture paper starts with, in the wording of
 * the real test as far as it is known, with this paper's timing written
 * in. The institute edits it like any other paper's instructions.
 */
/** "3 minutes" / "3 मिनट". */
function minutes(n: number, en: boolean): string {
  return en ? `${n} minute${n === 1 ? "" : "s"}` : `${n} मिनट`;
}

/** The closing lines of every picture test's instructions: the clock, the mouse, and the time to read. */
function timingBlocks(testMin: number, instructionMin: number): InstructionBlock[] {
  return [
    {
      en: `The time limit for the test is ${minutes(testMin, true)}.`,
      hi: `इस परीक्षण हेतु समय सीमा ${minutes(testMin, false)} है।`,
    },
    {
      en: "Give answer by clicking on the appropriate answer option through the mouse.",
      hi: "अपना उत्तर माउस की सहायता से उपयुक्त विकल्प पर क्लिक करके दें।",
    },
    {
      en: `You have ${minutes(instructionMin, true)} to read these instructions. When that time is over the test begins by itself. Press Skip Instruction to begin sooner.`,
      hi: `इन निर्देशों को पढ़ने के लिए आपके पास ${minutes(instructionMin, false)} हैं। यह समय समाप्त होते ही परीक्षण स्वतः प्रारंभ हो जाएगा। जल्दी शुरू करने के लिए Skip Instruction दबाएँ।`,
    },
  ];
}

/**
 * The instruction screen of one part of a test whose parts are introduced
 * one by one, as the hall's new Memory Test is: Part 1 the street map and
 * its automobiles, Part 2 the railway map and its rail signals, each in
 * the mock's own words with its own clock. Null for a test whose one
 * instruction screen covers every part.
 */
export function partInstructions(category: string, part: number, testMin: number, instructionMin: number, studyMin = 0): InstructionBlock[] | null {
  if (category === "signal") return signalPartInstructions(part, testMin, instructionMin, studyMin);
  if (category !== "vehicle") return null;
  const study = studyMin || 1;
  const text: InstructionBlock =
    part === 0
      ? {
          en: `This is the first part of the test of memory. In this part there is a Study screen and then a Test screen. On the Study screen you will see a street map with some automobiles shown on it. Your task is to memorise the location of these automobiles, for ${minutes(study, true)}. After that the Test screen will appear. On this screen you will find the same street map having the English letters A, B, C and D in place of the automobiles, and beside it the automobiles one by one as questions. You are required to recall the location of each automobile on the map. The letter that shows the location of the automobile on the map is your answer.`,
          hi: `यह स्मृति परीक्षण का पहला भाग है। इस भाग में एक अध्ययन स्क्रीन और फिर एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर आप एक मार्ग मानचित्र देखेंगे जिसमें कुछ वाहन प्रदर्शित हैं। आपको मानचित्र में इन वाहनों की स्थिति ${minutes(study, false)} तक याद करनी है। उसके बाद परीक्षण स्क्रीन दिखाई देगी। इस स्क्रीन पर आपको वही मार्ग मानचित्र मिलेगा किंतु वाहनों की जगह अंग्रेज़ी अक्षर A, B, C तथा D होंगे, और उसके पास प्रश्न के रूप में एक-एक वाहन। आपको मानचित्र में प्रत्येक वाहन की स्थिति बतानी है। वह अक्षर जो मानचित्र में वाहन के स्थान पर आता है, आपका उत्तर होगा।`,
        }
      : {
          en: `This is the second part of the test of memory. In this part there is a Study screen and then a Test screen. On the Study screen you will see a railway map with rail signals. Your task is to memorise the location of the rail signals, for ${minutes(study, true)}. After that the Test screen will appear. On this screen you will find the same railway map having the English letters A, B, C and D in place of the rail signals, and beside it the rail signals one by one as questions. You are required to recall the location of each rail signal on the map. The letter that shows the position of the rail signal on the map is your answer.`,
          hi: `यह स्मृति परीक्षण का दूसरा भाग है। इस भाग में एक अध्ययन स्क्रीन और फिर एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर आप एक रेल मानचित्र देखेंगे जिसमें कुछ रेल संकेत प्रदर्शित हैं। आपको मानचित्र में इन रेल संकेतों की स्थिति ${minutes(study, false)} तक याद करनी है। उसके बाद परीक्षण स्क्रीन दिखाई देगी। इस स्क्रीन पर आपको वही रेल मानचित्र मिलेगा किंतु रेल संकेतों की जगह अंग्रेज़ी अक्षर A, B, C तथा D होंगे, और उसके पास प्रश्न के रूप में एक-एक रेल संकेत। आपको मानचित्र में प्रत्येक संकेत की स्थिति बतानी है। वह अक्षर जो रेल मानचित्र में संकेत के स्थान पर आता है, वही आपका उत्तर होगा।`,
        };
  return [text, ...timingBlocks(testMin, instructionMin)];
}

/**
 * The Rail Signal Position Test's two sections, each a railway map with
 * symbols on it, in the words of the railway's second mock link for CEN
 * 01/2025; only "first" and "second" differ between them.
 */
function signalPartInstructions(part: number, testMin: number, instructionMin: number, studyMin = 0): InstructionBlock[] {
  const study = studyMin || 1;
  const nth = part === 0 ? "first" : part === 1 ? "second" : "next";
  const nthHi = part === 0 ? "प्रथम" : part === 1 ? "द्वितीय" : "अगला";
  const text: InstructionBlock = {
    en: `This is the ${nth} section of the test of memory. This section is in two parts. In the first part there is a study screen and in the second part there is a test screen. On the study screen you will see a railway map with symbols. Your task is to memorise the location of the symbols. After the allotted time of ${minutes(study, true)} you will be asked to go to the test screen. On this screen you will find the same railway map having the English alphabets A, B, C and D in place of the symbols, and beside it the symbols one by one as questions. You are required to recall the location of each symbol in the map. The option of the alphabet that shows the position of the symbol in the map will be your answer.`,
    hi: `यह स्मृति परीक्षण का ${nthHi} खंड है। इस खंड में दो भाग हैं। प्रथम भाग में एक अध्ययन स्क्रीन और दूसरे भाग में एक परीक्षण स्क्रीन होगा। अध्ययन स्क्रीन पर आप एक रेल मानचित्र देखेंगे जिसमें कुछ चिन्ह दिए गए हैं। आपको मानचित्र में इन चिन्हों की स्थिति याद करनी है। ${minutes(study, false)} के नियत समय के बाद आपको परीक्षण स्क्रीन दिखाई देगी। इस स्क्रीन पर आपको वही रेल मानचित्र मिलेगा किंतु चिन्हों की जगह अंग्रेज़ी अक्षर A, B, C तथा D होंगे, और उसके पास प्रश्न के रूप में एक-एक चिन्ह। आपको मानचित्र में प्रत्येक चिन्ह की स्थिति बतानी है। वह अक्षर का विकल्प जो रेल मानचित्र में चिन्ह के स्थान पर आता है, वही आपका उत्तर होगा।`,
  };
  return [text, ...timingBlocks(testMin, instructionMin)];
}

export function pictureInstructions(
  category: string,
  testMin: number,
  instructionMin: number,
  studyMin = 0,
): InstructionBlock[] {
  const min = minutes;
  const timing = timingBlocks(testMin, instructionMin);
  switch (category) {
    case "memory":
      return [
        {
          en: `This is a test of memory. The test is in parts. In each part there is a Study screen and a Test screen. On the Study screen, sets of some shapes are given for ${min(studyMin || 1, true)}. Your task is to memorise these sets of shapes. After the allotted time the Test screen will appear. On the Test screen, for each problem you will find five options A, B, C, D and E. One of the options shows a set of shapes exactly similar to one you have seen on the Study screen.`,
          hi: `यह स्मृति का परीक्षण है। यह परीक्षण भागों में है। प्रत्येक भाग में एक अध्ययन स्क्रीन और एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर कुछ आकृतियों के सेट ${min(studyMin || 1, false)} के लिए दिए गए हैं। आपको आकृतियों के इन सेटों को याद करना है। नियत समय के बाद परीक्षण स्क्रीन दिखेगी। परीक्षण स्क्रीन पर प्रत्येक प्रश्न में आपको पाँच विकल्प A, B, C, D और E मिलेंगे। इनमें से एक विकल्प में आकृतियों का सेट बिल्कुल वैसा होगा जैसा आपने अध्ययन स्क्रीन पर देखा है।`,
        },
        ...timing,
      ];
    case "house":
      return [
        {
          en: `This is a test of memory, in two parts. In each part there is a Study screen and a Test screen. On the Study screen you will see a map with houses and other structures on it for ${min(studyMin || 2, true)}. Your task is to memorise where each house stands. After the allotted time the Test screen will appear: the same map with the letters A, B, C, D and E in place of the houses, and beside it the houses one by one as questions. For each house shown, find the letter that marks where it stood on the Study map. Mark your answer by clicking the mouse.`,
          hi: `यह स्मृति का परीक्षण है, दो भागों में। प्रत्येक भाग में एक अध्ययन स्क्रीन और एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर आपको ${min(studyMin || 2, false)} के लिए एक नक्शा दिखेगा जिस पर मकान और अन्य आकृतियाँ अंकित हैं। आपको याद करना है कि हर मकान कहाँ है। नियत समय के बाद परीक्षण स्क्रीन आएगी: वही नक्शा जिसमें मकानों की जगह A, B, C, D और E अक्षर हैं, और उसके पास प्रश्न के रूप में एक-एक मकान। हर दिखाए गए मकान के लिए वह अक्षर खोजें जो अध्ययन नक्शे में उसकी जगह दिखाता है। उत्तर माउस क्लिक करके दें।`,
        },
        ...timing,
      ];
    case "fignum":
      return [
        {
          en: `This is a test of memory, in two parts. In each part there is a Study screen and a Test screen. On the Study screen you will be given picture and number pairs to memorise for ${min(studyMin || 3, true)}. After the allotted time the Test screen will appear, showing the pictures in a different order. For each picture, pick the number that went with it out of the four options given. Mark your answer by clicking the mouse.`,
          hi: `यह स्मृति का परीक्षण है, दो भागों में। प्रत्येक भाग में एक अध्ययन स्क्रीन और एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर आपको ${min(studyMin || 3, false)} के लिए चित्र-अंक के जोड़े याद करने को दिए जाएँगे। नियत समय के बाद परीक्षण स्क्रीन आएगी जिस पर चित्र अलग क्रम में होंगे। हर चित्र के लिए दिए गए चार विकल्पों में से वह अंक चुनें जो उसके साथ था। उत्तर माउस क्लिक करके दें।`,
        },
        ...timing,
      ];
    case "railway":
      return [
        {
          en: `This is a test of memory, in two parts. In each part there is a Study screen and a Test screen. On the Study screen you will see a railway map with the names of some railway stations for ${min(studyMin || 2, true)}. Your task is to memorise the location of the stations. After the allotted time the Test screen will appear: the same railway map with the English letters A, B, C, D and E in place of the stations, and the names of the stations beside it. For each station, the letter that shows its position on the map is your answer. Mark your answer by clicking the mouse.`,
          hi: `यह स्मृति का परीक्षण है, दो भागों में। प्रत्येक भाग में एक अध्ययन स्क्रीन और एक परीक्षण स्क्रीन है। अध्ययन स्क्रीन पर आपको ${min(studyMin || 2, false)} के लिए एक रेलवे मानचित्र दिखेगा जिसमें कुछ स्टेशनों के नाम हैं। आपको स्टेशनों की स्थिति याद करनी है। नियत समय के बाद परीक्षण स्क्रीन आएगी: वही रेलवे मानचित्र जिसमें स्टेशनों की जगह अंग्रेज़ी अक्षर A, B, C, D और E हैं, और पास में स्टेशनों के नाम। हर स्टेशन के लिए वह अक्षर जो मानचित्र में उसकी स्थिति दिखाता है, आपका उत्तर है। उत्तर माउस क्लिक करके दें।`,
        },
        ...timing,
      ];
    case "vehicle":
    case "signal":
      // The first part's screen; the second part has a screen of its own
      // on the clock (see partInstructions).
      return partInstructions(category, 0, testMin, instructionMin, studyMin) ?? [];
    case "figfig":
      return [
        {
          en: `This is a test of memory, in two parts. In each part there is a Memory screen and an Answer screen. On the Memory screen you will be given pairs of pictures to memorise for ${min(studyMin || 3, true)}. After the allotted time the Answer screen will appear. Against each picture you will find four pictures A, B, C and D; your task is to find the one that was paired with it on the Memory screen. Mark your answer by clicking the mouse.`,
          hi: `यह स्मृति का परीक्षण है, दो भागों में। प्रत्येक भाग में एक स्मृति स्क्रीन और एक उत्तर स्क्रीन है। स्मृति स्क्रीन पर आपको ${min(studyMin || 3, false)} के लिए आकृतियों के जोड़े याद करने को दिए जाएँगे। नियत समय के बाद उत्तर स्क्रीन आएगी। हर आकृति के सामने चार आकृतियाँ A, B, C और D मिलेंगी; आपको वह खोजनी है जो स्मृति स्क्रीन पर उसके साथ जुड़ी थी। उत्तर माउस क्लिक करके दें।`,
        },
        ...timing,
      ];
    case "brick":
      return [
        {
          en: "In this test you will see a pile of bricks with some bricks labelled A, B, C, D and E. Your task is to count the number of bricks that are touching the brick of the pile that has any one of the letters on it. All bricks are of the same size and shape.",
          hi: "आप इस परीक्षण में ईंटों का एक समूह देखेंगे जिसमें कुछ ईंटों पर A, B, C, D एवं E लिखा होगा। आपको उन ईंटों की गणना करनी है जो समूह में उन ईंटों को छू रही हैं जिन पर इनमें से कोई एक अक्षर दिया गया है। सभी ईंटें समान आकार एवं माप की हैं।",
        },
        ...timing,
      ];
    case "depth":
      return [
        {
          en: "In each item of this test, you will see a pile of blocks. Each block is of the same shape and size. Your task is to count the number of blocks having all sides and corners hidden by the other blocks. Please remember that there are always three blocks in the base of the farthest row.",
          hi: "आप इस परीक्षण के प्रत्येक प्रश्न में ब्लाक्स (गुटकों) का एक ढेर देखेंगे। सारे ब्लाक्स एक ही आकार और माप के हैं। ढेर में आपको उन ब्लाक्स की गिनती करनी है जिनकी सभी सतहें और किनारे पूर्ण रूप से अन्य ब्लाक्स से छिपे हुए हैं। कृपया याद रखें कि सबसे पीछे की पंक्ति के आधार में सदैव तीन ब्लाक्स (गुटके) ही होंगे।",
        },
        ...timing,
      ];
    case "yesno":
      return [
        {
          en: "This is a test to find out how quickly you can compare two numbers and decide whether or not they are the same. In each question two numbers are given side by side. If the numbers are the same, select 'Y'; otherwise select 'N' by clicking the mouse.",
          hi: "इस परीक्षण में आपको दिये गये दो अंक समूहों के बीच शीघ्रता से तुलना करनी है और यह तय करना है कि वे एक जैसे हैं या भिन्न। प्रत्येक प्रश्न में दो संख्याएँ आमने-सामने दी गई हैं। यदि अंक समान हैं तो माउस की सहायता से 'Y' चुनें, अन्यथा 'N' चुनें।",
        },
        ...timing,
      ];
    case "find6":
    case "find9": {
      const d = findDigitOf(category) ?? "6";
      return [
        {
          en: `In this test you will find four groups (A, B, C and D) of digits. Your task is to find out the group of digits which contains a '${d}' and indicate your answer by clicking the mouse. In case the digit '${d}' appears in more than one group, your answer will be 'E'.`,
          hi: `इस परीक्षण के प्रत्येक प्रश्न में अंकों के चार समूह (A, B, C और D) दिये गये हैं। आपको यह पता करना है कि किस अंक समूह में '${d}' का अंक आया है तथा माउस से क्लिक करके उत्तर देना है। यदि किसी प्रश्न में एक से अधिक अंक समूहों में '${d}' आता है तो आपका उत्तर 'E' होगा।`,
        },
        ...timing,
      ];
    }
    case "observation":
      return [
        {
          en: "This test measures your ability to quickly observe and compare figures given in two sets. In this test you will be shown two sets 'A' and 'B' of figures in a sequence to observe. Your task is to find out whether the placement of each figure in set A is exactly similar to the placement of figures in set B or there is some difference. If the placement of each figure in both the sets is exactly similar then your answer will be 'A'; if there are two differences in the placement of each figure you have to give answer 'B'; if there are three differences then your answer will be 'C'; and if there are four differences then your answer will be 'D'. In this test there will be either no difference or a minimum of 2 and maximum of 4 differences in the placement of each figure.",
          hi: "यह परीक्षण शीघ्रता के साथ दो सेटों में दिये गये चित्रों की तुलना करने की आपकी योग्यता का माप करता है। इस परीक्षण में कुछ चित्र क्रम से सेट 'A' तथा सेट 'B' के माध्यम से दिखाए जाएंगे। आपको यह बताना है कि सेट 'A' में दिये गये चित्रों का स्थान सेट 'B' में दिए गए चित्रों के स्थान क्रम के बिल्कुल समान है अथवा कुछ भिन्न है। यदि दोनों सेटों के स्थान क्रम में पूर्ण समानता है तो उत्तर 'A' होगा; यदि दो चित्रों के स्थान क्रम में अंतर है तो उत्तर 'B' होगा; यदि तीन चित्रों के स्थान क्रम में अंतर है तो उत्तर 'C' होगा; इसी प्रकार यदि चार चित्रों के स्थान क्रम में अंतर है तो उत्तर 'D' होगा। इस परीक्षण में चित्रों के स्थान क्रम में या तो कोई अंतर नहीं होगा या स्थान क्रम में कम से कम दो और अधिकतम चार अंतर होगा।",
        },
        ...timing,
      ];
    case "similarity":
      return [
        {
          en: "This is a test of how rapidly you can see figures in order to match them. On each sheet four figures, a, b, c and d, are given at the left. For each one, look at the five figures A, B, C, D and E at its right and find the one that is most nearly like it. Give your answer by clicking the mouse.",
          hi: "यह आकृतियों के दो सेटों का शीघ्रता से मिलान करने की योग्यता का परीक्षण है। प्रत्येक पृष्ठ पर बाईं ओर चार आकृतियाँ a, b, c और d दी गई हैं। हर एक के लिए दाईं ओर बनी पाँच आकृतियों A, B, C, D और E में से वह आकृति खोजें जो उससे सबसे अधिक मिलती है। अपना उत्तर माउस क्लिक करके दें।",
        },
        ...timing,
      ];
    case "similarity2":
      return [
        {
          en: "This is a test of how rapidly you can see objects in order to match them. On each sheet four objects, a, b, c and d, are given at the left. For each one, look at the five objects A, B, C, D and E at its right and find the one that is most nearly like it. Give your answer by clicking the mouse.",
          hi: "यह वस्तुओं के दो सेटों का शीघ्रता से मिलान करने की योग्यता का परीक्षण है। प्रत्येक पृष्ठ पर बाईं ओर चार वस्तुएँ a, b, c और d दी गई हैं। हर एक के लिए दाईं ओर बनी पाँच वस्तुओं A, B, C, D और E में से वह खोजें जो उससे सबसे अधिक मिलती है। अपना उत्तर माउस क्लिक करके दें।",
        },
        ...timing,
      ];
    case "octagonal":
      return [
        {
          en: "This is a test of your ability to match figures quickly. A figure is given on the left side. On the right side there are five other figures. You are required to find out which of the five figures is identical to the figure given on the left.",
          hi: "यह आकृतियों के शीघ्रतापूर्वक मिलान करने की योग्यता का परीक्षण है। बाईं तरफ एक आकृति दी गयी है; दाहिनी तरफ पाँच अन्य आकृतियाँ दी गयी हैं। आपको यह पता करना है कि पाँचों आकृतियों में से कौन सी आकृति बाईं ओर दी गयी आकृति के समान है।",
        },
        ...timing,
      ];
    case "circle":
      return [
        {
          en: "This is a test of your ability to match figures quickly and accurately. In each problem a figure is given at the left followed by figures A, B, C, D and E on the right hand side. You are to find out which of these five figures is exactly similar to the figure given on the left. Indicate your answers by clicking the mouse.",
          hi: "यह आकृतियों के शीघ्रतापूर्वक सही मिलान करने की योग्यता का परीक्षण है। प्रत्येक समस्या में बाईं ओर एक आकृति मिलेगी जिसके दाईं ओर A, B, C, D एवं E आकृतियाँ दी हुई हैं। आपको ज्ञात करना है कि इन पाँच आकृतियों में से कौन सी आकृति बाईं ओर दी आकृति से पूर्णतया मिलती है। आपको माउस से क्लिक करके उत्तर देना होगा।",
        },
        ...timing,
      ];
    default:
      return figureInstructions(testMin, instructionMin);
  }
}

/** The worked-example paragraphs of the Octagonal and Same Circle Tests; the institute adds its example pictures under them. */
export const OCTAGONAL_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For the first example the correct answer is 'D'. Similarly the correct answers for examples 2 and 3 are 'A' and 'D' respectively.",
    hi: "पहले उदाहरण के लिए सही उत्तर 'D' है। इसी प्रकार अभ्यास 2 एवं 3 का सही उत्तर क्रमशः 'A' एवं 'D' है।",
  },
];
export const CIRCLE_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "The correct answer for practice problem 1 is 'C', and for 2 it is 'B'.",
    hi: "अभ्यास समस्या 1 का सही उत्तर 'C', 2 का 'B' है।",
  },
];

/** The example paragraphs a picture-matching test starts with. */
export function matchingExampleText(category: string): InstructionBlock[] {
  return category === "octagonal" ? OCTAGONAL_EXAMPLE_TEXT : category === "circle" ? CIRCLE_EXAMPLE_TEXT : FIGURE_EXAMPLE_TEXT;
}

/** The worked-example paragraphs; the institute adds its example pictures under them. */
export const FIGURE_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For the first example the correct answer is 'A'. Similarly the correct answers for examples 2 and 3 are 'B' and 'D' respectively.",
    hi: "पहले उदाहरण के लिए सही उत्तर 'A' है। इसी प्रकार अभ्यास 2 एवं 3 का सही उत्तर क्रमशः 'B' एवं 'D' है।",
  },
];

/** The letters the options are named by, in order. */
export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/** How many figures a question offers; the real test shows five. */
export const DEFAULT_OPTION_COUNT = 5;
export const MAX_OPTION_COUNT = OPTION_LETTERS.length;
/** Numbered options run 1, 2, 3 …; the Depth Perception test offers ten. */
export const MAX_NUMBER_OPTIONS = 12;

export type OptionStyle = "letters" | "numbers";

/** The option values a question offers, in order: A, B, C … or 1, 2, 3 … */
export function optionValues(style: OptionStyle, count: number): (string | number)[] {
  if (style === "numbers") return Array.from({ length: count }, (_, i) => i + 1);
  return [...OPTION_LETTERS.slice(0, count)];
}

/** How large a picture test draws its pictures when the paper does not say: percent of the usual size. */
export function defaultPictureScale(category: string | undefined): number {
  return category === "depth" || category === "brick" || category === "similarity" || category === "similarity2" || category === "house" || category === "railway" || category === "vehicle" || category === "signal"
    ? 225
    : category === "memory" || category === "fignum" || category === "figfig"
      ? 140
      : 100;
}

/** The sizes offered in the settings. */
export const PICTURE_SCALES = [75, 100, 125, 140, 150, 200, 225, 250] as const;

/** What each picture test offers by default; the admin may change it per upload. */
export function defaultOptionsFor(category: string): { style: OptionStyle; count: number } {
  switch (category) {
    case "depth":
    case "brick":
      return { style: "numbers", count: 10 };
    case "similarity":
    case "similarity2":
      return { style: "letters", count: 5 };
    case "fignum":
    case "figfig":
      return { style: "letters", count: 4 };
    case "observation":
    case "vehicle":
    case "signal":
      return { style: "letters", count: 4 };
    default:
      return { style: "letters", count: DEFAULT_OPTION_COUNT };
  }
}
/** The worked example the Yes or No Test's instruction screen shows: the guideline's own five pairs. */
export const YESNO_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.   589 = 589", hi: "1.   589 = 589" },
  { en: "2.   2768 = 2786", hi: "2.   2768 = 2786" },
  { en: "3.   36463 = 36462", hi: "3.   36463 = 36462" },
  { en: "4.   712963 = 712963", hi: "4.   712963 = 712963" },
  { en: "5.   487562 = 487652", hi: "5.   487562 = 487652" },
  {
    en: "The answers for the above questions are 'Y', 'N', 'N', 'Y' and 'N'.",
    hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः 'Y', 'N', 'N', 'Y' और 'N' हैं।",
  },
];

/** The worked examples the Find tests' instruction screens show: the guideline's own rows. */
export const FIND6_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.  A 72383514  B 98734521  C 12947685  D 39587421", hi: "1.  A 72383514  B 98734521  C 12947685  D 39587421" },
  { en: "2.  A 1354931582  B 2943587138  C 7823945125  D 4793268251", hi: "2.  A 1354931582  B 2943587138  C 7823945125  D 4793268251" },
  { en: "3.  A 7938210435  B 5938204751  C 8475210239  D 3897104652", hi: "3.  A 7938210435  B 5938204751  C 8475210239  D 3897104652" },
  { en: "4.  A 250389417  B 984057213  C 358164072  D 280157943", hi: "4.  A 250389417  B 984057213  C 358164072  D 280157943" },
  { en: "5.  A 47854323179  B 98423563172  C 31792428534  D 21374894579", hi: "5.  A 47854323179  B 98423563172  C 31792428534  D 21374894579" },
  { en: "The answers for the above questions are C, D, D, C and B.", hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः C, D, D, C और B हैं।" },
];
export const FIND9_EXAMPLE_TEXT: InstructionBlock[] = [
  { en: "1.  A 5462  B 5927  C 4282  D 2821", hi: "1.  A 5462  B 5927  C 4282  D 2821" },
  { en: "2.  A 73457  B 24674  C 32985  D 54838", hi: "2.  A 73457  B 24674  C 32985  D 54838" },
  { en: "3.  A 482942  B 2541248  C 2532184  D 5421482", hi: "3.  A 482942  B 2541248  C 2532184  D 5421482" },
  { en: "4.  A 2834  B 4382  C 8341  D 2932", hi: "4.  A 2834  B 4382  C 8341  D 2932" },
  { en: "5.  A 89537  B 38567  C 58974  D 28378", hi: "5.  A 89537  B 38567  C 58974  D 28378" },
  { en: "The answers for the above questions are B, C, A, D and E.", hi: "ऊपर दिये गये प्रश्नों के सही उत्तर क्रमशः B, C, A, D और E हैं।" },
];

/** The worked example the Brick Test's instruction screen gives: the institute adds the example pile's picture above it. */
export const BRICK_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "For example, in the pile above the brick with an 'A' on it touches two other bricks, viz., 'D' and 'E', hence the answer will be 2. Similarly bricks B, C and D and E touch 3, 3, 4 and 4 bricks respectively.",
    hi: "उदाहरण के लिए उपरोक्त समूह में 'A' वाली ईंट दो अन्य ईंटों 'D' और 'E' को छू रही है अतः उत्तर 2 होगा। इसी प्रकार B, C, D एवं E अक्षर वाली ईंटें क्रमशः 3, 3, 4 और 4 ईंटों को छू रही हैं।",
  },
];

/** The worked examples the Similarity Tests' instruction screens give: the institute adds the example sheet's picture above them. */
export const SIMILARITY_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "Look at the first figure 'a' at the left. Which one of the five at the right is most nearly like it? Figure D is the one, so the answer for 'a' is D. For the second figure 'b' the answer is C. For 'c' it is B, and for 'd' it is A.",
    hi: "बाईं ओर बनी पहली आकृति 'a' को देखें। दाईं ओर की पाँच आकृतियों में से कौन सी उससे सबसे अधिक मिलती है? आकृति D मिलती है, अतः 'a' का उत्तर D है। दूसरी आकृति 'b' का उत्तर C है। 'c' का उत्तर B और 'd' का उत्तर A है।",
  },
];
export const SIMILARITY2_EXAMPLE_TEXT: InstructionBlock[] = [
  {
    en: "Look at the first radio 'a' at the left. Which one of the five at the right is most nearly like it? Radio B is the one. For the second radio 'b' the answer is C. For 'c' it is A, and for 'd' it is D.",
    hi: "बाईं ओर बने पहले रेडियो 'a' को देखें। दाईं ओर के पाँच रेडियो में से कौन सा उससे सबसे अधिक मिलता है? रेडियो B मिलता है। दूसरे रेडियो 'b' का उत्तर C है। 'c' का उत्तर A और 'd' का उत्तर D है।",
  },
];

/** The example paragraphs a sheet test starts with. */
export function sheetExampleText(category: string): InstructionBlock[] {
  return category === "similarity" ? SIMILARITY_EXAMPLE_TEXT : category === "similarity2" ? SIMILARITY2_EXAMPLE_TEXT : BRICK_EXAMPLE_TEXT;
}

/** The lettered bricks of one pile: the five questions each pile asks, in order. */
export const BRICK_LETTERS = ["A", "B", "C", "D", "E"] as const;

/**
 * The sheet tests: one picture carries several questions. The Brick Test
 * (a pile, five lettered bricks A to E, answered by a number) and the two
 * Similarity Tests (a sheet of four figures a to d, each matched against
 * five, answered by a letter). The picture stands at the left of the
 * screen and its questions at the right.
 */
export interface SheetSpec {
  /** What one picture is called in the admin panel. */
  noun: string;
  /** The questions each picture asks, in order, as they are labelled on it. */
  prompts: readonly string[];
  /** What the result's topic breakdown calls a question: "Brick A", "Figure a". */
  topicPrefix: string;
  style: OptionStyle;
  count: number;
  /** How many pictures the hall gives, and its clock. */
  pictures: number;
  timeMin: number;
}

const SHEETS: Record<string, SheetSpec> = {
  brick: { noun: "pile", prompts: BRICK_LETTERS, topicPrefix: "Brick", style: "numbers", count: 10, pictures: 10, timeMin: 5 },
  similarity: { noun: "sheet", prompts: ["a", "b", "c", "d"], topicPrefix: "Figure", style: "letters", count: 5, pictures: 18, timeMin: 6 },
  similarity2: { noun: "sheet", prompts: ["a", "b", "c", "d"], topicPrefix: "Figure", style: "letters", count: 5, pictures: 18, timeMin: 6 },
};

/**
 * The map tests of the Memory battery (House Position, Railway Track
 * Route, Vehicle & Signal Position): after the study screen, one picture
 * per part at the left (the map lettered A to E, or A to D) and its
 * questions at the right, each a label (a house's number, a station's
 * name) or a picture (a vehicle) answered by a letter. The labels are
 * the admin's, typed with the picture.
 */
export interface MapSpec {
  noun: string;
  /** What the questions are called: "house", "station". */
  item: string;
  /**
   * What each part's questions are called when the parts differ (the
   * Vehicle & Signal Position Test: vehicles on a street map, then rail
   * signals on a railway map); `item` for every part otherwise.
   */
  partItems?: readonly string[];
  /** One line for the admin on how the parts differ, when they do. */
  partsNote?: string;
  /** The labels a part starts with, when they are always the same; null when the admin types them. */
  defaultLabels: string[] | null;
  /** The questions are pictures (the house to find), one uploaded per question, not labels typed. */
  pictureQuestions: boolean;
  topicPrefix: string;
  /** Questions per part, and the clock per part. */
  perPart: number;
  /** Whose count that is, for the admin: "in the hall" unless said otherwise (this portal's own setting, for the vehicle test). */
  countSource?: string;
  studyMin: number;
  partMin: number;
}

const MAPS: Record<string, MapSpec> = {
  house: { noun: "map", item: "house", defaultLabels: Array.from({ length: 12 }, (_, i) => String(i + 1)), pictureQuestions: true, topicPrefix: "House", perPart: 12, studyMin: 2, partMin: 2 },
  railway: { noun: "map", item: "station", defaultLabels: null, pictureQuestions: false, topicPrefix: "Station", perPart: 12, studyMin: 2, partMin: 2 },
  vehicle: {
    noun: "map",
    item: "vehicle",
    partItems: ["vehicle", "signal"],
    partsNote: "Part 1 is the street map with its vehicles; Part 2 the railway map with its rail signals, 12 questions in each as the House Position Test has (the railway's mock gave 3), and both parts must have the same count.",
    defaultLabels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
    pictureQuestions: true,
    topicPrefix: "Vehicle",
    perPart: 12,
    countSource: "on this portal",
    studyMin: 2.5,
    partMin: 2.5,
  },
  signal: {
    noun: "map",
    item: "signal",
    partsNote: "Part 1 and Part 2 are each a railway map with its rail signals, 12 questions in each, and both parts must have the same count.",
    defaultLabels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
    pictureQuestions: true,
    topicPrefix: "Signal",
    perPart: 12,
    countSource: "on this portal",
    studyMin: 2,
    partMin: 2,
  },
};

export function mapOf(category: string | null | undefined): MapSpec | null {
  return category ? (MAPS[category] ?? null) : null;
}

/** The Memory battery's schedule per test: study, then questions, part by part, with a break between. */
export function memorySchedule(category: string): { studyTimeMin: number; partTimeMin: number; breakTimeMin: number; questionsPerPart: number; partInstructionMin?: number } | null {
  switch (category) {
    case "memory":
      return { studyTimeMin: 1, partTimeMin: 1, breakTimeMin: 1, questionsPerPart: 3 };
    case "house":
    case "railway":
      return { studyTimeMin: 2, partTimeMin: 2, breakTimeMin: 1, questionsPerPart: 12 };
    case "vehicle":
      // Set like the House Position Test with half a minute more each way:
      // 2.5 minutes to study, 2.5 to answer and twelve questions a part, the
      // second part introduced on an instruction screen of its own with a
      // three-minute clock, as the railway's mock for CEN 01/2025 does. The
      // mock itself gave a minute, a minute and three questions a part, and
      // says the hall's own count and clock will vary.
      return { studyTimeMin: 2.5, partTimeMin: 2.5, breakTimeMin: 1, questionsPerPart: 12, partInstructionMin: 3 };
    case "signal":
      // The railway's second mock link for CEN 01/2025: two sections, each
      // introduced on an instruction screen of its own, a railway map with
      // symbols to study and the same map lettered to answer on; this
      // portal gives twelve questions a section, two minutes to study and
      // two to answer (the mock gave three, a minute and a minute).
      return { studyTimeMin: 2, partTimeMin: 2, breakTimeMin: 1, questionsPerPart: 12, partInstructionMin: 3 };
    case "fignum":
      return { studyTimeMin: 3, partTimeMin: 3, breakTimeMin: 1, questionsPerPart: 21 };
    case "figfig":
      return { studyTimeMin: 3, partTimeMin: 3, breakTimeMin: 1, questionsPerPart: 20 };
    default:
      return null;
  }
}

/** True for a test of the Memory battery: a study screen before each part's questions. */
export function isMemoryTest(category: string | null | undefined): boolean {
  return memorySchedule(category ?? "") !== null;
}

/** The sheet spec of a category, or null for a test whose pictures are one question each. */
export function sheetOf(category: string | null | undefined): SheetSpec | null {
  return category ? (SHEETS[category] ?? null) : null;
}

/** The most pictures the panel sends the server in one call. */
export const FIGURE_BATCH = 50;

/**
 * A tiny Perceptual Speed paper that ships with the portal, so the screen
 * can be seen before a database is connected. Its pictures are drawn
 * inline, so it needs no storage bucket. Like the bundled watch table, it
 * is not a paper any student can reach once a database is in place.
 */
function figureSvg(marks: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="10" y="10" width="100" height="100" rx="14" fill="#fff" stroke="#333" stroke-width="3"/>${marks}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
const STAR = '<path d="M60 28 l9 20 22 2 -17 14 5 22 -19 -12 -19 12 5 -22 -17 -14 22 -2z" fill="none" stroke="#333" stroke-width="3"/>';
const DOT = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="7" fill="#333"/>`;
const CROSS = (x: number, y: number) => `<path d="M${x - 8} ${y - 8} l16 16 M${x + 8} ${y - 8} l-16 16" stroke="#333" stroke-width="3"/>`;

const SHAPES = [
  STAR + DOT(30, 30) + CROSS(90, 90),
  STAR + DOT(90, 30) + CROSS(30, 90),
  STAR + DOT(30, 90) + CROSS(90, 30),
  STAR + DOT(90, 90) + CROSS(30, 30),
  STAR + DOT(60, 95) + CROSS(60, 25),
];

export const FIGURE_SAMPLE_ID = "perceptual-speed-sample";

export function figureSamplePaper() {
  const letters = OPTION_LETTERS.slice(0, 5);
  const questions = [0, 2, 4, 1].map((answerIndex, i) => {
    // Each question's options are the five figures in a different order,
    // and the answer is wherever the target figure landed.
    const order = SHAPES.map((_, k) => (k + i) % SHAPES.length);
    const target = SHAPES[answerIndex];
    return {
      id: `fs-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer: letters[order.indexOf(answerIndex)],
      working: { en: "", hi: "" },
      topic: "Same figure",
      image: figureSvg(target),
      optionImages: order.map((k) => figureSvg(SHAPES[k])),
    };
  });
  return {
    id: FIGURE_SAMPLE_ID,
    kind: "figure" as const,
    category: "figure",
    title: "Perceptual Speed Test",
    displayName: "Perceptual Speed Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: false, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: figureInstructions(1, 5),
    example: { table: { label: "Example", cells: [] }, text: FIGURE_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A tiny Memory Test, shipped like the Perceptual Speed sample: study screens on a short clock. */
export const MEMORY_SAMPLE_ID = "memory-sample";

export function memorySamplePaper() {
  const letters = OPTION_LETTERS.slice(0, 5);
  const study = [
    figureSvg(SHAPES[0]),
    figureSvg(SHAPES[3]),
  ];
  const questions = [0, 2, 3, 4].map((answerIndex, i) => {
    const order = SHAPES.map((_, k) => (k + i) % SHAPES.length);
    return {
      id: `ms-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer: letters[order.indexOf(answerIndex)],
      working: { en: "", hi: "" },
      topic: "Memory",
      optionImages: order.map((k) => figureSvg(SHAPES[k])),
    };
  });
  return {
    id: MEMORY_SAMPLE_ID,
    kind: "figure" as const,
    category: "memory",
    title: "Memory Test",
    displayName: "Memory Test - Sample",
    features: {
      showQuestionPaperButton: false,
      lockScroll: true,
      overflowQuestions: false,
      questionsPerPart: 2,
      // Seconds, not minutes, so the sample can be watched through: 3 s to
      // study, 3 s of questions, per part.
      studyTimeMin: 0.05,
      partTimeMin: 0.05,
      breakTimeMin: 0.05,
      studyImages: study,
    },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("memory", 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A tiny Power of Observation paper, for seeing the Set A / Set B layout before a database exists. */
export const OBSERVATION_SAMPLE_ID = "observation-sample";

export function observationSamplePaper() {
  const glyphs = ["★", "●", "■", "▲", "◆", "✚"];
  const row = (order: number[], swap: [number, number] | null) => {
    const b = [...order];
    if (swap) [b[swap[0]], b[swap[1]]] = [b[swap[1]], b[swap[0]]];
    const text = (arr: number[], x0: number) =>
      arr.map((g, i) => `<text x="${x0 + i * 40}" y="42" font-size="30" text-anchor="middle" fill="#111">${glyphs[g]}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="60" viewBox="0 0 560 60">${text(order, 30)}<line x1="265" y1="6" x2="265" y2="54" stroke="#111" stroke-width="2"/>${text(b, 300)}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const letters = OPTION_LETTERS.slice(0, 4);
  const items: [number[], [number, number] | null, string][] = [
    [[0, 1, 2, 3, 4, 5], null, "A"],
    [[5, 4, 3, 2, 1, 0], [0, 5], "B"],
    [[2, 0, 4, 1, 5, 3], [1, 2], "B"],
    [[1, 3, 5, 0, 2, 4], null, "A"],
  ];
  return {
    id: OBSERVATION_SAMPLE_ID,
    kind: "figure" as const,
    category: "observation",
    title: "Power of Observation Test",
    displayName: "Power of Observation Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("observation", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions: items.map(([order, swap, answer], i) => ({
      id: `os-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer,
      working: { en: "", hi: "" },
      topic: "Observation",
      image: row(order, swap),
    })),
    resultView: {},
  };
}

/** A tiny Depth Perception paper: a scene per question, drawn half as large again, answered by a letter. */
export const DEPTH_SAMPLE_ID = "depth-sample";

export function depthSamplePaper() {
  // Four blocks at different "depths": the nearest is the largest and lowest.
  const scene = (sizes: number[]) => {
    const rects = sizes
      .map((sz, i) => `<rect x="${30 + i * 70}" y="${70 - sz}" width="${sz}" height="${sz}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${30 + i * 70 + sz / 2}" y="${70 - sz - 6}" font-size="14" text-anchor="middle" fill="#111">${OPTION_LETTERS[i]}</text>`)
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><line x1="10" y1="72" x2="310" y2="72" stroke="#999"/>${rects}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const letters = OPTION_LETTERS.slice(0, 4);
  const items: [number[], string][] = [
    [[50, 30, 40, 20], "A"],
    [[20, 50, 30, 40], "B"],
    [[30, 20, 50, 40], "C"],
    [[40, 30, 20, 50], "D"],
  ];
  return {
    id: DEPTH_SAMPLE_ID,
    kind: "figure" as const,
    category: "depth",
    title: "Depth Perception Test",
    displayName: "Depth Perception Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 2 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("depth", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions: items.map(([sizes, answer], i) => ({
      id: `ds-q${i + 1}`,
      tableIndex: 0,
      prompt: { en: "", hi: "" },
      options: [...letters],
      answer,
      working: { en: "", hi: "" },
      topic: "Depth",
      image: scene(sizes),
    })),
    resultView: {},
  };
}

/** A Yes or No paper at the hall's size, built from a fixed seed, for seeing the screen before a database exists. */
export const YESNO_SAMPLE_ID = "yes-or-no-sample";

export function yesNoSamplePaper() {
  return {
    id: YESNO_SAMPLE_ID,
    kind: "figure" as const,
    category: "yesno",
    title: "Yes or No Test",
    displayName: "Yes or No Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 24 },
    timeLimitMin: 4,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("yesno", 4, 5),
    example: { table: { label: "Example", cells: [] }, text: YESNO_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions: yesNoQuestions({ seed: 20200101, count: 96 }, "yn"),
    resultView: {},
  };
}

/** Find 6 and Find 9 papers at the hall's size, built from a fixed seed, for seeing the screen before a database exists. */
export const FIND6_SAMPLE_ID = "find-6-sample";
export const FIND9_SAMPLE_ID = "find-9-sample";

export function findSamplePaper(category: "find6" | "find9") {
  const digit = findDigitOf(category) ?? "6";
  return {
    id: category === "find6" ? FIND6_SAMPLE_ID : FIND9_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: `Find ${digit} Test`,
    displayName: `Find ${digit} Test - Sample`,
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 25 },
    timeLimitMin: 4,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 4, 5),
    example: { table: { label: "Example", cells: [] }, text: category === "find6" ? FIND6_EXAMPLE_TEXT : FIND9_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions: findQuestions(digit, { seed: 20200101, count: 75 }, category),
    resultView: {},
  };
}

/** The Octagonal and Same Circle Tests ride the Same Figure engine; a sample of each shows its instruction screen before a database exists. */
export const OCTAGONAL_SAMPLE_ID = "octagonal-sample";
export const CIRCLE_SAMPLE_ID = "same-circle-sample";

export function matchingSamplePaper(category: "octagonal" | "circle") {
  const base = figureSamplePaper();
  const octagonal = category === "octagonal";
  return {
    ...base,
    id: octagonal ? OCTAGONAL_SAMPLE_ID : CIRCLE_SAMPLE_ID,
    category,
    title: octagonal ? "Octagonal Test" : "Same Circle Test",
    displayName: octagonal ? "Octagonal Test - Sample" : "Same Circle Test - Sample",
    instructions: pictureInstructions(category, 1, 5),
    example: { table: { label: "Example", cells: [] }, text: matchingExampleText(category) },
    questions: base.questions.map((q) => ({ ...q, id: `${category}-${q.id}` })),
  };
}

/** A Brick Test of two piles, drawn in the portal, for seeing the two-column screen before a database exists. */
export const BRICK_SAMPLE_ID = "brick-sample";

export function brickSamplePaper() {
  // A pile drawn flat: rows of bricks, five of them lettered.
  const pile = (letters: [number, number][]) => {
    const w = 60, h = 28;
    const rows = [[0, 1, 2], [0.5, 1.5], [0, 1, 2]];
    let rects = "";
    rows.forEach((row, r) => {
      row.forEach((c) => {
        const x = 20 + c * w, y = 20 + (rows.length - 1 - r) * h;
        const tag = letters.find(([lr, lc]) => lr === r && lc === c);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#111" stroke-width="2"/>`;
        if (tag) rects += `<text x="${x + w / 2}" y="${y + h / 2 + 6}" font-size="16" text-anchor="middle" fill="#111">${BRICK_LETTERS[letters.indexOf(tag)]}</text>`;
      });
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120">${rects}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const piles: { image: string; answers: number[] }[] = [
    { image: pile([[0, 0], [0, 2], [1, 0.5], [2, 1], [2, 2]]), answers: [2, 2, 4, 3, 2] },
    { image: pile([[0, 1], [1, 1.5], [2, 0], [2, 1], [0, 2]]), answers: [4, 4, 2, 3, 2] },
  ];
  const questions = piles.flatMap((p, pi) =>
    BRICK_LETTERS.map((letter, li) => ({
      id: `br-q${pi * 5 + li + 1}`,
      tableIndex: 0,
      prompt: { en: letter, hi: "" },
      options: optionValues("numbers", 10),
      answer: p.answers[li],
      working: { en: "", hi: "" },
      topic: `Brick ${letter}`,
      image: p.image,
    })),
  );
  return {
    id: BRICK_SAMPLE_ID,
    kind: "figure" as const,
    category: "brick",
    title: "Brick Test",
    displayName: "Brick Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 5 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions("brick", 1, 5),
    example: { table: { label: "Example", cells: [] }, text: BRICK_EXAMPLE_TEXT },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A Similarity Test of two sheets, drawn in the portal, for seeing the two-column screen before a database exists. */
export const SIMILARITY_SAMPLE_ID = "similarity-sample";
export const SIMILARITY2_SAMPLE_ID = "similarity-2-sample";

export function similaritySamplePaper(category: "similarity" | "similarity2") {
  // A sheet: four rows, each a figure at the left and five at the right,
  // lettered A to E; the figures are the Same Figure sample's stars.
  const rowSvg = (y: number, label: string, target: number, order: number[]) => {
    const cell = (x: number, k: number) => `<g transform="translate(${x} ${y}) scale(0.42)">${SHAPES[k]}</g>`;
    const letters = order.map((_, i) => `<text x="${150 + i * 64 + 25}" y="${y + 62}" font-size="12" text-anchor="middle" fill="#111">${OPTION_LETTERS[i]}</text>`).join("");
    return `<text x="20" y="${y + 32}" font-size="16" fill="#111">${label}</text>${cell(40, target)}${order.map((k, i) => cell(150 + i * 64, k)).join("")}${letters}`;
  };
  const sheet = (rows: { target: number; order: number[] }[]) => {
    const body = rows.map((r, i) => rowSvg(10 + i * 72, ["a", "b", "c", "d"][i], r.target, r.order)).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect x="1" y="1" width="478" height="298" fill="#fff" stroke="#999"/>${body}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const sheets = [
    { rows: [{ target: 0, order: [3, 1, 0, 2, 4] }, { target: 2, order: [2, 4, 1, 0, 3] }, { target: 4, order: [1, 0, 3, 4, 2] }, { target: 1, order: [1, 2, 4, 3, 0] }] },
    { rows: [{ target: 3, order: [0, 3, 2, 1, 4] }, { target: 1, order: [4, 2, 0, 1, 3] }, { target: 0, order: [2, 1, 4, 3, 0] }, { target: 2, order: [3, 0, 1, 2, 4] }] },
  ];
  const spec = sheetOf(category)!;
  const questions = sheets.flatMap((sh, si) =>
    sh.rows.map((r, ri) => ({
      id: `${category}-q${si * 4 + ri + 1}`,
      tableIndex: 0,
      prompt: { en: spec.prompts[ri], hi: "" },
      options: optionValues("letters", 5),
      answer: OPTION_LETTERS[r.order.indexOf(r.target)],
      working: { en: "", hi: "" },
      topic: `${spec.topicPrefix} ${spec.prompts[ri]}`,
      image: sheet(sh.rows),
    })),
  );
  const two = category === "similarity2";
  return {
    id: two ? SIMILARITY2_SAMPLE_ID : SIMILARITY_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: two ? "Similarity Test Type-II" : "Similarity Test",
    displayName: two ? "Similarity Test Type-II - Sample" : "Similarity Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 4 },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5),
    example: { table: { label: "Example", cells: [] }, text: sheetExampleText(category) },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** Samples of the five newer Memory tests, on the Memory sample's short clock, for seeing each screen before a database exists. */
export const HOUSE_SAMPLE_ID = "house-position-sample";
export const RAILWAY_SAMPLE_ID = "railway-route-sample";
export const FIGNUM_SAMPLE_ID = "figure-number-sample";
export const FIGFIG_SAMPLE_ID = "figure-figure-sample";
export const VEHICLE_SAMPLE_ID = "vehicle-signal-sample";
export const SIGNAL_SAMPLE_ID = "rail-signal-sample";
export const FIGURE2_SAMPLE_ID = "same-figure-2-sample";

const SHORT_CLOCK = { studyTimeMin: 0.05, partTimeMin: 0.05, breakTimeMin: 0.05 };

/** A house, drawn differently each time: the House Position Test's houses, on the study map and as its questions. */
function houseSvg(kind: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">${houseBody(kind)}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * A map: a few spots on a track, each with a name (a station's study map),
 * a house (a house test's study map) or a letter (either test map).
 */
function mapSvg(labels: string[], houses: number[] | null): string {
  const spots = [[60, 40], [150, 90], [240, 40], [330, 90], [420, 40]];
  const dots = spots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="#222"/><text x="${x}" y="${y - 12}" font-size="13" text-anchor="middle" fill="#111">${labels[i] ?? ""}</text>`).join("");
  const track = `<polyline points="${spots.map(([x, y]) => `${x},${y}`).join(" ")}" fill="none" stroke="#444" stroke-width="3"/>`;
  // The study map's houses: a picture at each spot that has one, in place of a name.
  const drawn = houses
    ? spots.map(([x, y], i) => (houses[i] === undefined ? "" : `<g transform="translate(${x - 16} ${y - 44}) scale(0.66)">${houseBody(houses[i])}</g>`)).join("")
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120" viewBox="0 0 480 120"><rect x="1" y="1" width="478" height="118" fill="#fff" stroke="#999"/>${track}${dots}${drawn}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** The house's strokes alone, for drawing it inside another picture. */
function houseBody(kind: number): string {
  const roof = kind % 2 === 0 ? `<path d="M2 22 L24 4 L46 22z" fill="#fff" stroke="#111" stroke-width="2"/>` : `<rect x="4" y="8" width="40" height="14" fill="#fff" stroke="#111" stroke-width="2"/>`;
  const door = kind % 3 === 0 ? `<rect x="19" y="30" width="10" height="16" fill="#111"/>` : kind % 3 === 1 ? `<rect x="8" y="30" width="9" height="16" fill="#111"/>` : `<rect x="31" y="30" width="9" height="16" fill="#111"/>`;
  const windows = kind < 3 ? `<rect x="10" y="26" width="7" height="7" fill="#fff" stroke="#111" stroke-width="1.5"/>` : `<rect x="10" y="26" width="7" height="7" fill="#fff" stroke="#111" stroke-width="1.5"/><rect x="31" y="26" width="7" height="7" fill="#fff" stroke="#111" stroke-width="1.5"/>`;
  const chimney = kind % 4 === 1 ? `<rect x="34" y="6" width="6" height="12" fill="#111"/>` : "";
  return `<rect x="4" y="22" width="40" height="24" fill="#fff" stroke="#111" stroke-width="2"/>${chimney}${roof}${windows}${door}`;
}

export function mapSamplePaper(category: "house" | "railway") {
  const house = category === "house";
  const spec = mapOf(category)!;
  const letters = OPTION_LETTERS.slice(0, 5);
  // Two parts: on each, three questions on the lettered map. A house test's
  // study map shows the houses themselves, and its questions are those
  // houses, one by one; a railway test's shows the stations' names.
  const parts = house
    ? [{ names: ["", "", "", "", ""], houses: [0, 1, 2], answers: ["B", "D", "A"] }, { names: ["", "", "", "", ""], houses: [3, 4, 5], answers: ["E", "C", "B"] }]
    : [{ names: ["SOK", "DET", "PIR", "", ""], houses: [], answers: ["C", "A", "B"] }, { names: ["", "PMK", "TMP", "", "OLW"], houses: [], answers: ["D", "E", "A"] }];
  const lettered = [["E", "B", "C", "D", "A"], ["A", "C", "B", "E", "D"]];
  // Where each house stands on its study map: the spot whose letter is the answer.
  const studyHouses = (pi: number, p: { houses: number[]; answers: string[] }): number[] => {
    const at: number[] = [];
    p.houses.forEach((kind, i) => { at[lettered[pi].indexOf(p.answers[i])] = kind; });
    return at;
  };
  const study = parts.map((p, pi) => mapSvg(p.names, house ? studyHouses(pi, p) : null));
  const questions = parts.flatMap((p, pi) => {
    const labels = house ? ["1", "2", "3"] : p.names.filter(Boolean);
    const image = mapSvg(lettered[pi], null);
    return labels.map((label, li) => ({
      id: `${category}-q${pi * 3 + li + 1}`,
      tableIndex: 0,
      prompt: { en: label, hi: "" },
      options: [...letters],
      answer: p.answers[li],
      working: { en: "", hi: "" },
      topic: `${spec.topicPrefix} ${label}`,
      image,
      ...(house ? { promptImage: houseSvg(p.houses[li]) } : {}),
    }));
  });
  return {
    id: house ? HOUSE_SAMPLE_ID : RAILWAY_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: house ? "House Position Test" : "Railway Track Route Test",
    displayName: house ? "House Position Test - Sample" : "Railway Track Route Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 3, ...SHORT_CLOCK, studyImages: study },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** A picture of its own: a vehicle or a rail signal, as the Vehicle & Signal Position Test's questions are. */
function iconSvg(body: string, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** A vehicle's strokes, in a 64 × 36 box: a car, a truck or a jeep, as the mock draws them, in silhouette. */
function vehicleBody(kind: number): string {
  const wheels = (a: number, b: number) =>
    `<circle cx="${a}" cy="29" r="6" fill="#111"/><circle cx="${a}" cy="29" r="2.5" fill="#fff"/><circle cx="${b}" cy="29" r="6" fill="#111"/><circle cx="${b}" cy="29" r="2.5" fill="#fff"/>`;
  switch (kind % 3) {
    case 0: // a car
      return `<path d="M4 28 L4 20 L14 18 L22 9 L42 9 L52 18 L60 20 L60 28 Z" fill="#111"/><path d="M24 11 L40 11 L46 17 L18 17 Z" fill="#fff"/>${wheels(17, 47)}`;
    case 1: // a truck: a cab and a box
      return `<rect x="2" y="7" width="38" height="21" fill="#111"/><path d="M40 13 L52 13 L60 21 L60 28 L40 28 Z" fill="#111"/><rect x="43" y="15" width="8" height="6" fill="#fff"/>${wheels(14, 50)}`;
    default: // a jeep: a boxy body with a rack on the roof
      return `<rect x="14" y="5" width="30" height="3" fill="#111"/><path d="M6 28 L6 18 L12 10 L46 10 L52 18 L60 18 L60 28 Z" fill="#111"/><rect x="15" y="12" width="12" height="6" fill="#fff"/><rect x="30" y="12" width="12" height="6" fill="#fff"/>${wheels(17, 49)}`;
  }
}

/** A rail signal's strokes, in a 36 × 48 box: a post with round lights, a three-lamp signal, or crossed arms, as the mock draws them. */
function signalBody(kind: number): string {
  const post = `<rect x="16" y="24" width="4" height="20" fill="#111"/><rect x="9" y="43" width="18" height="3" fill="#111"/>`;
  switch (kind % 3) {
    case 0: // two round lights on a post
      return `<circle cx="18" cy="9" r="7" fill="#fff" stroke="#111" stroke-width="2.5"/><circle cx="18" cy="9" r="3" fill="#111"/><circle cx="18" cy="21" r="5" fill="#fff" stroke="#111" stroke-width="2.5"/>${post}`;
    case 1: // three lamps in a box
      return `<rect x="9" y="2" width="18" height="26" rx="4" fill="#111"/><circle cx="18" cy="8" r="3" fill="#fff"/><circle cx="18" cy="15" r="3" fill="#fff"/><circle cx="18" cy="22" r="3" fill="#fff"/>${post}`;
    default: // crossed arms with a lamp below
      return `<path d="M5 4 L31 22 M31 4 L5 22" stroke="#111" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="13" r="3" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="18" cy="27" r="4" fill="#fff" stroke="#111" stroke-width="2"/>${post.replace('y="24"', 'y="30"')}`;
  }
}

/** Where the lettered places of the sample's two maps are: seven on each, like the mock's, so a letter can stand twice. */
const STREET_SPOTS: [number, number][] = [[70, 50], [170, 95], [250, 60], [380, 70], [90, 150], [230, 165], [360, 160]];
const RAIL_SPOTS: [number, number][] = [[340, 30], [150, 70], [60, 130], [240, 125], [400, 95], [120, 170], [330, 175]];

/**
 * The sample's street map (a few winding roads) or railway map (tracks
 * that fork and cross), 480 × 200, with a letter at each place, or with
 * a vehicle or a signal at the places that have one: the test map, or the
 * study map.
 */
function placesMapSvg(kind: "street" | "rail", labels: string[] | null, icons: (number | undefined)[]): string {
  const spots = kind === "street" ? STREET_SPOTS : RAIL_SPOTS;
  const ground =
    kind === "street"
      ? `<path d="M0 70 C 80 30, 140 110, 220 80 S 400 20, 480 60" fill="none" stroke="#333" stroke-width="2"/><path d="M0 120 C 60 160, 120 110, 200 150 S 330 200, 480 130" fill="none" stroke="#333" stroke-width="2"/><path d="M130 0 C 150 60, 110 120, 160 200" fill="none" stroke="#333" stroke-width="2"/><path d="M300 40 C 330 100, 290 140, 320 200" fill="none" stroke="#333" stroke-width="2"/>`
      : ["M0 130 C 120 110, 220 90, 480 100", "M60 140 C 160 70, 260 40, 360 10", "M100 110 C 200 160, 300 190, 460 170"]
          .map((d) => `<path d="${d}" fill="none" stroke="#333" stroke-width="7"/><path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 6"/>`)
          .join("");
  const marks = spots
    .map(([x, y], i) => {
      // A letter wears a white halo and an icon sits on a white patch: both
      // must read where a road or a track runs under them, as on the mock.
      if (labels) return `<text x="${x}" y="${y + 6}" font-size="17" font-family="serif" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="5" paint-order="stroke">${labels[i] ?? ""}</text>`;
      const icon = icons[i];
      if (icon === undefined) return "";
      return kind === "street"
        ? `<rect x="${x - 28}" y="${y - 17}" width="56" height="34" rx="4" fill="#fff"/><g transform="translate(${x - 26} ${y - 15}) scale(0.8)">${vehicleBody(icon)}</g>`
        : `<rect x="${x - 20}" y="${y - 26}" width="40" height="52" rx="4" fill="#fff"/><g transform="translate(${x - 18} ${y - 24})">${signalBody(icon)}</g>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200" viewBox="0 0 480 200"><rect x="1" y="1" width="478" height="198" fill="#fff" stroke="#999"/>${ground}${marks}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * The Vehicle & Signal Position Test's sample: Part 1 a street map with
 * three vehicles, Part 2 a railway map with three rail signals, each on
 * the mock's clock of a minute to study and a minute to answer, with the
 * letters A to D standing at more places than there were vehicles.
 */
export function vehicleSamplePaper() {
  const category = "vehicle";
  const spec = mapOf(category)!;
  const letters = OPTION_LETTERS.slice(0, 4);
  // The test maps' letters, place by place, and where each question's
  // picture stood: the mock's own answers, a jeep at C, a truck at D, a
  // car at B; then the signals at B, C and A.
  const parts: { kind: "street" | "rail"; lettered: string[]; icons: number[]; answers: string[] }[] = [
    { kind: "street", lettered: ["B", "A", "B", "C", "D", "C", "A"], icons: [2, 1, 0], answers: ["C", "D", "B"] },
    { kind: "rail", lettered: ["D", "D", "B", "A", "C", "A", "B"], icons: [2, 0, 1], answers: ["B", "C", "A"] },
  ];
  const study = parts.map((p) => {
    const at: (number | undefined)[] = [];
    p.icons.forEach((icon, i) => { at[p.lettered.indexOf(p.answers[i])] = icon; });
    return placesMapSvg(p.kind, null, at);
  });
  const questions = parts.flatMap((p, pi) => {
    const image = placesMapSvg(p.kind, p.lettered, []);
    const prefix = spec.partItems?.[pi] ?? spec.item;
    return p.icons.map((icon, li) => ({
      id: `${category}-q${pi * 3 + li + 1}`,
      tableIndex: 0,
      prompt: { en: String(li + 1), hi: "" },
      options: [...letters],
      answer: p.answers[li],
      working: { en: "", hi: "" },
      topic: `${prefix[0].toUpperCase() + prefix.slice(1)} ${li + 1}`,
      image,
      promptImage: p.kind === "street" ? iconSvg(vehicleBody(icon), 64, 36) : iconSvg(signalBody(icon), 36, 48),
    }));
  });
  return {
    id: VEHICLE_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: "Vehicle & Signal Position Test",
    displayName: "Vehicle & Signal Position Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 3, ...SHORT_CLOCK, partInstructionMin: 0.05, studyImages: study },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/**
 * The Rail Signal Position Test's sample: two sections, each a railway map
 * with three rail signals, on the second mock's clock of a minute to study
 * and a minute to answer, the letters A to D standing at more places than
 * there were signals.
 */
export function signalSamplePaper() {
  const category = "signal";
  const spec = mapOf(category)!;
  const letters = OPTION_LETTERS.slice(0, 4);
  // The mock's own answers: D, B and A in the first section, then B, C
  // and A in the second.
  const parts: { lettered: string[]; icons: number[]; answers: string[] }[] = [
    { lettered: ["D", "A", "B", "C", "D", "A", "B"], icons: [0, 1, 2], answers: ["D", "B", "A"] },
    { lettered: ["D", "D", "B", "A", "C", "A", "B"], icons: [2, 0, 1], answers: ["B", "C", "A"] },
  ];
  const study = parts.map((p) => {
    const at: (number | undefined)[] = [];
    p.icons.forEach((icon, i) => { at[p.lettered.indexOf(p.answers[i])] = icon; });
    return placesMapSvg("rail", null, at);
  });
  const questions = parts.flatMap((p, pi) => {
    const image = placesMapSvg("rail", p.lettered, []);
    return p.icons.map((icon, li) => ({
      id: `${category}-q${pi * 3 + li + 1}`,
      tableIndex: 0,
      prompt: { en: String(li + 1), hi: "" },
      options: [...letters],
      answer: p.answers[li],
      working: { en: "", hi: "" },
      topic: `${spec.topicPrefix} ${li + 1}`,
      image,
      promptImage: iconSvg(signalBody(icon), 36, 48),
    }));
  });
  return {
    id: SIGNAL_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: "Rail Signal Position Test",
    displayName: "Rail Signal Position Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 3, ...SHORT_CLOCK, partInstructionMin: 0.05, studyImages: study },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}

/** The Same Figure Test Type-II's sample: the Perceptual Speed sample under the kind's own name. */
export function figure2SamplePaper() {
  const base = figureSamplePaper();
  return {
    ...base,
    id: FIGURE2_SAMPLE_ID,
    category: "figure2",
    title: "Same Figure Test Type-II",
    displayName: "Same Figure Test Type-II - Sample",
    questions: base.questions.map((q) => ({ ...q, id: `figure2-${q.id}` })),
  };
}

/** A box with a number in it, as the Figure to Number Test's options are. */
function numberBox(n: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect x="1" y="1" width="58" height="38" fill="#fff" stroke="#333" stroke-width="2"/><text x="30" y="27" font-size="18" text-anchor="middle" fill="#111">${n}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function rowMemorySamplePaper(category: "fignum" | "figfig") {
  const fignum = category === "fignum";
  const letters = OPTION_LETTERS.slice(0, 4);
  const numbers = [39, 93, 58, 24];
  // The study screen: the pairs (a figure with its number, or with its partner).
  const studyOf = (ids: number[]) => {
    const cells = ids.map((k, i) => `<g transform="translate(${20 + i * 150} 10) scale(0.6)">${SHAPES[k]}</g>` + (fignum
      ? `<text x="${20 + i * 150 + 95}" y="60" font-size="18" fill="#111">${numbers[i]}</text>`
      : `<g transform="translate(${20 + i * 150 + 75} 10) scale(0.6)">${SHAPES[(k + 2) % SHAPES.length]}</g>`)).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="100" viewBox="0 0 480 100"><rect x="1" y="1" width="478" height="98" fill="#fff" stroke="#999"/>${cells}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };
  const study = [studyOf([0, 1, 2]), studyOf([3, 4, 0])];
  const questions = [[0, 1, 2], [3, 4, 0]].flatMap((ids, pi) =>
    ids.map((k, i) => {
      const options = fignum
        ? numbers.map((_, j) => numberBox(numbers[(j + i) % 4]))
        : letters.map((_, j) => figureSvg(SHAPES[(k + 2 + j) % SHAPES.length]));
      const answerIndex = fignum ? (4 - i) % 4 : 0;
      return {
        id: `${category}-q${pi * 3 + i + 1}`,
        tableIndex: 0,
        prompt: { en: "", hi: "" },
        options: [...letters],
        answer: letters[answerIndex],
        working: { en: "", hi: "" },
        topic: fignum ? "Figure to number" : "Figure to figure",
        image: figureSvg(SHAPES[k]),
        optionImages: options,
      };
    }),
  );
  return {
    id: fignum ? FIGNUM_SAMPLE_ID : FIGFIG_SAMPLE_ID,
    kind: "figure" as const,
    category,
    title: fignum ? "Figure to Number Test" : "Figure to Figure Test",
    displayName: fignum ? "Figure to Number Test - Sample" : "Figure to Figure Test - Sample",
    features: { showQuestionPaperButton: false, lockScroll: true, overflowQuestions: false, questionsPerPart: 3, ...SHORT_CLOCK, studyImages: study },
    timeLimitMin: 1,
    instructionTimeLimitMin: 5,
    instructions: pictureInstructions(category, 1, 5, 1),
    example: { table: { label: "Example", cells: [] }, text: [] },
    tables: [{ label: "No. 1", cells: [] }],
    questions,
    resultView: {},
  };
}
