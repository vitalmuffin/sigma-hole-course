# Feedback on interactive_course_factory_skill v1.0.0 (from building this course, 2026-10-31)

Not applied to the skill package yet (it carries MANIFEST.sha256; changes need a new version).

| # | Problem met | Where | Suggested fix |
|---|---|---|---|
| 1 | `slugify("The σ-Hole …")` → `the-hole-and-its-models`: Greek letters dropped | scripts/bootstrap_course.py | transliterate common Greek (σ→sigma …) or take `--id` |
| 2 | Template renders only `lessons[0]` of each stage; no per-lesson routing or deep links | templates/project/app/js/app.js | lesson list per stage, hash routes `#/lesson[/anchor]`, prev/next |
| 3 | The linear model is hard-wired inside ui.js | templates/project/app/js/ui.js | interaction registry (controls + draw → readouts, legend, alt text) separate from the renderer |
| 4 | Redraw only via requestAnimationFrame: never fires in background tabs / embedded panes, so plots stay blank | ui.js | rAF + setTimeout fallback |
| 5 | Language selector shown with a single language | index.html / app.js | hide when `languages.length === 1` |
| 6 | Rules demand claim → source → page traceability, but the template has no claim layer | templates, scripts | `claims` records with a regex anchor, `check_claims.py` that resolves page labels, evidence panel with numbered markers |
| 7 | OCR gate assumes Mistral; for born-digital PDFs `pdftotext` (reading order) is enough; `-layout` breaks sentence search in two-column papers | tasks/03, scripts | add a pdftotext path + low-text detector that routes only scans to OCR |
| 8 | `audit_course.py` imports bs4 (not stdlib) and fails hard | scripts/audit_course.py | preflight check with a clear message, or an html.parser fallback |
| 9 | Browser QA needs Playwright; no fallback | scripts/browser_smoke.py | ship an in-page smoke script (see tests/browser/smoke_in_page.js here) |
| 10 | One quiz question per lesson; no link from a wrong answer back to the model | ui.js | multi-question checks, "back to the model" link, gaps stored per lesson |
| 11 | New pitfall: a model shows artefacts outside its domain (pure quadrupole → spurious σ-hole on the bond side) | references/pitfall_register.md | add P31 "model symmetry/domain artefacts": show only the valid domain, state it under the plot |
| 12 | Output-sensitivity test (P14) should check the text alternative too: two plots changed visually but their alt text ignored a slider | tests | compare alt text before/after each control change |
