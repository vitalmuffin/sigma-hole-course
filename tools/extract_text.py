#!/usr/bin/env python3
"""Gate 2/3: build the source manifest and the canonical transcription layer (pdftotext, per page).

The PDFs stay where they are (master_thesis/papers/pdfs, the evidentiary originals); this script records
path + SHA-256 in sources/source_manifest.csv and writes sources/processed/<key>/pages.json
(one string per PDF page, ligatures normalised). Book chapters (pdfs/<Key>_book/*.pdf) are concatenated with
page labels "ch. N, p. M". Re-runs skip sources whose hash is unchanged.
"""
import csv
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

COURSE = Path(__file__).resolve().parents[1]
PDF_DIR = Path("/home/vimu/Dokumente/master_thesis/papers/pdfs")
OUT = COURSE / "sources" / "processed"
MANIFEST = COURSE / "sources" / "source_manifest.csv"
LIG = {"ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl", "­": ""}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def pdf_pages(pdf):
    raw = subprocess.run(["pdftotext", "-enc", "UTF-8", str(pdf), "-"],
                         capture_output=True, text=True, check=False).stdout
    pages = raw.split("\f")
    if pages and not pages[-1].strip():
        pages = pages[:-1]
    out = []
    for p in pages:
        for a, b in LIG.items():
            p = p.replace(a, b)
        out.append(p)
    return out


def sources():
    for path in sorted(PDF_DIR.iterdir()):
        if path.is_dir() and path.name.endswith("_book"):
            yield path.name[:-5], sorted(path.glob("*.pdf"))
        elif path.suffix == ".pdf":
            key = re.split(r"_10\.", path.stem, maxsplit=1)[0]
            yield key, [path]
    # loose PDFs one level up (e.g. Kozuch2013), only if no copy exists in pdfs/
    seen = {re.split(r"_10\.", p.stem, maxsplit=1)[0] for p in PDF_DIR.glob("*.pdf")}
    for path in sorted(PDF_DIR.parent.glob("*.pdf")):
        key = re.split(r"_10\.", path.stem, maxsplit=1)[0]
        if key not in seen:
            yield key, [path]


def main():
    print(f"[extract_text] source dir {PDF_DIR}")
    old = {}
    if MANIFEST.exists():
        with open(MANIFEST, newline="", encoding="utf-8") as fh:
            old = {r["source_id"]: r for r in csv.DictReader(fh) if r.get("source_id")}
    rows, n_new, n_skip, n_empty = [], 0, 0, 0
    for key, files in sources():
        digest = hashlib.sha256("".join(sha256(f) for f in files).encode()).hexdigest()
        target = OUT / key / "pages.json"
        if key in old and old[key].get("sha256") == digest and target.exists():
            print(f"  skip {key}: unchanged")
            rows.append(old[key]); n_skip += 1
            continue
        labels, texts = [], []
        for f in files:
            pages = pdf_pages(f)
            ch = re.search(r"_ch(\d+)$", f.stem)
            for i, t in enumerate(pages, 1):
                labels.append(f"ch. {int(ch.group(1))}, p. {i}" if ch else str(i))
                texts.append(t)
        chars = sum(len(t.strip()) for t in texts)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps({"source_id": key, "labels": labels, "pages": texts}, ensure_ascii=False),
                          encoding="utf-8")
        quality = "ok" if chars > 500 * max(1, len(texts)) * 0.3 else "low-text (scan? needs OCR)"
        if quality != "ok":
            n_empty += 1
        print(f"  ok   {key}: {len(files)} file(s), {len(texts)} pages, {chars} chars, {quality}")
        rows.append({"source_id": key, "files": ";".join(str(f) for f in files), "pages": len(texts),
                     "chars": chars, "sha256": digest, "transcription": "pdftotext (reading order)", "quality": quality})
        n_new += 1
    with open(MANIFEST, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["source_id", "files", "pages", "chars", "sha256", "transcription", "quality"])
        w.writeheader(); w.writerows(rows)
    print(f"[extract_text] {len(rows)} sources: {n_new} extracted, {n_skip} unchanged, {n_empty} low-text")
    return 0


if __name__ == "__main__":
    sys.exit(main())
