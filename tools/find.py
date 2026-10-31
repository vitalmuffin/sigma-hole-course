#!/usr/bin/env python3
"""find.py KEY 'regex' ['regex' ...] : first match per regex in the source's page text, with page label + context.
KEY may be '*' to search every source (first hit per source)."""
import json
import re
import sys
from pathlib import Path

PROC = Path(__file__).resolve().parents[1] / "sources" / "processed"


def flat(s):
    return re.sub(r"-\s*\n\s*(?=[a-z])", "", s).replace("\n", " ")


def load(key):
    d = json.loads((PROC / key / "pages.json").read_text(encoding="utf-8"))
    return d["labels"], [re.sub(r"\s+", " ", flat(p)) for p in d["pages"]]


def search(key, rx, width=220):
    labels, pages = load(key)
    for lab, txt in zip(labels, pages):
        m = re.search(rx, txt, re.I)
        if m:
            a, b = max(0, m.start() - width), min(len(txt), m.end() + width)
            return lab, txt[a:b]
    return None


def main():
    key = sys.argv[1]
    keys = sorted(p.name for p in PROC.iterdir() if p.is_dir()) if key == "*" else [key]
    for rx in sys.argv[2:]:
        hits = 0
        for k in keys:
            r = search(k, rx)
            if r:
                hits += 1
                print(f"  ok  {k} p.{r[0]} /{rx}/: …{r[1]}…")
        if not hits:
            print(f"  --  /{rx}/ no match in {key}")


if __name__ == "__main__":
    main()
