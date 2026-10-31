# The σ-Hole and Its Models

Interactive course on halogen bonding: the σ-hole, energy components, CCSD(T)/CBS, DFT, force fields and their
parametrisation, and open questions. 9 stages, 21 lessons, 11 interactive models, 113 source claims with page anchors.
Built with the interactive course factory skill (v1.0.0).

## Run
    python3 -m http.server 8793    # in this folder, then open http://localhost:8793

KaTeX loads from cdnjs; offline, formulas show as TeX.

## Rebuild after content edits
    python3 tools/build_data.py        # validates claims, links, models; writes data/course-data.js
    node tests/models/models_test.js   # 51 model tests

`tools/extract_text.py` and `tools/check_claims.py` need the source PDFs (not in this repo: copyrighted). They expect
them at the paths in `tools/extract_text.py`; `sources/raw` is a local symlink to that folder. Without the PDFs the
course still runs from the committed `data/course-data.js`; evidence links to PDF pages then do not resolve.

Content lives in `content/` (claims + lessons), models in `app/js/models.js`, docs in `docs/`.
