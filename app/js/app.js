/* Shell: hash routing (#/lesson-id[/anchor]), drawer, theme, progress. */
(function () {
  "use strict";
  function initialize() {
    var DATA = window.ICF_COURSE_DATA, UI = window.ICF_UI, S = window.ICF_STATE;
    var menuButton = UI.required(document, "#menu-button");
    var closeButton = UI.required(document, "#close-menu-button");
    var drawer = UI.required(document, "#course-nav");
    var backdrop = UI.required(document, "#drawer-backdrop");
    var stageList = UI.required(document, "#stage-list");
    var view = UI.required(document, "#lesson-view");
    var stageTitle = UI.required(document, "#stage-title");
    var flat = [];
    DATA.stages.forEach(function (st) { st.lessons.forEach(function (l) { flat.push({ stage: st, lesson: l }); }); });
    var current = null;
    var desktop = window.matchMedia("(min-width: 1180px)");

    function applyTheme() {
      var t = S.get().theme;
      var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }
    applyTheme();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { applyTheme(); redraw(); });

    function setDrawer(open, focus) {
      drawer.setAttribute("data-open", String(open));
      backdrop.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
      if (desktop.matches) { drawer.removeAttribute("inert"); return; }
      if (open) { drawer.removeAttribute("inert"); closeButton.focus(); }
      else { drawer.setAttribute("inert", ""); if (focus) { menuButton.focus(); } }
    }
    menuButton.addEventListener("click", function () { setDrawer(true); });
    closeButton.addEventListener("click", function () { setDrawer(false, true); });
    backdrop.addEventListener("click", function () { setDrawer(false, true); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.getAttribute("data-open") === "true") { setDrawer(false, true); } });
    desktop.addEventListener("change", function () { setDrawer(false); });
    setDrawer(false);

    function renderNav() {
      var st = S.get();
      stageList.replaceChildren();
      DATA.stages.forEach(function (stage, si) {
        var li = UI.make("li");
        li.appendChild(UI.make("div", { className: "stage-name", text: si + " · " + stage.title }));
        var ul = UI.make("ul", { className: "lesson-list" });
        stage.lessons.forEach(function (l) {
          var state = st.mastery[l.id] ? "mastered" : (st.visited[l.id] ? "visited" : "new");
          var btn = UI.make("button", { attrs: { type: "button" }, children: [
            UI.make("span", { className: "mark", text: state === "mastered" ? "✓" : (state === "visited" ? "●" : "○"),
              attrs: { "data-state": state, "aria-hidden": "true" } }),
            UI.make("span", { text: l.title })] });
          btn.setAttribute("aria-label", l.title + (state === "mastered" ? " (check passed)" : state === "visited" ? " (visited)" : ""));
          if (current && current.lesson.id === l.id) { btn.setAttribute("aria-current", "page"); }
          btn.addEventListener("click", function () { location.hash = "#/" + l.id; setDrawer(false); });
          ul.appendChild(UI.make("li", { children: [btn] }));
        });
        li.appendChild(ul);
        stageList.appendChild(li);
      });
    }

    var ctx = null;
    function redraw() { if (ctx) { ctx.redraws.forEach(function (fn) { fn(); }); } }
    window.addEventListener("resize", redraw, { passive: true });

    function route() {
      var parts = (location.hash || "").replace(/^#\/?/, "").split("/");
      var idx = flat.findIndex(function (x) { return x.lesson.id === parts[0]; });
      if (idx < 0) {
        idx = Math.max(0, flat.findIndex(function (x) { return x.lesson.id === S.get().currentLesson; }));
        history.replaceState(null, "", "#/" + flat[idx].lesson.id);
      }
      var changed = !current || current.lesson.id !== flat[idx].lesson.id;
      current = flat[idx];
      if (changed) {
        stageTitle.textContent = current.stage.title;
        document.title = current.lesson.title + " · The σ-Hole and Its Models";
        ctx = UI.renderLesson(view, current.stage, current.lesson, {
          position: idx + 1, total: flat.length,
          prev: idx > 0 ? flat[idx - 1].lesson : null, next: idx < flat.length - 1 ? flat[idx + 1].lesson : null,
          onProgress: renderNav
        });
        S.markVisited(current.lesson.id);
        S.update({ currentLesson: current.lesson.id });
        renderNav();
      }
      if (parts[1]) {
        var scrollToAnchor = function () { var t = document.getElementById(parts[1]); if (t) { t.scrollIntoView(); } };
        scrollToAnchor();
        if (changed) { setTimeout(scrollToAnchor, 300); }   // again after math and plots settled the layout
      } else if (changed) {
        window.scrollTo(0, 0);
        var h1 = view.querySelector("h1"); if (h1) { h1.focus({ preventScroll: true }); }
      }
    }
    window.addEventListener("hashchange", route);

    UI.required(document, "#theme-button").addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      S.update({ theme: dark ? "light" : "dark" }); applyTheme(); redraw();
    });
    UI.required(document, "#progress-button").addEventListener("click", function () {
      var dlg = UI.required(document, "#progress-dialog"), box = UI.required(dlg, "#progress-content"), st = S.get();
      var table = UI.make("table", { className: "progress-table" });
      table.appendChild(UI.make("tr", { children: [UI.make("th", { text: "Lesson" }), UI.make("th", { text: "Read" }), UI.make("th", { text: "Check" })] }));
      flat.forEach(function (x) {
        table.appendChild(UI.make("tr", { children: [UI.make("td", { text: x.lesson.title }),
          UI.make("td", { text: st.visited[x.lesson.id] ? "yes" : "–" }),
          UI.make("td", { text: st.mastery[x.lesson.id] ? "passed" : (st.gaps[x.lesson.id] ? "retry" : "–") })] }));
      });
      var n = flat.filter(function (x) { return st.mastery[x.lesson.id]; }).length;
      var reset = UI.make("button", { className: "text-button", text: "Reset progress", attrs: { type: "button" } });
      reset.addEventListener("click", function () { S.reset(); dlg.close(); renderNav(); });
      box.replaceChildren(UI.make("p", { text: n + " of " + flat.length + " checks passed. Reading and passing a check are tracked separately." }), table, reset);
      dlg.showModal();
    });
    document.querySelectorAll("[data-close-dialog]").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = document.getElementById(b.getAttribute("data-close-dialog"));
        if (!d) { throw new Error("Dialog not found"); }
        d.close();
      });
    });
    route();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initialize, { once: true }); }
  else { initialize(); }
}());
