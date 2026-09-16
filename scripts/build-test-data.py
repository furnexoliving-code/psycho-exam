#!/usr/bin/env python3
"""
Generates data/tests/alp-psycho-1.json.

Answer keys for the memory, selective-attention and spatial-scanning sections
are DERIVED from the same structures that get rendered, so a stimulus can never
drift out of sync with its key. Re-run after editing anything in here:

    python3 scripts/build-test-data.py
"""
import json
import random
from pathlib import Path

RNG = random.Random(20260916)  # Fixed seed: the paper must be reproducible.

OUT = Path(__file__).resolve().parent.parent / "data" / "tests" / "alp-psycho-1.json"


def bi(en, hi):
    return {"en": en, "hi": hi}


# --------------------------------------------------------------------------
# 1. Memory Test — railway track map
# --------------------------------------------------------------------------

# Six tracks laid out across a 0-100 canvas, roughly mirroring the crossing
# lines of a real RRB track-memory diagram.
TRACKS = [
    {"points": [[4, 74], [26, 60], [52, 52], [78, 56], [96, 66]], "kind": "double"},
    {"points": [[8, 92], [30, 84], [58, 80], [84, 84], [97, 90]], "kind": "single"},
    {"points": [[12, 96], [22, 66], [30, 38], [36, 14]], "kind": "single"},
    {"points": [[34, 95], [44, 68], [54, 42], [62, 18]], "kind": "double"},
    {"points": [[58, 96], [68, 70], [78, 44], [86, 20]], "kind": "single"},
    {"points": [[2, 40], [24, 30], [50, 26], [74, 30], [94, 42]], "kind": "double"},
]

# 24 stations: real-looking Indian station codes paired with the A-E label the
# test page shows in their place. Letters repeat, exactly as on the real paper.
STATIONS = [
    ("MPL", "A", 0, 0.10), ("SLS", "C", 0, 0.35), ("OZM", "B", 0, 0.60),
    ("MGL", "E", 0, 0.85),
    ("CTR", "D", 1, 0.15), ("SRL", "A", 1, 0.40), ("BPQ", "E", 1, 0.65),
    ("JHS", "C", 1, 0.90),
    ("KGP", "B", 2, 0.20), ("NDL", "D", 2, 0.55), ("TVC", "A", 2, 0.85),
    ("ADI", "E", 3, 0.18), ("BSB", "B", 3, 0.48), ("GKP", "C", 3, 0.78),
    ("LKO", "D", 4, 0.22), ("CNB", "A", 4, 0.52), ("PNBE", "E", 4, 0.82),
    ("HWH", "C", 5, 0.12), ("SDAH", "B", 5, 0.34), ("DHN", "D", 5, 0.56),
    ("RNC", "A", 5, 0.78), ("BBS", "E", 5, 0.92),
    ("VSKP", "B", 0, 0.98), ("MAS", "D", 1, 0.02),
]


def point_on(track, t):
    """Position at fraction `t` along a polyline, measured by segment length."""
    pts = TRACKS[track]["points"]
    segs = []
    total = 0.0
    for i in range(len(pts) - 1):
        (x1, y1), (x2, y2) = pts[i], pts[i + 1]
        length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        segs.append((length, (x1, y1), (x2, y2)))
        total += length

    target = t * total
    run = 0.0
    for length, (x1, y1), (x2, y2) in segs:
        if run + length >= target or length == 0:
            local = 0 if length == 0 else (target - run) / length
            return round(x1 + (x2 - x1) * local, 2), round(y1 + (y2 - y1) * local, 2)
        run += length
    return pts[-1][0], pts[-1][1]


# Candidate label offsets, tried in order until one lands clear of its
# neighbours. Mirrors how a draughtsman shifts a label off a crowded junction.
LABEL_OFFSETS = [
    (2.4, -1.6), (-2.4, -1.6), (2.4, 3.6), (-2.4, 3.6),
    (2.4, -5.0), (-2.4, -5.0), (0.0, 5.6), (0.0, -6.2),
]


def place_labels(stations):
    """Pick a label offset per station so label boxes do not overlap."""
    placed = []  # (x1, y1, x2, y2) boxes in viewBox units
    # Codes are up to 4 characters at fontSize 3.4; this approximates the box.
    def box(station, dx, dy, width):
        x = station["x"] + dx
        y = station["y"] + dy
        left = x - width if dx < 0 else x
        return (left, y - 3.4, left + width, y + 0.6)

    def overlaps(a, b):
        return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])

    for station in stations:
        # Reserve room for the longer of the two labels the map can show.
        width = max(len(station["code"]), 1) * 2.0
        chosen = LABEL_OFFSETS[0]
        for dx, dy in LABEL_OFFSETS:
            candidate = box(station, dx, dy, width)
            # Stay inside the canvas and clear of every label already placed.
            if candidate[0] < 0.5 or candidate[2] > 99.5:
                continue
            if candidate[1] < 1.0 or candidate[3] > 99.0:
                continue
            if any(overlaps(candidate, other) for other in placed):
                continue
            chosen = (dx, dy)
            break
        placed.append(box(station, chosen[0], chosen[1], width))
        station["lx"], station["ly"] = chosen

    return stations


def build_track_map():
    stations = []
    for code, letter, track, t in STATIONS:
        x, y = point_on(track, t)
        stations.append({"x": x, "y": y, "code": code, "letter": letter})
    return {"tracks": TRACKS, "stations": place_labels(stations)}


TRACK_MAP = build_track_map()
LETTERS = ["A", "B", "C", "D", "E"]


def memory_section():
    blocks = [
        {
            "id": "mem-set-1",
            "title": bi("Set-1 (Q1 - Q12)", "सेट-1 (प्र1 - प्र12)"),
            "stimulus": {"type": "track-map", "map": TRACK_MAP},
        },
        {
            "id": "mem-set-2",
            "title": bi("Set-2 (Q13 - Q24)", "सेट-2 (प्र13 - प्र24)"),
            "stimulus": {"type": "track-map", "map": TRACK_MAP},
        },
    ]

    choices = [{"key": k} for k in LETTERS]
    questions = []
    for i, (code, letter, _, _) in enumerate(STATIONS):
        questions.append({
            "id": f"mem-q{i + 1}",
            "blockId": "mem-set-1" if i < 12 else "mem-set-2",
            "prompt": bi(code, code),
            "choices": choices,
            "correct": letter,
        })

    example_map = {
        "tracks": [
            {"points": [[6, 78], [34, 50], [62, 30], [92, 18]], "kind": "double"},
            {"points": [[6, 30], [32, 44], [58, 58], [92, 74]], "kind": "single"},
            {"points": [[50, 6], [48, 40], [46, 72], [44, 95]], "kind": "single"},
        ],
        "stations": place_labels([
            {"x": 34, "y": 50, "code": "SOK", "letter": "B"},
            {"x": 62, "y": 30, "code": "PER", "letter": "C"},
            {"x": 58, "y": 58, "code": "DET", "letter": "A"},
            {"x": 46, "y": 72, "code": "NGR", "letter": "E"},
        ]),
    }

    return {
        "id": "memory",
        "kind": "memory",
        "name": bi("Track Memory Test", "ट्रैक स्मृति परीक्षण"),
        "timeLimitMin": 8,
        "scored": True,
        "instructions": [
            bi(
                "This is a test of memory. The test is in two parts. In each part there "
                "is a Study page and a Test page.",
                "यह स्मृति की परीक्षा है। यह टेस्ट दो भागों में होता है। प्रत्येक भाग में एक "
                "अध्ययन पृष्ठ और एक परीक्षण पृष्ठ होता है।",
            ),
            bi(
                "On the study page you will see a railway map with names of some railway "
                "stations. Your task is to memorise the location of stations.",
                "अध्ययन पृष्ठ पर आपको कुछ रेलवे स्टेशनों के नाम सहित एक रेलवे मानचित्र दिखाई देगा। "
                "आपका कार्य स्टेशनों की स्थिति याद करना है।",
            ),
            bi(
                "After the allotted time you will be taken to the test page. On this page "
                "you will find the same railway map having English alphabets (A, B, C, D, E) "
                "in place of stations.",
                "निर्धारित समय के बाद आपको परीक्षण पृष्ठ पर ले जाया जाएगा। इस पृष्ठ पर आपको वही "
                "रेलवे मानचित्र मिलेगा जिसमें स्टेशनों के स्थान पर अंग्रेजी अक्षर (A, B, C, D, E) होंगे।",
            ),
            bi(
                "You are required to recall the location of each station in the map. The "
                "alphabet that stands for the position of the station in the map will be "
                "your answer.",
                "आपको मानचित्र में प्रत्येक स्टेशन की स्थिति याद करनी है। मानचित्र में स्टेशन की स्थिति "
                "को दर्शाने वाला अक्षर ही आपका उत्तर होगा।",
            ),
        ],
        "example": {
            "text": [
                bi(
                    "Now look at the example of study page given below:-",
                    "उदाहरण के लिए नीचे दिए गए अध्ययन पृष्ठ को देखें:-",
                ),
                bi(
                    "If the question asks for PER and PER stands at position C on the test "
                    "page, then option C is the right answer.",
                    "यदि प्रश्न PER के बारे में है और परीक्षण पृष्ठ पर PER की स्थिति C है, तो विकल्प C "
                    "सही उत्तर है।",
                ),
            ],
            "stimulus": {"type": "track-map", "map": example_map},
        },
        "studyPhase": {
            "durationSec": 180,
            "stimulus": {"type": "track-map", "map": TRACK_MAP},
        },
        "blocks": blocks,
        "questions": questions,
    }


# --------------------------------------------------------------------------
# 2. Selective Attention Test — symbol grid
# --------------------------------------------------------------------------

SYMBOLS = ["◆", "▲", "●", "■", "★", "✚", "▼", "◗"]


def selective_attention_section():
    rows = [[RNG.choice(SYMBOLS) for _ in range(12)] for _ in range(10)]
    grid = {"type": "symbol-grid", "rows": rows}

    questions = []
    for i in range(24):
        row_index = i % 10
        target = SYMBOLS[i % len(SYMBOLS)]
        count = rows[row_index].count(target)

        # Four plausible counts around the true one, shuffled into A-D.
        pool = {count}
        offset = 1
        while len(pool) < 4:
            for candidate in (count - offset, count + offset):
                if candidate >= 0 and len(pool) < 4:
                    pool.add(candidate)
            offset += 1
        values = sorted(pool)
        RNG.shuffle(values)

        keys = ["A", "B", "C", "D"]
        choices = [
            {"key": k, "label": bi(str(v), str(v))} for k, v in zip(keys, values)
        ]
        correct = keys[values.index(count)]

        questions.append({
            "id": f"sel-q{i + 1}",
            "blockId": "sel-grid",
            "prompt": bi(
                f"Row {row_index + 1}: how many times does {target} appear?",
                f"पंक्ति {row_index + 1}: {target} कितनी बार आया है?",
            ),
            "choices": choices,
            "correct": correct,
        })

    return {
        "id": "selective-attention",
        "kind": "selective-attention",
        "name": bi("Selective Attention Test", "चयनात्मक ध्यान परीक्षण"),
        "timeLimitMin": 6,
        "scored": True,
        "instructions": [
            bi(
                "This test measures how well you can focus on one target while ignoring "
                "everything around it.",
                "यह परीक्षण मापता है कि आप आसपास की अन्य चीज़ों को अनदेखा करते हुए एक लक्ष्य पर "
                "कितना ध्यान केंद्रित कर सकते हैं।",
            ),
            bi(
                "A grid of symbols is shown. For each question, count how many times the "
                "given symbol appears in the stated row and mark that number.",
                "प्रतीकों का एक ग्रिड दिखाया गया है। प्रत्येक प्रश्न के लिए गिनें कि दिया गया प्रतीक "
                "बताई गई पंक्ति में कितनी बार आता है और वह संख्या चिह्नित करें।",
            ),
            bi(
                "Work quickly but accurately. Rows are numbered from the top, starting at 1.",
                "तेज़ी से किंतु सावधानी से कार्य करें। पंक्तियाँ ऊपर से 1 से गिनी जाती हैं।",
            ),
        ],
        "blocks": [
            {
                "id": "sel-grid",
                "title": bi("Symbol Grid (Q1 - Q24)", "प्रतीक ग्रिड (प्र1 - प्र24)"),
                "stimulus": grid,
            }
        ],
        "questions": questions,
    }


# --------------------------------------------------------------------------
# 3. Spatial Scanning Test — odd figure out
# --------------------------------------------------------------------------

def polygon_path(sides, rotation=0.0, scale=38.0):
    """SVG path for a regular polygon centred in a 100x100 box."""
    import math
    pts = []
    for i in range(sides):
        angle = rotation + (2 * math.pi * i / sides) - math.pi / 2
        pts.append((50 + scale * math.cos(angle), 50 + scale * math.sin(angle)))
    body = " ".join(f"L{x:.1f},{y:.1f}" for x, y in pts[1:])
    return f"M{pts[0][0]:.1f},{pts[0][1]:.1f} {body} Z"


def spatial_scanning_section():
    keys = ["A", "B", "C", "D", "E"]
    blocks = []
    questions = []

    for i in range(20):
        common_sides = 5 + (i % 4)          # pentagon .. octagon
        odd_sides = common_sides + 1 + (i % 2)
        odd_index = RNG.randrange(5)

        figures = []
        for slot in range(5):
            sides = odd_sides if slot == odd_index else common_sides
            # A slight per-slot rotation stops the odd one being spotted by tilt alone.
            figures.append(polygon_path(sides, rotation=0.22 * slot))

        block_id = f"spa-block-{i + 1}"
        blocks.append({
            "id": block_id,
            "title": bi(f"Question {i + 1}", f"प्रश्न {i + 1}"),
            "stimulus": {"type": "figure-row", "figures": figures},
        })
        questions.append({
            "id": f"spa-q{i + 1}",
            "blockId": block_id,
            "prompt": bi(
                "Which figure is different from the other four?",
                "कौन सी आकृति अन्य चार से भिन्न है?",
            ),
            "choices": [{"key": k} for k in keys],
            "correct": keys[odd_index],
        })

    return {
        "id": "spatial-scanning",
        "kind": "spatial-scanning",
        "name": bi("Spatial Scanning Test", "स्थानिक अवलोकन परीक्षण"),
        "timeLimitMin": 8,
        "scored": True,
        "instructions": [
            bi(
                "This test measures how quickly you can scan a set of figures and spot "
                "the one that does not belong.",
                "यह परीक्षण मापता है कि आप आकृतियों के समूह को कितनी तेज़ी से देखकर उस आकृति को "
                "पहचान सकते हैं जो शेष से भिन्न है।",
            ),
            bi(
                "Five figures are shown side by side, labelled A to E from the left. Four "
                "of them are the same shape; one is different.",
                "पाँच आकृतियाँ साथ-साथ दिखाई गई हैं, बाएँ से A से E तक। इनमें से चार एक ही आकार की "
                "हैं; एक भिन्न है।",
            ),
            bi(
                "Mark the letter of the figure that is different. Figures may be rotated, "
                "which does not make them different.",
                "उस आकृति का अक्षर चिह्नित करें जो भिन्न है। आकृतियाँ घुमाई जा सकती हैं, इससे वे भिन्न "
                "नहीं हो जातीं।",
            ),
        ],
        "blocks": blocks,
        "questions": questions,
    }


# --------------------------------------------------------------------------
# 4. Intelligence Test — reasoning items
# --------------------------------------------------------------------------

INTELLIGENCE = [
    ("Find the next number: 3, 6, 11, 18, 27, ?", "अगली संख्या ज्ञात करें: 3, 6, 11, 18, 27, ?",
     ["34", "36", "38", "40"], "C"),
    ("Find the next number: 2, 6, 12, 20, 30, ?", "अगली संख्या ज्ञात करें: 2, 6, 12, 20, 30, ?",
     ["40", "42", "44", "46"], "B"),
    ("If TRAIN is coded as URBJO, how is METRO coded?",
     "यदि TRAIN का कोड URBJO है, तो METRO का कोड क्या होगा?",
     ["NFUSP", "NFTSP", "NEUSP", "MFUSP"], "A"),
    ("Odd one out: Engine, Coach, Wagon, Platform",
     "विषम चुनें: इंजन, कोच, वैगन, प्लेटफ़ॉर्म",
     ["Engine", "Coach", "Wagon", "Platform"], "D"),
    ("Signal : Train :: Traffic light : ?", "सिग्नल : ट्रेन :: ट्रैफ़िक लाइट : ?",
     ["Road", "Vehicle", "Driver", "Junction"], "B"),
    ("Find the missing term: AZ, BY, CX, ?", "लुप्त पद ज्ञात करें: AZ, BY, CX, ?",
     ["DV", "DW", "EW", "DX"], "B"),
    ("A is the brother of B. B is the sister of C. How is A related to C?",
     "A, B का भाई है। B, C की बहन है। A का C से क्या संबंध है?",
     ["Brother", "Sister", "Father", "Cannot be determined"], "A"),
    ("If 5 workers lay 100 m of track in 4 days, how many days for 10 workers to lay 200 m?",
     "यदि 5 श्रमिक 4 दिनों में 100 मीटर ट्रैक बिछाते हैं, तो 10 श्रमिक 200 मीटर कितने दिनों में बिछाएँगे?",
     ["2", "4", "6", "8"], "B"),
    ("Find the odd number: 16, 25, 36, 48, 64",
     "विषम संख्या ज्ञात करें: 16, 25, 36, 48, 64",
     ["25", "36", "48", "64"], "C"),
    ("Complete the series: Z, X, V, T, ?", "श्रृंखला पूरी करें: Z, X, V, T, ?",
     ["S", "R", "Q", "P"], "B"),
    ("A train travels 60 km in 45 minutes. Its speed in km/h is:",
     "एक ट्रेन 45 मिनट में 60 किमी चलती है। इसकी गति किमी/घंटा में है:",
     ["70", "75", "80", "85"], "C"),
    ("Pointing to a man, Ravi said, 'He is my father's only son.' Who is the man?",
     "एक व्यक्ति की ओर इशारा करते हुए रवि ने कहा, 'वह मेरे पिता का इकलौता पुत्र है।' वह व्यक्ति कौन है?",
     ["Ravi's brother", "Ravi himself", "Ravi's father", "Ravi's uncle"], "B"),
    ("Which comes next: 1, 4, 9, 16, 25, ?", "आगे क्या आएगा: 1, 4, 9, 16, 25, ?",
     ["30", "36", "42", "49"], "B"),
    ("If SOUTH is opposite NORTH, then LEFT of EAST facing north is:",
     "यदि दक्षिण, उत्तर के विपरीत है, तो उत्तर की ओर मुख करके पूर्व के बाएँ है:",
     ["North", "South", "West", "East"], "A"),
    ("Odd one out: Kilometre, Metre, Kilogram, Centimetre",
     "विषम चुनें: किलोमीटर, मीटर, किलोग्राम, सेंटीमीटर",
     ["Kilometre", "Metre", "Kilogram", "Centimetre"], "C"),
    ("Find the next: 100, 81, 64, 49, ?", "अगला ज्ञात करें: 100, 81, 64, 49, ?",
     ["32", "36", "38", "40"], "B"),
    ("Book : Author :: Timetable : ?", "पुस्तक : लेखक :: समय-सारणी : ?",
     ["Passenger", "Railway", "Station", "Clock"], "B"),
    ("A clock shows 3:15. The angle between its hands is:",
     "एक घड़ी 3:15 दिखाती है। इसकी सुइयों के बीच का कोण है:",
     ["0°", "7.5°", "15°", "30°"], "B"),
    ("Which number replaces the question mark: 7, 14, 28, 56, ?",
     "प्रश्नवाचक चिह्न के स्थान पर कौन सी संख्या आएगी: 7, 14, 28, 56, ?",
     ["84", "98", "112", "126"], "C"),
    ("If all signals are lights and some lights are red, then:",
     "यदि सभी सिग्नल लाइट हैं और कुछ लाइट लाल हैं, तो:",
     ["All signals are red", "Some signals may be red",
      "No signal is red", "All lights are signals"], "B"),
]


def intelligence_section():
    keys = ["A", "B", "C", "D"]
    questions = []
    for i, (en, hi, options, correct) in enumerate(INTELLIGENCE):
        questions.append({
            "id": f"int-q{i + 1}",
            "blockId": "int-main",
            "prompt": bi(en, hi),
            "choices": [
                {"key": k, "label": bi(opt, opt)} for k, opt in zip(keys, options)
            ],
            "correct": correct,
        })

    return {
        "id": "intelligence",
        "kind": "intelligence",
        "name": bi("Intelligence Test", "बुद्धि परीक्षण"),
        "timeLimitMin": 15,
        "scored": True,
        "instructions": [
            bi(
                "This test measures general reasoning ability through number series, "
                "analogies, coding and simple logic.",
                "यह परीक्षण संख्या श्रृंखला, सादृश्य, कूट-लेखन और सरल तर्क के माध्यम से सामान्य "
                "तर्क क्षमता मापता है।",
            ),
            bi(
                "Each question has four options, of which exactly one is correct. There is "
                "no negative marking.",
                "प्रत्येक प्रश्न के चार विकल्प हैं, जिनमें से ठीक एक सही है। कोई ऋणात्मक अंकन नहीं है।",
            ),
        ],
        "blocks": [
            {
                "id": "int-main",
                "title": bi("Reasoning (Q1 - Q20)", "तर्कशक्ति (प्र1 - प्र20)"),
            }
        ],
        "questions": questions,
    }


# --------------------------------------------------------------------------
# 5. Personality Test — Likert statements, not scored
# --------------------------------------------------------------------------

PERSONALITY = [
    ("I check my work again before reporting it as finished.",
     "मैं कार्य पूर्ण बताने से पहले उसे दोबारा जाँचता हूँ।"),
    ("I stay calm when something goes wrong unexpectedly.",
     "जब कुछ अप्रत्याशित रूप से गलत होता है तो मैं शांत रहता हूँ।"),
    ("I prefer to follow a fixed procedure rather than improvise.",
     "मैं सुधार करने के बजाय एक निश्चित प्रक्रिया का पालन करना पसंद करता हूँ।"),
    ("I find it easy to stay alert during long, repetitive duties.",
     "लंबी और दोहराव वाली ड्यूटी के दौरान सतर्क रहना मुझे आसान लगता है।"),
    ("I speak up when I notice a safety problem, even to seniors.",
     "सुरक्षा संबंधी समस्या दिखने पर मैं वरिष्ठों से भी कह देता हूँ।"),
    ("I get irritated when others work more slowly than me.",
     "जब दूसरे मुझसे धीमा काम करते हैं तो मुझे चिढ़ होती है।"),
    ("I plan my day in advance rather than deal with things as they come.",
     "मैं चीज़ों को आने पर निपटाने के बजाय अपना दिन पहले से नियोजित करता हूँ।"),
    ("I can work through the night shift without losing concentration.",
     "मैं रात की पाली में एकाग्रता खोए बिना कार्य कर सकता हूँ।"),
    ("I admit my mistakes even when nobody would find out.",
     "मैं अपनी गलतियाँ स्वीकार करता हूँ, भले ही किसी को पता न चले।"),
    ("Sudden changes in my schedule upset me.",
     "मेरी समय-सारणी में अचानक बदलाव मुझे परेशान करता है।"),
    ("I keep my tools and workspace in order.",
     "मैं अपने उपकरण और कार्यस्थल व्यवस्थित रखता हूँ।"),
    ("I would rather work in a team than alone.",
     "मैं अकेले के बजाय टीम में काम करना पसंद करूँगा।"),
    ("Under pressure I make decisions quickly and stick to them.",
     "दबाव में मैं शीघ्र निर्णय लेता हूँ और उन पर टिका रहता हूँ।"),
    ("I worry about things that have not happened yet.",
     "मैं उन बातों की चिंता करता हूँ जो अभी हुई ही नहीं।"),
    ("I follow rules even when they slow me down.",
     "मैं नियमों का पालन करता हूँ, भले ही वे मुझे धीमा करें।"),
    ("I lose my temper rarely.", "मुझे शायद ही कभी गुस्सा आता है।"),
    ("I take responsibility when a team I lead makes an error.",
     "मेरे नेतृत्व वाली टीम से गलती होने पर मैं ज़िम्मेदारी लेता हूँ।"),
    ("Monotonous work makes me lose interest quickly.",
     "एकरस कार्य में मेरी रुचि शीघ्र समाप्त हो जाती है।"),
    ("I double-check signals and instructions before acting.",
     "कार्य करने से पहले मैं संकेतों और निर्देशों की दोबारा जाँच करता हूँ।"),
    ("I remain confident when being observed by supervisors.",
     "पर्यवेक्षकों द्वारा देखे जाने पर मैं आत्मविश्वास बनाए रखता हूँ।"),
]

LIKERT = [
    ("A", "Strongly Agree", "पूर्णतः सहमत"),
    ("B", "Agree", "सहमत"),
    ("C", "Neutral", "तटस्थ"),
    ("D", "Disagree", "असहमत"),
    ("E", "Strongly Disagree", "पूर्णतः असहमत"),
]


def personality_section():
    choices = [{"key": k, "label": bi(en, hi)} for k, en, hi in LIKERT]
    questions = []
    for i, (en, hi) in enumerate(PERSONALITY):
        questions.append({
            "id": f"per-q{i + 1}",
            "blockId": "per-main",
            "prompt": bi(en, hi),
            "choices": choices,
            # No `correct`: the personality test has no answer key.
        })

    return {
        "id": "personality",
        "kind": "personality",
        "name": bi("Personality Test", "व्यक्तित्व परीक्षण"),
        "timeLimitMin": 20,
        "scored": False,
        "instructions": [
            bi(
                "This is not a test of ability and there are no right or wrong answers.",
                "यह क्षमता का परीक्षण नहीं है और इसमें कोई सही या गलत उत्तर नहीं होता।",
            ),
            bi(
                "Read each statement and mark how far it describes you. Answer honestly "
                "and do not spend long on any single statement.",
                "प्रत्येक कथन पढ़ें और चिह्नित करें कि वह आपका कितना वर्णन करता है। ईमानदारी से "
                "उत्तर दें और किसी एक कथन पर अधिक समय न लगाएँ।",
            ),
            bi(
                "Every statement must be answered. Unanswered statements are not evaluated.",
                "प्रत्येक कथन का उत्तर देना आवश्यक है। बिना उत्तर वाले कथनों का मूल्यांकन नहीं होता।",
            ),
        ],
        "blocks": [
            {
                "id": "per-main",
                "title": bi("Statements (Q1 - Q20)", "कथन (प्र1 - प्र20)"),
            }
        ],
        "questions": questions,
    }


# --------------------------------------------------------------------------

GENERAL_INSTRUCTIONS = [
    bi(
        "The total duration of the exam is the sum of the time limits of the individual "
        "tests. Each test carries its own timer.",
        "परीक्षा की कुल अवधि अलग-अलग परीक्षणों की समय सीमाओं का योग है। प्रत्येक परीक्षण का "
        "अपना टाइमर होता है।",
    ),
    bi(
        "The clock will be set at the server. The countdown timer in the top bar of your "
        "screen will display the remaining time available for you to complete the test. "
        "When the timer reaches zero the test will end by itself.",
        "घड़ी सर्वर पर सेट होगी। आपकी स्क्रीन के ऊपरी बार में उल्टी गिनती का टाइमर शेष उपलब्ध समय "
        "दिखाएगा। टाइमर शून्य पर पहुँचने पर परीक्षण स्वयं समाप्त हो जाएगा।",
    ),
    bi(
        "The Question Palette on the right side of the screen shows the status of each "
        "question using the symbols in the legend above.",
        "स्क्रीन के दाईं ओर प्रश्न पैलेट ऊपर दिए गए संकेतों द्वारा प्रत्येक प्रश्न की स्थिति दर्शाता है।",
    ),
    bi(
        "Marking a question for review simply indicates that you would like to look at it "
        "again. A question that is answered and marked for review WILL be evaluated.",
        "किसी प्रश्न को पुनरावलोकन हेतु चिह्नित करना केवल यह दर्शाता है कि आप उसे दोबारा देखना "
        "चाहते हैं। उत्तरित तथा पुनरावलोकन हेतु चिह्नित प्रश्न का मूल्यांकन किया जाएगा।",
    ),
    bi(
        "You may change the exam language at any time using the Language selector in the "
        "top bar. Both languages are shown side by side on wide screens.",
        "आप ऊपरी बार में भाषा चयनकर्ता से किसी भी समय परीक्षा की भाषा बदल सकते हैं। चौड़ी स्क्रीन "
        "पर दोनों भाषाएँ साथ-साथ दिखाई जाती हैं।",
    ),
    bi(
        "Once you move to the next test you cannot return to the previous one, so finish "
        "each test before moving on.",
        "अगले परीक्षण पर जाने के बाद आप पिछले परीक्षण पर वापस नहीं आ सकते, इसलिए आगे बढ़ने से "
        "पहले प्रत्येक परीक्षण पूरा करें।",
    ),
    bi(
        "Use Screen Zoom (A+ / A-) to change the text size if the screen is hard to read.",
        "यदि स्क्रीन पढ़ने में कठिनाई हो तो टेक्स्ट का आकार बदलने हेतु स्क्रीन ज़ूम (A+ / A-) का "
        "उपयोग करें।",
    ),
]

test = {
    "id": "alp-psycho-1",
    "name": bi("ALP Psycho Full Test - 1", "एएलपी साइको पूर्ण परीक्षण - 1"),
    "displayName": "ALP Psycho Full Test - 1 (Free)",
    "candidate": {"name": "Candidate", "rollNo": "ALP2026001"},
    "generalInstructions": GENERAL_INSTRUCTIONS,
    "sections": [
        memory_section(),
        intelligence_section(),
        selective_attention_section(),
        spatial_scanning_section(),
        personality_section(),
    ],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(test, ensure_ascii=False, indent=2), encoding="utf-8")

total = sum(len(s["questions"]) for s in test["sections"])
minutes = sum(s["timeLimitMin"] for s in test["sections"])
print(f"wrote {OUT} — {len(test['sections'])} sections, {total} questions, {minutes} min")
