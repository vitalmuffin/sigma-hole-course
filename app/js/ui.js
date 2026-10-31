/* Lesson renderer. Content text is turned into DOM nodes token by token (no innerHTML of content). */
(function () {
  "use strict";
  var DATA = window.ICF_COURSE_DATA;

  function required(root, selector) {
    var el = root.querySelector(selector);
    if (!el) { throw new Error("Required UI element missing: " + selector); }
    return el;
  }
  function make(tag, opts) {
    var el = document.createElement(tag);
    opts = opts || {};
    if (opts.className) { el.className = opts.className; }
    if (opts.text !== undefined) { el.textContent = opts.text; }
    Object.keys(opts.attrs || {}).forEach(function (k) { el.setAttribute(k, opts.attrs[k]); });
    (opts.children || []).forEach(function (c) { if (c) { el.appendChild(c); } });
    return el;
  }
  function math(tex, display) {
    return make(display ? "div" : "span", { className: display ? "formula" : "math-inline", text: tex,
      attrs: { "data-tex": tex, "data-display": String(Boolean(display)) } });
  }

  /* ---------- inline text: $tex$, **bold**, *italic*, [[lesson|label]], {{claim}} ---------- */
  var TOKEN = /(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[\[[a-z0-9-]+\|[^\]]+\]\]|\{\{[a-z0-9-]+\}\})/g;
  function inline(parent, text, ctx) {
    text.split(TOKEN).forEach(function (part) {
      if (!part) { return; }
      if (part[0] === "$" && part.length > 2 && part[part.length - 1] === "$") { parent.appendChild(math(part.slice(1, -1), false)); }
      else if (part.indexOf("**") === 0) { var b = make("strong"); inline(b, part.slice(2, -2), ctx); parent.appendChild(b); }
      else if (part[0] === "*" && part.length > 2 && part[part.length - 1] === "*") { var i = make("em"); inline(i, part.slice(1, -1), ctx); parent.appendChild(i); }
      else if (part.indexOf("[[") === 0) {
        var m = part.slice(2, -2).split("|");
        var a = make("a", { text: m[1], attrs: { href: "#/" + m[0] } });
        parent.appendChild(a);
      } else if (part.indexOf("{{") === 0) {
        parent.appendChild(evidenceMark(part.slice(2, -2), ctx));
      } else { parent.appendChild(document.createTextNode(part)); }
    });
  }
  function blocks(parent, text, ctx) {
    text.split(/\n\s*\n/).forEach(function (chunk) {
      var lines = chunk.split("\n").filter(function (l) { return l.trim(); });
      if (!lines.length) { return; }
      if (lines.every(function (l) { return /^\s*- /.test(l); })) {
        var ul = make("ul");
        lines.forEach(function (l) { var li = make("li"); inline(li, l.replace(/^\s*- /, ""), ctx); ul.appendChild(li); });
        parent.appendChild(ul);
      } else {
        var p = make("p"); inline(p, lines.join(" "), ctx); parent.appendChild(p);
      }
    });
  }

  /* ---------- evidence ---------- */
  function evidenceMark(id, ctx) {
    if (!(id in ctx.evIndex)) { ctx.evOrder.push(id); ctx.evIndex[id] = ctx.evOrder.length; }
    var n = ctx.evIndex[id], claim = DATA.claims[id], src = DATA.sources[claim.src] || {};
    var btn = make("button", { className: "ev-mark", text: String(n),
      attrs: { type: "button", title: (src.authors || claim.src) + " " + (src.year || "") + (claim.page ? ", p. " + claim.page : ""),
        "aria-label": "Evidence " + n + ": " + (src.authors || claim.src) + " " + (src.year || "") } });
    btn.addEventListener("click", function () {
      var target = document.getElementById("ev-" + id);
      if (!target) { return; }
      target.scrollIntoView({ block: "center" });
      target.setAttribute("data-flash", "true");
      setTimeout(function () { target.removeAttribute("data-flash"); }, 1600);
    });
    return btn;
  }
  function evidencePanel(ctx) {
    var panel = make("section", { className: "panel", attrs: { "aria-labelledby": "ev-head" } });
    panel.appendChild(make("h2", { text: "Evidence", attrs: { id: "ev-head" } }));
    if (!ctx.evOrder.length) { panel.appendChild(make("p", { className: "muted", text: "No source claims in this lesson." })); return panel; }
    var ol = make("ol", { className: "evidence-list" });
    ctx.evOrder.forEach(function (id) {
      var c = DATA.claims[id], s = DATA.sources[c.src] || {};
      var li = make("li", { attrs: { id: "ev-" + id } });
      li.appendChild(make("span", { className: "ev-num", text: String(ctx.evIndex[id]) }));
      var body = make("div");
      var t = make("div"); inline(t, c.text, ctx); body.appendChild(t);
      var meta = make("div", { className: "ev-src" });
      meta.appendChild(document.createTextNode((s.authors || c.src) + " (" + (s.year || "?") + "). " + (s.title || "") +
        (s.venue ? ". " + s.venue : "") + ". "));
      var loc = c.page ? "p. " + c.page : (c.type === "standard" ? "standard result, no page anchor" : "scan, checked by eye");
      if (s.pdf && c.page && !/^ch\./.test(c.page)) {
        meta.appendChild(make("a", { text: loc, attrs: { href: s.pdf + "#page=" + c.page, target: "_blank", rel: "noopener" } }));
      } else { meta.appendChild(document.createTextNode(loc)); }
      if (s.doi) { meta.appendChild(document.createTextNode(" · ")); meta.appendChild(make("a", { text: "doi", attrs: { href: "https://doi.org/" + s.doi, target: "_blank", rel: "noopener" } })); }
      meta.appendChild(make("span", { className: "ev-type", text: c.type }));
      body.appendChild(meta);
      li.appendChild(body);
      ol.appendChild(li);
    });
    panel.appendChild(ol);
    return panel;
  }

  /* ---------- sections ---------- */
  function textPanel(label, title, text, ctx) {
    var panel = make("section", { className: "panel" });
    if (label) { panel.appendChild(make("span", { className: "step-label", text: label })); }
    panel.appendChild(make("h2", { text: title }));
    blocks(panel, text, ctx);
    return panel;
  }
  function formulaPanel(lesson, ctx) {
    var panel = make("section", { className: "panel" });
    panel.appendChild(make("span", { className: "step-label", text: "Formal statement" }));
    panel.appendChild(make("h2", { text: "The relation" }));
    lesson.formulas.forEach(function (fm) {
      panel.appendChild(math(fm.tex, true));
      var dl = make("dl", { className: "symbol-ledger" });
      fm.symbols.forEach(function (s) {
        dl.appendChild(make("dt", { children: [math(s[0], false)] }));
        var dd = make("dd"); inline(dd, s[1], { evOrder: [], evIndex: {} }); dl.appendChild(dd);
      });
      panel.appendChild(dl);
      var src = make("p", { className: "formula-src", text: "Source: " });
      fm.src.forEach(function (id) { src.appendChild(evidenceMark(id, ctx)); });
      panel.appendChild(src);
    });
    return panel;
  }
  function modelPanel(lesson, ctx) {
    var spec = window.ICF_INTERACTIONS[lesson.model];
    if (!spec) { throw new Error("Unknown interaction " + lesson.model); }
    var panel = make("section", { className: "panel", attrs: { id: "model" } });
    panel.appendChild(make("span", { className: "step-label", text: "Interactive model" }));
    panel.appendChild(make("h2", { text: "Try it" }));
    var layout = make("div", { className: "interaction-layout" });
    var controls = make("div", { className: "controls" });
    var values = {};
    spec.controls.forEach(function (c) {
      values[c.id] = c.type === "select" ? c.value : c.value;
      var id = "ctl-" + lesson.id + "-" + c.id;
      var row = make("div", { className: "control-row" });
      var out = make("output", { attrs: { for: id } });
      var label = make("label", { attrs: { for: id }, children: [make("span", { text: c.label }), out] });
      var input;
      if (c.type === "select") {
        input = make("select", { attrs: { id: id } });
        c.options.forEach(function (o) { input.appendChild(make("option", { text: o[1], attrs: { value: o[0] } })); });
        input.value = c.value;
        out.textContent = "";
      } else {
        input = make("input", { attrs: { id: id, type: "range", min: c.min, max: c.max, step: c.step, value: c.value } });
        out.textContent = c.value + (c.unit ? " " + c.unit : "");
      }
      input.addEventListener("input", function () {
        values[c.id] = c.type === "select" ? input.value : Number(input.value);
        if (c.type !== "select") { out.textContent = input.value + (c.unit ? " " + c.unit : ""); }
        schedule();
      });
      row.appendChild(label); row.appendChild(input); controls.appendChild(row);
    });
    var reset = make("button", { className: "text-button", text: "Reset", attrs: { type: "button" } });
    reset.addEventListener("click", function () {
      spec.controls.forEach(function (c) {
        var el = document.getElementById("ctl-" + lesson.id + "-" + c.id);
        el.value = c.value; el.dispatchEvent(new Event("input"));
      });
    });
    controls.appendChild(reset);
    var visual = make("div");
    var canvas = make("canvas", { className: "plot", attrs: { role: "img", "aria-label": "Plot" } });
    var legend = make("div", { className: "legend", attrs: { "aria-hidden": "true" } });
    var readouts = make("div", { className: "readouts", attrs: { "aria-live": "polite" } });
    visual.appendChild(canvas); visual.appendChild(legend); visual.appendChild(readouts);
    layout.appendChild(controls); layout.appendChild(visual);
    panel.appendChild(layout);
    if (lesson.model_text) { var mt = make("div", { className: "model-text" }); blocks(mt, lesson.model_text, ctx); panel.appendChild(mt); }

    var frame = 0, timer = 0;
    function draw() {
      if (frame) { cancelAnimationFrame(frame); }
      if (timer) { clearTimeout(timer); }
      frame = 0; timer = 0;
      if (!canvas.isConnected) { return; }
      var r = spec.draw(canvas, values);
      canvas.setAttribute("aria-label", r.alt);
      legend.replaceChildren.apply(legend, r.legend.map(function (l) {
        var s = make("span", { text: l.label }); s.style.setProperty("--swatch", "var(" + l.color + ")"); return s;
      }));
      readouts.replaceChildren.apply(readouts, r.readouts.map(function (t) { return make("span", { className: "readout", text: t }); }));
    }
    // rAF coalesces slider events; the timeout covers background tabs/panes where rAF is paused
    function schedule() { if (!frame && !timer) { frame = requestAnimationFrame(draw); timer = setTimeout(draw, 80); } }
    ctx.redraws.push(schedule);
    schedule();
    return panel;
  }
  function listPanel(label, title, items, ctx, className) {
    var panel = make("section", { className: "panel" });
    panel.appendChild(make("span", { className: "step-label", text: label }));
    panel.appendChild(make("h2", { text: title }));
    var ul = make("ul", { className: className || "" });
    items.forEach(function (t) { var li = make("li"); inline(li, t, ctx); ul.appendChild(li); });
    panel.appendChild(ul);
    return panel;
  }
  function deeperPanel(lesson, ctx) {
    var panel = make("section", { className: "panel" });
    panel.appendChild(make("span", { className: "step-label", text: "Go deeper" }));
    panel.appendChild(make("h2", { text: "Details and side roads" }));
    lesson.deeper.forEach(function (d) {
      var det = make("details");
      det.appendChild(make("summary", { text: d[0] }));
      var div = make("div"); blocks(div, d[1], ctx); det.appendChild(div);
      panel.appendChild(det);
    });
    return panel;
  }

  /* ---------- quiz (explicit start, repeatable, links back) ---------- */
  function openQuiz(lesson, onDone) {
    var dialog = required(document, "#quiz-dialog"), content = required(dialog, "#quiz-content");
    required(dialog, "#quiz-title").textContent = "Check: " + lesson.title;
    content.replaceChildren();
    var ctx = { evOrder: [], evIndex: {}, redraws: [] };
    var groups = lesson.checks.map(function (q, qi) {
      var box = make("div", { className: "quiz-q" });
      var fs = make("fieldset");
      var lg = make("legend"); inline(lg, (qi + 1) + ". " + q.prompt, ctx); fs.appendChild(lg);
      q.choices.forEach(function (c, ci) {
        var lab = make("label", { className: "quiz-choice" });
        lab.appendChild(make("input", { attrs: { type: "radio", name: "q-" + qi, value: String(ci) } }));
        var span = make("span"); inline(span, c, ctx); lab.appendChild(span);
        fs.appendChild(lab);
      });
      box.appendChild(fs);
      var fb = make("div", { className: "feedback", attrs: { "aria-live": "polite", hidden: "" } });
      box.appendChild(fb);
      content.appendChild(box);
      return { q: q, box: box, fb: fb, qi: qi };
    });
    var submit = make("button", { className: "text-button primary", text: "Check answers", attrs: { type: "button" } });
    var summary = make("p", { attrs: { "aria-live": "polite" } });
    submit.addEventListener("click", function () {
      var right = 0, missed = [];
      groups.forEach(function (g) {
        var sel = g.box.querySelector("input:checked");
        g.fb.hidden = false; g.fb.replaceChildren();
        if (!sel) { g.fb.setAttribute("data-correct", "false"); g.fb.textContent = "Choose an answer."; missed.push(g.qi); return; }
        var ok = Number(sel.value) === g.q.correct;
        if (ok) { right += 1; } else { missed.push(g.qi); }
        g.fb.setAttribute("data-correct", String(ok));
        var strong = make("strong", { text: ok ? "Correct. " : "Not quite. " });
        g.fb.appendChild(strong); inline(g.fb, g.q.explanation, ctx);
        if (!ok && lesson.model) {
          g.fb.appendChild(document.createTextNode(" "));
          var back = make("a", { text: "Back to the model", attrs: { href: "#/" + lesson.id + "/model" } });
          back.addEventListener("click", function () { dialog.close(); });
          g.fb.appendChild(back);
        }
      });
      summary.textContent = right + " of " + groups.length + " correct." + (right === groups.length ? " Check passed." : " You can retry as often as you like.");
      window.ICF_STATE.setMastery(lesson.id, right === groups.length, missed);
      window.ICF_MATH.renderAll(content);
      if (onDone) { onDone(); }
    });
    content.appendChild(submit); content.appendChild(summary);
    window.ICF_MATH.renderAll(content);
    dialog.showModal();
  }

  /* ---------- whole lesson ---------- */
  function renderLesson(container, stage, lesson, nav) {
    container.replaceChildren();
    var ctx = { evOrder: [], evIndex: {}, redraws: [] };
    var header = make("header", { className: "lesson-header" });
    header.appendChild(make("div", { className: "eyebrow", text: stage.title + " · lesson " + nav.position + " of " + nav.total }));
    header.appendChild(make("h1", { text: lesson.title, attrs: { tabindex: "-1" } }));
    var q = make("p", { className: "callout" }); inline(q, lesson.question, ctx); header.appendChild(q);
    container.appendChild(header);

    var body = make("div", { className: "lesson-body" });
    body.appendChild(textPanel("1 · Starting picture", "What we usually assume", lesson.prior, ctx));
    body.appendChild(textPanel("2 · Where it breaks", "The observation that does not fit", lesson.boundary, ctx));
    body.appendChild(textPanel("3 · New idea", "What changes", lesson.idea, ctx));
    if (lesson.formulas && lesson.formulas.length) { body.appendChild(formulaPanel(lesson, ctx)); }
    if (lesson.model) { body.appendChild(modelPanel(lesson, ctx)); }
    if (lesson.limits && lesson.limits.length) { body.appendChild(listPanel("Limiting cases", "Where the relation reduces or stops", lesson.limits, ctx, "limits")); }
    if (lesson.deeper && lesson.deeper.length) { body.appendChild(deeperPanel(lesson, ctx)); }

    var check = make("section", { className: "panel" });
    check.appendChild(make("span", { className: "step-label", text: "Check" }));
    check.appendChild(make("h2", { text: "Use what you just saw" }));
    var row = make("div", { className: "check-row" });
    var start = make("button", { className: "text-button primary", text: "Start check (" + lesson.checks.length + (lesson.checks.length > 1 ? " questions)" : " question)"), attrs: { type: "button" } });
    var status = make("span", { className: "muted" });
    function refreshStatus() {
      var st = window.ICF_STATE.get();
      status.textContent = st.mastery[lesson.id] ? "Passed" : (st.gaps[lesson.id] ? "Not passed yet" : "Not attempted");
    }
    refreshStatus();
    start.addEventListener("click", function () { openQuiz(lesson, function () { refreshStatus(); nav.onProgress(); }); });
    row.appendChild(start); row.appendChild(status); check.appendChild(row);
    body.appendChild(check);

    body.appendChild(evidencePanel(ctx));

    var next = make("section", { className: "panel" });
    next.appendChild(make("span", { className: "step-label", text: "Next question" }));
    var nq = make("p"); inline(nq, lesson.next_q, ctx); next.appendChild(nq);
    var nr = make("div", { className: "next-row" });
    if (nav.prev) { nr.appendChild(make("a", { className: "text-button", text: "← " + nav.prev.title, attrs: { href: "#/" + nav.prev.id } })); }
    else { nr.appendChild(make("span")); }
    if (nav.next) { nr.appendChild(make("a", { className: "text-button primary", text: nav.next.title + " →", attrs: { href: "#/" + nav.next.id } })); }
    next.appendChild(nr);
    body.appendChild(next);

    container.appendChild(body);
    window.ICF_MATH.renderAll(container);
    return ctx;
  }

  window.ICF_UI = { required: required, make: make, renderLesson: renderLesson };
}());
