r"""Stages 0–3. Text syntax (rendered by app/js/ui.js, never as raw HTML):
blank line = new paragraph; '- ' list item; **bold**; *italic*; $tex$ inline math; [[lesson-id|label]] course link;
{{claim-id}} evidence marker (resolved to source + page at build time).
"""

STAGES_A = [
    dict(id="s0", title="Orientation", summary="One question, three levels of theory, one map.", lessons=[
        dict(
            id="map",
            title="The question behind this course",
            question="An iodine atom in C6F5I carries a negative partial charge, yet it binds chloride. "
                     "How can that be, and which model can predict how strongly, at what distance and at what angle?",
            prior="Chemistry courses treat halogens in molecules as negative ends of polar bonds: "
                  "they accept hydrogen bonds and repel anions. A single atomic charge per atom is enough for that picture.",
            boundary="Crystal structures and gas-phase spectra show short, nearly linear R–X···Y contacts to Lewis bases, "
                     "including anions {{desiraju-def}} {{desiraju-angle}}. A negative point charge on X cannot produce "
                     "an attraction to Y⁻, let alone a preferred direction.",
            idea="The charge around a bonded halogen is not spherical. The rest of this course follows that one fact through "
                 "three levels of theory, each fitted to or checked against the one above it:\n\n"
                 "- **Wavefunction reference**: CCSD(T) at the complete-basis-set limit. Accurate, but its cost grows roughly "
                 "as $N^7$ with system size, so it is used for small benchmark complexes.\n"
                 "- **Density functional theory**: cost roughly $N^3$–$N^4$; accuracy depends on the functional, and halogen bonds "
                 "are a known stress test for it.\n"
                 "- **Force fields**: classical pair terms, cost roughly $N^2$ (or $N \\log N$ with Ewald sums); their parameters "
                 "must be fitted to data from the levels above or to experiment.\n\n"
                 "Every stage asks the same three things: what does the method assume, what is it grounded in, and where does "
                 "it fail for halogen bonds?",
            formulas=[dict(src=['stone-scaling'], tex=r"\frac{t(N)}{t(N_0)} = \left(\frac{N}{N_0}\right)^{p}",
                           symbols=[("t", "wall time of one energy evaluation"),
                                    ("N", "system size (e.g. number of basis functions or atoms)"),
                                    ("N_0", "reference size"),
                                    ("p", "formal scaling exponent: ≈7 for CCSD(T), ≈4 for hybrid DFT, ≈2 for a pairwise force field")])],
            model="cost",
            model_text="Move the size slider. Doubling a system multiplies the CCSD(T) cost by $2^7 = 128$, but a pairwise "
                       "force field only by 4. This gap is the reason the three levels exist side by side.",
            limits=["Formal exponents ignore prefactors, screening and local approximations (DLPNO, density fitting): "
                    "real crossover sizes differ.",
                    "For $N = N_0$ all methods have relative cost 1 by construction."],
            deeper=[("Why not just run DFT on everything?",
                     "DFT is cheap enough for catalyst–substrate complexes, but not for the millions of configurations in "
                     "an MD simulation of a solution. Force fields fill that gap, and the quality of a force field cannot "
                     "exceed the quality of the data it was fitted to.")],
            checks=[dict(prompt="A complex is made three times larger. By roughly what factor does the CCSD(T) cost grow?",
                         choices=["9", "81", "about 2200", "about 59 000"], correct=2,
                         explanation="$3^7 = 2187$. With $p = 4$ (hybrid DFT) it would be 81, with $p = 2$ (force field) 9.")],
            next_q="What does the charge distribution around a bonded halogen actually look like?",
        ),
    ]),

    dict(id="s1", title="The σ-hole", summary="Anisotropic charge, its size, and how chemistry tunes it.", lessons=[
        dict(
            id="sigma-hole",
            title="An anisotropic halogen",
            question="Where on a bonded halogen can a negative partner find a positive potential?",
            prior="One partial charge per atom: the halogen is uniformly negative.",
            boundary="The electrostatic potential (ESP) mapped on an electron-density surface of CF3I or C6F5I shows a "
                     "positive cap on the outer end of iodine, on the extension of the C–I bond, surrounded by a negative belt "
                     "{{clark-sigmahole}} {{clark-belt}}.",
            idea="In R–X the halogen's valence p orbital along the bond is half used for the σ bond. Electron density is "
                 "pulled into the bonding region and the belt, leaving the outer pole depleted: the **σ-hole**. "
                 "The ESP is the energy of a +1 test charge; it is a physical observable, unlike an atomic charge "
                 "{{murray-observable}}. The usual descriptor is $V_{S,\\max}$, the maximum of the ESP on the 0.001 a.u. "
                 "density isosurface.\n\n"
                 "A minimal model already captures the effect: a net charge $q$ plus an axial quadrupole $\\Theta$ on X. "
                 "The quadrupole adds to the potential along the axis and subtracts from it in the belt.",
            formulas=[dict(src=['buckingham-multipole', 'clark-sigmahole'], tex=r"V(\theta) = \frac{q}{r} + \frac{\Theta}{r^{3}}\,\frac{3\cos^{2}\theta - 1}{2}",
                           symbols=[("V(\\theta)", "ESP at distance r and angle θ from the R–X axis (shown in kcal/mol per unit charge)"),
                                    ("q", "net charge on X (e)"),
                                    ("\\Theta", "axial quadrupole moment of X (e·bohr²); positive = depleted pole"),
                                    ("r", "distance from the X nucleus (bohr); 3.7 bohr ≈ 1.96 Å ≈ iodine vdW radius"),
                                    ("\\theta", "angle from the outward R–X direction (0° = σ-hole)")])],
            model="sigma-esp",
            model_text="Start with $\\Theta = 0$: the potential is the same in every direction and negative. Increase $\\Theta$: "
                       "a positive cap appears at 0° although $q$ stays negative. Make $q$ more negative (a more "
                       "electronegative halogen) and the cap shrinks and disappears.",
            limits=["The model is a pure quadrupole and therefore symmetric front to back; only the outer hemisphere "
                    "(θ ≤ 90°) is shown, because the bond side is occupied by R. A real R–X also has a dipole along the bond.",
                    "$\\Theta = 0$: an isotropic atom, $V = q/r$ everywhere. No σ-hole and no directionality.",
                    "Along the axis $V_{\\max} = q/r + \\Theta/r^3$; in the belt $V_{\\min} = q/r - \\Theta/(2r^3)$. "
                    "The difference $1.5\\,\\Theta/r^3$ does not depend on $q$."],
            deeper=[("Why a quadrupole?",
                     "A charge distribution with depleted poles and an enriched equator has a quadrupole moment. Higher "
                     "multipoles sharpen the cap, but the quadrupole is the lowest order that produces it, which is why "
                     "multipole force fields such as AMOEBA can describe σ-holes without extra sites {{amoeba}}."),
                    ("The 0.001 a.u. convention",
                     "$V_{S,\\max}$ depends on which isodensity surface is used. The 0.001 a.u. surface is a convention, "
                     "and halogens are flattened at their poles, so the 'surface' sits closer to the nucleus along the "
                     "bond than in the belt {{sedlak-flattening}}.")],
            checks=[dict(prompt="In the model, q = −0.05 e and Θ is large enough for a σ-hole. What happens to the "
                                "difference V_max − V_min if you make q more negative?",
                         choices=["It grows", "It shrinks", "It stays the same", "It changes sign"], correct=2,
                         explanation="$V_{\\max} - V_{\\min} = 1.5\\Theta/r^3$: the net charge shifts the whole curve "
                                     "but does not change its anisotropy. The σ-hole disappears only because the "
                                     "whole curve moves below zero."),
                    dict(prompt="Why is the ESP a better descriptor than an atomic partial charge?",
                         choices=["It is always positive", "It is a physical observable and keeps the anisotropy",
                                  "It does not depend on the method", "It is cheaper to compute"], correct=1,
                         explanation="The ESP is defined by the electron density (measurable in principle) and "
                                     "shows the direction dependence; a partial charge depends on an arbitrary "
                                     "partitioning and is spherical by construction.")],
            next_q="Which chemical changes make the σ-hole larger or smaller?",
        ),
        dict(
            id="tuning",
            title="Tuning the σ-hole",
            question="Why is iodine a better donor than chlorine, and why is fluorine usually not one at all?",
            prior="Electronegativity alone: F > Cl > Br > I, so fluorine should be the 'most special'.",
            boundary="Fluorine in simple molecules has no positive σ-hole {{clark-fluorine}}; it acts as a donor only with "
                     "very strong electron-withdrawing groups {{cavallo-fluorine}}.",
            idea="Three levers set the σ-hole:\n\n"
                 "- **The halogen**: more polarisable, less electronegative atoms give more positive σ-holes, I > Br > Cl ≫ F "
                 "{{politzer-trend}}. Along this series the bond also becomes stronger and more electrostatic, less "
                 "dispersive {{riley-trend}}.\n"
                 "- **Electron-withdrawing groups** on R deepen the hole: CF3I and C6F5I are classic strong neutral donors; "
                 "cationic heterocycles (imidazolium, pyridinium) are stronger still.\n"
                 "- **Hybridisation** of the carbon: C(sp)–X > C(sp2)–X > C(sp3)–X {{cavallo-hybrid}}.\n\n"
                 "In the model of the previous lesson these levers correspond to a larger $\\Theta$ (more polarisable "
                 "halogen) and a less negative $q$ (electron withdrawal).",
            formulas=[],
            model="sigma-esp",
            model_text="Try to make a 'fluorine' (q = −0.3 e, Θ small) and an 'iodine with C6F5' (q ≈ 0, Θ large). "
                       "Watch the half-opening angle of the positive cap: a stronger σ-hole is also wider.",
            limits=["The model has no polarisation: a real σ-hole grows further when a base approaches."],
            deeper=[("Polar flattening",
                     "Bonded halogens are not spheres. The electron density is compressed along the bond axis, so the "
                     "effective radius in the σ-hole direction is about 0.1–0.2 Å shorter than in the belt "
                     "{{sedlak-flattening}}. A force field with one spherical radius per atom places the repulsive wall "
                     "too far out along the axis."),
                    ("Is V_S,max the whole story?",
                     "No. For CX3I donors the binding trend runs opposite to the σ-hole size {{thirman-trend}}, and "
                     "Engelage et al. needed the σ*(C–I) orbital energy in addition to the σ-hole depth "
                     "([[descriptors|Descriptors lesson]]) {{engelage-w}}.")],
            checks=[dict(prompt="Which change gives the largest increase in σ-hole strength for a C–X donor?",
                         choices=["Cl → F", "C(sp)–I → C(sp3)–I", "CH3I → CF3I", "I → Br"], correct=2,
                         explanation="Fluorination of the carbon (electron withdrawal) deepens the hole. The other "
                                     "three changes all weaken it.")],
            next_q="Is there always exactly one σ-hole, on the bond axis?",
        ),
        dict(
            id="beyond-one-hole",
            title="More than one hole, and what crystals tell us",
            question="Chalcogens, hypervalent iodine and crowded molecules: does the one-axis picture survive?",
            prior="One σ-hole opposite the single R–X bond, contacts close to 180°.",
            boundary="Chalcogens and pnictogens have several covalent bonds and so several σ-holes {{kolar-chalcogen}}. "
                     "Cyclic iodolium salts present two electrophilic axes perpendicular to each other {{heinen-biaxial}}. "
                     "In real molecules σ-holes can be twisted, split or warped by their surroundings {{kirshenboim-split}}.",
            idea="The σ-hole concept generalises: one hole roughly opposite each covalent bond. Directionality is then "
                 "a property of the donor's geometry, not a universal 180° rule.\n\n"
                 "Crystal databases are the main experimental evidence for directionality. The Cambridge Structural "
                 "Database passed 800 000 entries in 2015 {{groom-csd}}; one survey of more than 22 000 contacts found "
                 "fewer than 2 % bifurcated, with iodine over-represented {{michalczyk-csd}}.\n\n"
                 "Two cautions apply when reading such statistics. First, angle histograms must be **cone-corrected**: "
                 "the solid angle near 180° is small, so even random contacts would rarely appear there {{mooibroek-cone}}. "
                 "Second, a crystal contact is the result of all packing forces at once, not of the halogen bond alone.",
            formulas=[dict(src=['mooibroek-cone'], tex=r"P_{\text{random}}(\theta)\,\mathrm{d}\theta \propto \sin\theta\,\mathrm{d}\theta",
                           symbols=[("\\theta", "R–X···Y angle measured from the linear arrangement (0° = linear)"),
                                    ("P_{\\text{random}}", "probability density of a randomly oriented contact"),
                                    ("\\sin\\theta", "solid-angle factor: zero at linearity, maximal at 90°")])],
            model=None, model_text="", limits=["At θ = 0 (perfectly linear) the random density vanishes: raw histograms "
                                               "undercount linear contacts unless divided by sin θ."],
            deeper=[("Why this matters for parametrisation",
                     "If a force field is validated against raw crystal angle histograms, it is rewarded for being "
                     "less directional than reality. Cone correction removes this geometric bias.")],
            checks=[dict(prompt="A raw CSD histogram of R–I···N angles peaks at 165°, not 180°. What is the most likely reason?",
                         choices=["Iodine σ-holes point 15° off-axis", "The solid-angle factor suppresses counts near 180°",
                                  "Nitrogen prefers bent contacts", "The CSD has too few structures"], correct=1,
                         explanation="Without cone correction the $\\sin\\theta$ factor shifts the apparent maximum away "
                                     "from linearity even when the energetic optimum is linear.")],
            next_q="What physical terms hold a halogen bond together?",
        ),
    ]),

    dict(id="s2", title="What holds it together", summary="Energy components and the long debate about them.", lessons=[
        dict(
            id="components",
            title="Anatomy of an interaction energy",
            question="If the σ-hole explains attraction, what explains the distance at which the partners stop?",
            prior="A single electrostatic term between the σ-hole and the base.",
            boundary="Pure electrostatics has no minimum: two opposite charges collapse. Something repulsive must take over "
                     "when the electron clouds overlap.",
            idea="Intermolecular energies are usually split into long-range terms, **electrostatics**, **induction** "
                 "(polarisation) and **dispersion** {{stone-longrange}}, and short-range terms that appear when "
                 "densities overlap: **exchange–repulsion**, **charge transfer** and **penetration** {{stone-shortrange}}. "
                 "Symmetry-adapted perturbation theory (SAPT) computes such terms directly.\n\n"
                 "SAPT on halogen-bonded complexes shows two regimes: in weak complexes (1–6 kcal/mol) dispersion is "
                 "usually the largest attractive term; in strong ones electrostatics and induction dominate {{kolar-sapt}}.",
            formulas=[dict(src=['bornmayer', 'stone-longrange', 'tt-damp'], tex=r"E(r) = A\,e^{-br} \;-\; \frac{332.06\,q_{\text{eff}}}{r} \;-\; f_6(br)\,\frac{C_6}{r^{6}}",
                           symbols=[("E(r)", "interaction energy at separation r (kcal/mol)"),
                                    ("A,\\;b", "Born–Mayer exchange-repulsion prefactor (kcal/mol) and decay constant (Å⁻¹)"),
                                    ("q_{\\text{eff}}", "effective product of interacting charges (e²); stands for the σ-hole–base electrostatics"),
                                    ("C_6", "dispersion coefficient (kcal/mol·Å⁶)"),
                                    ("f_6(br)", "Tang–Toennies damping, $1 - e^{-br}\\sum_{k=0}^{6}(br)^k/k!$")]),],
            model="components",
            model_text="Each slider controls one physical term. Set $q_{\\text{eff}}$ to zero: the complex is held only by "
                       "dispersion and becomes shallower and longer. Raise $b$: the exchange wall becomes steeper and moves in.",
            limits=["$r \\to \\infty$: only the $1/r$ term survives; at the same distance dispersion has long vanished.",
                    "$f_6 \\to 0$ for $br \\to 0$, so the damped dispersion stays finite where the bare $-C_6/r^6$ would diverge {{tt-damp}}."],
            deeper=[("Components are not observables",
                     "Only the total interaction energy is an observable. Every decomposition (SAPT, EDA, ALMO, NBO) "
                     "partitions it with its own definitions, and the shares differ between methods {{kolar-ct-sep}}.")],
            checks=[dict(prompt="In the model, you double C6 and keep everything else fixed. What happens?",
                         choices=["Minimum gets deeper and moves slightly inward", "Minimum moves outward and gets shallower",
                                  "Nothing changes near the minimum", "The curve loses its minimum"], correct=0,
                         explanation="More attraction at mid range deepens the well; the balance with the exchange wall "
                                     "shifts to slightly shorter distances."),
                    dict(prompt="According to SAPT studies, which term usually dominates the attraction in weak halogen bonds (1–6 kcal/mol)?",
                         choices=["Electrostatics", "Induction", "Dispersion", "Charge transfer"], correct=2,
                         explanation="Kolář et al. found dispersion as the largest attractive term in most weak "
                                     "complexes; electrostatics and induction dominate strong ones.")],
            next_q="How large is charge transfer, and why is there no agreement on it?",
        ),
        dict(
            id="ct-debate",
            title="Charge transfer or electrostatics?",
            question="Is a halogen bond a Coulombic contact or a weak donor–acceptor bond?",
            prior="Mulliken's donor–acceptor complexes: an electron donor (base) and an electron acceptor combine "
                  "{{mulliken-ct}}. For halogen bonds the acceptor orbital is σ*(R–X).",
            boundary="Different analyses of the same complexes reach different conclusions:\n\n"
                     "- block-localised wavefunctions: most halogen bonds are held by charge transfer {{wang-ct}};\n"
                     "- constrained DFT: charge transfer is on average only about 10 % of the interaction energy {{rezac-ct}};\n"
                     "- the Coulombic view: electrostatics plus polarisation plus dispersion explain the binding "
                     "{{politzer-coulombic}} {{clark-coulombic}};\n"
                     "- Kohn–Sham MO analysis: substantial HOMO–LUMO (donor–acceptor) stabilisation {{wolters-mo}}.",
            idea="The disagreement is largely about **definitions**. Charge transfer and polarisation are both responses "
                 "of the density to the partner; where one ends and the other begins is a choice of the analysis, and "
                 "CT is not uniquely distinguishable from polarisation {{clark-notseparable}} {{kolar-ct-sep}}.\n\n"
                 "What is not debated: the total interaction energy, the geometry, and the fact that both the "
                 "σ-hole and the σ* orbital correlate with binding. In complexes of Cl2 the charge-transfer "
                 "term is about as large as the interaction energy itself, and low-rung DFT over-binds them strongly {{kriz-ct-cl2}}.",
            formulas=[],
            model=None, model_text="",
            limits=["Weak, long contacts: all decompositions agree that CT is small.",
                    "Very short contacts (trihalides, I3⁻): the bond becomes three-centre four-electron, and the "
                    "'intermolecular' language breaks down."],
            deeper=[("Why a force-field builder should care",
                     "A fixed-charge force field has no CT term at all. If CT really is a large separate term, some "
                     "other term must absorb it; if it is really polarisation, a polarisable model should capture it. "
                     "Either way the fit target is the total energy, not a contested component.")],
            checks=[dict(prompt="Two papers report 10 % and 60 % CT for similar complexes. What is the most defensible reading?",
                         choices=["One of them made a numerical error", "CT depends on how CT is defined in each method",
                                  "The complexes must be very different", "CT is an observable that was measured twice"], correct=1,
                         explanation="CT is a partition of the total energy. Constrained DFT and block-localised "
                                     "wavefunctions draw the line between polarisation and CT differently.")],
            next_q="If electrostatics is not the whole story, where does the strong preference for linearity come from?",
        ),
        dict(
            id="directionality",
            title="Why linear?",
            question="Which energy term makes R–X···Y prefer 180°?",
            prior="The σ-hole sits on the axis, so the electrostatic attraction is strongest there. Linearity is electrostatic.",
            boundary="Analyses that decompose the angular dependence disagree with this simple picture:\n\n"
                     "- Stone (SAPT, distributed multipoles): linearity is a consequence of exchange–repulsion, not of "
                     "electrostatics {{stone-jacs-linear}};\n"
                     "- Huber et al.: charge transfer plus Pauli repulsion favour linear by 51.4 kcal/mol, while "
                     "electrostatics alone would favour a perpendicular approach in their complexes {{huber-linear}};\n"
                     "- activation-strain analysis of H3N···X2: mainly reduced Pauli repulsion {{herrmann-pauli}}.",
            idea="Polar flattening means the halogen's repulsive wall is closest along the axis. A base can come "
                 "nearer there before exchange repulsion grows, so the attractive terms are larger at linearity. "
                 "The σ-hole electrostatics and this 'thin wall' point in the same direction, which is why both pictures "
                 "predict linear contacts; they differ on which term carries the weight.\n\n"
                 "Small deviations from 180° usually come from secondary interactions of the base with other parts "
                 "of the donor {{granthill-secondary}}.",
            formulas=[],
            model=None, model_text="",
            limits=["A force field with a spherical halogen and an on-axis positive extra point produces linearity "
                    "purely electrostatically: try it in the [[ff-electrostatics|force-field electrostatics]] lesson. "
                    "It reproduces the right geometry for a different reason than SAPT gives."],
            deeper=[("Open point",
                     "Whether an FF should model directionality through an anisotropic repulsive wall, a charged site, or "
                     "both is not settled; the answer depends on which property (energy, geometry, angular stiffness) "
                     "it must reproduce.")],
            checks=[dict(prompt="Which statement agrees with Stone's 2013 analysis?",
                         choices=["Linearity is electrostatic", "Linearity comes from exchange–repulsion",
                                  "Linearity comes from dispersion", "Halogen bonds are not linear"], correct=1,
                         explanation="Stone concludes that the tendency to linearity is a consequence of exchange–repulsion, "
                                     "not of electrostatics (although binding is largely electrostatic).")],
            next_q="To settle such questions we need reference energies we trust. How are they computed?",
        ),
    ]),

    dict(id="s3", title="The wavefunction reference", summary="CCSD(T), basis sets, CBS, counterpoise, benchmark sets.", lessons=[
        dict(
            id="ccsdt",
            title="CCSD(T): why it is the reference",
            question="What makes CCSD(T)/CBS the 'gold standard' for interaction energies?",
            prior="Hartree–Fock: each electron moves in the average field of the others. It gets exchange exactly but "
                  "misses correlation, and so misses dispersion completely.",
            boundary="Halogen bonds have large dispersion and polarisation contributions. HF under-binds; MP2 over-binds "
                     "polarisable, dispersion-rich systems.",
            idea="Coupled-cluster theory writes the wavefunction as $e^{\\hat T}\\Phi_{\\text{HF}}$. CCSD includes all single "
                 "and double excitations in this exponential form; (T) adds connected triples by perturbation theory. "
                 "The result is size-consistent and part of a systematically improvable hierarchy; for closed-shell "
                 "non-covalent complexes it is the accepted reference level.\n\n"
                 "The second ingredient is the **basis set**. Correlation energy converges slowly with basis size, so "
                 "results are extrapolated to the complete-basis-set (CBS) limit. Benchmarks for halogen bonds "
                 "therefore quote 'CCSD(T)/CBS' {{rezac-x40}} {{kriz-sh250}}. Kozuch and Martin found that only heavily "
                 "correlated methods (CCSD(T)) or parametrised MP2 variants reach high accuracy, and that heavy basis "
                 "sets and relativistic ECPs are needed {{kozuch-disp}}.",
            formulas=[dict(src=['kolar-ccsdt'], tex=r"|\Psi_{\text{CC}}\rangle = e^{\hat T_1 + \hat T_2}\,|\Phi_{\text{HF}}\rangle,\qquad E_{\text{CCSD(T)}} = E_{\text{CCSD}} + E_{(T)}",
                           symbols=[("\\hat T_1,\\;\\hat T_2", "single and double excitation operators with amplitudes solved iteratively"),
                                    ("\\Phi_{\\text{HF}}", "Hartree–Fock reference determinant"),
                                    ("E_{(T)}", "perturbative estimate of connected triple excitations")])],
            model="cost", model_text="Back to the cost model: the $N^7$ step of (T) is what restricts CCSD(T)/CBS to "
                                     "complexes of a few dozen atoms.",
            limits=["Multireference systems (stretched bonds, some heavy-atom species) break the single-reference "
                    "assumption; for closed-shell halogen bonds at equilibrium this is rarely a problem."],
            deeper=[("Relativity for iodine",
                     "Iodine's core electrons are relativistic. Benchmarks use small-core relativistic pseudopotentials "
                     "with matching cc-pVnZ-PP valence basis sets {{peterson-pp}}.")],
            checks=[dict(prompt="Why does HF alone fail for halogen bonds?",
                         choices=["It has no exchange", "It has no electron correlation, hence no dispersion",
                                  "It cannot treat iodine", "It is not size-consistent"], correct=1,
                         explanation="HF includes exchange exactly but no correlation; dispersion is a correlation effect.")],
            next_q="How do basis sets work, and how is the CBS limit reached?",
        ),
        dict(
            id="basis",
            title="Basis sets, CBS and counterpoise",
            question="How can a finite basis give an infinite-basis answer, and why does the dimer cheat?",
            prior="Molecular orbitals are linear combinations of atom-centred Gaussian functions. More functions, better energy.",
            boundary="Two problems appear for interaction energies:\n\n"
                     "- the correlation energy converges only as about $X^{-3}$ with the cardinal number X (D = 2, T = 3, Q = 4);\n"
                     "- in the dimer, each monomer borrows the partner's basis functions. Its energy is lowered artificially: "
                     "**basis-set superposition error** (BSSE), which over-binds.",
            idea="**Families.** Correlation-consistent cc-pVXZ sets add shells in a fixed pattern so that energies converge "
                 "smoothly; cc-pVXZ-PP versions pair them with pseudopotentials for heavy elements {{peterson-pp}}. "
                 "Karlsruhe def2 sets cover H–Rn with ECPs beyond Kr {{weigend-def2}}. Diffuse functions ('aug-', 'def2-…D') "
                 "are needed for anions and polarisabilities {{rappoport-diffuse}}.\n\n"
                 "**CBS extrapolation.** If $E(X) = E_{\\text{CBS}} + A X^{-3}$, two calculations with X and Y fix both unknowns.\n\n"
                 "**Counterpoise.** Compute each monomer in the full dimer basis (ghost functions on the partner) "
                 "{{boys-cp}}. For DFT, CP-corrected energies are less sensitive to diffuse functions and CP does not "
                 "over-correct {{gray-cp}}; for intermediate basis sets the average of CP and non-CP ('half-half') can "
                 "work best {{brauer-halfcp}}.",
            formulas=[dict(src=['kolar-cbs'], tex=r"E_{\text{CBS}} = \frac{Y^{3}E_{Y} - X^{3}E_{X}}{Y^{3} - X^{3}}",
                           symbols=[("X,\\;Y", "cardinal numbers of the two basis sets (e.g. 3 = TZ, 4 = QZ)"),
                                    ("E_X,\\;E_Y", "correlation (or interaction) energies in those basis sets (kcal/mol)"),
                                    ("E_{\\text{CBS}}", "extrapolated complete-basis-set value")]),
                      dict(src=['boys-cp'], tex=r"\Delta E^{\text{CP}} = E_{AB}^{AB} - E_{A}^{AB} - E_{B}^{AB}",
                           symbols=[("E_{M}^{AB}", "energy of fragment M computed in the full dimer basis AB")])],
            model="cbs",
            model_text="The model assumes both the non-CP and the CP interaction energies converge as $X^{-3}$, non-CP from "
                       "below (over-binding) and CP from above. Pick the basis pair and compare raw values, half-CP and "
                       "the extrapolated result.",
            limits=["If the $X^{-3}$ law held exactly, extrapolation would be exact (the model shows this). "
                    "In practice it holds only approximately, and HF energies converge differently (exponentially), "
                    "so HF and correlation parts are extrapolated separately.",
                    "For $X \\to \\infty$ CP and non-CP agree: BSSE vanishes in a complete basis."],
            deeper=[("Diffuse functions and anions",
                     "An anion's outer electron density extends far out. Without diffuse functions its energy is too high, "
                     "and the error does not cancel between complex and monomers; interaction energies with anions can be "
                     "off by several kcal/mol in small basis sets.")],
            checks=[dict(prompt="Without counterpoise correction, a small-basis interaction energy is usually…",
                         choices=["too weak (under-bound)", "too strong (over-bound)", "exact", "positive"], correct=1,
                         explanation="Each monomer uses the partner's functions in the dimer, lowering the dimer energy "
                                     "relative to the separated monomers: over-binding."),
                    dict(prompt="With E(TZ) = −4.0 and E(QZ) = −4.4 kcal/mol, what does the X⁻³ two-point formula give?",
                         choices=["−4.2", "−4.55", "−4.69", "−5.0"], correct=2,
                         explanation="$(64\\cdot(-4.4) - 27\\cdot(-4.0))/(64-27) = (-281.6+108)/37 = -4.69$ kcal/mol.")],
            next_q="Which benchmark sets exist for halogen bonds, and what do they measure?",
        ),
        dict(
            id="benchmarks",
            title="Benchmark sets",
            question="Against which reference numbers are halogen-bond methods judged?",
            prior="Experimental binding energies.",
            boundary="Gas-phase experimental binding energies of halogen-bonded complexes are scarce, and solution data "
                     "include solvation and entropy. Theory benchmarks use CCSD(T)/CBS interaction energies instead.",
            idea="- **X40** (Řezáč et al. 2012): 40 complexes, CCSD(T)/CBS, plus 10-point dissociation curves {{rezac-x40}}.\n"
                 "- **XB18/XB51** (Kozuch & Martin 2013): geometries and dissociation energies {{kozuch-sets}}.\n"
                 "- **SH250×10** (Kříž & Řezáč 2022): 250 σ-hole complexes of Cl, Br, I, S, Se, P and As with "
                 "10-point CCSD(T)/CBS curves {{kriz-sh250}}.\n"
                 "- **GMTKN55** (Goerigk et al.): general main-group chemistry, contains halogen-bond subsets {{goerigk-gmtkn55}}.\n\n"
                 "Know what a benchmark reports. **Interaction energy** $E_{\\text{int}}$ uses monomers frozen at the "
                 "complex geometry; **binding energy** $E_{\\text{bind}}$ uses relaxed monomers and so includes deformation. "
                 "Dissociation curves ('×10') test the shape away from the minimum, which matters for force fields.",
            formulas=[dict(src=['stone-deformation'], tex=r"E_{\text{bind}} = E_{\text{int}} + \sum_{M} \left(E_{M}^{\text{complex geom}} - E_{M}^{\text{opt}}\right)",
                           symbols=[("E_{\\text{int}}", "interaction energy with monomers in the complex geometry"),
                                    ("E_{M}^{\\text{complex geom}} - E_{M}^{\\text{opt}}", "deformation energy of monomer M (≥ 0)")])],
            model=None, model_text="",
            limits=["For rigid monomers the deformation term is close to zero and both energies agree."],
            deeper=[("Why curves, not only minima?",
                     "A method can get the minimum right by error cancellation and still have the wrong repulsive wall. "
                     "Points at 0.8–2.0 times the equilibrium distance expose such cancellations.")],
            checks=[dict(prompt="A force field must reproduce the angle and distance dependence of a halogen bond. Which "
                                "benchmark type is most useful for fitting it?",
                         choices=["One equilibrium energy per complex", "Dissociation and angular scans",
                                  "Experimental association constants", "Crystal-structure counts"], correct=1,
                         explanation="Scans constrain the shape of the potential, not just one point on it.")],
            next_q="CCSD(T)/CBS is too costly for most systems. How does DFT approximate it?",
        ),
    ]),
]
