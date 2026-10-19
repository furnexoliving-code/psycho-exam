-- Four articles for /blog, written 11 Oct 2026: the T-Score formula, RDSO's FAQ
-- explained, exam-day advice, and preparation with Kautilya Classes and Pindel Sir.
--
-- Run once in the Supabase SQL editor (after supabase/blog.sql). Each article is
-- inserted only if no article with its slug exists, so running it twice changes
-- nothing and the panel's later edits are never overwritten. To replace an article
-- with this version, delete it in Admin > Blog first, then run this file again.
-- The articles go live at once; they show on /blog within five minutes.

insert into public.blog_posts (slug, title, excerpt, content, exam, meta_title, meta_description, keywords, faq, is_published, published_at, author)
values (
  $kc$alp-psycho-test-t-score-formula$kc$,
  $kc$ALP Psycho Test T-Score: RDSO's formula, worked examples and the 42 cut-off$kc$,
  $kc$The T-Score decides who qualifies in the RRB ALP CBAT. Here is RDSO's own formula, three worked examples (one of them a negative score), the composite score out of 30, and the target Pindel Sir sets for every student.$kc$,
  $kc$Every result in the RRB ALP psycho test, the Computer Based Aptitude Test (CBAT), is a T-Score, not a count of right answers. You need a T-Score of 42 or more in each of the five tests to qualify, and the five T-Scores together give a score out of 30 that goes into the final ALP merit. RDSO, the Research Designs and Standards Organisation of Indian Railways, designs the test, and its FAQ for candidates gives the formula and three worked examples. This article walks through them, in RDSO's own figures, and then says what they mean for the way you prepare.

If you are new to the exam, read the [complete guide to the RRB ALP psycho test](/rrb-alp-psycho-test) first. It explains the five tests and the 20 kinds of question the hall can give. On the Kautilya Classes portal, every practice paper and every Full Mock reports this same T-Score, computed the same way, so the number you see in practice is the number that matters in the hall.

## Why the railway reports a T-Score, not marks

RDSO's answer to "what is the criterion to qualify" is short: a T-Score of 42 or more in each test, and the T-Score is different from the raw score. The raw score of each test is converted into a T-Score. The conversion compares you with everyone who sat that test. So the T-Score does not say how many you got right; it says where you stand in the group. Five tests, five groups, five T-Scores. Each one must clear 42 on its own.

## The formula, as RDSO gives it

> T = 50 + 10 × (x − Mean) ÷ SD, where x is your score in the test, Mean is the average score of all candidates who appeared in that test, and SD is the standard deviation of their scores.

Two numbers describe the group. The mean is the average score. The standard deviation (SD) says how spread out the scores are: a small SD means most candidates scored close to the mean, a large SD means the scores were spread wide. The formula puts the average candidate at exactly 50, and every one SD above or below the average moves the T-Score by 10. RDSO notes that for most candidates the T-Score falls between 20 and 80, though the formula does not rule out scores outside that range.

## Example 1: a good test (RDSO's example)

- Your score in Test 1: 20
- Mean of Test 1: 14
- Standard deviation of Test 1: 3
- T-Score = 50 + 10 × (20 − 14) ÷ 3 = 50 + 10 × 2 = **70**

Six marks above the mean, with an SD of 3, is two standard deviations above the average. That is a T-Score of 70: comfortably qualified, and well above the 60 that Pindel Sir sets as the practice target.

## Example 2: "I did very well, but my T-Score is below 42"

RDSO answers this exact complaint in its FAQ, with figures:

- Questions in the test: 100
- Mean: 85
- Standard deviation: 10
- Your raw score: 75
- T-Score = 50 + 10 × (75 − 85) ÷ 10 = 50 − 10 = **40**

Seventy-five right out of a hundred looks like a strong paper. But when the average candidate got 85 right, 75 is one full SD below the average, and the T-Score is 40: not qualified. This is the trap of the speed tests. In the Power of Observation Test and the Perceptual Speed Test, most candidates score high, so the mean is high, and every careless error pushes you further below it. A score that feels good is not enough; you have to be at least near the middle of the group.

## Example 3: a negative T-Score is possible

- Questions in the test: 50
- Mean: 40
- Standard deviation: 5
- Your raw score: 0
- T-Score = 50 + 10 × (0 − 40) ÷ 5 = 50 − 80 = **−30**

RDSO adds that such candidates are very few. The lesson is not the number but the cause: a zero in one test. It happens when the study part of the Memory Test goes wrong and the candidate gives up on the test part, or when a candidate misreads the instruction screen and answers a different question from the one asked. The CBAT has no negative marking, so there is never a reason to leave a question blank, and never a reason to stop before the clock does.

## The cut-off: 42 in each test, the same everywhere

Four rules from RDSO's FAQ, in one place:

- To qualify, a T-Score of 42 or more is needed in each test of the battery.
- The cut-off is the same in all RRBs across the country, with no variation.
- There is no provision of reservation in the aptitude test, because it selects staff for safety categories.
- There is no negative marking, because the test measures attributes, not knowledge.

Put 42 on the scale: it is 0.8 of a standard deviation below the average candidate. On a normal curve about one candidate in five lands below that line in any one test. That sounds easy until you remember that you must clear the line five times in a row, in five different abilities. A good Memory Test does not rescue a weak Depth Perception Test. Each test is a separate pass or fail.

## The composite score out of 30

The aptitude test carries a weight of 30 in the final selection, and RDSO's FAQ shows how the five T-Scores become a score out of 30:

- Add the T-Scores of the five tests. RDSO's example: 300.
- The maximum is taken as 80 × 5 = 400.
- Score out of 30 = 300 × 30 ÷ 400 = **22.5**

The scores in the RRB examination and in the aptitude test are then apportioned 70:30 for the final merit list. So 42 is a floor, not a goal. Every T-Score point above 42, in every test, adds to your composite score and lifts your rank. The Full Mock scorecard on the Kautilya Classes portal is out of 30 for this reason: it uses the same formula on the same five T-Scores, so one look tells you both whether you qualified and how much merit the five tests earned.

## What this means for your preparation: Pindel Sir's five rules

1. **Aim at 60, not 42.** A target of 42 leaves no room for a hard paper, a slow start or a bad night. Sixty in every test is one SD above the average, and it is reachable with practice.
2. **Treat the five tests separately.** Find the weakest one on your scorecard and give it the most days. The strongest test cannot carry it.
3. **In the speed tests, be exact first.** When the mean is high, one careless error costs more than one slow answer. Build accuracy, then speed.
4. **Never leave a blank.** No negative marking means a guess can only help. When Time Left is nearly gone, answer everything that remains.
5. **Practise where a T-Score is reported against other candidates.** A percentage tells you nothing about the group. On the portal every paper's T-Score is computed against every student who sat that paper, with the formula above, and the Full Mock gives all five T-Scores and the score out of 30 in one scorecard.

Start with the free Full Mock: [create a free account](/signup?next=/mocks), sit the five tests in the hall's order, and read the five T-Scores. Then take the kinds of your weakest test from the [list of all 20 kinds of question](/psycho-test), and the [packages](/packages) when you want every practice paper.

## सारांश (हिंदी में)

ALP साइको टेस्ट (CBAT) का हर परिणाम T-Score में आता है, सही उत्तरों की गिनती में नहीं। RDSO का सूत्र है T = 50 + 10 × (आपका स्कोर − औसत) ÷ मानक विचलन, जहाँ औसत और मानक विचलन उस टेस्ट में बैठे सभी उम्मीदवारों के अंकों से निकलते हैं। औसत उम्मीदवार का T-Score ठीक 50 होता है। हर टेस्ट में 42 या उससे ज़्यादा T-Score ज़रूरी है, और यह कट-ऑफ पूरे देश के हर RRB में एक जैसा है; न आरक्षण है, न नेगेटिव मार्किंग। RDSO का उदाहरण याद रखें: 100 में से 75 सही होने पर भी, अगर औसत 85 और मानक विचलन 10 हो, तो T-Score सिर्फ़ 40 आता है, यानी असफल। पाँचों टेस्ट के T-Score जोड़कर, 400 से भाग देकर, 30 से गुणा करने पर 30 में से स्कोर मिलता है (जैसे 300 → 22.5), जो अंतिम मेरिट में 70:30 के अनुपात से जुड़ता है। पिंडेल सर की सलाह: लक्ष्य हर टेस्ट में 60 रखें, कोई सवाल खाली न छोड़ें, और वहीं अभ्यास करें जहाँ T-Score दूसरे उम्मीदवारों के मुकाबले दिखे।

*Source: RDSO (Research Designs and Standards Organisation, Lucknow), Psychology Directorate, Candidates' Corner and Frequently Asked Questions, rdso.indianrailways.gov.in. The ALP test pattern is from the RDSO guideline "ALPs Guidelines CBT, Jan 2020".*$kc$,
  'alp',
  $kc$ALP Psycho Test T-Score: Formula, Examples, Cut-off 42$kc$,
  $kc$RRB ALP CBAT T-Score explained with RDSO's formula, three worked examples, the composite score out of 30 and the 42 cut-off. By Pindel Sir, Kautilya Classes.$kc$,
  $kc$alp psycho test t score, t score formula rrb alp, alp cbat t score calculation, psycho test t score kaise nikalta hai, alp psycho test cut off 42, cbat composite score out of 30, rdso t score formula, railway aptitude test t score$kc$,
  $kc$[{"q":"What is the formula for the T-Score in the ALP psycho test?","a":"RDSO gives it as T = 50 + 10 × (your score − mean) ÷ standard deviation. The mean and the standard deviation come from the scores of every candidate who sat that test. A score equal to the mean gives exactly 50."},{"q":"Can the T-Score be negative?","a":"Yes. RDSO's own example is a test of 50 questions with a mean of 40 and a standard deviation of 5: a raw score of 0 gives 50 + 10 × (0 − 40) ÷ 5 = −30. Very few candidates land there, but the formula allows it."},{"q":"I answered most questions correctly. How can my T-Score still be below 42?","a":"Because the T-Score is relative. In RDSO's example, 75 right out of 100 gives a T-Score of only 40 when the mean is 85 and the standard deviation is 10. In a test where almost everyone scores high, an ordinary score falls below the average."},{"q":"Is the cut-off the same in every RRB?","a":"Yes. RDSO states that the qualifying criterion, a T-Score of 42 or more in each test, is the same in all RRBs across the country, with no variation. There is no reservation in the aptitude test and no negative marking."},{"q":"How is the score out of 30 calculated?","a":"Add the T-Scores of the five tests, divide by 400 (taken as 80 × 5) and multiply by 30. RDSO's example: 300 ÷ 400 × 30 = 22.5. This is the aptitude test's share in the 70:30 final merit with the RRB examination."},{"q":"What T-Score should I aim for in practice?","a":"Pindel Sir sets 60 in every test. 42 is the floor; 60 leaves a margin for a hard paper and lifts your composite score, which still counts in the final merit."}]$kc$::jsonb,
  true,
  now() - interval '3 minutes',
  $kc$Team Kautilya$kc$
)
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, content, exam, meta_title, meta_description, keywords, faq, is_published, published_at, author)
values (
  $kc$rdso-aptitude-test-faq-alp$kc$,
  $kc$RDSO's FAQ on the railway aptitude test, explained for ALP candidates$kc$,
  $kc$RDSO publishes a 15-question FAQ on the aptitude test, in English and Hindi. Pindel Sir goes through the answers that matter for the ALP CBAT: who takes the test, how it is scored, the rules, the mock test in the hall, and the five points RDSO itself asks you to keep in mind.$kc$,
  $kc$RDSO, the Research Designs and Standards Organisation of Indian Railways at Lucknow, is the body whose Psychology Directorate designs the aptitude tests the RRBs give. Its website has a Candidates' Corner with a 15-question FAQ, in English and Hindi. Some of the questions are about Station Masters, some about serving loco pilots, and the rest apply to every candidate, including the RRB ALP psycho test, the Computer Based Aptitude Test (CBAT). This article takes the FAQ answer by answer and says, in plain words, what each one means for an ALP candidate.

Two things this article does not repeat. The pattern of the ALP test itself, the five tests and the 20 kinds of question with their counts and clocks, is in the [complete guide to the RRB ALP psycho test](/rrb-alp-psycho-test). And the T-Score formula with RDSO's worked examples has [its own article](/blog/alp-psycho-test-t-score-formula).

## Who takes the aptitude test, and why (questions 1 and 2)

RDSO's answer: aptitude tests are given to candidates selected as safety-category staff, at the entry level of Station Masters, Traffic Assistants and Assistant Loco Pilots, to assess the cognitive and personality attributes essential for safe train operation. Today this testing is in CBT mode, the computer-based mode, for the RRB recruitment of Station Masters and ALPs. It is also used in CBT mode for in-house promotions through the GDCE and for Station Controllers and Train Operators of metro rail corporations.

The Candidates' Corner adds the purpose in one line: people who perform well in these tests usually also do well on the job, and the tests are designed to give real measures of your strengths and limitations. What it means for you: the CBAT is not a knowledge test. It measures abilities, memory, following directions, depth perception, observation and speed, and each of those abilities improves with the right practice. A candidate who has never seen the screen is at a disadvantage that has nothing to do with intelligence.

## The five points RDSO asks you to keep in mind (question 3)

RDSO lists five points for the aptitude test in CBT mode:

1. Understand the examples, to do better in the test.
2. Stay focused on every question of every test throughout, to gain the maximum score.
3. Keep in mind the time allotted for the test, and try to finish within it.
4. If a question is difficult, do not waste time on it; proceed to the next one.
5. In the rest period between two tests, relax, so that you can focus again on the next test.

Pindel Sir's note on the first point: the example on the instruction screen is not decoration. The hall gives one kind of question for each test, and the example tells you which kind. Read it to the end even when you know the kind at a glance. The other four points are habits, and habits come from practice on a screen that runs like the hall's, with the hall's clock.

## How you qualify: a T-Score of 42 in every test (questions 4 to 7)

To qualify, a candidate needs a T-Score of 42 or more in each test. The T-Score is not the raw score; the raw score of each test is converted into a T-Score using the mean and the standard deviation of all candidates who appeared in that test. RDSO's formula is T = 50 + 10 × (score − mean) ÷ SD, and its FAQ gives three worked examples: a score of 20 with mean 14 and SD 3 gives 70; a raw score of 75 out of 100 with mean 85 and SD 10 gives only 40; and a raw score of 0 with mean 40 and SD 5 gives −30. The five T-Scores are added and scaled to a score out of 30. The [T-Score article](/blog/alp-psycho-test-t-score-formula) works through each example.

What it means for you: the score is relative, so your practice must also be relative. A percentage on a practice paper tells you nothing. On the Kautilya Classes portal every paper reports a T-Score against every student who sat it, with the same formula.

## The rules: reservation, negative marking, cut-off and merit (questions 9 to 12)

- **No reservation.** The aptitude test recruits staff for safety categories, so RDSO provides no reservation in it. Every candidate needs the same 42.
- **No negative marking.** The test assesses attributes, not knowledge, so a wrong answer costs nothing. A blank answer is the only sure loss.
- **The same cut-off everywhere.** The qualifying criterion is the same in all RRBs across the country, with no variation at all.
- **70:30 for the final merit.** The scores in the RRB examination and in the aptitude test are apportioned 70:30 in the final merit list. The CBAT is qualifying and it also counts.

## How you answer in CBT mode, and the mock test in the hall

RDSO's Candidates' Corner describes the mechanics. In the computer-based test you record an answer by clicking the mouse on one of the alternatives for the question. A mock test is available before the aptitude test, so that you can get familiar with it. The answers you mark can be changed within the time limit specified for the test.

Three things follow. First, the hall is a desktop with a mouse, so practise on a laptop or desktop, not only on a phone. Second, the mock in the hall is for the mouse and the screen, not for learning the 20 kinds of question; a candidate who meets the Watch Table Test for the first time in that mock has left it too late. Third, changing an answer is allowed, but going back costs seconds that the clock does not return. Give your most likely answer, press Save & Next, and change it only when you are sure.

## What in the FAQ is not about ALP

- **Question 8, six scores from five tests.** This is the Station Master and Traffic Assistant battery, where the fifth test measures two dimensions of personality and produces two scores. The ALP battery has five tests and five T-Scores.
- **Questions 13 to 15, CADAT.** CADAT is RDSO's computer-aided test system for deploying serving Loco Pilots on trains faster than 110 km/h. Its five tests are the Reaction Time Test, the Form Perception Test, the Group Bourdon Test, the Speed Perception Test and the Visual Differentiating Attention Test, and they are given at zonal centres. CADAT is not part of ALP recruitment. Do not spend a day on it now.
- **The sample tests on the Candidates' Corner.** RDSO marks them as indicative, and some, such as the personality questions, belong to the Station Master battery. The ALP pattern is in RDSO's own guideline, "ALPs Guidelines CBT, Jan 2020", which fixes the five tests and the kinds each one can take.

## Where the ALP pattern itself is written

The ALPs Guidelines CBT (Jan 2020) give the five tests in their order, Memory, Following Directions, Depth Perception, Power of Observation and Perceptual Speed, and the kinds of question each test can take, 20 in all, with the number of questions and the minutes for each kind. The Kautilya Classes portal follows that guideline for every practice paper and every Full Mock, and the [list of all 20 kinds of question](/psycho-test) gives the count and the clock of each one.

Start with the free Full Mock: [create a free account](/signup?next=/mocks) and sit all five tests on a screen like the hall's, in the hall's order, with a T-Score in each.

## सारांश (हिंदी में)

RDSO (लखनऊ) का मनोविज्ञान निदेशालय रेलवे के अभिवृत्ति परीक्षण बनाता है, और उसकी वेबसाइट के Candidates' Corner में 15 सवालों का FAQ है। ALP उम्मीदवार के काम की बातें: यह परीक्षण संरक्षा श्रेणी (स्टेशन मास्टर, ALP, सेक्शन कंट्रोलर) के लिए होता है और अब कंप्यूटर पर होता है; हर टेस्ट में 42 या ज़्यादा T-Score ज़रूरी है; कट-ऑफ पूरे देश के हर RRB में एक जैसा है; न आरक्षण है, न नेगेटिव मार्किंग; अंतिम मेरिट में RRB परीक्षा और अभिवृत्ति परीक्षण के अंक 70:30 के अनुपात में जुड़ते हैं। उत्तर माउस से क्लिक करके दिया जाता है, असली टेस्ट से पहले एक मॉक टेस्ट मिलता है, और समय सीमा के अंदर उत्तर बदला जा सकता है। RDSO के पाँच सुझाव: उदाहरण समझें, हर सवाल पर ध्यान रखें, समय का ध्यान रखें, कठिन सवाल छोड़कर आगे बढ़ें, और दो टेस्ट के बीच के विश्राम में आराम करें। स्टेशन मास्टर के छह स्कोर और CADAT (110 किमी/घंटा से तेज़ ट्रेनों के लोको पायलटों के लिए) ALP भर्ती का हिस्सा नहीं हैं।

*Source: RDSO (Research Designs and Standards Organisation, Lucknow), Psychology Directorate, Candidates' Corner and Frequently Asked Questions, rdso.indianrailways.gov.in; RDSO, "ALPs Guidelines CBT, Jan 2020".*$kc$,
  'alp',
  $kc$RDSO Aptitude Test FAQ, Explained for RRB ALP Candidates$kc$,
  $kc$RDSO's aptitude test FAQ for RRB ALP candidates: T-Score 42, no negative marking, the same cut-off everywhere, 70:30 merit, the mock before the test.$kc$,
  $kc$rdso aptitude test faq, rrb alp psycho test rules, alp cbat faq, railway aptitude test questions and answers, alp psycho test negative marking, alp psycho test reservation, cadat vs alp psycho test, rdso candidates corner$kc$,
  $kc$[{"q":"Does RDSO's aptitude test FAQ apply to the ALP psycho test?","a":"Most of it does. RDSO designs the aptitude tests for Station Masters, Assistant Loco Pilots and Section Controllers, and the FAQ covers all of them. The questions on the six scores of the Station Master battery and on CADAT do not apply to ALP recruitment."},{"q":"Is there any reservation in the ALP psycho test?","a":"No. RDSO states that the aptitude test selects staff for safety categories, so there is no provision of reservation. The same T-Score of 42 is needed by every candidate."},{"q":"Is there negative marking in the ALP CBAT?","a":"No. RDSO says the test measures cognitive attributes, so there is no negative marking. Attempt every question; a blank can only lose."},{"q":"Is the cut-off the same in every RRB?","a":"Yes. RDSO states that the qualifying criterion is the same in all RRBs across the country, with no variation at all: a T-Score of 42 or more in each test."},{"q":"Will I get a mock test in the exam hall before the real CBAT?","a":"Yes. RDSO's Candidates' Corner says a mock test is available before the aptitude test so that candidates can get familiar with it. It shows you the screen and the mouse, not the kinds of question; those must be practised beforehand."},{"q":"Can I change an answer during the test?","a":"Yes, within the time limit of that test. RDSO states that answers marked in CBT mode can be changed within the time specified for the test. Going back costs time, so change an answer only when you are sure."},{"q":"What is CADAT, and do I need to prepare for it?","a":"CADAT is RDSO's computer-aided test system for serving Loco Pilots being deployed on trains faster than 110 km/h. It has its own five tests and is not part of ALP recruitment. Prepare for the five tests of the ALP CBAT instead."}]$kc$::jsonb,
  true,
  now() - interval '2 minutes',
  $kc$Team Kautilya$kc$
)
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, content, exam, meta_title, meta_description, keywords, faq, is_published, published_at, author)
values (
  $kc$alp-psycho-test-exam-day-tips$kc$,
  $kc$Exam day in the ALP psycho test: RDSO's own advice, and Pindel Sir's ten rules$kc$,
  $kc$What RDSO tells candidates to do before and during the aptitude test session, and the ten rules Pindel Sir gives every Kautilya Classes batch in the last class before the CBAT.$kc$,
  $kc$The CBAT is short. The five tests together take well under an hour of test time, and each test has its own clock. There is no time in the hall to learn anything; the day only shows what the weeks before it built. But the day can still lose marks that the weeks earned: a missed instruction, a clock not watched, a blank answer at the end. RDSO, which designs the test, gives its own advice to candidates on its website. Here it is, with the ten rules Pindel Sir gives every Kautilya Classes batch in the last class before the exam.

New to the exam? Start with the [complete guide to the RRB ALP psycho test](/rrb-alp-psycho-test), which explains the five tests, the T-Score 42 rule and the 30-day plan.

## Before the session: RDSO's three points

RDSO's Candidates' Corner, under "what can you do to get higher scores", starts the night before:

- Do not stay up all night. Make sure you get a good night's sleep.
- Give yourself plenty of time to get to the session, so that you do not have to rush.
- If you wear glasses or a hearing aid, be sure to take them with you.

The sleep line is the one most candidates break, and the Memory Test is the first test of the day. A tired mind holds a map for 2 minutes and loses it in the third. Pindel Sir's addition: eat lightly, carry the admit card and the identity proof it names, and know the way to the centre a day earlier.

One document comes before everything on this page. The RRB's notice of 8 October 2026 requires the **vision certificate in original**, in the Annexure VI-A format, at the time of entry for the CBAT; a candidate without it is not allowed in. The [vision certificate article](/blog/alp-cbat-vision-certificate-annexure-via) has the format in Hindi and English, who may sign it, and the steps to get it made.

## At the session: RDSO's eight points

RDSO continues, for the session itself:

- Listen carefully to the instructions.
- Do exactly as you are told.
- Do not be afraid to ask questions.
- Think about each question before answering.
- Work quickly and accurately, as most tests have short time limits.
- Do not waste time on difficult questions.
- Try as hard as you can: the more questions you get right, the higher your score will be.
- Do not try to copy the answers of your neighbour; the question set may be different from yours.

The last point matters more than it looks. The candidate beside you may be on a different kind of question, or a different item, and in a speed test a glance sideways is a question lost.

## During each test: RDSO's five points from the FAQ

RDSO's FAQ adds five points specifically for the aptitude test in CBT mode:

1. Understand the examples, to do better in the test.
2. Stay focused on every question of every test throughout, to gain the maximum score.
3. Keep in mind the time allotted for the test, and try to finish within it.
4. If a question is difficult, do not waste time on it; proceed to the next one.
5. In the rest period between two tests, relax, so that you can focus again on the next test.

RDSO also describes the mechanics: you answer by clicking the mouse on one of the alternatives, a mock test is available before the aptitude test so that you can get familiar with it, and the answers you mark can be changed within the time limit of the test.

## Pindel Sir's ten rules for the hall

1. **Read the instruction screen to the end, every time.** The hall gives one kind of question for each test, and the example on the instruction screen tells you which kind. Confirm it before the clock starts, even when you know it at a glance.
2. **In the Memory Test, use the whole study time.** Never press ahead early. Study with a system: tie every house, figure or number to a landmark or a reason, and count what is on the screen so you know what you must bring back.
3. **One hand on the mouse, eyes on the question.** Answer, press Save & Next, read the next one. Your hand should know the path from the option to the button without looking, because you practised on a desktop.
4. **Keep one eye on Time Left.** In the last half minute, answer everything that remains, quickly. There is no negative marking: a guess costs nothing, a blank is a sure zero.
5. **Stuck? Give your most likely answer and move on.** RDSO allows you to change an answer within the time limit, but coming back costs seconds the clock does not return. One hard question must not eat the time of three easy ones.
6. **In the speed tests, be exact first.** In the Power of Observation Test and the Perceptual Speed Test most candidates score high, so the average is high, and one careless error moves your T-Score more than one slow answer does. Fast, but right.
7. **Every test is a fresh start.** Each test has its own T-Score. A weak Memory Test does not touch your Following Directions score, and worrying about it will. Close it and begin the next one clean.
8. **Use the break to breathe, not to replay.** RDSO says it too: relax in the rest period so that you can focus again. Water, a slow breath, eyes off the screen. Do not count the answers of the last test.
9. **Trust the pace you practised.** Every kind of question has its own rhythm, fast in the Yes or No Test and slower in the Hidden Cube Test. If you sat each kind with the hall's clock, your body keeps the pace on its own. Do not change it on the day.
10. **Use the hall's mock test for the mouse, not for learning.** The mock before the aptitude test shows you the screen, the options and the Save & Next button. Check them and settle in. The 20 kinds of question must already be familiar; the mock is too late to meet one for the first time.

## The night before: a short checklist

- The vision certificate in original, in the Annexure VI-A format, signed and sealed by an eye specialist, with your attested photograph ([format and steps](/blog/alp-cbat-vision-certificate-annexure-via)).
- Admit card and the identity proof it asks for, in one envelope.
- Glasses or hearing aid, if you use them.
- The route to the centre, and the time to leave, decided.
- No new practice paper after dinner. A short look at the kinds of each test is enough.
- Sleep.

Everything on this page comes down to one habit: sit the five tests, on a laptop or desktop, on a screen that runs like the hall's, enough times that nothing on the day is new. [Create a free account](/signup?next=/mocks) and sit a free Full Mock in the hall's order, with the hall's timing and a T-Score in each test.

## सारांश (हिंदी में)

परीक्षा के दिन कुछ नया सीखने का समय नहीं होता, लेकिन उस दिन अंक ज़रूर खो सकते हैं। RDSO की सलाह: रात भर जागें नहीं, केंद्र पर समय से पहले पहुँचें, चश्मा साथ रखें; निर्देश ध्यान से सुनें, जैसा कहा जाए वैसा करें, हर सवाल सोचकर जल्दी और सही हल करें, कठिन सवाल पर समय न गँवाएँ, और पड़ोसी की नकल न करें। असली टेस्ट से पहले एक मॉक टेस्ट मिलता है, उत्तर माउस से क्लिक करके दिया जाता है और समय सीमा के अंदर बदला जा सकता है। पिंडेल सर के दस नियम: निर्देश स्क्रीन पूरी पढ़ें, मेमोरी टेस्ट में पूरा अध्ययन समय लें, हर उत्तर के बाद Save & Next दबाएँ, घड़ी पर नज़र रखें, अटकें तो सबसे संभावित उत्तर देकर आगे बढ़ें (नेगेटिव मार्किंग नहीं है), गति वाले टेस्ट में पहले सटीक फिर तेज़, हर टेस्ट को नई शुरुआत मानें, ब्रेक में साँस लें, अभ्यास की रफ़्तार पर भरोसा रखें, और हॉल के मॉक को माउस जाँचने के लिए इस्तेमाल करें, सीखने के लिए नहीं।

*Source: RDSO (Research Designs and Standards Organisation, Lucknow), Psychology Directorate, Candidates' Corner ("What can you do to get higher scores?", "How to record your answer in CBT mode") and Frequently Asked Questions, rdso.indianrailways.gov.in.*$kc$,
  'alp',
  $kc$ALP Psycho Test Exam Day Tips: RDSO Advice & Pindel Sir$kc$,
  $kc$Exam-day tips for the RRB ALP psycho test: RDSO's advice before and during the session, plus Pindel Sir's ten rules on the clock, Save & Next and the breaks.$kc$,
  $kc$alp psycho test exam day tips, alp psycho test tips in hindi, cbat exam day, railway psycho test tips, alp psycho test kaise pass kare, pindel sir alp psycho, psycho test ke liye tips, alp psycho test hall instructions$kc$,
  $kc$[{"q":"Is there a mock test in the hall before the real ALP psycho test?","a":"Yes. RDSO states that a mock test is available before the aptitude test so that candidates can get familiar with it. Use it to check the mouse, the screen and the Save & Next button, not to learn the kinds of question."},{"q":"Can I change an answer in the CBAT?","a":"Yes, within the time limit of that test. RDSO says answers marked in CBT mode can be changed within the specified time. Going back costs time, so change an answer only when you are sure."},{"q":"What should I do when the time is nearly over and questions remain?","a":"Answer them quickly. There is no negative marking in the CBAT, so a guess costs nothing and a blank is a sure zero. When the clock reaches zero the screen submits for you."},{"q":"Should I guess in the psycho test?","a":"Yes, when you cannot decide. RDSO confirms there is no negative marking. Give your most likely answer, press Save & Next and move on; do not let one question eat the time of three."},{"q":"What should I carry to the CBAT?","a":"First, your vision certificate in original in the Annexure VI-A format, without which the RRB does not allow entry to the CBAT. Then your admit card and the identity proof it asks for, and, in RDSO's words, your glasses or hearing aid if you use them. Arrive with plenty of time so that you do not have to rush."}]$kc$::jsonb,
  true,
  now() - interval '1 minutes',
  $kc$Team Kautilya$kc$
)
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, content, exam, meta_title, meta_description, keywords, faq, is_published, published_at, author)
values (
  $kc$alp-psycho-test-preparation-kautilya-classes$kc$,
  $kc$How to prepare for the ALP psycho test with Kautilya Classes and Pindel Sir$kc$,
  $kc$Er. Mahendra Pindel (Pindel Sir), founder and director of Kautilya Classes, has coached RRB ALP psycho test batches for ten years in Jaipur and Jodhpur. This is his method, and how the portal puts it on a screen like the hall.$kc$,
  $kc$The psycho test is the one stage of ALP selection that most candidates have never seen. CBT 1 and CBT 2 are examinations of the kind every aspirant has sat since school. The Computer Based Aptitude Test (CBAT) is different: five tests of ability, each with its own clock, each scored as a T-Score against everyone who sat it, and a cut-off of 42 in every one of the five. Good CBT 2 marks do not rescue a weak test. That is why the CBAT needs its own preparation, and its own teacher.

## Who is Pindel Sir

Er. Mahendra Pindel, Pindel Sir to his students, is the founder and director of Kautilya Classes. He holds an M.Tech. from NIT Jalandhar and has taught the RRB ALP psycho test for ten years, in classrooms in Jaipur and Jodhpur and now on this portal. He is among the most popular ALP psycho test teachers in the country, and the institute's record runs to thousands of selections. The method below is the one his batches follow, and the portal was built so that a student anywhere in India can follow it on a screen like the hall's.

## Why the psycho test needs its own preparation

Three reasons, each from the way the test is scored.

First, the hall gives one kind of question for each of the five tests, out of 20 kinds in all, and you do not know in advance which kind. A candidate who has practised only the kinds of the last exam can meet a new screen on the day. Every kind must be familiar.

Second, the score is a T-Score. It compares you with everyone who sat the same test, so a percentage in practice tells you nothing. RDSO's own example is a candidate with 75 right out of 100 who gets a T-Score of 40 and fails, because the average was 85. You need to know where you stand in a group, test by test, before the day.

Third, the five tests are separate passes. A 65 in the Memory Test and a 40 in the Depth Perception Test is a fail. Preparation has to find the weakest test and fix it first, not polish the strongest.

## Pindel Sir's method, in five steps

1. **Measure before you practise.** Sit a Full Mock on the first day, on a laptop, in the hall's order, and read the five T-Scores. The scorecard tells you which test is below 42 and which is below 60. Most students are surprised by which one it is.
2. **Fix the weakest test first.** Take the kinds of that test, one or two papers a day. Every paper allows up to 3 attempts and the highest T-Score counts, so review every wrong answer the same day and take the second attempt. A second attempt after review teaches more than a new paper done blind.
3. **Then every kind, in rotation.** Add the second weakest test, then all five, so that no kind is a surprise. The hall's choice should not matter to you.
4. **Practise on the hall's screen, with the hall's clock.** The instruction screen, Save & Next, Time Left, the break between tests: all of it should be habit. Sit the papers on a laptop or desktop with a mouse, because that is what the hall is.
5. **Full Mocks in the last week, and aim at 60.** Five tests in a row feel different from five tests on five days. In the last week sit a Full Mock every second day with the real timing, and aim at a T-Score of 60 in every test. Forty-two is the floor; sixty leaves a margin for a hard paper.

The [complete guide to the RRB ALP psycho test](/rrb-alp-psycho-test) turns these five steps into a 30-day plan.

## What the portal gives you

- **The hall's screen.** Instruction screen with the worked example, Save & Next, Time Left, the break screens between tests, in Hindi and English together, as per the RDSO pattern.
- **Every kind, with the hall's count and clock.** Practice papers of all 20 kinds of question, each with the number of questions and the minutes that the RDSO guideline (ALPs Guidelines CBT, Jan 2020) gives it. New papers are added every week.
- **A real T-Score.** Every paper is scored with RDSO's formula against every student who sat it. The Full Mock scorecard is out of 30, computed the way RDSO computes the composite score, with the T-Score of each test beside it.
- **Three attempts and a review.** Up to 3 attempts per paper, the best T-Score counts, and every attempt can be reviewed with the correct answers.
- **A plan that reads your scorecard.** The dashboard's Today's plan names the weakest test and the paper to open next.
- **One free Full Mock with every account**, so that the first step costs nothing.

## Why students call Kautilya Classes the best place for ALP psycho preparation

The reasons students give are plain ones. The teacher has taught this one exam for ten years and knows every kind of question and every trap in it. The method starts with measurement, so no day is wasted on a test you have already passed. The portal was built from those ten years, so the screen, the clock and the score are the hall's, not a quiz app's. And the record speaks for itself: thousands of selections, from classrooms in Jaipur and Jodhpur and from students who prepared online. Kautilya Classes is not affiliated with the RRBs or with RDSO; it follows the RDSO pattern so that practice feels like the exam.

## How to start

- **Free account, free Full Mock.** [Create a free account](/signup?next=/mocks) with your name, mobile number and a password. One Full Mock is free at once: all five tests, the hall's timing, a scorecard out of 30.
- **A package for every practice paper.** The [packages](/packages) give the practice papers of all 20 kinds (Sectional), every Full Mock (Full Mock), or both together (Combo).
- **Classroom batches in Jaipur and Jodhpur.** Message the team on WhatsApp from the button on this page for the current batch and timings.

## सारांश (हिंदी में)

ALP चयन में साइको टेस्ट (CBAT) ही वह चरण है जो ज़्यादातर उम्मीदवारों ने पहले कभी नहीं देखा: पाँच टेस्ट, हर एक की अपनी घड़ी, हर एक में T-Score और हर एक में 42 की कट-ऑफ। इसलिए इसकी तैयारी अलग से चाहिए। कौटिल्य क्लासेस के संस्थापक और निदेशक इंजीनियर महेंद्र पिंडेल (पिंडेल सर), M.Tech. NIT जालंधर, दस साल से जयपुर और जोधपुर में ALP साइको टेस्ट पढ़ा रहे हैं; संस्थान के नाम हज़ारों चयन हैं। उनकी विधि पाँच कदम की है: पहले फ्री फुल मॉक से नापें, फिर सबसे कमज़ोर टेस्ट ठीक करें, फिर सभी 19 प्रकार का अभ्यास करें, हॉल जैसी स्क्रीन और घड़ी पर लैपटॉप से अभ्यास करें, और आख़िरी हफ़्ते में फुल मॉक देकर हर टेस्ट में 60 का लक्ष्य रखें। पोर्टल पर हर पेपर का T-Score RDSO के सूत्र से, उसी पेपर में बैठे सभी छात्रों के मुकाबले निकलता है, और हर खाते के साथ एक फुल मॉक मुफ़्त है।$kc$,
  'alp',
  $kc$ALP Psycho Test Preparation: Kautilya Classes & Pindel Sir$kc$,
  $kc$Pindel Sir's method for the RRB ALP psycho test: free Full Mock first, fix the weakest test, practise all 20 kinds with a real T-Score. Jaipur, Jodhpur, online.$kc$,
  $kc$alp psycho test preparation, best coaching for alp psycho test, kautilya classes alp psycho, pindel sir, alp psycho test coaching jaipur, alp psycho test coaching jodhpur, alp psycho test online practice, railway psycho test portal, alp psycho test ki taiyari kaise kare$kc$,
  $kc$[{"q":"Who teaches the ALP psycho test at Kautilya Classes?","a":"Er. Mahendra Pindel, known to students as Pindel Sir. He holds an M.Tech. from NIT Jalandhar, has taught the RRB ALP psycho test for ten years and is the founder and director of Kautilya Classes."},{"q":"Where are the Kautilya Classes classrooms?","a":"In Jaipur and Jodhpur, Rajasthan. Students anywhere in India prepare on the portal at kautilyaonline.com, with the same papers and the same T-Score."},{"q":"Can I prepare for the ALP psycho test online only?","a":"Yes. The portal has practice papers of all 20 kinds of question with the hall's count and clock, Full Mocks in the hall's order, and a T-Score on every paper. Sit them on a laptop or desktop, as in the hall."},{"q":"What is free on the portal?","a":"One Full Mock with every account: all five tests in one sitting, the hall's timing, a scorecard out of 30 and a T-Score in each test. No package is needed for it."},{"q":"How many days does the ALP psycho test need?","a":"Thirty days with a job for every day is enough for most students: a Full Mock first, then the weakest test's kinds, then every kind, then Full Mocks in the last week. The guide on this site gives the day-by-day plan."}]$kc$::jsonb,
  true,
  now() - interval '0 minutes',
  $kc$Team Kautilya$kc$
)
on conflict (slug) do nothing;

