(function () {
  "use strict";

  var glass = document.getElementById("glassPanel");
  var frost = document.getElementById("frostLayer");
  var remoteBtn = document.getElementById("remoteBtn");
  var remoteLed = document.getElementById("remoteLed");
  var remoteKeyText = document.getElementById("remoteKeyText");
  var glassStatus = document.getElementById("glassStatus");
  var form = document.getElementById("waitlistForm");
  var formMsg = document.getElementById("formMsg");
  var emailInput = document.getElementById("email");

  if (!glass || !remoteBtn) return;

  var fogged = false;
  var animating = false;
  var FOG_MS = 850;

  function setFog(next) {
    if (animating && next === fogged) return;
    fogged = next;
    animating = true;

    glass.classList.toggle("is-fogged", fogged);
    glass.setAttribute("data-fogged", fogged ? "true" : "false");
    remoteBtn.setAttribute("aria-pressed", fogged ? "true" : "false");
    remoteLed.classList.toggle("is-on", fogged);
    remoteKeyText.textContent = fogged ? "CLEAR" : "FOG";
    glassStatus.textContent = fogged
      ? "Glass is fogged — tap to clear"
      : "Glass is clear — tap to fog";

    window.setTimeout(function () {
      animating = false;
    }, FOG_MS);
  }

  function toggleFog() {
    setFog(!fogged);
  }

  remoteBtn.addEventListener("click", toggleFog);

  remoteBtn.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFog();
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (emailInput && emailInput.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!valid) {
        formMsg.textContent = "Please enter a valid email.";
        formMsg.classList.add("is-error");
        if (emailInput) emailInput.focus();
        return;
      }

      formMsg.classList.remove("is-error");
      try {
        var list = JSON.parse(localStorage.getItem("fogtap-waitlist") || "[]");
        if (list.indexOf(email) === -1) {
          list.push(email);
          localStorage.setItem("fogtap-waitlist", JSON.stringify(list));
        }
      } catch (err) {}

      form.classList.add("is-success");
      formMsg.textContent = "You're on the list. We'll be in touch.";
    });
  }
})();
