(function () {
  "use strict";

  var stage = document.getElementById("porchStage");
  var remoteBtn = document.getElementById("remoteBtn");
  var clapBtn = document.getElementById("clapBtn");
  var glassStatus = document.getElementById("glassStatus");
  var demoLive = document.getElementById("demoLive");
  var remoteLed = document.getElementById("remoteLed");
  var remoteKeyText = document.getElementById("remoteKeyText");
  var micStatus = document.getElementById("micStatus");
  var form = document.getElementById("waitlistForm");
  var formMsg = document.getElementById("formMsg");
  var submitBtn = document.getElementById("submitBtn");

  if (!stage || !remoteBtn) return;

  function isFogged() {
    return stage.classList.contains("is-fogged");
  }

  function setFogged(next) {
    stage.classList.toggle("is-fogged", next);
    remoteBtn.setAttribute("aria-pressed", next ? "true" : "false");
    if (remoteLed) remoteLed.classList.toggle("is-on", next);
    if (remoteKeyText) remoteKeyText.textContent = next ? "CLEAR" : "FOG";
    var label = next
      ? "Glass is fogged — press the remote to clear"
      : "Glass is clear — press the remote to fog";
    if (glassStatus) glassStatus.textContent = label;
    if (demoLive) demoLive.textContent = label;
  }

  function toggleFog() {
    setFogged(!isFogged());
  }

  remoteBtn.addEventListener("click", function () {
    toggleFog();
  });

  if (clapBtn) {
    clapBtn.addEventListener("click", function () {
      toggleFog();
    });
  }

  function setupMicClap() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (!window.AudioContext && !window.webkitAudioContext) return;

    var started = false;
    function arm() {
      if (started) return;
      started = true;
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
          var Ctx = window.AudioContext || window.webkitAudioContext;
          var ctx = new Ctx();
          var src = ctx.createMediaStreamSource(stream);
          var analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          src.connect(analyser);
          var data = new Uint8Array(analyser.fftSize);
          var peaks = [];
          var lastToggle = 0;

          if (micStatus) micStatus.textContent = "Listening for a double clap…";

          function tick() {
            analyser.getByteTimeDomainData(data);
            var peak = 0;
            for (var i = 0; i < data.length; i++) {
              var v = Math.abs(data[i] - 128);
              if (v > peak) peak = v;
            }
            var now = performance.now();
            if (peak > 42) {
              peaks.push(now);
              peaks = peaks.filter(function (t) {
                return now - t < 700;
              });
              if (peaks.length >= 2 && now - lastToggle > 900) {
                lastToggle = now;
                peaks = [];
                toggleFog();
              }
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        })
        .catch(function () {
          if (micStatus) micStatus.textContent = "";
        });
    }

    remoteBtn.addEventListener("click", arm, { once: true });
    if (clapBtn) clapBtn.addEventListener("click", arm, { once: true });
  }

  setupMicClap();
  setFogged(true);

  if (form) {
    form.addEventListener("submit", function (e) {
      var nameEl = document.getElementById("name");
      var emailEl = document.getElementById("email");
      var phoneEl = document.getElementById("phone");
      var neighborhoodEl = document.getElementById("neighborhood");
      var email = emailEl && emailEl.value ? emailEl.value.trim() : "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.preventDefault();
        if (formMsg) formMsg.textContent = "Please enter a valid email.";
        return;
      }

      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Joining…";
      }
      if (formMsg) formMsg.textContent = "";

      var payload = {
        name: nameEl ? nameEl.value.trim() : "",
        email: email,
        phone: phoneEl ? phoneEl.value.trim() : "",
        neighborhood: neighborhoodEl ? neighborhoodEl.value.trim() : ""
      };

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.json().catch(function () {
            return { ok: r.ok };
          });
        })
        .then(function (data) {
          if (data && data.ok) {
            if (formMsg) formMsg.textContent = "You're on the list. We'll be in touch.";
            form.reset();
            return;
          }
          form.submit();
        })
        .catch(function () {
          form.submit();
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Join waitlist";
          }
        });
    });
  }
})();
