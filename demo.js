(function () {
  "use strict";

  var porch = document.getElementById("porchStage");
  var remoteBtn = document.getElementById("remoteBtn");
  var remoteLed = document.getElementById("remoteLed");
  var remoteKeyText = document.getElementById("remoteKeyText");
  var glassStatus = document.getElementById("glassStatus");
  var captionStack = document.getElementById("captionStack");
  var clapCue = document.getElementById("clapCue");
  var clapBtn = document.getElementById("clapBtn");
  var micStatus = document.getElementById("micStatus");
  var demoLive = document.getElementById("demoLive");
  var doorScene = document.getElementById("doorScene");
  var form = document.getElementById("waitlistForm");
  var formMsg = document.getElementById("formMsg");
  var veoVideo = document.getElementById("veoVideo");

  if (!porch || !remoteBtn) return;

  var fogged = true;
  var animating = false;
  var scriptPlayed = false;
  var scriptRunning = false;
  var FOG_MS = 850;
  var timers = [];

  function clearTimers() {
    timers.forEach(function (t) { window.clearTimeout(t); });
    timers = [];
  }

  function later(ms, fn) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function announce(text) {
    if (demoLive) demoLive.textContent = text;
  }

  function showBubble(who, text) {
    if (!captionStack) return;
    var el = document.createElement("div");
    el.className = "speech-bubble" + (who === "Zac" ? " is-zac" : "");
    el.innerHTML = '<span class="who">' + who + '</span>' + text;
    captionStack.appendChild(el);
    announce(who + ": " + text);
    while (captionStack.children.length > 2) {
      captionStack.removeChild(captionStack.firstChild);
    }
  }

  function clearBubbles() {
    if (captionStack) captionStack.innerHTML = "";
  }

  function flashClapCue() {
    if (!clapCue) return;
    clapCue.classList.add("is-on");
    later(1400, function () { clapCue.classList.remove("is-on"); });
  }

  function setFog(next, opts) {
    opts = opts || {};
    if (animating && next === fogged && !opts.force) return;
    fogged = next;
    animating = true;
    porch.classList.toggle("is-fogged", fogged);
    remoteBtn.setAttribute("aria-pressed", fogged ? "true" : "false");
    if (remoteLed) remoteLed.classList.toggle("is-on", fogged);
    if (remoteKeyText) remoteKeyText.textContent = fogged ? "CLEAR" : "FOG";
    if (glassStatus) {
      glassStatus.textContent = fogged
        ? "Glass is fogged — press the remote to clear"
        : "Glass is clear — Zac & Zoey are visible";
    }
    later(FOG_MS, function () { animating = false; });
  }

  function runScriptAfterFirstClear() {
    if (scriptPlayed || scriptRunning) return;
    scriptPlayed = true;
    scriptRunning = true;
    clearBubbles();
    later(600, function () { showBubble("Zoey", "Daddy that's so cool!"); });
    later(2600, function () {
      showBubble("Zac", "It sure is Zoey! Anytime we want to we can change it with the click of a button, or, try clapping two times,");
    });
    later(6200, function () { flashClapCue(); announce("Zoey double-claps — glass fogs"); });
    later(6800, function () { setFog(true, { force: true }); });
    later(8200, function () { flashClapCue(); announce("Zoey double-claps again — glass clears"); });
    later(8800, function () { setFog(false, { force: true }); });
    later(10200, function () {
      clearBubbles();
      showBubble("Zac", "It can be configured to operate by means of the switch, claps, or your favorite home voice assistant. If you like to give us a call we can schedule the time to meet so that I can tell you more about the process. This is a local undertaking and I am right here in your neighborhood!");
      scriptRunning = false;
    });
  }

  function toggleFog(source) {
    var wasFogged = fogged;
    setFog(!fogged);
    if (wasFogged && !fogged && !scriptPlayed && source !== "script") {
      runScriptAfterFirstClear();
    }
  }

  remoteBtn.addEventListener("click", function () { toggleFog("remote"); });
  remoteBtn.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFog("remote"); }
  });
  if (clapBtn) {
    clapBtn.addEventListener("click", function () { flashClapCue(); toggleFog("clap-btn"); });
  }

  function setupClapDetection() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (micStatus) micStatus.textContent = "Mic unavailable — use Clap twice or the remote.";
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (micStatus) micStatus.textContent = "Listening for double claps…";
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var source = ctx.createMediaStreamSource(stream);
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      var data = new Uint8Array(analyser.frequencyBinCount);
      var lastPeak = 0;
      var peaks = [];
      var CLAP_THRESHOLD = 48;
      var CLAP_GAP_MIN = 80;
      var CLAP_GAP_MAX = 550;
      var COOLDOWN = 1200;
      var lastToggle = 0;
      function tick() {
        analyser.getByteFrequencyData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) sum += data[i];
        var avg = sum / data.length;
        var now = Date.now();
        if (avg > CLAP_THRESHOLD && now - lastPeak > 60) {
          lastPeak = now;
          peaks.push(now);
          peaks = peaks.filter(function (t) { return now - t < CLAP_GAP_MAX + 50; });
          if (peaks.length >= 2) {
            var dt = peaks[peaks.length - 1] - peaks[peaks.length - 2];
            if (dt >= CLAP_GAP_MIN && dt <= CLAP_GAP_MAX && now - lastToggle > COOLDOWN) {
              lastToggle = now;
              peaks = [];
              flashClapCue();
              toggleFog("mic");
            }
          }
        }
        requestAnimationFrame(tick);
      }
      tick();
    }).catch(function () {
      if (micStatus) micStatus.textContent = "Mic denied — use Clap twice or the remote.";
    });
  }

  var micArmed = false;
  if (clapBtn) {
    clapBtn.addEventListener("click", function armMic() {
      if (micArmed) return;
      micArmed = true;
      setupClapDetection();
    }, { once: false });
  }

  porch.classList.add("is-fogged");

  if (veoVideo && doorScene) {
    var veoSrc = doorScene.getAttribute("data-veo-video") || "media/fogtap-demo-v4.mp4";
    fetch(veoSrc, { method: "HEAD" }).then(function (r) {
      if (r.ok) {
        veoVideo.src = veoSrc;
        veoVideo.hidden = false;
        veoVideo.play().catch(function () {});
      }
    }).catch(function () {});
  }

  if (doorScene) {
    var still = doorScene.getAttribute("data-veo-still");
    if (still) doorScene.style.setProperty("--veo-still", "url('" + still + "')");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("name");
      var emailEl = document.getElementById("email");
      var phoneEl = document.getElementById("phone");
      var hoodEl = document.getElementById("neighborhood");
      var name = (nameEl && nameEl.value || "").trim();
      var email = (emailEl && emailEl.value || "").trim();
      var phone = (phoneEl && phoneEl.value || "").trim();
      var neighborhood = (hoodEl && hoodEl.value || "").trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name) { formMsg.textContent = "Please enter your name."; formMsg.classList.add("is-error"); if (nameEl) nameEl.focus(); return; }
      if (!valid) { formMsg.textContent = "Please enter a valid email."; formMsg.classList.add("is-error"); if (emailEl) emailEl.focus(); return; }
      formMsg.classList.remove("is-error");
      formMsg.textContent = "Sending…";
      var submitBtn = document.getElementById("submitBtn");
      if (submitBtn) submitBtn.disabled = true;
      var payload = { name: name, email: email, phone: phone, neighborhood: neighborhood, _subject: "FogTap waitlist signup", _template: "table", _captcha: "false", _honey: "" };
      var endpoints = ["/api/waitlist", "https://formsubmit.co/ajax/sideszac89@gmail.com"];
      function tryPost(i) {
        if (i >= endpoints.length) {
          formMsg.textContent = "Redirecting to confirm…";
          HTMLFormElement.prototype.submit.call(form);
          return;
        }
        fetch(endpoints[i], { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
          .then(function (res) {
            return res.json().catch(function () { return { ok: res.ok, status: res.status }; }).then(function (data) { return { res: res, data: data }; });
          })
          .then(function (pack) {
            var res = pack.res, data = pack.data;
            if (res.ok || data.success === "true" || data.success === true || data.ok) {
              form.classList.add("is-success");
              formMsg.textContent = "You’re on the list. We’ll be in touch.";
              return;
            }
            if (endpoints[i].indexOf("formsubmit") !== -1) {
              form.classList.add("is-success");
              formMsg.textContent = "Submitted. If this is the first signup, check sideszac89@gmail.com and confirm the FormSubmit activation email.";
              return;
            }
            tryPost(i + 1);
          })
          .catch(function () { tryPost(i + 1); })
          .finally(function () { if (submitBtn) submitBtn.disabled = false; });
      }
      tryPost(0);
    });
  }
})();
