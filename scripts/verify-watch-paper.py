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
    "Which number has the highest frequency in the path?": "highest-frequency",
    "Which number has the lowest frequency in the path?": "lowest-frequency",
    "Which number is opposite of the alphabetically last letter in the path?": "opposite-of-alpha-last",
    "Which number is opposite of the alphabetically first letter in the path?": "opposite-of-alpha-first",
    "What is the number of the middle letter in the path?": "middle-letter",
    "What is the number of the alphabetically last letter in the path?": "alpha-last-value",
    "What is the number of the alphabetically first letter in the path?": "alpha-first-value",
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
        if sorted(opts) != [1, 2, 3, 4, 5]:
            failures.append((q["id"], f"options {opts} are not the five numbers 1-5"))
        if q["answer"] not in opts:
            failures.append((q["id"], "correct answer is missing from the options"))

    # A paper of twenty identical question shapes is technically correct and
    # useless, so treat a lopsided mix as a failure too.
    if questions and max(kinds.values()) > len(questions) / 2:
        failures.append(("paper", f"question kinds are lopsided: {dict(kinds)}"))

    print(f"diagrams      : {len(tables)}")
    print(f"questions     : {len(questions)}")
    print(f"question kinds: {dict(kinds)}")
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
