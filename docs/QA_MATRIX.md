# QA matrix (2026-10-31)

| Layer | Target | Status | Evidence/notes |
|---|---|---|---|
| Claim anchors | 113 claims | pass | tools/check_claims.py: 111 located on a page, 2 scans (no text layer) marked `scan` |
| Content build | links, claims, models, quiz indices, $ balance | pass | tools/build_data.py, 0 errors |
| Model unit tests | 11 models | pass | node tests/models/models_test.js: 51 passed, 0 failed |
| Static audit (skill audit_course.py) | full tree | not run | needs bs4 (not installed; not downloaded without asking) |
| In-page smoke | 21 lessons, every control, every check | pass | tests/browser/smoke_in_page.js in the Claude browser pane (Chromium): 0 JS errors, 0 math errors, every control changes the plot, no auto-opening quiz |
| Mobile | 320 px | pass | same smoke at 320 px: no horizontal overflow; drawer opens/closes |
| Mobile | 375 / 768 px | not run | |
| Firefox | desktop | not run | |
| Themes | light + dark | pass (visual) | screenshots of σ-hole, components, CBS, dispersion, ridge, vsite models |
| Keyboard/focus | full path | partial | native controls, focus moves to h1 on lesson change, Esc closes drawer; not tested end to end |
| Scientific review | lesson text | not run by a human | facts checked against the PDFs only where a claim marker is placed |
