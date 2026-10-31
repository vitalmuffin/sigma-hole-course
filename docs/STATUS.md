# Status (2026-10-31)

Gates: 0 contract ✔ · 1 scope ✔ · 2 corpus ✔ (131 sources, manifest + hashes) · 3 transcription ✔ (pdftotext) ·
4 translation n/a · 5 knowledge model ✔ (claims + lessons as records) · 6 curriculum ✔ (9 stages, 21 lessons, 26 check questions) ·
7 models ✔ (11 models, 51 unit tests) · 8 frontend ✔ · 9 QA partial (see QA_MATRIX) · 10 release not started.

Rebuild after content edits:
    python3 tools/extract_text.py      # only when PDFs change
    python3 tools/build_data.py        # validates and writes data/course-data.js
    node tests/models/models_test.js
Serve: python3 <skill>/scripts/serve_course.py . --port 8793
