(function () {
  var p = window.__FTD || [];
  var uri = (p[0] || "") + (p[1] || "") + (p[2] || "") + (p[3] || "");
  function apply() {
    document.querySelectorAll("[data-door-src]").forEach(function (el) {
      if (uri) el.setAttribute("src", uri);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
})();
