/* Node tests for app/js/models.js: known values, limits, invariants. Run: node tests/models/models_test.js */
"use strict";
const M = require("../../app/js/models.js");
let pass = 0, fail = 0;
function check(name, cond, info) {
  if (cond) { pass += 1; console.log("  ok   " + name); }
  else { fail += 1; console.log("  FAIL " + name + (info !== undefined ? "  (" + info + ")" : "")); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const deriv = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

console.log("[models_test] cost scaling");
check("cost N0 -> 1", M.relativeCost(10, 10, 7) === 1);
check("cost doubles^7 = 128", near(M.relativeCost(20, 10, 7), 128, 1e-12));

console.log("[models_test] sigma-hole ESP");
check("Θ=0 isotropic", near(M.sigmaEsp(0, 3.7, -0.1, 0), M.sigmaEsp(1.2, 3.7, -0.1, 0), 1e-12));
check("q/r in kcal/mol", near(M.sigmaEsp(0, 2, 1, 0), M.HARTREE / 2, 1e-9));
let s = M.sigmaSummary(3.7, -0.05, 2.0);
check("Vmax > Vmin for Θ>0", s.vmax > s.vmin);
check("cap edge has V = 0", s.hasHole && near(M.sigmaEsp(s.halfAngle * Math.PI / 180, 3.7, -0.05, 2.0), 0, 1e-8), s.halfAngle);
check("Vmax - Vmin = 1.5 Θ/r³ (hartree)", near((s.vmax - s.vmin) / M.HARTREE, 1.5 * 2.0 / 3.7 ** 3, 1e-12));
check("no hole for q=-0.3, Θ=0.5", !M.sigmaSummary(3.7, -0.3, 0.5).hasHole);
check("θ = 0 is the maximum", M.sigmaEsp(0, 3.7, -0.05, 2) > M.sigmaEsp(0.3, 3.7, -0.05, 2));

console.log("[models_test] Tang–Toennies + components");
check("f6(0) = 0", near(M.ttDamp(6, 0), 0, 1e-15));
check("f6(large) -> 1", near(M.ttDamp(6, 60), 1, 1e-12));
check("f6 monotone", M.ttDamp(6, 3) < M.ttDamp(6, 6) && M.ttDamp(6, 6) < M.ttDamp(6, 12));
const P = { A: 40000, b: 3.0, qeff: 0.05, c6: 2000 };
const c = M.components(3.2, P);
check("components sum", near(c.total, c.exch + c.elec + c.disp, 1e-12));
const mn = M.minimum(r => M.components(r, P).total, 2.4, 6);
check("default curve has a bound minimum 2.6–4 Å", mn.e < 0 && mn.r > 2.6 && mn.r < 4.0, JSON.stringify(mn));

console.log("[models_test] pair potentials");
for (const [name, f] of [["LJ", r => M.lj(r, 1.5, 3.5)], ["Buckingham", r => M.buckingham(r, 1.5, 3.5, 13)],
  ["Morse", r => M.morse(r, 1.5, 3.5, 1.6)], ["double-exp", r => M.doubleExp(r, 1.5, 3.5, 16.766, 4.427)]]) {
  check(name + " E(rm) = -ε", near(f(3.5), -1.5, 1e-9), f(3.5));
  check(name + " dE/dr(rm) = 0", near(deriv(f, 3.5), 0, 1e-5), deriv(f, 3.5));
  check(name + " -> 0 at long range", Math.abs(f(30)) < 1e-3);
}
check("LJ wall harder than double-exp at 0.7 rm", M.lj(0.7 * 3.5, 1.5, 3.5) > M.doubleExp(0.7 * 3.5, 1.5, 3.5, 16.766, 4.427));

console.log("[models_test] virtual-site electrostatics");
check("qv = 0 -> angle independent", near(M.vsiteEnergy(0, 3.2, -0.1, 0, 1.5, -1), M.vsiteEnergy(1.4, 3.2, -0.1, 0, 1.5, -1), 1e-12));
const e0 = M.vsiteEnergy(0, 3.2, -0.1, 0.2, 1.5, -1), e90 = M.vsiteEnergy(Math.PI / 2, 3.2, -0.1, 0.2, 1.5, -1);
check("positive site + anion: linear is lowest", e0 < e90, e0 + " vs " + e90);
check("point charges: θ=0 equals hand value", near(e0, 332.0637 * -1 * (-0.3 / 3.2 + 0.2 / 1.7), 1e-9));

console.log("[models_test] CBS extrapolation");
check("X^-3 model is recovered exactly", near(M.cbs2(3, M.basisEnergy(3, -5, 8), 4, M.basisEnergy(4, -5, 8)), -5, 1e-12));
check("cbs2 symmetric in order", near(M.cbs2(4, -5.2, 3, -4.9), M.cbs2(3, -4.9, 4, -5.2), 1e-12));

console.log("[models_test] range separation");
check("erf(0) = 0", M.erf(0) === 0);
check("erf(1) reference", near(M.erf(1), 0.8427007929497149, 1e-13), M.erf(1));
check("erf(3) reference", near(M.erf(3), 0.9999779095030014, 1e-13), M.erf(3));
check("erf odd", near(M.erf(-0.7), -M.erf(0.7), 1e-15));
const rs = M.rangeSplit(2, 0.2);
check("sr + lr = 1/r", near(rs.sr + rs.lr, 0.5, 1e-15));
check("ω = 0 -> all short range", M.rangeSplit(2, 0).lr === 0);
check("large ω r -> all long range", near(M.rangeSplit(10, 3).sr, 0, 1e-12));

console.log("[models_test] dispersion damping");
check("BJ finite at r -> 0", near(M.dispBJ(1e-6, 100, 3.5, 0.4, 4.4), -100 / Math.pow(0.4 * 3.5 + 4.4, 6), 1e-12));
check("zero damping -> 0 at short r", Math.abs(M.dispZero(0.5, 100, 3.5, 1.2, 14)) < 1e-9);
check("all damped -> undamped at long r", [M.dispBJ(40, 100, 3.5, 0.4, 4.4), M.dispZero(40, 100, 3.5, 1.2, 14), M.dispCHG(40, 100, 3.5, 6)]
  .every(v => near(v / M.dispUndamped(40, 100), 1, 1e-3)));

console.log("[models_test] Engelage");
check("W from paper coefficients", near(M.engelageW(130, -60), 3.513e-3 * 130 + 8.962e-4 * 60, 1e-15));
const ee = M.engelageEnergies(0.5);
check("chloride kcal/mol", near(ee.chloride, (-182.45 * 0.5 - 8.5) / 4.184, 1e-12));
check("chloride slope ≈ 4.7× ammonia slope", near(182.45 / 38.84, 4.697, 1e-3));

console.log("[models_test] LJ fit");
const lpts = M.grid(3.0, 7, 30).map(r => ({ r, e: M.lj(r, 1.2, 3.8) }));
const f = M.fitLJ(lpts, 1e6, [0.5, 2.0], [3.0, 4.6], 61);
check("fit recovers ε, rm of LJ data", near(f.eps, 1.2, 0.03) && near(f.rm, 3.8, 0.02), JSON.stringify(f));
check("rmse of perfect fit ≈ 0", M.rmse(lpts, r => M.lj(r, 1.2, 3.8)) < 1e-12);

console.log("[models_test] ridge");
const data = M.makeData(200, 0.5, 0.1, 7);
const ols = M.ridge(data, 0), big = M.ridge(data, 1e9);
check("seeded data reproducible", M.makeData(5, 0.5, 0.1, 7)[3].y === M.makeData(5, 0.5, 0.1, 7)[3].y);
check("OLS near true coefficients", near(ols.b1, 1.0, 0.05) && near(ols.b2, 0.3, 0.05), JSON.stringify(ols));
check("λ -> ∞ shrinks to 0", Math.abs(big.b1) < 1e-4 && Math.abs(big.b2) < 1e-4);
check("train RMSE grows with λ", M.predictRmse(data, M.ridge(data, 0)) <= M.predictRmse(data, M.ridge(data, 50)));

console.log(`[models_test] ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
