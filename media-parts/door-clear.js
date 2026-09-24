(function () {
  var p = window.__FTD || [];
  var uri = "";
  for (var i = 0; i < 5; i++) uri += (p[i] || "");
  function apply() {
    document.querySelectorAll("[data-door-src]").forEach(function (el) {
      if (uri) el.setAttribute("src", uri);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
})();
