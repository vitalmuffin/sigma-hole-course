#!/usr/bin/env python3
"""Resolve every claim in content/claims.py to a page of its source. Prints ok/MISS/NOTEXT per claim.
Returns {claim_id: page_label or None}; exit code 1 if any regex-backed claim is missing."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "content"))
sys.path.insert(0, str(ROOT / "tools"))
import find  # noqa: E402
from claims import CLAIMS  # noqa: E402


def resolve(verbose=True):
    pages, misses, seen = {}, [], set()
    for c in CLAIMS:
        if c["id"] in seen:
            raise SystemExit(f"duplicate claim id {c['id']}")
        seen.add(c["id"])
        if not (find.PROC / c["src"] / "pages.json").exists():
            misses.append(c["id"]); print(f"  NOSRC {c['id']}: {c['src']} not in corpus"); continue
        if not c["rx"]:
            pages[c["id"]] = None
            if verbose:
                print(f"  NOTEXT {c['id']} ({c['src']}): no text anchor, marked unverified")
            continue
        r = find.search(c["src"], c["rx"], 0)
        if r:
            pages[c["id"]] = r[0]
            if verbose:
                print(f"  ok    {c['id']} ({c['src']} p.{r[0]})")
        else:
            misses.append(c["id"]); print(f"  MISS  {c['id']} ({c['src']}) /{c['rx']}/")
    print(f"[check_claims] {len(CLAIMS)} claims: {len(pages) - list(pages.values()).count(None)} located, "
          f"{list(pages.values()).count(None)} without text anchor, {len(misses)} missing")
    return pages, misses


if __name__ == "__main__":
    _, m = resolve("-q" not in sys.argv)
    sys.exit(1 if m else 0)
