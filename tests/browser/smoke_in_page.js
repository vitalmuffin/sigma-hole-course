/* In-page smoke test (paste into the devtools console or run via a browser-automation "evaluate").
   Visits every lesson; checks horizontal overflow, math errors, that every control changes the plot
   (output sensitivity, pitfall P14), that the check dialog opens only on click and gives feedback. */
(async function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const errs = [];
  window.addEventListener("error", e => errs.push(e.message));
  const ids = window.ICF_COURSE_DATA.stages.flatMap(s => s.lessons.map(l => l.id));
  const out = [];
  for (const id of ids) {
    location.hash = "#/" + id; await sleep(400);
    const dlg = document.getElementById("quiz-dialog");
    const rec = { id, overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      autoQuiz: dlg.open, mathErr: document.querySelectorAll('[data-math-error="true"]').length,
      math: document.querySelectorAll('[data-math="rendered"]').length,
      evidence: document.querySelectorAll(".evidence-list li").length, insensitive: [] };
    const cv = document.querySelector("canvas.plot");
    for (const inp of document.querySelectorAll(".controls input[type=range], .controls select")) {
      const before = cv.getAttribute("aria-label"), orig = inp.value;
      if (inp.tagName === "SELECT") { inp.value = inp.options[(inp.selectedIndex + 1) % inp.options.length].value; }
      else { const mn = +inp.min, mx = +inp.max; inp.value = (+orig - mn > (mx - mn) / 2) ? mn + (mx - mn) * 0.2 : mn + (mx - mn) * 0.8; }
      inp.dispatchEvent(new Event("input")); await sleep(150);
      if (cv.getAttribute("aria-label") === before) { rec.insensitive.push(inp.id); }
      inp.value = orig; inp.dispatchEvent(new Event("input")); await sleep(120);
    }
    [...document.querySelectorAll("button")].find(b => /Start check/.test(b.textContent)).click(); await sleep(100);
    rec.quizOpen = dlg.open;
    dlg.querySelectorAll("fieldset").forEach(fs => { fs.querySelector("input").checked = true; });
    [...dlg.querySelectorAll("button")].find(b => /Check answers/.test(b.textContent)).click(); await sleep(60);
    rec.feedback = dlg.querySelectorAll(".feedback:not([hidden])").length;
    dlg.close();
    out.push(rec);
  }
  const bad = out.filter(r => r.overflow || r.autoQuiz || r.mathErr || r.insensitive.length || !r.quizOpen || !r.feedback);
  window.ICF_SMOKE = { errs, bad, lessons: out.length, out };
  return window.ICF_SMOKE;
}());
