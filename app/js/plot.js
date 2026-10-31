/* Canvas line plots. Every draw resets the transform, clears the full buffer and restores HiDPI scaling. */
(function () {
  "use strict";
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function prepare(canvas) {
    var rect = canvas.getBoundingClientRect();
    var ratio = Math.max(1, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.shadowColor = "transparent"; ctx.globalCompositeOperation = "source-over";
    return { ctx: ctx, width: rect.width, height: rect.height };
  }

  function niceTicks(a, b, n) {
    var span = b - a, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    [1, 2, 5, 10].some(function (m) { if (span / (step * m) <= n) { step *= m; return true; } return false; });
    var out = [];
    for (var t = Math.ceil(a / step) * step; t <= b + step * 1e-9; t += step) { out.push(Math.abs(t) < step * 1e-9 ? 0 : t); }
    return out;
  }
  function fmt(v) { var a = Math.abs(v); return a >= 1000 || (a > 0 && a < 0.01) ? v.toExponential(0) : String(Math.round(v * 1000) / 1000); }

  /* spec: {x:[min,max], y:[min,max], xLabel, yLabel, series:[{points:[{x,y}], color, dash, width}],
            hlines:[y], vlines:[{x,color,label}], markers:[{x,y,color,label}], area:{x0,y0,w,h}} (area in CSS px) */
  function line(canvas, spec, prepared) {
    var p = prepared || prepare(canvas), ctx = p.ctx;
    var area = spec.area || { x0: 0, y0: 0, w: p.width, h: p.height };
    var L = area.x0 + 52, R = area.x0 + area.w - 12, T = area.y0 + 12, B = area.y0 + area.h - 40;
    var x0 = spec.x[0], x1 = spec.x[1], y0 = spec.y[0], y1 = spec.y[1];
    function px(x) { return L + (x - x0) / (x1 - x0) * (R - L); }
    function py(y) { return B - (y - y0) / (y1 - y0) * (B - T); }
    ctx.font = "12px system-ui, sans-serif";
    ctx.lineWidth = 1; ctx.strokeStyle = css("--border"); ctx.fillStyle = css("--muted");
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    niceTicks(x0, x1, Math.max(3, Math.floor((R - L) / 70))).forEach(function (t) {
      ctx.beginPath(); ctx.moveTo(px(t), T); ctx.lineTo(px(t), B); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText(fmt(t), px(t), B + 4);
    });
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    niceTicks(y0, y1, Math.max(3, Math.floor((B - T) / 45))).forEach(function (t) {
      ctx.beginPath(); ctx.moveTo(L, py(t)); ctx.lineTo(R, py(t)); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText(fmt(t), L - 6, py(t));
    });
    ctx.strokeStyle = css("--muted");
    (spec.hlines || [0]).forEach(function (h) {
      if (h >= y0 && h <= y1) { ctx.beginPath(); ctx.moveTo(L, py(h)); ctx.lineTo(R, py(h)); ctx.stroke(); }
    });
    (spec.vlines || []).forEach(function (v) {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = css(v.color || "--muted");
      ctx.beginPath(); ctx.moveTo(px(v.x), T); ctx.lineTo(px(v.x), B); ctx.stroke(); ctx.restore();
    });
    ctx.save();
    ctx.beginPath(); ctx.rect(L, T, R - L, B - T); ctx.clip();
    (spec.series || []).forEach(function (s) {
      ctx.strokeStyle = css(s.color || "--c1"); ctx.lineWidth = s.width || 2.5; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      var started = false;
      s.points.forEach(function (pt) {
        if (!Number.isFinite(pt.y)) { started = false; return; }
        var yy = Math.max(T - 2000, Math.min(B + 2000, py(pt.y)));
        if (!started) { ctx.moveTo(px(pt.x), yy); started = true; } else { ctx.lineTo(px(pt.x), yy); }
      });
      ctx.stroke();
      if (s.dots) {
        ctx.fillStyle = css(s.color || "--c1");
        s.points.forEach(function (pt) { ctx.beginPath(); ctx.arc(px(pt.x), py(pt.y), 3.2, 0, 2 * Math.PI); ctx.fill(); });
      }
    });
    ctx.restore();
    ctx.setLineDash([]);
    (spec.markers || []).forEach(function (m) {
      if (m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1) { return; }
      ctx.fillStyle = css(m.color || "--text");
      ctx.beginPath(); ctx.arc(px(m.x), py(m.y), 4.5, 0, 2 * Math.PI); ctx.fill();
      if (m.label) { ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(m.label, px(m.x) + 6, py(m.y) - 4); }
    });
    ctx.fillStyle = css("--muted"); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(spec.xLabel || "", (L + R) / 2, area.y0 + area.h - 2);
    ctx.save(); ctx.translate(area.x0 + 12, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "middle";
    ctx.fillText(spec.yLabel || "", 0, 0); ctx.restore();
    return p;
  }

  window.ICF_PLOT = { prepare: prepare, line: line, css: css };
}());
