r"""Stages 4–8 (same text syntax as lessons_a.py)."""

STAGES_B = [
    dict(id="s4", title="Density functional theory", summary="Foundations, the ladder, exact exchange, dispersion.", lessons=[
        dict(
            id="dft-foundations",
            title="From the wavefunction to the density",
            question="How can a function of three coordinates replace a wavefunction of 3N coordinates?",
            prior="Wavefunction methods: the cost grows steeply because the wavefunction depends on all electron coordinates.",
            boundary="CCSD(T) is out of reach for catalyst–substrate complexes with 50–200 atoms.",
            idea="**Hohenberg–Kohn**: the external potential, and hence everything about the ground state, is a unique "
                 "functional of the electron density {{hk-theorem}}. **Kohn–Sham**: replace the interacting electrons by "
                 "non-interacting ones in an effective potential that reproduces the same density; the kinetic energy of "
                 "these orbitals is computed exactly and all remaining many-body effects go into the exchange–correlation "
                 "functional $E_{xc}[\\rho]$ {{ks-equations}}.\n\n"
                 "The exact $E_{xc}$ is unknown. Approximations are ordered on **Jacob's ladder** by their ingredients "
                 "{{perdew-ladder}}:\n\n"
                 "- LDA: the local density $\\rho$;\n"
                 "- GGA: adds the gradient $\\nabla\\rho$ (PBE, BLYP; LYP correlation from Lee, Yang and Parr);\n"
                 "- meta-GGA: adds the kinetic-energy density $\\tau$;\n"
                 "- hybrids: add a fraction of exact (HF) exchange (B3LYP, PBE0, M06-2X) {{becke-hybrid}} {{zhao-m06}};\n"
                 "- double hybrids: add MP2-like correlation from unoccupied orbitals (revDSD-PBEP86).\n\n"
                 "Functionals are grounded either in **exact constraints** (PBE, SCAN) or in **fits to reference data** "
                 "(B3LYP's three parameters, M06-2X's dozens, ωB97X-D's fitted series).",
            formulas=[dict(tex=r"E[\rho] = T_s[\rho] + \int v_{\text{ext}}\rho\,\mathrm{d}\mathbf r + J[\rho] + E_{xc}[\rho]",
                           symbols=[("T_s", "kinetic energy of the non-interacting Kohn–Sham electrons"),
                                    ("v_{\\text{ext}}", "potential of the nuclei"),
                                    ("J", "classical Coulomb repulsion of the density with itself"),
                                    ("E_{xc}", "exchange–correlation energy: everything else, the only approximated part")])],
            model=None, model_text="",
            limits=["With the exact $E_{xc}$, KS-DFT would give the exact ground-state energy and density."],
            deeper=[("What DFT delivers for halogen bonds",
                     "Besides energies, DFT gives the density and ESP, so σ-hole descriptors ($V_{S,\\max}$), charges and "
                     "orbital energies are usually computed at DFT level.")],
            checks=[dict(prompt="Which rung adds exact (Hartree–Fock) exchange?",
                         choices=["GGA", "meta-GGA", "Hybrid", "LDA"], correct=2,
                         explanation="Hybrids mix a fraction of exact exchange into a (meta-)GGA.")],
            next_q="Why does the amount of exact exchange matter so much for halogen bonds?",
        ),
        dict(
            id="exact-exchange",
            title="Exact exchange, range separation and delocalisation error",
            question="Why do many functionals over-bind halogen bonds?",
            prior="Any reasonable hybrid with a dispersion correction should handle a non-covalent contact.",
            boundary="Common functionals over-stabilise halogen bonds; the culprit is **delocalisation error**: approximate "
                     "functionals favour spreading charge over donor and acceptor, which inflates the donor–acceptor part "
                     "{{otero-delocal}}. The most accurate hybrids for halogen bonds have a high fraction of exact exchange "
                     "{{kozuch-exx}}.",
            idea="Exact exchange is free of self-interaction and counters delocalisation, but 100 % of it everywhere ruins "
                 "other properties. **Range-separated hybrids** split the Coulomb operator: short range is treated mostly "
                 "with the DFA, long range with exact exchange. In ωB97X-D the split parameter is ω = 0.2 bohr⁻¹ "
                 "{{chai-omega}}, with a short-range exact-exchange fraction of 0.222 {{chai-cx}}.\n\n"
                 "On the SH250×10 benchmark the double hybrid revDSD-PBEP86 is the most accurate {{kriz-best}}; "
                 "M06-2X and most range-separated hybrids slightly **under**-bind {{kriz-under}}, whereas low-rung "
                 "functionals strongly over-bind complexes in which charge transfer is large {{kriz-ct-cl2}}.",
            formulas=[dict(tex=r"\frac{1}{r} = \underbrace{\frac{\operatorname{erfc}(\omega r)}{r}}_{\text{short range}} + \underbrace{\frac{\operatorname{erf}(\omega r)}{r}}_{\text{long range}}",
                           symbols=[("r", "electron–electron distance (bohr)"),
                                    ("\\omega", "range-separation parameter (bohr⁻¹); 1/ω is the crossover length"),
                                    ("\\operatorname{erf},\\;\\operatorname{erfc}", "error function and its complement, erf + erfc = 1")])],
            model="range-sep",
            model_text="Slide ω. At ω = 0 the whole operator is 'short range' (a global hybrid); for large ω almost all of it "
                       "is 'long range' (pure HF exchange at all relevant distances). ωB97X-D's ω = 0.2 bohr⁻¹ puts the "
                       "crossover near 5 bohr ≈ 2.6 Å, the size of a halogen-bond contact.",
            limits=["$\\omega = 0$: no long-range part; $\\omega \\to \\infty$: no short-range part. The two pieces always sum to $1/r$."],
            deeper=[("ωB97X-D is not ωB97X-D3(BJ)",
                     "ωB97X-D (Chai & Head-Gordon) carries its own damped C6 term fitted together with the functional "
                     "{{chai-damp}}. ωB97X-D3(BJ) (Najibi & Goerigk) is ωB97X refitted with Grimme's D3(BJ) {{najibi-d3bj}}. "
                     "Benchmark rankings of one do not transfer to the other.")],
            checks=[dict(prompt="A GGA functional strongly over-binds a halogen bond with large charge transfer. Which change most "
                                "directly attacks the cause?",
                         choices=["Add a dispersion correction", "Use more exact exchange or a range-separated hybrid",
                                  "Use a smaller basis set", "Remove diffuse functions"], correct=1,
                         explanation="The over-binding comes from delocalisation error; exact exchange reduces it. "
                                     "A dispersion correction would add even more attraction.")],
            next_q="Dispersion is a correlation effect that semilocal functionals miss. How is it added back?",
        ),
        dict(
            id="dispersion",
            title="Dispersion corrections",
            question="How do DFT-D methods add London dispersion, and what happens at short range?",
            prior="Semilocal functionals have no long-range correlation, so $-C_6/r^6$ is missing.",
            boundary="Adding $-C_6/r^6$ naively diverges at short distance and double-counts correlation that the functional "
                     "already has at overlap distances.",
            idea="All DFT-D schemes add damped pairwise terms:\n\n"
                 "- **D2**: empirical atomic C6 and a global scaling $s_6$ {{grimme-d2}};\n"
                 "- **D3**: C6 depends on the coordination number; C8 and an optional three-body term {{grimme-d3}}; "
                 "two damping choices: **zero damping** switches the correction off at short range {{grimme-zero}}, "
                 "**BJ damping** lets it approach a finite value {{grimme-bj}} {{grimme-bj-form}};\n"
                 "- **D4**: C6 also depends on atomic partial charges {{caldeweyher-d4}};\n"
                 "- **TS**: C6 from the self-consistent density via Hirshfeld volumes {{ts-vdw}};\n"
                 "- ωB97X-D: its own Chai–Head-Gordon damping, fitted with the functional {{chai-damp}}.\n\n"
                 "For halogen bonds, Kozuch and Martin found that dispersion corrections tend to be detrimental, "
                 "because the functionals that over-bind already over-bind without them {{kozuch-disp}}; with "
                 "half-and-half functionals that minimise delocalisation error, dispersion corrections work well "
                 "{{otero-delocal}}.",
            formulas=[dict(tex=r"E^{\text{BJ}}_{6} = -\frac{C_6}{r^{6} + (a_1 R_0 + a_2)^{6}}, \qquad E^{\text{zero}}_{6} = -\frac{C_6}{r^{6}}\,\frac{1}{1 + 6\,(r/s_r R_0)^{-\alpha}}",
                           symbols=[("C_6", "pair dispersion coefficient (kcal/mol·Å⁶)"),
                                    ("R_0", "pair cutoff radius (Å)"),
                                    ("a_1,\\;a_2", "BJ parameters fitted per functional (a2 in Å)"),
                                    ("s_r,\\;\\alpha", "zero-damping scaling of R0 and steepness (α = 14 for C6 in D3)")])],
            model="disp-damp",
            model_text="Compare the curves at short range: zero damping goes to zero, BJ stays finite, the bare term "
                       "dives to −∞. At long range all coincide. The region where they differ, 2.5–4 Å, is exactly where "
                       "halogen-bond minima sit.",
            limits=["$r \\to \\infty$: every damped form approaches $-C_6/r^6$.",
                    "$r \\to 0$: BJ → $-C_6/(a_1R_0+a_2)^6$, zero damping → 0."],
            deeper=[("Parameters are functional-specific",
                     "$s_6$, $s_8$, $a_1$, $a_2$ are fitted for each functional on benchmark sets. Combining a functional "
                     "with another functional's parameters is an uncontrolled approximation.")],
            checks=[dict(prompt="At very short range, which damping keeps a finite, non-zero dispersion energy?",
                         choices=["Zero damping", "Becke–Johnson damping", "No damping", "Chai–Head-Gordon damping"], correct=1,
                         explanation="BJ damping replaces $r^6$ by $r^6 + (a_1R_0+a_2)^6$, so the energy approaches a "
                                     "finite constant; zero-type damping sends it to zero.")],
            next_q="With a good density in hand, how do we read charges and descriptors from it?",
        ),
    ]),

    dict(id="s5", title="Reading the density", summary="Charges, orbitals and descriptors for donors and acceptors.", lessons=[
        dict(
            id="charges",
            title="Atomic charges: many answers to one question",
            question="What is 'the' charge of an iodine atom in C6F5I?",
            prior="Every atom has a partial charge that a calculation simply reports.",
            boundary="Atomic charges are not observables. Each scheme divides the same density differently, and for "
                     "halogens they disagree even in sign.",
            idea="- **Mulliken**: split each overlap population equally between the two atoms {{mulliken-pop}}; strongly basis dependent.\n"
                 "- **NBO/NPA**: charges from natural atomic orbitals; NBO also gives donor–acceptor energies such as "
                 "$n(Y) \\to \\sigma^*(C\\text{–}X)$ {{reed-nbo}}.\n"
                 "- **Hirshfeld**: share the density at each point in proportion to free-atom densities {{hirshfeld-stock}}; "
                 "**CM5** rescales Hirshfeld charges to reproduce dipole moments {{marenich-cm5}}.\n"
                 "- **MBIS**: iterative stockholder partitioning with Slater-type atomic densities, also yields atomic "
                 "multipoles {{mbis}}.\n"
                 "- **ESP-fitted** (RESP): charges chosen to reproduce the ESP outside the molecule, the classic choice for "
                 "force fields {{cornell-amber}}.\n\n"
                 "None of these spherical charges can show a σ-hole. For force fields this is the central problem of the "
                 "next stage.",
            formulas=[dict(tex=r"q_A = Z_A - \int w_A(\mathbf r)\,\rho(\mathbf r)\,\mathrm d\mathbf r, \qquad w_A^{\text{Hirsh}} = \frac{\rho_A^{0}(\mathbf r)}{\sum_B \rho_B^{0}(\mathbf r)}",
                           symbols=[("Z_A", "nuclear charge of atom A"),
                                    ("w_A", "weight function that assigns density at r to atom A"),
                                    ("\\rho_A^0", "spherical free-atom density of A (the promolecule reference)")])],
            model=None, model_text="",
            limits=["A charge scheme that reproduces the external ESP well need not give chemically intuitive charges, and vice versa."],
            deeper=[("Which charge for which purpose?",
                     "Descriptors for regression need charges that are robust to basis and geometry (Hirshfeld, CM5, MBIS). "
                     "Force fields need charges that reproduce the ESP or condensed-phase properties (RESP, AM1-BCC). "
                     "NBO is for orbital interpretation.")],
            checks=[dict(prompt="A fixed-charge force field gives iodine q = −0.1 e. What can this model not reproduce?",
                         choices=["The dipole moment", "The attraction of an anion along the C–I axis",
                                  "The total charge", "Long-range Coulomb interactions"], correct=1,
                         explanation="A negative spherical charge repels anions in every direction; the σ-hole needs "
                                     "anisotropy (a multipole or an off-centre site).")],
            next_q="Which descriptors predict how strong a halogen bond will be?",
        ),
        dict(
            id="descriptors",
            title="Descriptors and a single Lewis-acidity parameter",
            question="Can one number per donor predict binding to any acceptor?",
            prior="Conceptual DFT: electronegativity as minus the chemical potential {{parr-chempot}}, hardness as its "
                  "derivative {{parr-hardness}}, HSAB {{pearson-hsab}}, frontier orbitals {{fukui-fmo}}, orbital energies "
                  "as ionisation energies {{koopmans}}. And the σ-hole: $V_{S,\\max}$.",
            boundary="$V_{S,\\max}$ alone misorders some donors {{thirman-trend}}. Engelage et al. therefore searched for the "
                     "best single parameter for 17 carbon-based donors with chloride and ammonia {{engelage-w}}.",
            idea="Their best descriptor combines σ-hole depth and the σ*(C–I) orbital energy {{engelage-coef}}. Binding "
                 "energies follow from W through **one fitted line per acceptor** {{engelage-eq}}. Cationic donors needed "
                 "re-optimised coefficients and still formed a separate trend line with ammonia {{engelage-cationic}}.\n\n"
                 "So W is a property of the donor; the acceptor enters only through which line is used. Predicting "
                 "binding to a new acceptor needs descriptors of **both** partners. That is the step this thesis takes.\n\n"
                 "Cheaper donor descriptors exist too: VmaxPred estimates σ-hole magnitudes from substituent increments "
                 "{{heidrich-vmaxpred}}; %V_bur measures steric shielding {{falivene-vbur}}.",
            formulas=[dict(tex=r"W = a\,E_{\sigma\text{-hole}} + b\,E_{\sigma^*}, \qquad E_{\text{Cl}^-} = -182.45\,W - 8.5, \qquad E_{\text{NH}_3} = -38.84\,W - 7.61",
                           symbols=[("E_{\\sigma\\text{-hole}}", "σ-hole depth (kJ/mol)"),
                                    ("E_{\\sigma^*}", "σ*(C–I) orbital energy (kJ/mol)"),
                                    ("a,\\;b", "3.513×10⁻³ and −8.962×10⁻⁴ (per kJ/mol)"),
                                    ("E_{\\text{Cl}^-},\\;E_{\\text{NH}_3}", "binding energies in kJ/mol as published; the model shows kcal/mol (÷4.184)")])],
            model="engelage",
            model_text="Move W. The chloride line is about 4.7 times steeper than the ammonia line: two donors that differ "
                       "by 0.1 in W differ by about 4.4 kcal/mol with Cl⁻ but only 0.9 kcal/mol with NH3. A single "
                       "acidity number cannot rank acceptors.",
            limits=["Valid only inside the descriptor range of the fitted neutral donors; cationic donors fall on other lines."],
            deeper=[("Descriptor regression, done carefully",
                     "With few compounds and correlated descriptors (σ-hole depth and σ* energy correlate), coefficients "
                     "become unstable. Regularisation and proper validation are the subject of the "
                     "[[fitting-statistics|statistics lesson]].")],
            checks=[dict(prompt="Two neutral donors differ by ΔW = 0.2. Roughly how different are their binding energies to chloride?",
                         choices=["≈ 0.9 kcal/mol", "≈ 1.9 kcal/mol", "≈ 8.7 kcal/mol", "≈ 36 kcal/mol"], correct=2,
                         explanation="$182.45 \\times 0.2 = 36.5$ kJ/mol $= 8.7$ kcal/mol. With ammonia it would be "
                                     "$38.84 \\times 0.2 / 4.184 = 1.9$ kcal/mol.")],
            next_q="How do classical force fields represent all of this?",
        ),
    ]),

    dict(id="s6", title="Force fields", summary="Functional forms, electrostatics, the σ-hole problem, families.", lessons=[
        dict(
            id="ff-forms",
            title="Functional forms for non-bonded interactions",
            question="Which simple function should stand for exchange repulsion plus dispersion?",
            prior="Lennard-Jones 12-6: repulsive and attractive parts as inverse powers of distance {{lj-1924}}.",
            boundary="Exchange repulsion decays exponentially with distance (overlap of densities) {{bornmayer}}; the "
                     "$r^{-12}$ wall is a convenient approximation that is too hard at short range.",
            idea="Common choices, written with the same well depth ε and minimum position $r_m$:\n\n"
                 "- **LJ 12-6**: two parameters, cheap, too hard inside the minimum;\n"
                 "- **Buckingham exp-6**: exponential repulsion {{buckingham}}; needs care because it turns over at very short r;\n"
                 "- **Morse**: a bond-like well with finite depth {{morse}}, sometimes used for directional contacts;\n"
                 "- **double exponential**: two exponentials with global α, β; used by Horton et al. in an OpenFF-style "
                 "force field (α ≈ 16.77, β ≈ 4.43 after refitting) {{horton-de}};\n"
                 "- **Tang–Toennies**: Born–Mayer repulsion plus damped dispersion series {{tt-damp}}.",
            formulas=[dict(tex=r"E_{\text{LJ}} = \varepsilon\left[\left(\tfrac{r_m}{r}\right)^{12} - 2\left(\tfrac{r_m}{r}\right)^{6}\right], \qquad E_{\text{DE}} = \varepsilon\left[\tfrac{\beta e^{\alpha}}{\alpha-\beta}e^{-\alpha r/r_m} - \tfrac{\alpha e^{\beta}}{\alpha-\beta}e^{-\beta r/r_m}\right]",
                           symbols=[("\\varepsilon", "well depth (kcal/mol)"),
                                    ("r_m", "position of the minimum (Å)"),
                                    ("\\alpha,\\;\\beta", "dimensionless steepness of repulsion and attraction (double exponential)")])],
            model="pair-forms",
            model_text="All curves share ε and $r_m$, so they agree at the minimum by construction. Look at $r < 0.8\\,r_m$: "
                       "LJ is the hardest. Near $0.85\\,r_m$ LJ and the double exponential almost coincide; at $0.7\\,r_m$ "
                       "the double exponential is about 10 % softer.",
            limits=["Every form gives $E(r_m) = -\\varepsilon$ and $E'(r_m) = 0$ (unit-tested).",
                    "Buckingham with small α becomes too soft and can collapse at very short r."],
            deeper=[("Combining rules",
                     "Force fields store parameters per atom type and build pair parameters with combining rules "
                     "(Lorentz–Berthelot: arithmetic mean of radii, geometric mean of ε). For unusual pairs such as I···Cl⁻ "
                     "these rules are often the weakest link, which is why pair-specific corrections (NBFIX) exist.")],
            checks=[dict(prompt="Why is an exponential repulsion physically better motivated than r⁻¹²?",
                         choices=["It is cheaper", "Overlap of electron densities decays exponentially",
                                  "It has fewer parameters", "It avoids combining rules"], correct=1,
                         explanation="Exchange repulsion scales with density overlap, which decays exponentially "
                                     "(Born–Mayer).")],
            next_q="Repulsion and dispersion are spherical. How can a force field get the σ-hole?",
        ),
        dict(
            id="ff-electrostatics",
            title="Electrostatics, the σ-hole and virtual sites",
            question="How can fixed point charges describe a positive cap on a negative atom?",
            prior="One charge per atom, fitted to the ESP (RESP) {{cornell-amber}} or from AM1-BCC {{jakalian-am1bcc}}.",
            boundary="A spherical negative charge on iodine repels every anion: no halogen bond at all.",
            idea="Fixes, from cheapest to most physical:\n\n"
                 "- **Off-centre positive site** (extra point, 'explicit σ-hole'): a massless charge on the R–X axis beyond "
                 "the halogen, with the halogen charge adjusted to keep the total {{ibrahim-vs}} {{kolar-vs}} "
                 "{{jorgensen-xb}} {{soteras-vs}}. Directionality now arises from electrostatics.\n"
                 "- **Atomic multipoles** (AMOEBA): the quadrupole carries the σ-hole directly {{amoeba}}.\n"
                 "- **Polarisation**: induced dipoles with Thole damping {{thole}} let the σ-hole respond to the partner.\n"
                 "- **Charge penetration**: point multipoles miss the extra attraction when densities overlap {{wang-cp}}; "
                 "damped-charge models add it {{rackers-cp}}.",
            formulas=[dict(tex=r"E_{\text{elst}}(\theta) = 332.06\,q_A\left[\frac{q_X - q_V}{d} + \frac{q_V}{\lvert \mathbf d - \mathbf d_V\rvert}\right]",
                           symbols=[("q_A", "charge of the anion (e), here −1"),
                                    ("q_X", "total charge of the halogen plus its site (e)"),
                                    ("q_V", "charge moved to the virtual site (e)"),
                                    ("d", "X···A distance (Å), fixed at 3.2 Å"),
                                    ("\\mathbf d_V", "site position: d_V along the R–X axis beyond X (Å)"),
                                    ("\\theta", "angle between the R–X axis and the X···A vector (0° = linear)")])],
            model="vsite",
            model_text="With $q_V = 0$ the curve is flat and repulsive: the halogen is a negative sphere. Move charge to the "
                       "site: the linear approach becomes attractive and the side-on approach repulsive. Push the site "
                       "further out: the angular profile sharpens.",
            limits=["$q_V = 0$: no angle dependence (unit-tested).",
                    "The electrostatic energy says nothing about repulsion; a full force field adds LJ terms, which keep the "
                    "anion from reaching the site."],
            deeper=[("Electrostatic directionality vs. the SAPT picture",
                     "The site makes linearity an electrostatic effect, while SAPT analyses attribute it mainly to "
                     "exchange–repulsion ([[directionality|Why linear?]]). The site works by fitting, not by mimicking the "
                     "physics term by term; its charge and distance absorb whatever the missing terms contribute.")],
            checks=[dict(prompt="In the model, you move the virtual site further from the halogen at fixed q_V. What happens "
                                "to the energy difference between linear and side-on approach?",
                         choices=["It grows", "It shrinks", "It stays the same", "It changes sign"], correct=0,
                         explanation="A site closer to the anion's linear position stabilises the linear approach more "
                                     "strongly than the side-on one, so the anisotropy increases."),
                    dict(prompt="Which effect can a fixed-charge virtual-site model not capture without extra terms?",
                         choices=["The σ-hole direction", "Polarisation of the σ-hole by an approaching anion",
                                  "Net charge conservation", "Linear preference"], correct=1,
                         explanation="Fixed charges do not respond to the partner; polarisation needs induced dipoles or "
                                     "fluctuating charges.")],
            next_q="Which force-field families exist, and how were they parametrised?",
        ),
        dict(
            id="ff-families",
            title="Force-field families and what they were fitted to",
            question="Why do AMBER, CHARMM, OPLS and OpenFF give different answers for the same molecule?",
            prior="A force field is a fixed table of parameters.",
            boundary="Each family made different choices about functional form, charges and, above all, fit targets.",
            idea="- **AMBER** (Cornell 1995): RESP charges from the 6-31G* ESP {{cornell-amber}}; **GAFF** extends it to "
                 "general organic molecules {{gaff}}.\n"
                 "- **CHARMM22**: charges and interaction parameters fitted to ab initio interactions with water {{charmm}}.\n"
                 "- **OPLS-AA**: non-bonded parameters fitted to liquid properties {{opls}}; OPLS added a halogen X-site {{jorgensen-xb}}.\n"
                 "- **MMFF94**: largely ab initio data {{mmff}}.\n"
                 "- **OpenFF (SMIRNOFF)**: parameters assigned by SMIRKS patterns instead of atom types {{smirnoff}}; "
                 "Sage refitted LJ to liquid densities and enthalpies of mixing {{boothroyd-sage}}.\n\n"
                 "Engines such as OpenMM accept custom functional forms, which makes non-standard halogen-bond terms "
                 "practical {{openmm8}}. A broad historical review: Dauber-Osguthorpe & Hagler {{dauber-review}}.",
            formulas=[dict(tex=r"E = \sum_{\text{bonds}} k_b(b-b_0)^2 + \sum_{\text{angles}} k_\theta(\theta-\theta_0)^2 + \sum_{\text{torsions}} \sum_n k_n[1+\cos(n\phi-\delta_n)] + \sum_{i<j}\left[E_{\text{vdW}}(r_{ij}) + \frac{332.06\,q_iq_j}{r_{ij}}\right]",
                           symbols=[("k_b,\\;b_0", "bond force constant and reference length"),
                                    ("k_\\theta,\\;\\theta_0", "angle force constant and reference angle"),
                                    ("k_n,\\;n,\\;\\delta_n", "torsion barrier, periodicity and phase"),
                                    ("E_{\\text{vdW}}", "LJ or another pair form from the previous lesson"),
                                    ("q_i", "partial charges (e), possibly including virtual sites")])],
            model=None, model_text="",
            limits=["Non-bonded terms are usually excluded or scaled for atoms separated by one to three bonds (1-2, 1-3, scaled 1-4)."],
            deeper=[("Atom types vs. SMIRKS",
                     "Atom typing assigns one label per atom and looks up parameters per type combination. SMIRKS-based "
                     "assignment matches chemical patterns directly, so a halogen-bond parameter can target, e.g., only "
                     "iodine bound to an aromatic carbon.")],
            checks=[dict(prompt="Which family fitted its non-bonded parameters mainly to liquid properties?",
                         choices=["MMFF94", "OPLS-AA", "CHARMM22", "AMBER (Cornell 1995)"], correct=1,
                         explanation="OPLS-AA was developed against conformational energetics and properties of organic liquids.")],
            next_q="So: what should be fitted to what?",
        ),
    ]),

    dict(id="s7", title="Parametrisation", summary="Fit targets, weighting, regularisation and validation.", lessons=[
        dict(
            id="what-to-fit",
            title="What to fit on, and where",
            question="Which data should determine which parameters?",
            prior="Fit everything to everything at once.",
            boundary="Parameters are correlated: LJ radii, charges and virtual sites can trade off. A global fit to a few "
                     "interaction energies can reproduce them with unphysical parameters that fail elsewhere.",
            idea="A layered strategy assigns each parameter group to the data that determine it best:\n\n"
                 "- **Bonded terms** ← QM geometries, Hessians and torsion scans of monomers;\n"
                 "- **Charges** ← the monomer ESP (RESP) or AM1-BCC {{jakalian-am1bcc}}; multipoles/polarisabilities ← "
                 "monomer multipoles and polarisability tensors {{thole}};\n"
                 "- **LJ / repulsion** ← liquid densities and heats of vaporisation or mixing {{opls}} {{boothroyd-sage}};\n"
                 "- **Halogen-bond terms** (site charge and distance, pair corrections) ← QM interaction scans of complexes "
                 "{{kolar-vs}} {{ibrahim-vs}}.\n\n"
                 "Tools like ForceBalance optimise many targets at once with explicit weights and regularisation "
                 "{{forcebalance}}. Weights decide which part of a curve is matched.",
            formulas=[dict(tex=r"L(\boldsymbol\theta) = \frac{\sum_i w_i\,[E_{\text{FF}}(r_i;\boldsymbol\theta) - E_{\text{ref}}(r_i)]^2}{\sum_i w_i}, \qquad w_i = e^{-(E_{\text{ref},i} - E_{\min})/kT_w}",
                           symbols=[("\\boldsymbol\\theta", "parameters being fitted (here ε and r_m of an LJ term)"),
                                    ("w_i", "weight of reference point i"),
                                    ("kT_w", "weighting temperature (kcal/mol): small = focus on the well, large = all points alike")])],
            model="fit-lj",
            model_text="The 'reference' points come from a Morse curve (a stand-in for a QM scan, not real data). An LJ 12-6 "
                       "cannot match both its soft wall and its well. Lower $kT_w$ and the fit locks onto the minimum; raise "
                       "it and the fit compromises, shifting $r_m$ and ε.",
            limits=["Fitting LJ data with LJ recovers the true parameters (unit-tested).",
                    "No weighting makes a wrong functional form right; it only chooses where the error goes."],
            deeper=[("Monomer data first",
                     "Data that depend on one molecule only (ESP, multipoles, polarisabilities) can be fitted without any "
                     "assumptions about partners. Complex data are best reserved for the few parameters that only "
                     "complexes can determine.")],
            checks=[dict(prompt="A force field must give good equilibrium distances; the repulsive wall above +5 kcal/mol is "
                                "less important. Which weighting suits?",
                         choices=["Uniform weights", "Small kT_w (Boltzmann-like)", "Weights growing with energy",
                                  "Only the highest point"], correct=1,
                         explanation="A small weighting temperature concentrates the loss on low-energy points near the minimum.")],
            next_q="With many parameters and few data, how do we avoid fitting noise?",
        ),
        dict(
            id="fitting-statistics",
            title="Statistics of fitting: regularisation and validation",
            question="When does adding a parameter or a descriptor stop helping?",
            prior="The fit with the lowest training error is the best model.",
            boundary="With correlated predictors (σ-hole depth and σ* energy, ε and r_m) least squares gives large, "
                     "unstable coefficients; training error keeps falling while prediction gets worse.",
            idea="- **Ridge** adds $\\lambda\\lVert\\boldsymbol\\beta\\rVert^2$: biased, but stable coefficients {{ridge}}.\n"
                 "- **Lasso** penalises $\\lVert\\boldsymbol\\beta\\rVert_1$ and sets some coefficients to exactly zero {{lasso}}.\n"
                 "- **Information criteria**: AIC $= 2k - 2\\ln L$ {{aic}}; BIC penalises parameters more for large n {{bic}}.\n"
                 "- **Validation**: hold out data; choose the training set to cover descriptor space (Kennard–Stone) "
                 "{{kennard-stone}}; estimate uncertainty by bootstrap resampling {{bootstrap}}.\n\n"
                 "Report errors as RMSE and mean |Δ| on held-out data, not as a signed mean that lets errors cancel.",
            formulas=[dict(tex=r"\hat{\boldsymbol\beta}_{\text{ridge}} = \left(\mathbf X^{\top}\mathbf X + \lambda\mathbf I\right)^{-1}\mathbf X^{\top}\mathbf y",
                           symbols=[("\\mathbf X", "centred descriptor matrix (one row per compound)"),
                                    ("\\mathbf y", "centred target values (e.g. binding energies)"),
                                    ("\\lambda", "penalty strength; λ = 0 is ordinary least squares")])],
            model="ridge",
            model_text="Synthetic data (seeded): $y = 1.0\\,x_1 + 0.3\\,x_2 + \\text{noise}$. Raise the correlation between "
                       "$x_1$ and $x_2$ and watch the least-squares coefficients scatter with only 12 training points. "
                       "Increase λ: coefficients shrink toward each other and zero; the test error often first falls, then rises.",
            limits=["λ = 0 reproduces ordinary least squares; λ → ∞ shrinks all coefficients to zero (unit-tested)."],
            deeper=[("Choosing λ",
                     "Choose λ by cross-validation on the training data only. Using the test set to tune λ leaks "
                     "information and makes the reported error optimistic.")],
            checks=[dict(prompt="With strongly correlated descriptors and λ = 0, what typically happens?",
                         choices=["Coefficients are stable and small", "Coefficients become large and unstable",
                                  "The intercept vanishes", "Training error increases"], correct=1,
                         explanation="Near-collinear columns make $\\mathbf X^\\top\\mathbf X$ nearly singular; small noise "
                                     "changes the coefficients a lot.")],
            next_q="Where does the community still disagree?",
        ),
    ]),

    dict(id="s8", title="Open questions", summary="What is settled, what is debated, what is open.", lessons=[
        dict(
            id="open-questions",
            title="Settled, debated, open",
            question="After all this: what do we actually know about halogen bonds?",
            prior="A textbook picture: σ-hole electrostatics explains everything.",
            boundary="On the physical nature of the halogen bond, a universal consensus has not been reached {{cavallo-consensus}}.",
            idea="**Settled**\n\n"
                 "- Bonded Cl, Br, I carry anisotropic charge with a positive σ-hole; strength I > Br > Cl, tuned by "
                 "electron-withdrawing groups and hybridisation {{politzer-trend}} {{cavallo-hybrid}}.\n"
                 "- Contacts are strongly directional and short {{desiraju-angle}} {{michalczyk-csd}}.\n"
                 "- CCSD(T)/CBS interaction energies are the reference, and benchmark sets exist {{rezac-x40}} {{kriz-sh250}}.\n"
                 "- Delocalisation error makes low-exact-exchange functionals over-bind {{otero-delocal}}.\n\n"
                 "**Debated**\n\n"
                 "- How much is charge transfer, and is it separable from polarisation? {{wang-ct}} {{rezac-ct}} {{clark-notseparable}}\n"
                 "- Which term causes linearity: electrostatics, exchange–repulsion, or CT plus Pauli? {{stone-jacs-linear}} {{huber-linear}}\n"
                 "- Do dispersion corrections help or hurt for halogen bonds? It depends on the functional {{kozuch-disp}} {{otero-delocal}}.\n"
                 "- Which isodensity surface and descriptor define 'the' σ-hole size? {{sedlak-flattening}} {{thirman-trend}}\n\n"
                 "**Open**\n\n"
                 "- A transferable acidity/basicity scale that covers neutral and anionic acceptors: existing single-parameter "
                 "scales need one line per acceptor {{engelage-eq}} {{engelage-cationic}}.\n"
                 "- Force fields for halogen bonds to **anions**: are virtual sites plus fixed charges enough, or are "
                 "polarisation and charge penetration required? {{rackers-cp}} {{wang-cp}}\n"
                 "- Polar flattening in force fields: anisotropic repulsion instead of spheres?\n"
                 "- Fit targets: how to combine monomer data, QM scans and liquid data without double counting.",
            formulas=[], model=None, model_text="",
            limits=[],
            deeper=[("How to use this map",
                     "When a paper makes a claim about 'the nature' of the halogen bond, first ask which decomposition it "
                     "used. When a method is said to be accurate, ask on which benchmark, for which energy (interaction or "
                     "binding), and at which geometry.")],
            checks=[dict(prompt="Which of these is still debated rather than settled?",
                         choices=["Iodine forms stronger halogen bonds than chlorine", "The size of the charge-transfer contribution",
                                  "CCSD(T)/CBS as the reference level", "The existence of the σ-hole"], correct=1,
                         explanation="The CT share depends on the decomposition; the other three are broadly agreed."),
                    dict(prompt="Why does a single donor parameter W not solve the anion problem?",
                         choices=["It ignores the σ-hole", "Each acceptor needs its own slope and offset",
                                  "It cannot be computed with DFT", "It only works for fluorine"], correct=1,
                         explanation="Engelage et al. fitted separate lines for chloride and ammonia; the acceptor is not "
                                     "a variable of the model.")],
            next_q="Back to the start: try to explain the C6F5I···Cl⁻ contact with every level of this course.",
        ),
    ]),
]
