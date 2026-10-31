#!/usr/bin/env python3
"""Gate 5/6: validate the content records and write data/course-data.js (classic script, works under file://).

Checks: unique ids; every {{claim}} exists and resolves to a source page; every [[lesson]] link exists;
every model id is implemented in app/js/interactions.js; quiz answers are in range; every source has bib data.
Exit code 1 on any error.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "content"))
sys.path.insert(0, str(ROOT / "tools"))
from claims import CLAIMS          # noqa: E402
from lessons_a import STAGES_A     # noqa: E402
from lessons_b import STAGES_B     # noqa: E402
import check_claims                # noqa: E402

BIB = Path("/home/vimu/Dokumente/master_thesis/bib/refs.bib")
PDF_DIR = Path("/home/vimu/Dokumente/master_thesis/papers/pdfs")


def parse_bib():
    entries = {}
    for m in re.finditer(r"@(\w+)\s*\{\s*([^,\s]+)\s*,(.*?)\n\}", BIB.read_text(encoding="utf-8"), re.S):
        fields = {}
        for f in re.finditer(r"(\w+)\s*=\s*(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|\"[^\"]*\"|\d+)", m.group(3)):
            v = f.group(2).strip()
            v = v[1:-1] if v[0] in "{\"" else v
            fields[f.group(1).lower()] = re.sub(r"[{}]", "", re.sub(r"\\['\"`^~]\{?(\w)\}?", r"\1", v)).strip()
        entries[m.group(2)] = fields
    return entries


def short_authors(a):
    names = [n.strip() for n in a.split(" and ") if n.strip()]
    last = [n.split(",")[0] if "," in n else n.split()[-1] for n in names]
    if not last:
        return ""
    return last[0] if len(last) == 1 else (f"{last[0]} & {last[1]}" if len(last) == 2 else f"{last[0]} et al.")


def pdf_link(key):
    book = PDF_DIR / f"{key}_book"
    if book.is_dir():
        return f"sources/raw/{key}_book/"
    for p in sorted(PDF_DIR.glob(f"{key}*.pdf")):
        if re.split(r"_10\.", p.stem, maxsplit=1)[0] == key:
            return f"sources/raw/{p.name}"
    loose = sorted(PDF_DIR.parent.glob(f"{key}_10.*.pdf"))
    return f"sources/raw_extra/{loose[0].name}" if loose else None


def main():
    errors = []
    print("[build_data] resolving claims")
    pages, misses = check_claims.resolve(verbose=False)
    errors += [f"claim {m} not located" for m in misses]
    claims = {c["id"]: c for c in CLAIMS}
    stages = STAGES_A + STAGES_B
    interactions = (ROOT / "app" / "js" / "interactions.js").read_text(encoding="utf-8")
    model_ids = set(re.findall(r'^\s*"([a-z0-9-]+)":\s*\{', interactions, re.M))
    lesson_ids = [l["id"] for s in stages for l in s["lessons"]]
    if len(set(lesson_ids)) != len(lesson_ids):
        errors.append("duplicate lesson ids")
    used_claims, used_models = set(), set()

    def scan(text, where):
        for cid in re.findall(r"\{\{([a-z0-9-]+)\}\}", text):
            used_claims.add(cid)
            if cid not in claims:
                errors.append(f"{where}: unknown claim {cid}")
        for lid in re.findall(r"\[\[([a-z0-9-]+)\|", text):
            if lid not in lesson_ids:
                errors.append(f"{where}: link to unknown lesson {lid}")
        if text.count("$") % 2:
            errors.append(f"{where}: unbalanced $ math delimiters")

    for s in stages:
        for l in s["lessons"]:
            w = l["id"]
            for field in ("question", "prior", "boundary", "idea", "model_text", "next_q"):
                scan(l.get(field) or "", f"{w}.{field}")
            for x in l.get("limits", []):
                scan(x, f"{w}.limits")
            for t, b in l.get("deeper", []):
                scan(b, f"{w}.deeper")
            for fm in l.get("formulas", []):      # every displayed formula must cite a located claim
                if not fm.get("src"):
                    errors.append(f"{w}: formula without src: {fm['tex'][:40]}")
                for cid in fm.get("src", []):
                    used_claims.add(cid)
                    if cid not in claims:
                        errors.append(f"{w}.formula: unknown claim {cid}")
            for q in l.get("checks", []):
                if not 0 <= q["correct"] < len(q["choices"]):
                    errors.append(f"{w}: quiz answer index out of range")
                scan(q["explanation"], f"{w}.check")
            if l.get("model"):
                used_models.add(l["model"])
                if l["model"] not in model_ids:
                    errors.append(f"{w}: model {l['model']} not implemented")
            print(f"  lesson {w:20s} checks={len(l.get('checks', []))} model={l.get('model') or '-'}")

    bib = parse_bib()
    sources = {}
    for cid in sorted(used_claims):
        if cid not in claims:
            continue
        key = claims[cid]["src"]
        if key in sources:
            continue
        b = bib.get(key)
        if not b:
            errors.append(f"source {key} missing in refs.bib")
            continue
        sources[key] = {"id": key, "authors": short_authors(b.get("author", b.get("editor", ""))), "year": b.get("year", ""),
                        "title": b.get("title", ""), "venue": b.get("journal", b.get("publisher", b.get("booktitle", ""))),
                        "doi": b.get("doi", ""), "pdf": pdf_link(key)}
    unused = sorted(set(claims) - used_claims)
    data = {
        "schemaVersion": "1.0", "id": "sigma-hole-course",
        "title": "The σ-Hole and Its Models",
        "builtAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "stages": stages,
        "claims": {cid: {"src": c["src"], "type": c["type"], "text": c["text"], "page": pages.get(cid)}
                   for cid, c in claims.items() if cid in used_claims},
        "sources": sources,
    }
    for e in errors:
        print(f"  ERROR {e}")
    print(f"[build_data] {len(stages)} stages, {len(lesson_ids)} lessons, {len(used_claims)} claims used "
          f"({len(unused)} defined but unused: {', '.join(unused) or '-'}), {len(sources)} sources, "
          f"models used: {', '.join(sorted(used_models))}")
    if errors:
        print(f"[build_data] {len(errors)} error(s); data file NOT written")
        return 1
    out = ROOT / "data" / "course-data.js"
    out.write_text("/* generated by tools/build_data.py — do not edit */\nwindow.ICF_COURSE_DATA = "
                   + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"[build_data] wrote {out} ({out.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
