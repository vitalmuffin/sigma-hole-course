# Project contract — The σ-Hole and Its Models

## Course thesis
An iodine atom with a negative partial charge binds chloride. Which model explains that, and which can predict how
strongly, at what distance and at what angle? The course follows the σ-hole through three levels of theory
(CCSD(T)/CBS → DFT → force fields), asking for each: what it assumes, what it is grounded in, where it fails.

## Audience
- Chemistry master student with basic quantum chemistry (Hartree–Fock, orbitals, basis sets by name).
- Mathematics: algebra, derivatives, least squares; no derivations required.
- Language: English (thesis language). Single language, no translation layer.

## Observable learning outcomes
1. Predict how net charge and quadrupole set the size and opening angle of a σ-hole.
2. Name the energy components of an intermolecular interaction and explain why their shares are method dependent.
3. Compute a two-point CBS extrapolation and say when counterpoise correction matters.
4. Place a functional on Jacob's ladder and explain delocalisation error, range separation and DFT-D damping.
5. Compare pair-potential forms and show how a virtual site creates electrostatic directionality.
6. Assign each force-field parameter group to the data that should determine it; explain weighting and regularisation.
7. Separate settled, debated and open questions about halogen bonding.

## Mode
Hybrid: conceptual dependency order (σ-hole → components → reference → DFT → analysis → FF → fitting → open questions).

## Source policy
- Corpus = the 131 PDFs cited in the master thesis (papers/pdfs + Kozuch2013), no web sources.
- Evidence = the original PDF. Transcription = `pdftotext` reading order per page (born-digital PDFs; Mistral OCR not
  needed). Efron1979 and Schwarz1978 are image scans: claims marked `scan`, checked by eye.
- Every claim: paraphrase in course wording + regex anchor that must match the page text (tools/check_claims.py).
  No long quotations (copyright); the evidence list links to the local PDF page.

## Hosting
Static site, relative paths, classic scripts (works from a local server; `file://` works except the PDF links).
KaTeX 0.16.9 from cdnjs; without network the TeX source is shown instead.

## Exclusions (this stage)
No translation, no OCR, no GitHub Pages deployment, no publishing as an artifact without the user's go,
no new QM calculations, no data from the thesis's own XBFF fits.
