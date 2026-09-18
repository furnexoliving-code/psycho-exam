#!/usr/bin/env python3
"""
Independently re-derives every answer in data/watch-table-1.json.

This deliberately does NOT reuse the TypeScript engine. It re-parses each
question's English prompt back into (kind, from, to, hand) and recomputes the
answer from the diagram with a separate implementation, so a bug in the
generator cannot certify itself.

    python3 scripts/verify-watch-paper.py
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

PAPER = Path(__file__).resolve().parent.parent / "data" / "watch-table-1.json"

DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
NAME_TO_DIR = {
    "North": "N", "North-East": "NE", "East": "E", "South-East": "SE",
    "South": "S", "South-West": "SW", "West": "W", "North-West": "NW",
}

STEM = re.compile(
    r"^Starting from ([A-Za-z-]+) travel (right|left)-handedly up to ([A-Za-z-]+)\.\s*(.+)$"
)

TAILS = {
    "Among the numbers you pass through, which one appears the most times?": "highest-frequency",
    "Among the numbers you pass through, which one appears the fewest times?": "lowest-frequency",
    "Among the letters you pass through, which number is opposite the alphabetically last one?": "opposite-of-alpha-last",
    "Among the letters you pass through, which number is opposite the alphabetically first one?": "opposite-of-alpha-first",
    "What is the number of the middle letter of the path?": "middle-letter",
    "Among the letters you pass through, what is the number of the alphabetically last one?": "alpha-last-value",
    "Among the letters you pass through, what is the number of the alphabetically first one?": "alpha-first-value",
}


def walk(cells_by_dir, start, end, hand):
    """Positions from start to end inclusive, clockwise for 'right'."""
    step = 1 if hand == "right" else -1
    i = DIRECTIONS.index(start)
    path = []
    for _ in range(len(DIRECTIONS) + 1):
        d = DIRECTIONS[i]
        path.append(cells_by_dir[d])
        if d == end:
            return path
        i = (i + step) % len(DIRECTIONS)
    raise AssertionError("walk did not terminate")


def opposite(direction):
    return DIRECTIONS[(DIRECTIONS.index(direction) + len(DIRECTIONS) // 2) % len(DIRECTIONS)]


def derive(kind, path, cells_by_dir):
    """Recompute the answer, or None when the instance is ambiguous."""
    if kind in ("highest-frequency", "lowest-frequency"):
        counts = Counter(c["value"] for c in path)
        target = max(counts.values()) if kind == "highest-frequency" else min(counts.values())
        winners = [v for v, n in counts.items() if n == target]
        return winners[0] if len(winners) == 1 else None

    if kind == "middle-letter":
        if len(path) % 2 == 0:
            return None
        return path[len(path) // 2]["value"]

    letters = [c["letter"] for c in path]
    if len(set(letters)) != len(letters):
        return None

    want_last = kind in ("opposite-of-alpha-last", "alpha-last-value")
    picked = sorted(path, key=lambda c: c["letter"])[-1 if want_last else 0]

    if kind in ("opposite-of-alpha-last", "opposite-of-alpha-first"):
        return cells_by_dir[opposite(picked["direction"])]["value"]
    return picked["value"]


def main():
    paper = json.loads(PAPER.read_text(encoding="utf-8"))
    tables = paper["tables"]
    questions = paper["questions"]

    failures = []
    kinds = Counter()

    # Structural checks on the diagrams themselves.
    for table in tables:
        dirs = [c["direction"] for c in table["cells"]]
        if sorted(dirs) != sorted(DIRECTIONS):
            failures.append((table["label"], "diagram does not cover all 8 directions"))
        letters = [c["letter"] for c in table["cells"]]
        if len(set(letters)) != len(letters):
            failures.append((table["label"], "diagram repeats a letter"))
        values = sorted(c["value"] for c in table["cells"])
        if set(values) != {1, 2, 3, 4, 5}:
            failures.append((table["label"], f"diagram values {values} are not 1-5"))

    for q in questions:
        table = tables[q["tableIndex"]]
        cells_by_dir = {c["direction"]: c for c in table["cells"]}

        m = STEM.match(q["prompt"]["en"])
        if not m:
            failures.append((q["id"], f"prompt did not parse: {q['prompt']['en']}"))
            continue

        start_name, hand, end_name, tail = m.groups()
        if start_name not in NAME_TO_DIR or end_name not in NAME_TO_DIR:
            failures.append((q["id"], f"unknown direction in {q['prompt']['en']}"))
            continue
        kind = TAILS.get(tail.strip())
        if not kind:
            failures.append((q["id"], f"unknown question tail: {tail}"))
            continue

        kinds[kind] += 1
        start, end = NAME_TO_DIR[start_name], NAME_TO_DIR[end_name]

        if start == end:
            failures.append((q["id"], "path starts and ends at the same position"))
            continue

        path = walk(cells_by_dir, start, end, hand)
        truth = derive(kind, path, cells_by_dir)

        if truth is None:
            failures.append((q["id"], f"{kind} is AMBIGUOUS on this path — should not have been generated"))
            continue
        if truth != q["answer"]:
            failures.append((q["id"], f"{kind}: stored answer {q['answer']}, recomputed {truth}"))
            continue

        opts = q["options"]
        table_values = sorted({c["value"] for c in table["cells"]})
        if sorted(opts) != table_values:
            failures.append((q["id"], f"options {sorted(opts)} are not the diagram's values {table_values}"))
        if q["answer"] not in opts:
            failures.append((q["id"], "correct answer is missing from the options"))

        # A frequency stem must not let an option that never appears in the
        # path read as the least frequent one.
        if kind == "lowest-frequency":
            present = {c["value"] for c in path}
            absent = sorted(set(opts) - present)
            if absent and "you pass through" not in q["prompt"]["en"]:
                failures.append((
                    q["id"],
                    f"lowest-frequency is ambiguous: {absent} never appear in the path "
                    "but are offered as options",
                ))

    # A paper of twenty identical question shapes is technically correct and
    # useless, so treat a lopsided mix as a failure too.
    if questions and max(kinds.values()) > len(questions) / 2:
        failures.append(("paper", f"question kinds are lopsided: {dict(kinds)}"))

    # Answer entropy. Several question types collapse onto one or two answers
    # for most arcs on a given diagram; a paper where one type keeps giving the
    # same number is guessable without reading the diagram at all.
    by_kind = {}
    for q in questions:
        m = STEM.match(q["prompt"]["en"])
        if not m:
            continue
        k = TAILS.get(m.group(4).strip())
        by_kind.setdefault(k, []).append(q["answer"])

    for k, got in by_kind.items():
        if len(got) < 3:
            continue
        modal, times = Counter(got).most_common(1)[0]
        if times / len(got) > 0.5:
            failures.append((
                k,
                f"answer {modal} repeats {times}/{len(got)} times — guessable without the diagram",
            ))

    overall = Counter(q["answer"] for q in questions)
    if questions:
        modal, times = overall.most_common(1)[0]
        if times / len(questions) > 0.35:
            failures.append((
                "paper",
                f"answer {modal} is correct for {times}/{len(questions)} questions overall",
            ))

    print(f"diagrams      : {len(tables)}")
    print(f"questions     : {len(questions)}")
    print(f"question kinds: {dict(kinds)}")
    print(f"answers       : {dict(sorted(Counter(q['answer'] for q in questions).items()))}")
    print()

    if failures:
        print(f"FAILED — {len(failures)} problem(s):")
        for where, why in failures:
            print(f"  {where}: {why}")
        return 1

    print(f"PASSED — all {len(questions)} answers independently recomputed and matched.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
