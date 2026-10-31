/* Learner state, kept separate per kind: reading (visited), practice/mastery (checks), preferences (theme).
   localStorage is optional: every access is guarded and the course works without it. */
(function () {
  "use strict";
  var KEY = "icf-state:" + window.ICF_COURSE_DATA.id;
  var first = window.ICF_COURSE_DATA.stages[0].lessons[0].id;
  var defaults = { theme: "system", currentLesson: first, visited: {}, mastery: {}, gaps: {} };

  function load() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(KEY) || "null");
      return Object.assign({}, defaults, parsed || {});
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }
  var state = load();
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (error) { /* storage unavailable */ }
  }

  window.ICF_STATE = {
    get: function () { return state; },
    update: function (patch) { Object.assign(state, patch); save(); return state; },
    markVisited: function (id) { state.visited[id] = true; save(); },
    setMastery: function (id, passed, missed) {
      state.mastery[id] = Boolean(passed) || Boolean(state.mastery[id]);
      state.gaps[id] = missed || [];
      save();
    },
    reset: function () { state = Object.assign({}, defaults, { visited: {}, mastery: {}, gaps: {} }); save(); }
  };
}());
