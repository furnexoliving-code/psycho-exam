#!/usr/bin/env python3
"""
Generates data/tests/following-directions-1.json — a Following Directions paper.

Every answer key is DERIVED from the same row of items that gets rendered, so a
question can never disagree with its stimulus. Re-run after any edit:

    python3 scripts/build-following-directions.py
"""
import json
import random
from pathlib import Path

RNG = random.Random(20260918)  # Fixed seed keeps the paper reproducible.
OUT = Path(__file__).resolve().parent.parent / "data" / "tests" / "following-directions-1.json"


def bi(en, hi):
    return {"en": en, "hi": hi}


LETTERS = list("PQRSTUVWXYZABCDEFGHIJKLMN")
KEYS = ["A", "B", "C", "D", "E"]


def make_row(length=12):
    """A row of distinct letters the questions will refer to by position."""
    return RNG.sample(LETTERS, length)


def options_for(answer, row, count=5):
    """`count` distinct items including the answer, shuffled into A-E."""
    pool = [item for item in row if item != answer]
    RNG.shuffle(pool)
    values = [answer] + pool[: count - 1]
    RNG.shuffle(values)
    return values


def build():
    blocks = []
    questions = []

    for index in range(12):
        row = make_row(12)
        block_id = f"fd-block-{index + 1}"

        # Six question shapes, cycled so the paper stays varied but every key
        # is computed from `row` rather than written by hand.
        shape = index % 6

        if shape == 0:
            pivot_pos = RNG.randrange(2, 9)
            step = RNG.randrange(1, 4)
            pivot = row[pivot_pos]
            answer = row[pivot_pos + step]
            prompt = bi(
                f"Which letter is {ordinal(step)} to the RIGHT of {pivot}?",
                f"{pivot} के {ordinal_hi(step)} दाईं ओर कौन सा अक्षर है?",
            )

        elif shape == 1:
            pivot_pos = RNG.randrange(3, 11)
            step = RNG.randrange(1, 4)
            pivot = row[pivot_pos]
            answer = row[pivot_pos - step]
            prompt = bi(
                f"Which letter is {ordinal(step)} to the LEFT of {pivot}?",
                f"{pivot} के {ordinal_hi(step)} बाईं ओर कौन सा अक्षर है?",
            )

        elif shape == 2:
            pos = RNG.randrange(1, 12)
            answer = row[pos]
            prompt = bi(
                f"Which letter is at position {pos + 1} counting from the LEFT?",
                f"बाईं ओर से गिनने पर स्थान {pos + 1} पर कौन सा अक्षर है?",
            )

        elif shape == 3:
            pos_from_right = RNG.randrange(1, 11)
            answer = row[len(row) - 1 - pos_from_right]
            prompt = bi(
                f"Which letter is {ordinal(pos_from_right + 1)} from the RIGHT end?",
                f"दाएँ छोर से {ordinal_hi(pos_from_right + 1)} अक्षर कौन सा है?",
            )

        elif shape == 4:
            # Two hops: find a letter, then step from it.
            base_pos = RNG.randrange(0, 5)
            step = RNG.randrange(2, 5)
            base = row[base_pos]
            answer = row[base_pos + step]
            prompt = bi(
                f"Start at {base} and move {step} places to the RIGHT. "
                "Which letter do you reach?",
                f"{base} से शुरू करके {step} स्थान दाईं ओर जाएँ। आप किस अक्षर पर पहुँचेंगे?",
            )

        else:
            # Midpoint between two letters, which only has an answer when the
            # gap is even — so the gap is chosen even.
            left_pos = RNG.randrange(0, 6)
            gap = RNG.choice([2, 4, 6])
            right_pos = left_pos + gap
            answer = row[left_pos + gap // 2]
            prompt = bi(
                f"Which letter lies exactly midway between {row[left_pos]} "
                f"and {row[right_pos]}?",
                f"{row[left_pos]} और {row[right_pos]} के ठीक बीच में कौन सा अक्षर है?",
            )

        values = options_for(answer, row)
        choices = [
            {"key": k, "label": bi(v, v)} for k, v in zip(KEYS, values)
        ]
        correct = KEYS[values.index(answer)]

        blocks.append({
            "id": block_id,
            "title": bi(f"Question {index + 1}", f"प्रश्न {index + 1}"),
            "stimulus": {"type": "sequence", "items": row, "showPositions": True},
        })
        questions.append({
            "id": f"fd-q{index + 1}",
            "blockId": block_id,
            "prompt": prompt,
            "choices": choices,
            "correct": correct,
        })

    return blocks, questions


def ordinal(n):
    return {1: "1st", 2: "2nd", 3: "3rd"}.get(n, f"{n}th")


def ordinal_hi(n):
    return {1: "पहला", 2: "दूसरा", 3: "तीसरा", 4: "चौथा", 5: "पाँचवाँ",
            6: "छठा", 7: "सातवाँ", 8: "आठवाँ", 9: "नौवाँ", 10: "दसवाँ",
            11: "ग्यारहवाँ", 12: "बारहवाँ"}.get(n, f"{n}वाँ")


blocks, questions = build()

GENERAL_INSTRUCTIONS = [
    bi(
        "This is a sample question paper. The number of questions and the time limit of "
        "each test will differ in the actual examination.",
        "यह केवल एक प्रतिदर्श प्रश्न पत्र है। वास्तविक परीक्षा में प्रत्येक परीक्षण में प्रश्नों की "
        "संख्या एवं समय-सीमा अलग होगी।",
    ),
    bi(
        "Before each test begins, the instructions for that test are shown on screen, "
        "covering the number of questions, the time limit and how to answer.",
        "प्रत्येक परीक्षण के प्रारंभ से पहले कंप्यूटर स्क्रीन पर उस परीक्षण से सम्बंधित निर्देश "
        "प्रदर्शित किए जायेंगे, जिनमें प्रश्नों की संख्या, समय-सीमा तथा प्रश्नों को हल करने की "
        "विधि समझाई जाएगी।",
    ),
    bi(
        "The test starts automatically as soon as the time allotted to the instruction "
        "screen is over.",
        "निर्देश स्क्रीन के बाद निर्धारित समय समाप्त होते ही परीक्षण स्वत: प्रारंभ हो जाएगा।",
    ),
    bi(
        "Click the desired option with the mouse to select your answer. Click another "
        "option to change it.",
        "उत्तर चयन करने के लिए माउस की सहायता से इच्छित विकल्प पर क्लिक करें। उत्तर बदलने के "
        "लिए किसी अन्य विकल्प पर क्लिक करें।",
    ),
    bi(
        "A question palette is shown in the upper left corner of each test, marking every "
        "question as Answered, Not Answered or Not Visited.",
        "प्रत्येक परीक्षण में स्क्रीन के ऊपरी बाएं कोने में एक प्रश्न पैलेट प्रदर्शित होगा, जिसमें "
        "प्रश्नों की स्थिति हल किये गए, हल नहीं किये गए अथवा अनदेखे के रूप में दर्शायी जाएगी।",
    ),
    bi(
        "A countdown timer in the upper right corner shows the time remaining in minutes "
        "and seconds. The test ends by itself when it reaches zero.",
        "स्क्रीन के ऊपरी दाहिने कोने में काउंटडाउन टाइमर शेष समय को मिनट और सेकंड में दिखाएगा। "
        "टाइमर शून्य पर पहुँचने पर परीक्षण स्वत: समाप्त हो जाएगा।",
    ),
    bi(
        "Keep an eye on the time limit. If a question seems difficult, move on rather than "
        "spending too long on it.",
        "समय सीमा का विशेष ध्यान रखें। यदि कोई प्रश्न कठिन लगे, तो उस पर अधिक समय न दें; "
        "अगले प्रश्नों को हल करें।",
    ),
]

test = {
    "id": "following-directions-1",
    "name": bi("Following Directions Test", "निर्देश पालन परीक्षण"),
    "displayName": "RRB ALP Aptitude Test",
    "candidate": {"name": "Candidate", "rollNo": ""},
    "generalInstructions": GENERAL_INSTRUCTIONS,
    "sections": [
        {
            "id": "following-directions",
            "kind": "following-directions",
            "name": bi("Following Directions", "निर्देश पालन"),
            "timeLimitMin": 6,
            "scored": True,
            "instructions": [
                bi(
                    "This is a test of your ability to follow directions accurately. "
                    "A row of letters is shown, with the position of each letter numbered "
                    "beneath it.",
                    "यह निर्देशों का सही ढंग से पालन करने की क्षमता का परीक्षण है। अक्षरों की एक "
                    "पंक्ति दिखाई जाती है, जिसके नीचे प्रत्येक अक्षर का स्थान अंकित होता है।",
                ),
                bi(
                    "Each question gives a direction such as moving a number of places to "
                    "the left or right of a letter, or counting from one end of the row.",
                    "प्रत्येक प्रश्न में एक निर्देश दिया जाता है, जैसे किसी अक्षर से कुछ स्थान बाएँ "
                    "या दाएँ जाना, अथवा पंक्ति के किसी छोर से गिनना।",
                ),
                bi(
                    "Read the direction carefully, find the letter it leads to, and mark the "
                    "option showing that letter.",
                    "निर्देश को ध्यानपूर्वक पढ़ें, उससे प्राप्त अक्षर को खोजें, और उस अक्षर वाले "
                    "विकल्प को चिह्नित करें।",
                ),
                bi(
                    "Work quickly but carefully. A direction misread is a mark lost.",
                    "तेज़ी से किंतु सावधानी से कार्य करें। गलत पढ़ा गया निर्देश अंक का नुकसान है।",
                ),
            ],
            "example": {
                "text": [
                    bi(
                        "For example, if the row is  K  M  T  B  R  and the question asks "
                        "for the letter 2nd to the RIGHT of K, the answer is T, because "
                        "moving two places right from K gives M then T.",
                        "उदाहरण के लिए, यदि पंक्ति  K  M  T  B  R  है और प्रश्न K के दूसरे दाईं "
                        "ओर के अक्षर के बारे में है, तो उत्तर T है, क्योंकि K से दो स्थान दाएँ "
                        "जाने पर M फिर T आता है।",
                    ),
                ],
                "stimulus": {
                    "type": "sequence",
                    "items": ["K", "M", "T", "B", "R"],
                    "showPositions": True,
                },
            },
            "blocks": blocks,
            "questions": questions,
        }
    ],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(test, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {OUT} — {len(questions)} questions")
