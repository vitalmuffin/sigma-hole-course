/* Pure reference models. No DOM access. Units are stated per function; energies in kcal/mol.
   Loaded as a classic script in the browser (window.ICF_MODELS) and via require() in the Node tests. */
(function (root) {
  "use strict";
  var COULOMB = 332.0637;      // kcal/mol · Å / e²
  var HARTREE = 627.5095;      // kcal/mol
  var KJ = 4.184;              // kJ per kcal

  function finite() {
    for (var i = 0; i < arguments.length; i += 1) {
      if (!Number.isFinite(arguments[i])) { throw new TypeError("model input must be finite"); }
    }
  }
  function grid(a, b, n) {
    var out = [];
    for (var i = 0; i < n; i += 1) { out.push(a + (b - a) * i / (n - 1)); }
    return out;
  }

  /* 0. Cost scaling: relative wall time t(N)/t(N0) = (N/N0)^p. */
  function relativeCost(n, n0, power) {
    finite(n, n0, power);
    if (n <= 0 || n0 <= 0) { throw new RangeError("sizes must be positive"); }
    return Math.pow(n / n0, power);
  }

  /* 1. σ-hole on a sphere around X: monopole q (e) + axial quadrupole Θ (e·bohr²), radius r (bohr).
        V(θ) = q/r + Θ·P2(cosθ)/r³  in hartree/e, returned in kcal/mol per unit positive probe charge.
        θ = 0 points along R–X outward (the σ-hole direction). */
  function sigmaEsp(theta, r, q, quad) {
    finite(theta, r, q, quad);
    if (r <= 0) { throw new RangeError("r must be positive"); }
    var c = Math.cos(theta);
    return HARTREE * (q / r + quad * (3 * c * c - 1) / (2 * r * r * r));
  }
  function sigmaSummary(r, q, quad) {
    var vmax = sigmaEsp(0, r, q, quad);
    var vmin = sigmaEsp(Math.PI / 2, r, q, quad);
    var halfAngle = 0;   // half-opening angle (deg) of the V > 0 cap around θ = 0
    if (vmax > 0) {
      if (vmin >= 0) { halfAngle = 90; }
      else {
        var c2 = (1 - 2 * q * r * r / quad) / 3;   // V(θ) = 0  ⇔  cos²θ = c2
        halfAngle = Math.acos(Math.sqrt(Math.min(1, Math.max(0, c2)))) * 180 / Math.PI;
      }
    }
    return { vmax: vmax, vmin: vmin, halfAngle: halfAngle, hasHole: vmax > 0 };
  }

  /* 2. Anatomy of an interaction (Å, kcal/mol): exchange A·e^(−b r), Coulomb attraction −k/r with
        k = 332.06·q_eff (q_eff = effective product of charges, e²), and Tang–Toennies-damped −C6 f6(b r)/r⁶. */
  function ttDamp(n, x) {
    finite(n, x);
    var term = 1, sum = 1;
    for (var k = 1; k <= n; k += 1) { term *= x / k; sum += term; }
    return 1 - Math.exp(-x) * sum;
  }
  function components(r, p) {
    finite(r, p.A, p.b, p.qeff, p.c6);
    var exch = p.A * Math.exp(-p.b * r);
    var elec = -COULOMB * p.qeff / r;
    var disp = -p.c6 * ttDamp(6, p.b * r) / Math.pow(r, 6);
    return { exch: exch, elec: elec, disp: disp, total: exch + elec + disp };
  }
  function minimum(fn, a, b, n) {
    var xs = grid(a, b, n || 2000), best = { r: xs[0], e: fn(xs[0]) };
    xs.forEach(function (x) { var e = fn(x); if (e < best.e) { best = { r: x, e: e }; } });
    return best;
  }

  /* 3. Pair potentials sharing well depth ε (kcal/mol) and minimum position rm (Å). */
  function lj(r, eps, rm) { finite(r, eps, rm); var s = Math.pow(rm / r, 6); return eps * (s * s - 2 * s); }
  function buckingham(r, eps, rm, alpha) {          // exp-6 in (ε, rm, α) form; α > 6
    finite(r, eps, rm, alpha);
    return eps * (6 / (alpha - 6) * Math.exp(alpha * (1 - r / rm)) - alpha / (alpha - 6) * Math.pow(rm / r, 6));
  }
  function morse(r, eps, rm, a) {                   // a in Å⁻¹
    finite(r, eps, rm, a);
    var e = 1 - Math.exp(-a * (r - rm));
    return eps * (e * e - 1);
  }
  function doubleExp(r, eps, rm, alpha, beta) {     // Horton et al. double exponential
    finite(r, eps, rm, alpha, beta);
    return eps * (beta * Math.exp(alpha) / (alpha - beta) * Math.exp(-alpha * r / rm)
      - alpha * Math.exp(beta) / (alpha - beta) * Math.exp(-beta * r / rm));
  }

  /* 4. Electrostatics of an anion (charge qa) around a halogen with an off-centre site.
        X carries qx − qv at the origin, the site carries qv at +dv along the R–X axis.
        Anion at distance d (Å) from X, angle θ from the axis (θ = 0: linear R–X···A). kcal/mol. */
  function vsiteEnergy(theta, d, qx, qv, dv, qa) {
    finite(theta, d, qx, qv, dv, qa);
    var ax = d * Math.sin(theta), az = d * Math.cos(theta);
    var rv = Math.sqrt(ax * ax + (az - dv) * (az - dv));
    if (rv < 1e-9) { throw new RangeError("anion sits on the virtual site"); }
    return COULOMB * qa * ((qx - qv) / d + qv / rv);
  }

  /* 5. Basis-set convergence: E(X) = E_CBS + A·X^−3 and the two-point X⁻³ extrapolation. */
  function basisEnergy(x, ecbs, a) { finite(x, ecbs, a); return ecbs + a / (x * x * x); }
  function cbs2(x, ex, y, ey) {
    finite(x, ex, y, ey);
    if (x === y) { throw new RangeError("need two different cardinal numbers"); }
    var x3 = x * x * x, y3 = y * y * y;
    return (y3 * ey - x3 * ex) / (y3 - x3);
  }

  /* 6. Range separation of the Coulomb operator (r in bohr, ω in bohr⁻¹): 1/r = erfc(ωr)/r + erf(ωr)/r. */
  function erf(x) {
    finite(x);
    var ax = Math.abs(x), s;
    if (ax < 2.5) {                                 // Maclaurin series
      var term = ax, sum = ax, k = 0;
      while (Math.abs(term) > 1e-17 * Math.abs(sum) && k < 200) {
        k += 1; term *= -ax * ax / k; sum += term / (2 * k + 1);
      }
      s = 2 / Math.sqrt(Math.PI) * sum;
    } else {                                        // erfc continued fraction, evaluated backwards
      var f = 0;
      for (var n = 60; n >= 1; n -= 1) { f = n / 2 / (ax + f); }
      s = 1 - Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f);
    }
    return x < 0 ? -s : s;
  }
  function rangeSplit(r, omega) {
    finite(r, omega);
    if (r <= 0) { throw new RangeError("r must be positive"); }
    var lr = erf(omega * r) / r;
    return { full: 1 / r, sr: 1 / r - lr, lr: lr };
  }

  /* 7. Dispersion damping (r and R0 in Å, C6 in kcal/mol·Å⁶): energy of one pair. */
  function dispUndamped(r, c6) { finite(r, c6); return -c6 / Math.pow(r, 6); }
  function dispZero(r, c6, r0, sr, alpha) {         // D3 zero damping, s6 = 1
    finite(r, c6, r0, sr, alpha);
    return -c6 / Math.pow(r, 6) / (1 + 6 * Math.pow(r / (sr * r0), -alpha));
  }
  function dispBJ(r, c6, r0, a1, a2) {              // Becke–Johnson rational damping, s6 = 1
    finite(r, c6, r0, a1, a2);
    return -c6 / (Math.pow(r, 6) + Math.pow(a1 * r0 + a2, 6));
  }
  function dispCHG(r, c6, rr, a) {                  // Chai–Head-Gordon damping used in ωB97X-D
    finite(r, c6, rr, a);
    return -c6 / Math.pow(r, 6) / (1 + a * Math.pow(r / rr, -12));
  }

  /* 8. Engelage et al. single-parameter Lewis acidity (energies in kJ/mol in the paper; returned in kcal/mol). */
  function engelageW(eSigmaHole, eSigmaStar) {      // both kJ/mol
    finite(eSigmaHole, eSigmaStar);
    return 3.513e-3 * eSigmaHole - 8.962e-4 * eSigmaStar;
  }
  function engelageEnergies(w) {
    finite(w);
    return { chloride: (-182.45 * w - 8.5) / KJ, ammonia: (-38.84 * w - 7.61) / KJ };
  }

  /* 9. Weighted fit of an LJ 12-6 (ε, rm) to reference points by grid search.
        weights w_i = exp(−(E_i − E_min)/kT) emphasise the well (small kT) or treat all points alike (large kT). */
  function fitLJ(points, kT, epsRange, rmRange, n) {
    if (!points.length) { throw new RangeError("no points"); }
    finite(kT);
    var emin = Math.min.apply(null, points.map(function (p) { return p.e; }));
    var w = points.map(function (p) { return Math.exp(-(p.e - emin) / kT); });
    var best = null, steps = n || 121;
    grid(epsRange[0], epsRange[1], steps).forEach(function (eps) {
      grid(rmRange[0], rmRange[1], steps).forEach(function (rm) {
        var s = 0, ws = 0;
        points.forEach(function (p, i) { var d = lj(p.r, eps, rm) - p.e; s += w[i] * d * d; ws += w[i]; });
        var loss = s / ws;
        if (!best || loss < best.loss) { best = { eps: eps, rm: rm, loss: loss }; }
      });
    });
    return best;
  }
  function rmse(points, fn) {
    var s = 0;
    points.forEach(function (p) { var d = fn(p.r) - p.e; s += d * d; });
    return Math.sqrt(s / points.length);
  }

  /* 10. Ridge regression with two centred predictors (closed form), seeded synthetic data. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    var u = Math.max(rand(), 1e-12), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /* y = 1.0·x1 + 0.3·x2 + noise, with corr(x1, x2) ≈ corr ∈ [0, 1). */
  function makeData(n, corr, noise, seed) {
    var rand = mulberry32(seed), out = [];
    for (var i = 0; i < n; i += 1) {
      var x1 = gauss(rand);
      var x2 = corr * x1 + Math.sqrt(1 - corr * corr) * gauss(rand);
      out.push({ x1: x1, x2: x2, y: 1.0 * x1 + 0.3 * x2 + noise * gauss(rand) });
    }
    return out;
  }
  function ridge(data, lambda) {
    finite(lambda);
    var n = data.length, m1 = 0, m2 = 0, my = 0;
    data.forEach(function (d) { m1 += d.x1; m2 += d.x2; my += d.y; });
    m1 /= n; m2 /= n; my /= n;
    var s11 = 0, s12 = 0, s22 = 0, s1y = 0, s2y = 0;
    data.forEach(function (d) {
      var a = d.x1 - m1, b = d.x2 - m2, y = d.y - my;
      s11 += a * a; s12 += a * b; s22 += b * b; s1y += a * y; s2y += b * y;
    });
    var a11 = s11 + lambda, a22 = s22 + lambda, det = a11 * a22 - s12 * s12;
    var b1 = (a22 * s1y - s12 * s2y) / det, b2 = (a11 * s2y - s12 * s1y) / det;
    return { b1: b1, b2: b2, b0: my - b1 * m1 - b2 * m2 };
  }
  function predictRmse(data, fit) {
    var s = 0;
    data.forEach(function (d) { var e = fit.b0 + fit.b1 * d.x1 + fit.b2 * d.x2 - d.y; s += e * e; });
    return Math.sqrt(s / data.length);
  }

  var api = {
    COULOMB: COULOMB, HARTREE: HARTREE, KJ: KJ, grid: grid,
    relativeCost: relativeCost, sigmaEsp: sigmaEsp, sigmaSummary: sigmaSummary,
    ttDamp: ttDamp, components: components, minimum: minimum,
    lj: lj, buckingham: buckingham, morse: morse, doubleExp: doubleExp,
    vsiteEnergy: vsiteEnergy, basisEnergy: basisEnergy, cbs2: cbs2,
    erf: erf, rangeSplit: rangeSplit,
    dispUndamped: dispUndamped, dispZero: dispZero, dispBJ: dispBJ, dispCHG: dispCHG,
    engelageW: engelageW, engelageEnergies: engelageEnergies,
    fitLJ: fitLJ, rmse: rmse, mulberry32: mulberry32, makeData: makeData, ridge: ridge, predictRmse: predictRmse
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  else { root.ICF_MODELS = api; }
}(typeof window !== "undefined" ? window : globalThis));
