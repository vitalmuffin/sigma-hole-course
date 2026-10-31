/* Interaction registry: controls (units, bounds, defaults) + a draw function that only calls pure models
   (window.ICF_MODELS) and the plot adapter. draw() returns readouts, legend and a text alternative. */
(function () {
  "use strict";
  var M = window.ICF_MODELS, P = window.ICF_PLOT;
  function f(v, d) { return Number(v).toFixed(d === undefined ? 2 : d); }
  function range(a, b, n, fn) { return M.grid(a, b, n).map(function (x) { return { x: x, y: fn(x) }; }); }
  function extent(series, pad, clampLo, clampHi) {
    var ys = [];
    series.forEach(function (s) { s.points.forEach(function (p) { if (Number.isFinite(p.y)) { ys.push(p.y); } }); });
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    if (clampLo !== undefined) { lo = Math.max(lo, clampLo); }
    if (clampHi !== undefined) { hi = Math.min(hi, clampHi); }
    var span = Math.max(hi - lo, 1e-6);
    return [lo - span * pad, hi + span * pad];
  }

  var REGISTRY = {
    "cost": {
      controls: [
        { id: "n", label: "System size N / N₀", min: 1, max: 10, step: 0.1, value: 2, unit: "×" }
      ],
      draw: function (canvas, v) {
        var methods = [["CCSD(T), p = 7", 7, "--c2"], ["hybrid DFT, p = 4", 4, "--c1"], ["force field, p = 2", 2, "--c3"]];
        var series = methods.map(function (m) {
          return { points: range(1, 10, 120, function (x) { return Math.log10(M.relativeCost(x, 1, m[1])); }), color: m[2] };
        });
        P.line(canvas, { x: [1, 10], y: [0, 7.2], xLabel: "system size N / N₀", yLabel: "log₁₀ relative cost",
          series: series, vlines: [{ x: v.n }],
          markers: methods.map(function (m) { return { x: v.n, y: Math.log10(M.relativeCost(v.n, 1, m[1])), color: m[2] }; }) });
        return {
          legend: methods.map(function (m) { return { label: m[0], color: m[2] }; }),
          readouts: methods.map(function (m) { return m[0].split(",")[0] + ": ×" + M.relativeCost(v.n, 1, m[1]).toPrecision(3); }),
          alt: "Relative cost at N/N0 = " + f(v.n, 1) + ": CCSD(T) " + M.relativeCost(v.n, 1, 7).toPrecision(3) +
            ", DFT " + M.relativeCost(v.n, 1, 4).toPrecision(3) + ", force field " + M.relativeCost(v.n, 1, 2).toPrecision(3)
        };
      }
    },

    "sigma-esp": {
      controls: [
        { id: "q", label: "Net charge q on X", min: -0.35, max: 0.15, step: 0.01, value: -0.05, unit: "e" },
        { id: "quad", label: "Quadrupole Θ", min: 0, max: 3, step: 0.05, value: 2.0, unit: "e·bohr²" }
      ],
      draw: function (canvas, v) {
        var r = 3.7, prep = P.prepare(canvas), ctx = prep.ctx, W = prep.width, H = prep.height;
        var s = M.sigmaSummary(r, v.q, v.quad);
        var ringW = Math.min(W * 0.36, H, 260);
        var plotArea = { x0: ringW, y0: 0, w: W - ringW, h: H };
        if (W < 520) { ringW = 0; plotArea = { x0: 0, y0: 0, w: W, h: H }; }
        var series = [{ points: range(0, 90, 91, function (d) { return M.sigmaEsp(d * Math.PI / 180, r, v.q, v.quad); }), color: "--c1" }];
        var y = extent(series, 0.12);
        y = [Math.min(y[0], -5), Math.max(y[1], 5)];
        P.line(canvas, { x: [0, 90], y: y, xLabel: "angle θ from the outward R–X axis (°)", yLabel: "ESP (kcal/mol)", series: series,
          area: plotArea, markers: s.hasHole && s.halfAngle < 90 ? [{ x: s.halfAngle, y: 0, label: "cap edge", color: "--c2" }] : [] }, prep);
        if (ringW) {   // the atom seen from the side: R–X bond to the left, σ-hole to the right
          var cx = ringW / 2, cy = H / 2, rad = Math.min(ringW, H) * 0.32;
          ctx.lineWidth = Math.max(10, rad * 0.22);
          var vmaxAbs = Math.max(Math.abs(s.vmax), Math.abs(s.vmin), 1);
          for (var d = 0; d < 360; d += 3) {
            var th = d * Math.PI / 180, val = M.sigmaEsp(th, r, v.q, v.quad);
            var back = Math.cos(th) < -0.17;          // bond side (θ > ~100°): occupied by R, not modelled
            ctx.strokeStyle = P.css(back ? "--border" : (val > 0 ? "--pos" : "--neg"));
            ctx.globalAlpha = back ? 1 : 0.25 + 0.75 * Math.min(1, Math.abs(val) / vmaxAbs);
            ctx.beginPath(); ctx.arc(cx, cy, rad, th - 0.03, th + 3 * Math.PI / 180 + 0.03); ctx.stroke();
          }
          ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = P.css("--muted");
          ctx.beginPath(); ctx.moveTo(cx - rad * 2.2, cy); ctx.lineTo(cx - rad * 1.1, cy); ctx.stroke();
          ctx.fillStyle = P.css("--text"); ctx.font = "600 15px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("X", cx, cy); ctx.fillText("R", Math.max(12, cx - rad * 2.4), cy);
          ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = P.css("--muted");
          ctx.fillText("blue +, red −, grey: bond side (not modelled)", cx, H - 14);
        }
        return {
          legend: [{ label: "V(θ) on a sphere r = 3.7 bohr, outer hemisphere", color: "--c1" }],
          readouts: ["V_max = " + f(s.vmax, 1) + " kcal/mol", "V_min (belt) = " + f(s.vmin, 1) + " kcal/mol",
            s.hasHole ? "positive cap: ±" + f(s.halfAngle, 0) + "°" : "no σ-hole"],
          alt: "ESP from " + f(s.vmax, 1) + " kcal/mol on the axis to " + f(s.vmin, 1) + " kcal/mol in the belt; " +
            (s.hasHole ? "positive cap with half-angle " + f(s.halfAngle, 0) + " degrees." : "no positive region.")
        };
      }
    },

    "components": {
      controls: [
        { id: "qeff", label: "Electrostatic strength q_eff", min: 0, max: 0.15, step: 0.005, value: 0.05, unit: "e²" },
        { id: "c6", label: "Dispersion C₆", min: 0, max: 5000, step: 50, value: 2000, unit: "kcal/mol·Å⁶" },
        { id: "b", label: "Exchange decay b", min: 2.4, max: 3.8, step: 0.05, value: 3.0, unit: "Å⁻¹" },
        { id: "logA", label: "Exchange prefactor log₁₀ A", min: 3.5, max: 5.5, step: 0.05, value: 4.6, unit: "" }
      ],
      draw: function (canvas, v) {
        var p = { A: Math.pow(10, v.logA), b: v.b, qeff: v.qeff, c6: v.c6 };
        function c(r) { return M.components(r, p); }
        var series = [
          { points: range(2.2, 7, 300, function (r) { return c(r).exch; }), color: "--c2", width: 1.6, dash: [5, 4] },
          { points: range(2.2, 7, 300, function (r) { return c(r).elec; }), color: "--c1", width: 1.6, dash: [5, 4] },
          { points: range(2.2, 7, 300, function (r) { return c(r).disp; }), color: "--c3", width: 1.6, dash: [5, 4] },
          { points: range(2.2, 7, 300, function (r) { return c(r).total; }), color: "--text", width: 3 }
        ];
        var mn = M.minimum(function (r) { return c(r).total; }, 2.2, 7, 2000);
        var lo = Math.min(-2, mn.e * 1.6, Math.min.apply(null, series[1].points.map(function (q) { return q.y; })) * 0.6);
        P.line(canvas, { x: [2.2, 7], y: [lo, Math.max(4, -lo)], xLabel: "distance r (Å)", yLabel: "energy (kcal/mol)",
          series: series, markers: mn.e < 0 && mn.r < 6.99 ? [{ x: mn.r, y: mn.e, label: "minimum" }] : [] });
        var bound = mn.e < 0 && mn.r < 6.99;
        return {
          legend: [{ label: "exchange", color: "--c2" }, { label: "electrostatics", color: "--c1" }, { label: "dispersion", color: "--c3" }, { label: "total", color: "--text" }],
          readouts: bound ? ["r_min = " + f(mn.r) + " Å", "E_min = " + f(mn.e) + " kcal/mol",
            "at r_min: exch " + f(c(mn.r).exch, 1) + ", elst " + f(c(mn.r).elec, 1) + ", disp " + f(c(mn.r).disp, 1)] : ["no bound minimum in 2.2–7 Å"],
          alt: bound ? "Total curve minimum at " + f(mn.r) + " angstrom, depth " + f(mn.e) + " kcal/mol." : "The total curve has no minimum in range."
        };
      }
    },

    "pair-forms": {
      controls: [
        { id: "eps", label: "Well depth ε", min: 0.2, max: 4, step: 0.05, value: 1.5, unit: "kcal/mol" },
        { id: "rm", label: "Minimum position r_m", min: 2.8, max: 4.5, step: 0.05, value: 3.5, unit: "Å" },
        { id: "alpha", label: "Buckingham α", min: 10, max: 16, step: 0.5, value: 13, unit: "" },
        { id: "a", label: "Morse a", min: 1.0, max: 2.5, step: 0.05, value: 1.6, unit: "Å⁻¹" }
      ],
      draw: function (canvas, v) {
        var a = 0.62 * v.rm, b = 2.2 * v.rm;
        var forms = [
          ["LJ 12-6", "--c2", function (r) { return M.lj(r, v.eps, v.rm); }],
          ["Buckingham", "--c1", function (r) { return M.buckingham(r, v.eps, v.rm, v.alpha); }],
          ["Morse", "--c4", function (r) { return M.morse(r, v.eps, v.rm, v.a); }],
          ["double exp. (α 16.77, β 4.43)", "--c3", function (r) { return M.doubleExp(r, v.eps, v.rm, 16.766, 4.427); }]
        ];
        var series = forms.map(function (fm) { return { points: range(a, b, 300, fm[2]), color: fm[1] }; });
        P.line(canvas, { x: [a, b], y: [-1.3 * v.eps, 3 * v.eps], xLabel: "distance r (Å)", yLabel: "energy (kcal/mol)",
          series: series, vlines: [{ x: 0.7 * v.rm }, { x: v.rm }] });
        var r7 = 0.7 * v.rm;
        return {
          legend: forms.map(function (fm) { return { label: fm[0], color: fm[1] }; }),
          readouts: ["at 0.7 r_m: LJ " + f(M.lj(r7, v.eps, v.rm), 1), "double exp. " + f(M.doubleExp(r7, v.eps, v.rm, 16.766, 4.427), 1),
            "Buckingham " + f(M.buckingham(r7, v.eps, v.rm, v.alpha), 1), "Morse " + f(M.morse(r7, v.eps, v.rm, v.a), 1) + " kcal/mol"],
          alt: "Four pair potentials with depth " + f(v.eps) + " kcal/mol at " + f(v.rm) + " angstrom; at 0.7 r_m: LJ " +
            f(M.lj(r7, v.eps, v.rm), 1) + ", double exponential " + f(M.doubleExp(r7, v.eps, v.rm, 16.766, 4.427), 1) +
            ", Buckingham (alpha " + v.alpha + ") " + f(M.buckingham(r7, v.eps, v.rm, v.alpha), 1) +
            ", Morse (a " + v.a + ") " + f(M.morse(r7, v.eps, v.rm, v.a), 1) + " kcal/mol."
        };
      }
    },

    "vsite": {
      controls: [
        { id: "qv", label: "Charge on virtual site q_V", min: 0, max: 0.4, step: 0.01, value: 0.2, unit: "e" },
        { id: "dv", label: "Site distance d_V", min: 0.6, max: 2.2, step: 0.05, value: 1.5, unit: "Å" },
        { id: "qx", label: "Total halogen charge q_X", min: -0.3, max: 0.1, step: 0.01, value: -0.1, unit: "e" }
      ],
      draw: function (canvas, v) {
        var d = 3.2;
        function e(deg) { return M.vsiteEnergy(deg * Math.PI / 180, d, v.qx, v.qv, v.dv, -1); }
        var series = [
          { points: range(0, 180, 181, e), color: "--c1" },
          { points: range(0, 180, 181, function (deg) { return M.vsiteEnergy(deg * Math.PI / 180, d, v.qx, 0, v.dv, -1); }), color: "--c5", dash: [5, 4], width: 1.8 }
        ];
        var y = extent(series, 0.15);
        P.line(canvas, { x: [0, 180], y: [Math.min(y[0], -2), Math.max(y[1], 2)], xLabel: "angle θ (°), 0 = linear R–X···A⁻",
          yLabel: "electrostatic energy (kcal/mol)", series: series });
        return {
          legend: [{ label: "with virtual site", color: "--c1" }, { label: "same total charge, no site", color: "--c5" }],
          readouts: ["E(0°) = " + f(e(0), 1) + " kcal/mol", "E(90°) = " + f(e(90), 1) + " kcal/mol", "E(90°) − E(0°) = " + f(e(90) - e(0), 1)],
          alt: "Electrostatic energy of a chloride at 3.2 angstrom: " + f(e(0), 1) + " kcal/mol linear, " + f(e(90), 1) + " kcal/mol side-on."
        };
      }
    },

    "cbs": {
      controls: [
        { id: "pair", label: "Basis pair (X, X+1)", type: "select", options: [["2", "DZ / TZ"], ["3", "TZ / QZ"], ["4", "QZ / 5Z"]], value: "3" },
        { id: "ecbs", label: "True E_int at CBS", min: -8, max: -1, step: 0.1, value: -4.5, unit: "kcal/mol" },
        { id: "anocp", label: "Non-CP error A_noCP", min: -60, max: 0, step: 1, value: -30, unit: "kcal/mol" },
        { id: "acp", label: "CP error A_CP", min: 0, max: 60, step: 1, value: 25, unit: "kcal/mol" }
      ],
      draw: function (canvas, v) {
        var x = Number(v.pair), yX = x + 1;
        function no(X) { return M.basisEnergy(X, v.ecbs, v.anocp); }
        function cp(X) { return M.basisEnergy(X, v.ecbs, v.acp); }
        var series = [
          { points: range(2, 6, 80, no), color: "--c2" },
          { points: range(2, 6, 80, cp), color: "--c1" },
          { points: range(2, 6, 80, function (X) { return (no(X) + cp(X)) / 2; }), color: "--c3", dash: [5, 4], width: 1.8 }
        ];
        var ext = M.cbs2(x, cp(x), yX, cp(yX));
        var y = extent(series, 0.1);
        P.line(canvas, { x: [2, 6], y: y, xLabel: "cardinal number X (2 = DZ … 6 = 6Z)", yLabel: "E_int (kcal/mol)", series: series,
          hlines: [v.ecbs], vlines: [{ x: x }, { x: yX }],
          markers: [{ x: yX, y: ext, color: "--text", label: "CBS (CP, X⁻³)" }] });
        return {
          legend: [{ label: "no CP (over-binds)", color: "--c2" }, { label: "CP (under-binds)", color: "--c1" }, { label: "half-CP", color: "--c3" }],
          readouts: ["no CP at X+1: " + f(no(yX)), "CP at X+1: " + f(cp(yX)), "half-CP: " + f((no(yX) + cp(yX)) / 2),
            "extrapolated: " + f(ext) + " kcal/mol"],
          alt: "At X = " + yX + " the non-CP energy is " + f(no(yX)) + ", CP " + f(cp(yX)) + ", extrapolated " + f(ext) + " kcal/mol."
        };
      }
    },

    "range-sep": {
      controls: [
        { id: "omega", label: "Range-separation ω", min: 0, max: 1, step: 0.01, value: 0.2, unit: "bohr⁻¹" }
      ],
      draw: function (canvas, v) {
        var series = [
          { points: range(0.2, 12, 300, function (r) { return M.rangeSplit(r, v.omega).full; }), color: "--c5", width: 1.8 },
          { points: range(0.2, 12, 300, function (r) { return M.rangeSplit(r, v.omega).sr; }), color: "--c2" },
          { points: range(0.2, 12, 300, function (r) { return M.rangeSplit(r, v.omega).lr; }), color: "--c1" }
        ];
        P.line(canvas, { x: [0, 12], y: [0, 2], xLabel: "electron–electron distance r (bohr)", yLabel: "operator value (1/bohr)",
          series: series, vlines: v.omega > 0 ? [{ x: Math.min(12, 1 / v.omega) }] : [] });
        var s = M.rangeSplit(3.78, v.omega);
        return {
          legend: [{ label: "1/r", color: "--c5" }, { label: "short range: erfc(ωr)/r", color: "--c2" }, { label: "long range: erf(ωr)/r", color: "--c1" }],
          readouts: [v.omega > 0 ? "crossover 1/ω = " + f(1 / v.omega, 1) + " bohr = " + f(0.529177 / v.omega, 2) + " Å" : "ω = 0: global hybrid",
            "long-range share at 2 Å: " + f(100 * s.lr / s.full, 0) + " %"],
          alt: "With omega " + f(v.omega) + " per bohr, the long-range part is " + f(100 * s.lr / s.full, 0) + " percent of 1/r at 2 angstrom."
        };
      }
    },

    "disp-damp": {
      controls: [
        { id: "c6", label: "Pair C₆", min: 100, max: 3000, step: 50, value: 800, unit: "kcal/mol·Å⁶" },
        { id: "r0", label: "Cutoff radius R₀", min: 2.5, max: 4.5, step: 0.05, value: 3.4, unit: "Å" },
        { id: "a1", label: "BJ a₁", min: 0, max: 0.8, step: 0.01, value: 0.4, unit: "" },
        { id: "a2", label: "BJ a₂", min: 1.0, max: 3.5, step: 0.05, value: 2.34, unit: "Å" }
      ],
      draw: function (canvas, v) {
        var series = [
          { points: range(1.5, 8, 300, function (r) { return M.dispUndamped(r, v.c6); }), color: "--c5", dash: [5, 4], width: 1.8 },
          { points: range(1.5, 8, 300, function (r) { return M.dispZero(r, v.c6, v.r0, 1.217, 14); }), color: "--c2" },
          { points: range(1.5, 8, 300, function (r) { return M.dispBJ(r, v.c6, v.r0, v.a1, v.a2); }), color: "--c1" },
          { points: range(1.5, 8, 300, function (r) { return M.dispCHG(r, v.c6, v.r0 * 1.1, 6); }), color: "--c3" }
        ];
        var bj0 = -v.c6 / Math.pow(v.a1 * v.r0 + v.a2, 6);
        var lo = Math.min(-0.5, 2.2 * bj0, M.dispUndamped(3.5, v.c6) * 1.5);
        P.line(canvas, { x: [1.5, 8], y: [lo, 0.1 * -lo], xLabel: "distance r (Å)", yLabel: "dispersion energy (kcal/mol)", series: series });
        return {
          legend: [{ label: "undamped −C₆/r⁶", color: "--c5" }, { label: "D3 zero damping (s_r 1.217, α 14)", color: "--c2" },
            { label: "Becke–Johnson", color: "--c1" }, { label: "Chai–Head-Gordon (a = 6, R_r = 1.1 R₀)", color: "--c3" }],
          readouts: ["BJ limit r→0: " + f(bj0, 2) + " kcal/mol", "at 3.5 Å: BJ " + f(M.dispBJ(3.5, v.c6, v.r0, v.a1, v.a2)) +
            ", zero " + f(M.dispZero(3.5, v.c6, v.r0, 1.217, 14)) + ", bare " + f(M.dispUndamped(3.5, v.c6))],
          alt: "At 3.5 angstrom: BJ " + f(M.dispBJ(3.5, v.c6, v.r0, v.a1, v.a2)) + ", zero damping " + f(M.dispZero(3.5, v.c6, v.r0, 1.217, 14)) + " kcal/mol."
        };
      }
    },

    "engelage": {
      controls: [
        { id: "w", label: "Lewis-acidity parameter W", min: 0, max: 1, step: 0.01, value: 0.5, unit: "" },
        { id: "dw", label: "Difference between two donors ΔW", min: 0, max: 0.4, step: 0.01, value: 0.1, unit: "" }
      ],
      draw: function (canvas, v) {
        var series = [
          { points: range(0, 1, 50, function (w) { return M.engelageEnergies(w).chloride; }), color: "--c2" },
          { points: range(0, 1, 50, function (w) { return M.engelageEnergies(w).ammonia; }), color: "--c1" }
        ];
        var e1 = M.engelageEnergies(v.w), e2 = M.engelageEnergies(Math.min(1, v.w + v.dw));
        P.line(canvas, { x: [0, 1], y: [-48, 2], xLabel: "W (dimensionless)", yLabel: "binding energy (kcal/mol)", series: series,
          vlines: [{ x: v.w }, { x: Math.min(1, v.w + v.dw), color: "--c4" }],
          markers: [{ x: v.w, y: e1.chloride, color: "--c2" }, { x: v.w, y: e1.ammonia, color: "--c1" }] });
        return {
          legend: [{ label: "with Cl⁻ (Eq. 2)", color: "--c2" }, { label: "with NH₃ (Eq. 3)", color: "--c1" }],
          readouts: ["E(Cl⁻) = " + f(e1.chloride, 1), "E(NH₃) = " + f(e1.ammonia, 1) + " kcal/mol",
            "ΔE for ΔW: Cl⁻ " + f(e2.chloride - e1.chloride, 1) + ", NH₃ " + f(e2.ammonia - e1.ammonia, 1)],
          alt: "At W = " + f(v.w) + ": chloride " + f(e1.chloride, 1) + " kcal/mol, ammonia " + f(e1.ammonia, 1) +
            " kcal/mol. A step of " + f(v.dw) + " in W changes them by " + f(e2.chloride - e1.chloride, 1) + " and " +
            f(e2.ammonia - e1.ammonia, 1) + " kcal/mol."
        };
      }
    },

    "fit-lj": {
      controls: [
        { id: "kt", label: "Weighting temperature kT_w", min: 0.1, max: 10, step: 0.1, value: 1, unit: "kcal/mol" },
        { id: "a", label: "Softness of the reference wall (Morse a)", min: 1.0, max: 2.4, step: 0.05, value: 1.4, unit: "Å⁻¹" }
      ],
      draw: function (canvas, v) {
        var ref = M.grid(3.0, 7, 25).map(function (r) { return { r: r, e: M.morse(r, 2.0, 3.6, v.a) }; });
        var fit = M.fitLJ(ref, v.kt, [0.5, 4], [3.0, 4.4], 81);
        var well = ref.filter(function (p) { return p.e < 0; });
        var series = [
          { points: ref.map(function (p) { return { x: p.r, y: p.e }; }), color: "--c2", dots: true, width: 0.01 },
          { points: range(2.9, 7, 300, function (r) { return M.lj(r, fit.eps, fit.rm); }), color: "--c1" }
        ];
        P.line(canvas, { x: [2.9, 7], y: [-2.8, 6], xLabel: "distance r (Å)", yLabel: "energy (kcal/mol)", series: series,
          vlines: [{ x: 3.6, color: "--c2" }, { x: fit.rm, color: "--c1" }] });
        return {
          legend: [{ label: "reference points (Morse, ε 2.0, r_m 3.6 Å)", color: "--c2" }, { label: "fitted LJ 12-6", color: "--c1" }],
          readouts: ["fitted ε = " + f(fit.eps) + " kcal/mol", "fitted r_m = " + f(fit.rm) + " Å",
            "RMSE well (E<0): " + f(M.rmse(well, function (r) { return M.lj(r, fit.eps, fit.rm); })),
            "RMSE all: " + f(M.rmse(ref, function (r) { return M.lj(r, fit.eps, fit.rm); })) + " kcal/mol"],
          alt: "Weighted LJ fit: epsilon " + f(fit.eps) + " kcal/mol, r_m " + f(fit.rm) + " angstrom."
        };
      }
    },

    "ridge": {
      controls: [
        { id: "loglam", label: "Penalty log₁₀ λ", min: -3, max: 3, step: 0.05, value: -3, unit: "" },
        { id: "corr", label: "Correlation of x₁ and x₂", min: 0, max: 0.99, step: 0.01, value: 0.95, unit: "" },
        { id: "seed", label: "Data seed", min: 1, max: 30, step: 1, value: 4, unit: "" }
      ],
      draw: function (canvas, v) {
        var train = M.makeData(12, v.corr, 0.4, v.seed), test = M.makeData(400, v.corr, 0.4, 1000 + v.seed);
        var path = M.grid(-3, 3, 121).map(function (l) { return { l: l, fit: M.ridge(train, Math.pow(10, l)) }; });
        var series = [
          { points: path.map(function (p) { return { x: p.l, y: p.fit.b1 }; }), color: "--c1" },
          { points: path.map(function (p) { return { x: p.l, y: p.fit.b2 }; }), color: "--c2" },
          { points: path.map(function (p) { return { x: p.l, y: M.predictRmse(test, p.fit) }; }), color: "--c3", dash: [5, 4], width: 1.8 }
        ];
        var y = extent(series, 0.1);
        var cur = M.ridge(train, Math.pow(10, v.loglam));
        P.line(canvas, { x: [-3, 3], y: [Math.min(y[0], -0.2), Math.max(y[1], 1.2)], xLabel: "log₁₀ λ", yLabel: "coefficient / test RMSE",
          series: series, hlines: [0, 1.0, 0.3], vlines: [{ x: v.loglam }] });
        return {
          legend: [{ label: "β₁ (true 1.0)", color: "--c1" }, { label: "β₂ (true 0.3)", color: "--c2" }, { label: "test RMSE", color: "--c3" }],
          readouts: ["β₁ = " + f(cur.b1), "β₂ = " + f(cur.b2), "train RMSE " + f(M.predictRmse(train, cur)), "test RMSE " + f(M.predictRmse(test, cur))],
          alt: "Ridge with log lambda " + f(v.loglam, 1) + ": beta1 " + f(cur.b1) + ", beta2 " + f(cur.b2) + ", test RMSE " + f(M.predictRmse(test, cur)) + "."
        };
      }
    }
  };

  window.ICF_INTERACTIONS = REGISTRY;
}());
