/* One math adapter for the whole course: KaTeX when loaded, readable TeX fallback otherwise.
   Elements carry data-tex (without delimiters) and data-display="true|false". */
(function () {
  "use strict";
  var pending = [];
  var tries = 0;

  function renderNode(node) {
    var tex = node.getAttribute("data-tex") || "";
    var display = node.getAttribute("data-display") === "true";
    if (window.katex && typeof window.katex.render === "function") {
      try {
        window.katex.render(tex, node, { displayMode: display, throwOnError: false, strict: "ignore" });
        node.removeAttribute("data-math-error");
        node.setAttribute("data-math", "rendered");
      } catch (error) {
        node.textContent = tex;
        node.setAttribute("data-math-error", "true");
      }
      return true;
    }
    node.textContent = tex;
    node.setAttribute("data-math-error", "true");
    return false;
  }

  function renderAll(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll("[data-tex]"));
    var ok = nodes.every(renderNode);
    if (!ok) {
      pending.push(root || document);
      if (tries < 40) {           // KaTeX loads deferred from the CDN: retry for up to ~10 s
        tries += 1;
        setTimeout(function () {
          var roots = pending.splice(0);
          roots.forEach(function (r) { if (r.isConnected !== false) { renderAll(r); } });
        }, 250);
      }
    }
  }

  window.ICF_MATH = { renderAll: renderAll };
}());
