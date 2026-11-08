/* Agentium website behaviour: menu, language window, cookies, scroll stories, Try Maria, booking calendar. No libraries. */
(function () {
  "use strict";
  var CFG = JSON.parse(document.getElementById("cfg").textContent);
  var T = CFG.t, LANG = CFG.lang, PAGE = CFG.page;
  var SET = window.AGENTIUM_CONFIG || {};
  var DEMO = /[?&]demo\b/.test(location.search);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: fine */ } }
  };
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) root.classList.add("still");
  var still = function () { return root.classList.contains("still"); };

  /* ---------- the floating pill menu ---------- */
  var pill = $(".pill"), menu = $("#menu"), lastFocus = null;
  function openMenu() { lastFocus = document.activeElement; menu.classList.add("open"); pill.setAttribute("aria-expanded", "true"); $(".menu-close").focus(); }
  function closeMenu() { menu.classList.remove("open"); pill.setAttribute("aria-expanded", "false"); if (lastFocus) lastFocus.focus(); }
  pill.addEventListener("click", openMenu);
  $(".menu-close").addEventListener("click", closeMenu);
  menu.addEventListener("click", function (e) { if (e.target === menu) closeMenu(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (menu.classList.contains("open")) closeMenu();
    if ($("#langmodal").classList.contains("open")) closeLang();
  });
  // keep keyboard focus inside an open window
  function trap(box) {
    box.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = $$("a[href],button:not([disabled]),input,select", box).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
  trap(menu); trap($("#langmodal"));

  /* ---------- language + currency window (shown on the first visit) ---------- */
  var lm = $("#langmodal");
  var RATES = { EUR: [1, "€"], GBP: [0.855, "£"], USD: [1.087, "$"] }; // rough guide only (shown as "about")
  function openLang() { lastFocus = document.activeElement; lm.classList.add("open"); var b = $(".opt[aria-pressed=true]", lm) || $(".opt", lm); b.focus(); }
  function closeLang() {
    lm.classList.remove("open");
    if (!store.get("ag-lang")) store.set("ag-lang", LANG);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    maybeCookies();
  }
  $$("[data-open-lang]").forEach(function (b) { b.addEventListener("click", function () { if (menu.classList.contains("open")) closeMenu(); openLang(); }); });
  $$("[data-close-lang]").forEach(function (b) { b.addEventListener("click", closeLang); });
  lm.addEventListener("click", function (e) { if (e.target === lm) closeLang(); });
  $$(".tabs [role=tab]", lm).forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tabs [role=tab]", lm).forEach(function (x) { x.setAttribute("aria-selected", String(x === tab)); $("#" + x.getAttribute("aria-controls")).hidden = x !== tab; });
    });
  });
  function goLang(l) {
    store.set("ag-lang", l);
    if (l === LANG) { closeLang(); return; }
    var file = CFG.files[PAGE] || "index.html";
    location.href = (l === "en" ? "en/" : "../") + file + location.search + location.hash;
  }
  $$("[data-lang]", lm).forEach(function (b) { b.addEventListener("click", function () { goLang(b.getAttribute("data-lang")); }); });
  function applyCurrency() {
    var c = store.get("ag-cur") || "EUR"; if (!RATES[c]) c = "EUR";
    $$("[data-cur]", lm).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cur") === c)); });
    $$("[data-region-label]").forEach(function (s) { s.textContent = T.lang_name + " (" + c + ")"; });
    var loc = LANG === "el" ? "el-GR" : "en-GB";
    $$("[data-eur]").forEach(function (p) { // the number itself changes (rough rate; billing stays in euros)
      var v = +p.getAttribute("data-eur") * RATES[c][0];
      var txt = v < 10 ? v.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(v).toLocaleString(loc);
      p.textContent = RATES[c][1] + txt;
    });
  }
  $$("[data-cur]", lm).forEach(function (b) { b.addEventListener("click", function () { store.set("ag-cur", b.getAttribute("data-cur")); applyCurrency(); }); });
  applyCurrency();

  /* ---------- cookie notice (reject as easy as accept) ---------- */
  var ck = $("#cookie");
  function maybeCookies() { if (!store.get("ag-cookies") && !lm.classList.contains("open")) ck.classList.add("open"); }
  function saveCookies(stats) { store.set("ag-cookies", JSON.stringify({ necessary: true, stats: !!stats, at: new Date().toISOString() })); ck.classList.remove("open"); }
  $$("[data-ck]", ck).forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-ck");
      if (k === "accept") saveCookies(true);
      else if (k === "reject") saveCookies(false);
      else {
        var prefs = $("#cookie-prefs");
        if (!prefs.classList.contains("open")) { prefs.classList.add("open"); b.textContent = T.cookie_save; }
        else saveCookies($("#ck-stats").checked);
      }
    });
  });
  $$("[data-open-cookies]").forEach(function (b) {
    b.addEventListener("click", function () {
      var c = {}; try { c = JSON.parse(store.get("ag-cookies") || "{}"); } catch (e) { /* ignore */ }
      $("#ck-stats").checked = !!c.stats; $("#cookie-prefs").classList.add("open"); $("[data-ck=custom]", ck).textContent = T.cookie_save;
      ck.classList.add("open"); $("[data-ck=custom]", ck).focus();
    });
  });
  if (!store.get("ag-lang")) setTimeout(openLang, 350); else maybeCookies();

  /* ---------- scroll: gentle reveal, clouds, story, the box that opens ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else $$(".reveal").forEach(function (el) { el.classList.add("in"); });

  function progress(el) { // 0 when the element's top reaches the top of the screen, 1 when its end does
    var r = el.getBoundingClientRect(), h = r.height - innerHeight;
    return h <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / h));
  }
  var story = $(".story"), opens = $$(".opens");
  $$(".gv").forEach(function (v) { // pick the small film on phones; never plays by itself, only follows the scroll
    v.src = innerWidth < 820 ? v.getAttribute("data-src-small") : v.getAttribute("data-src-big");
    v.addEventListener("loadedmetadata", function () { v._dur = v.duration; v.pause(); onScroll && onScroll(); });
    v.load();
  });

  /* ---------- the live call on the home page: real-sounding calls, typed as they happen ---------- */
  var hl = $(".hero-live");
  if (hl) (function () {
    var calls = JSON.parse(hl.getAttribute("data-calls")), box = $(".hl-msgs", hl), biz = $(".hl-biz", hl), clock = $(".hl-clock", hl), tm = $(".hl-time", hl);
    var ow = $(".hl-orb", hl), bars = $$(".hl-wave i", hl), chips = [$(".c1", hl), $(".c2", hl), $(".c3", hl)], who = "", n = 0, secs = 0;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    setInterval(function () { // the voice bars follow whoever is talking
      bars.forEach(function (b, i) {
        var h = who === "m" ? 25 + Math.random() * 75 * (1 - Math.abs(i - 13.5) / 20) : who === "c" ? 15 + Math.random() * 40 : 10;
        b.style.height = h.toFixed(0) + "%";
      });
    }, 120);
    setInterval(function () { secs++; clock.textContent = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0"); }, 1000);
    function bubble(cls, text) { var d = document.createElement("div"); d.className = "hl-msg " + cls; if (text) d.textContent = text; box.appendChild(d); return d; }
    async function typeIn(el, text) { for (var i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(text[i - 1] === " " ? 34 : 22); } }
    async function run() {
      if (still()) return; // phones set to "reduce motion": the first call stays as a still picture
      for (;;) {
        var c = calls[n % calls.length]; n++;
        chips.forEach(function (x) { x.classList.remove("show"); });
        box.style.transition = "opacity .4s"; box.style.opacity = 0; await wait(450);
        box.innerHTML = ""; box.style.opacity = 1; biz.textContent = c.biz; tm.textContent = c.time; secs = 0;
        $(".hl-booked", hl).textContent = c.booked; $(".hl-when", hl).textContent = c.when;
        await wait(500); chips[0].classList.add("show");
        for (var k = 0; k < c.lines.length; k++) {
          var w = c.lines[k][0], t = c.lines[k][1];
          if (w === "c") { who = "c"; await wait(900); bubble("c", t); await wait(900); who = ""; }
          else {
            var dots = bubble("m typing"); dots.innerHTML = "<b></b><b></b><b></b>"; await wait(800);
            dots.className = "hl-msg m"; dots.textContent = ""; who = "m"; ow.classList.add("talking");
            await typeIn(dots, t); await wait(500); who = ""; ow.classList.remove("talking");
          }
          while (box.scrollHeight > box.clientHeight && box.firstChild) box.removeChild(box.firstChild);
          await wait(450);
        }
        chips[1].classList.add("show"); await wait(1100); chips[2].classList.add("show"); await wait(4200);
      }
    }
    run();
    var tilt = $(".hl-tilt", hl);
    if (matchMedia("(pointer:fine)").matches) $(".hero").addEventListener("mousemove", function (e) { // the phone turns gently toward the mouse
      var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      tilt.style.setProperty("--ry", (x * 16 - 4).toFixed(2) + "deg"); tilt.style.setProperty("--rx", (-y * 10 + 3).toFixed(2) + "deg");
    });
  })();

  /* ---------- clouds: soft clouds drawn in 3D; scrolling glides the camera through them. The hero sky and every
     ".sky.gap" between home-page parts carry you from one part to the next (Nicolas, 8 Nov) ---------- */
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  var SPRITES = null;
  function sprite() { // one fluffy cumulus: many soft puffs, flat-ish base, shaded underside
    var w = 640, h = 340, c = document.createElement("canvas"), g = c.getContext("2d"); c.width = w; c.height = h;
    var base = h * 0.72;
    for (var i = 0; i < 70; i++) {
      var x = w / 2 + gauss() * w * 0.30, sp = 1 - Math.abs(x - w / 2) / (w / 2);
      var r = (26 + rnd() * 52) * (0.55 + sp * 0.8), y = base - r * (0.35 + rnd() * 0.9) * (0.6 + sp * 0.7);
      var rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.55, "rgba(255,255,255,.92)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    g.globalCompositeOperation = "source-atop";
    var sh = g.createLinearGradient(0, h * 0.25, 0, base + 10);
    sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.6, "rgba(196,214,234,.35)"); sh.addColorStop(1, "rgba(150,178,208,.55)");
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    var cut = g.createLinearGradient(0, base - 18, 0, base + 30);
    cut.addColorStop(0, "rgba(0,0,0,0)"); cut.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = cut; g.fillRect(0, base - 18, w, h);
    return c;
  }
  function cloudField(sky) {
    var cv = $(".sky-canvas", sky); if (!cv || !cv.getContext) return;
    if (!SPRITES) SPRITES = [sprite(), sprite(), sprite(), sprite(), sprite()];
    var hero = !sky.classList.contains("gap"), ctx = cv.getContext("2d"), W = 0, H = 0, R = Math.min(window.devicePixelRatio || 1, 1.5);
    var DEPTH = hero ? 7 : 6.5, clouds = [];
    var count = hero ? 46 : 34;
    for (var i = 0; i < count; i++) {
      var z = hero ? 1.2 + rnd() * 9 : 1.3 + rnd() * 7.5, x = (rnd() * 2 - 1) * 2.1, y = gauss() * 0.85;
      if (hero && z < 4 && Math.abs(x) < 1.15 && y < 0.6) x = (x < 0 ? -1 : 1) * (1.15 + rnd() * 1); // keep the headline clear
      if (z > (hero ? 4.5 : 2.5) && rnd() < 0.5) { x = gauss() * 0.55; y = gauss() * 0.35; } // a bank dead ahead: you fly into it
      clouds.push({ x: x, y: y, z: z, s: 0.8 + rnd() * 0.9, img: SPRITES[i % 5], drift: (rnd() - 0.5) * 0.003 });
    }
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * R); cv.height = Math.round(H * R); }
    var cam = 0, want = 0, edge = 1, visible = false, t0 = performance.now(), dirty = true;
    function target() {
      var r = sky.getBoundingClientRect();
      visible = r.bottom > 0 && r.top < innerHeight;
      var p = hero ? Math.min(1, Math.max(0, -r.top / r.height)) // the whole time the sky is on screen
                   : Math.min(1, Math.max(0, (innerHeight - r.top) / r.height)); // gone by the time the next part reaches the screen
      want = p * DEPTH; edge = hero ? 1 : Math.sin(Math.PI * p); dirty = true;
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      cam += (want - cam) * (still() ? 1 : 0.08); // eased: it glides
      var dt = (now - t0) / 1000;
      ctx.setTransform(R, 0, 0, R, 0, 0); ctx.clearRect(0, 0, W, H);
      if (!hero && edge > 0.002) { // the blue sky comes and goes WITH the clouds, so it never leaves a band on the white page
        var sk = ctx.createLinearGradient(0, 0, 0, H);
        sk.addColorStop(0, "#e6f0fa"); sk.addColorStop(0.5, "#c9e0f5"); sk.addColorStop(1, "#e6f0fa");
        ctx.globalAlpha = Math.min(1, edge * 1.3); ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      }
      var F = Math.max(W, H) * 0.55, list = [];
      for (var k = 0; k < clouds.length; k++) { var d = clouds[k].z - cam; if (d > 0.18 && d < 10) list.push([d, clouds[k]]); }
      list.sort(function (a, b) { return b[0] - a[0]; });
      for (var j = 0; j < list.length; j++) {
        var d2 = list[j][0], cl = list[j][1], sc = F / d2, wx = cl.x + (still() ? 0 : Math.sin(dt * 0.05 + cl.z) * 0.06 + cl.drift * dt);
        var cw = cl.s * sc * 1.6, ch = cw * 0.53, px = W / 2 + wx * sc - cw / 2, py = H * 0.46 + cl.y * sc - ch * 0.7;
        var a = Math.min(1, (10 - d2) / 3) * Math.min(1, (d2 - 0.18) / 0.9) * Math.min(1, edge * 1.6);
        if (a <= 0 || px > W || py > H || px + cw < 0 || py + ch < 0) continue;
        ctx.globalAlpha = a; ctx.drawImage(cl.img, px, py, cw, ch);
      }
      ctx.globalAlpha = 1;
    }
    size(); target();
    addEventListener("resize", function () { size(); target(); });
    addEventListener("scroll", target, { passive: true });
    requestAnimationFrame(frame);
  }
  $$(".sky").forEach(cloudField);


  function onScroll() {
    if (still()) return;
    if (story) {
      var p = progress(story), i = Math.min(2, Math.floor(p * 3));
      $$(".story-step", story).forEach(function (s, k) { s.classList.toggle("on", k === i); });
      $$(".story-dots i", story).forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }
    opens.forEach(function (sec) {
      if (sec.classList.contains("explode")) { // the globe film follows the scroll: opens, the 12 beads come out, (cards), they go back, it closes
        var px = progress($(".opens-track", sec)), N = $$(".ex-card", sec).length, v = $(".gv", sec);
        if (v && v._dur) {
          var T1 = 5.3, T2 = 6.5, D = v._dur - 0.05, t;
          if (px < 0.16) t = px / 0.16 * T1; else if (px < 0.82) t = T1 + (px - 0.16) / 0.66 * (T2 - T1); else t = T2 + Math.min(1, (px - 0.82) / 0.14) * (D - T2);
          v._want = t; if (!v._raf) v._raf = requestAnimationFrame(function step() { // eased seek, one at a time (a seek during a seek is dropped)
            v._raf = 0; if (v.seeking) { v._raf = requestAnimationFrame(step); return; }
            var cur = v.currentTime, d = v._want - cur;
            if (Math.abs(d) > 0.02) { v.currentTime = cur + d * 0.35; v._raf = requestAnimationFrame(step); }
          });
        }
        var c = px < 0.17 || px > 0.81 ? -1 : Math.min(N - 1, Math.floor((px - 0.17) / 0.64 * N));
        $$(".ex-card", sec).forEach(function (b, k) { b.classList.toggle("on", k === c); b.classList.toggle("gone", k < c); });
        $$(".opens-progress i", sec).forEach(function (d, k) { d.classList.toggle("on", k <= c || px > 0.81); });
        var rd = px > 0.95; sec.classList.toggle("ready", rd); $(".ex-ready", sec).classList.toggle("show", rd);
        return;
      }
      var p = progress($(".opens-track", sec));
      var open = Math.min(1, p / 0.14); // the lid opens over the first 14% of the scroll
      $(".core", sec).style.setProperty("--open", open.toFixed(3));
      var bs = $$(".bubble", sec), n = bs.length, q = (p - 0.14) / 0.84, cur = open < 1 ? -1 : Math.min(n - 1, Math.floor(q * n));
      bs.forEach(function (b, k) { b.classList.toggle("on", k === cur); b.classList.toggle("gone", k < cur); });
      $$(".opens-progress i", sec).forEach(function (d, k) { d.classList.toggle("on", k <= cur); });
      $$(".orbit i", sec).forEach(function (d, k) { d.classList.toggle("on", k <= cur); d.classList.toggle("now", k === cur); });
      if (sec._cur !== cur) { sec._cur = cur; var ow2 = $(".core .orb-wrap", sec); ow2.classList.add("talking"); clearTimeout(sec._t); sec._t = setTimeout(function () { ow2.classList.remove("talking"); }, 1400); }
    });
  }
  var ticking = false;
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Try Maria (8 Nov: 1 min 30 s per visitor per day, countdown, red at the end, cut at 0) ---------- */
  var mic = $("#mic");
  if (mic) {
    var sel = ["#t-biz", "#t-name", "#t-voice"].map(function (s) { return $(s); });
    var hint = $("#michint"), last = $("#lastline"), orb = $("#orb"), orbW = $("#orb .orb-wrap"), micW = $("#micwrap"), chat = $("#chatwin"), msgs = $("#msgs"), timerEl = $("#trytimer");
    var live = false, timers = [], inView = true, left = 90, tick = null, sock = null, audio = null, stream = null, playAt = 0;
    var DAILY = 90, RED_AT = 15;
    var visitor = store.get("ag-visitor") || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    store.set("ag-visitor", visitor);
    var dayKey = "ag-try-" + new Date().toISOString().slice(0, 10);
    function localLeft() { return Math.max(0, DAILY - (+store.get(dayKey) || 0)); }
    function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function showTimer(s) { timerEl.textContent = fmt(s); timerEl.classList.toggle("red", live && s <= RED_AT); timerEl.setAttribute("aria-label", T.try_timer + " " + fmt(s)); }
    function ready() { return sel.every(function (s) { return s.value; }); }
    function usedUp() { return left < 3; }
    function refresh() {
      if (live) return;
      mic.disabled = !ready() || usedUp();
      hint.textContent = usedUp() ? T.try_used_up : (ready() ? T.try_hint_ready : T.try_hint_off);
      showTimer(left);
    }
    sel.forEach(function (s) { s.addEventListener("change", refresh); });
    function say(who, text) {
      var m = document.createElement("div"); m.className = "msg " + (who === "maria" ? "them" : "me"); m.textContent = text; msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight;
      if (who === "me") { micW.classList.add("hearing"); timers.push(setTimeout(function () { micW.classList.remove("hearing"); }, 1300)); }
      if (who === "maria") { last.textContent = text; orbW.classList.add("talking"); timers.push(setTimeout(function () { orbW.classList.remove("talking"); }, 1800)); }
    }
    var MIC_SVG = mic.innerHTML;
    var END_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-3.3-2.6M5.6 12.4A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8M22 2 2 22"/></svg>';
    var startedAt = 0, heardText = false;
    function end(why) {
      if (!live) return;
      live = false; timers.forEach(clearTimeout); timers = []; clearInterval(tick); orbW.classList.remove("talking"); micW.classList.remove("hearing");
      var used = (Date.now() - startedAt) / 1000;
      store.set(dayKey, String(Math.min(DAILY, (+store.get(dayKey) || 0) + used)));
      left = Math.max(0, left - used);
      try { if (sock && sock.readyState < 2) { sock.send("end"); sock.close(); } } catch (e) { /* ignore */ }
      try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); if (audio) audio.close(); } catch (e) { /* ignore */ }
      sock = null; stream = null; audio = null;
      mic.classList.remove("live"); mic.setAttribute("aria-label", T.try_start); mic.innerHTML = MIC_SVG; chat.classList.remove("show");
      refresh();
      if (why === "limit" || usedUp()) { last.textContent = ""; hint.textContent = T.try_used_up; }
    }
    function startClock() {
      startedAt = Date.now(); var startLeft = left;
      showTimer(left);
      tick = setInterval(function () {
        var now = startLeft - (Date.now() - startedAt) / 1000;
        showTimer(now);
        if (now <= 0) end("limit");
      }, 250);
    }
    function goLive() {
      live = true; msgs.innerHTML = ""; last.textContent = "";
      mic.classList.add("live"); mic.setAttribute("aria-label", T.try_end); mic.innerHTML = END_SVG; hint.textContent = T.try_hint_live;
    }
    function demoScript() { // made-up conversation, only with ?demo, to see how the box behaves (no sound, nothing sent)
      var name = sel[1].value, biz = sel[0].options[sel[0].selectedIndex].text;
      if (LANG === "el") return [["maria", "Καλησπέρα, " + biz + ", είμαι η " + name + ". Πώς μπορώ να βοηθήσω;"], ["me", "Θα ήθελα ένα ραντεβού αύριο το πρωί."],
        ["maria", "Αύριο έχω 10:00 ή 11:30. Ποια σας βολεύει;"], ["me", "Στις 10:00."], ["maria", "Πώς σας λένε, παρακαλώ;"], ["me", "Ελένη Γεωργίου."],
        ["maria", "Λοιπόν, Ελένη Γεωργίου, αύριο στις 10:00. Σωστά;"], ["me", "Ναι."], ["maria", "Έγινε. Τα λέμε αύριο!"]];
      return [["maria", "Hello, " + biz + ", this is " + name + ". How can I help?"], ["me", "I'd like an appointment tomorrow morning."],
        ["maria", "Tomorrow I have 10:00 or 11:30. Which suits you?"], ["me", "10:00, please."], ["maria", "May I have your name?"], ["me", "Eleni Georgiou."],
        ["maria", "So that's Eleni Georgiou, tomorrow at 10:00. Is that right?"], ["me", "Yes."], ["maria", "Done. See you tomorrow!"]];
    }
    // the invisible human check (Cloudflare Turnstile) -- loaded only when a call starts; a puzzle shows only if it suspects a bot
    function humanToken() {
      if (!SET.turnstileSiteKey) return Promise.resolve("");
      return new Promise(function (resolve, reject) {
        function run() {
          var box = $("#ts-box") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "ts-box" }));
          window.turnstile.render(box, { sitekey: SET.turnstileSiteKey, appearance: "interaction-only", callback: resolve, "error-callback": function () { reject("human"); } });
        }
        if (window.turnstile) return run();
        var s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"; s.async = true; s.onload = run; s.onerror = function () { reject("human"); };
        document.head.appendChild(s);
      });
    }
    function startLive() {
      goLive(); hint.textContent = T.try_connecting;
      var token;
      humanToken().then(function (t) { token = t; return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); })
        .then(function (st) {
          stream = st; audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.resume) audio.resume(); playAt = 0;
          sock = new WebSocket(SET.tryMariaUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/call"); sock.binaryType = "arraybuffer";
          sock.onopen = function () { sock.send(JSON.stringify({ business: sel[0].value, name: sel[1].value, voice: sel[2].value, visitor: visitor, turnstile: token, lang: LANG })); };
          sock.onmessage = function (ev) {
            if (typeof ev.data === "string") {
              var j = {}; try { j = JSON.parse(ev.data); } catch (e) { /* ignore */ }
              if (j.maria) { heardText = true; say("maria", j.maria); return; }
              if (j.ok) { left = Math.min(left, j.seconds_left); hint.textContent = T.try_hint_live; startClock(); pipeMic(); }
              else if (j.ended === "limit" || j.error === "limit") { left = 0; end("limit"); }
              else if (j.error) { end(); hint.textContent = j.error === "busy" ? T.try_busy : T.try_soon; }
              return;
            }
            play(ev.data);
          };
          sock.onclose = function () { if (live) end(); };
        })
        .catch(function (e) { end(); hint.textContent = e === "human" ? T.try_soon : T.try_mic_denied; });
    }
    function pipeMic() { // the microphone -> 8 kHz 16-bit mono, 20 ms chunks, as the phone line sends
      var src = audio.createMediaStreamSource(stream), proc = audio.createScriptProcessor(2048, 1, 1), ratio = audio.sampleRate / 8000, carry = [];
      proc.onaudioprocess = function (e) {
        if (!sock || sock.readyState !== 1) return;
        var x = e.inputBuffer.getChannelData(0), en = 0;
        for (var q = 0; q < x.length; q += 8) en += x[q] * x[q];
        if (Math.sqrt(en / (x.length / 8)) > 0.03) { micW.classList.add("hearing"); clearTimeout(pipeMic.t); pipeMic.t = setTimeout(function () { micW.classList.remove("hearing"); }, 350); }
        for (var i = 0; i < x.length / ratio; i++) carry.push(Math.max(-1, Math.min(1, x[Math.floor(i * ratio)])));
        while (carry.length >= 160) {
          var c = carry.splice(0, 160), out = new Int16Array(160);
          for (var k = 0; k < 160; k++) out[k] = c[k] * 32767;
          sock.send(out.buffer);
        }
      };
      src.connect(proc); proc.connect(audio.destination);
    }
    function play(buf) { // her voice: 8 kHz 16-bit mono from demo Maria
      if (!audio) return;
      var pcm = new Int16Array(buf), b = audio.createBuffer(1, pcm.length, 8000), ch = b.getChannelData(0);
      for (var i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
      var s = audio.createBufferSource(); s.buffer = b; s.connect(audio.destination);
      playAt = Math.max(playAt, audio.currentTime + 0.05); s.start(playAt); playAt += b.duration;
      orbW.classList.add("talking"); if (!heardText) last.textContent = T.try_speaking;
      clearTimeout(play.t); play.t = setTimeout(function () { orbW.classList.remove("talking"); }, (playAt - audio.currentTime) * 1000 + 200);
    }
    mic.addEventListener("click", function () {
      if (live) { end(); return; }
      if (!ready() || usedUp()) return;
      if (!SET.tryMariaUrl && !DEMO) { $("#trysoon").hidden = false; hint.textContent = ""; $("#trysoon").scrollIntoView({ block: "nearest", behavior: still() ? "auto" : "smooth" }); return; }
      if (SET.tryMariaUrl && !DEMO) { startLive(); return; }
      goLive(); startClock();
      var s = demoScript(), at = 600;
      s.forEach(function (line) { timers.push(setTimeout(function () { if (live) say(line[0], line[1]); }, at)); at += line[0] === "maria" ? 2400 : 1500; });
      timers.push(setTimeout(function () { if (live) end(); }, at + 1500));
    });
    $("#chat-end").addEventListener("click", function () { end(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; chat.classList.toggle("show", live && !inView); }, { threshold: 0.15 }).observe($("#try"));
      setInterval(function () { chat.classList.toggle("show", live && !inView); }, 500);
    }
    left = localLeft();
    if (SET.tryMariaUrl && !DEMO) fetch(SET.tryMariaUrl.replace(/\/$/, "") + "/left?visitor=" + encodeURIComponent(visitor)).then(function (r) { return r.json(); })
      .then(function (j) { left = Math.min(left, j.seconds_left); refresh(); }).catch(function () { /* the service is off: the page still works */ });
    refresh();
  }

  /* ---------- Book a demo (own calendar, Cal.com look) ---------- */
  var grid = $("#cal-grid");
  if (grid) {
    var TZ = "Asia/Nicosia", now = new Date(), view = new Date(now.getFullYear(), now.getMonth(), 1), slots = {}, chosenDay = null, chosen = null, loaded = {};
    var fmtDay = new Intl.DateTimeFormat(LANG === "el" ? "el-GR" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
    var fmtTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
    var keyOf = function (d) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); };
    var slotsBox = $("#bk-slots"), form = $("#bk-form"), cal = $("#bk-cal"), info = $(".bk-info"), done = $("#bk-done");
    function demoSlots(from, to) { // weekdays 10:00-18:00 Cyprus, 30 min, some taken -- ONLY with ?demo
      var out = [], d = new Date(from + "T00:00:00Z"), end = new Date(to + "T00:00:00Z"), seed = 7;
      for (; d <= end; d = new Date(d.getTime() + 864e5)) {
        var wd = d.getUTCDay(); if (wd === 0 || wd === 6) continue;
        for (var h = 10; h < 18; h += 0.5) {
          seed = (seed * 9301 + 49297) % 233280; if (seed / 233280 < 0.35) continue;
          var iso = d.toISOString().slice(0, 10) + "T" + String(Math.floor(h)).padStart(2, "0") + ":" + (h % 1 ? "30" : "00") + ":00+02:00";
          if (new Date(iso) > new Date(Date.now() + 2 * 36e5)) out.push(iso);
        }
      }
      return out;
    }
    function load(month) {
      var y = month.getFullYear(), m = month.getMonth(), k = y + "-" + m;
      if (loaded[k]) return Promise.resolve();
      var from = y + "-" + String(m + 1).padStart(2, "0") + "-01", last = new Date(y, m + 1, 0).getDate(), to = y + "-" + String(m + 1).padStart(2, "0") + "-" + last;
      var put = function (list) { list.forEach(function (iso) { var dk = keyOf(new Date(iso)); (slots[dk] = slots[dk] || []).push(iso); }); loaded[k] = true; };
      if (DEMO) { put(demoSlots(from, to)); return Promise.resolve(); }
      if (!SET.bookingApi) return Promise.reject("closed");
      slotsBox.innerHTML = "<h3>" + T.bk_loading + "</h3>";
      return fetch(SET.bookingApi.replace(/\/$/, "") + "/slots?from=" + from + "&to=" + to, { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) { put(j.slots || []); });
    }
    function draw() {
      $("#cal-title").innerHTML = T.months[view.getMonth()] + " <span>" + view.getFullYear() + "</span>";
      $("#cal-prev").disabled = view <= new Date(now.getFullYear(), now.getMonth(), 1);
      $("#cal-next").disabled = view >= new Date(now.getFullYear(), now.getMonth() + 2, 1);
      var h = T.dow.map(function (d) { return '<div class="dow" aria-hidden="true">' + d + "</div>"; }).join("");
      var first = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7, days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < first; i++) h += "<div></div>";
      var todayKey = keyOf(now);
      for (var d = 1; d <= days; d++) {
        var dk = view.getFullYear() + "-" + String(view.getMonth() + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        var has = slots[dk] && slots[dk].length;
        h += '<button type="button" class="day' + (has ? " has" : "") + (dk === chosenDay ? " sel" : "") + (dk === todayKey ? " today" : "") + '" data-day="' + dk + '"' + (has ? "" : " disabled") + ' aria-label="' + d + " " + T.months[view.getMonth()] + '">' + d + "</button>";
      }
      grid.innerHTML = h;
      $$(".day.has", grid).forEach(function (b) { b.addEventListener("click", function () { pickDay(b.getAttribute("data-day")); }); });
    }
    function pickDay(dk) {
      chosenDay = dk; draw();
      var list = (slots[dk] || []).slice().sort();
      var title = fmtDay.format(new Date(dk + "T12:00:00Z"));
      slotsBox.innerHTML = "<h3>" + title + "</h3>" + (list.length ? list.map(function (iso) { return '<button type="button" class="slot" data-iso="' + iso + '">' + fmtTime.format(new Date(iso)) + "</button>"; }).join("") : '<p class="bk-empty">' + T.bk_none + "</p>");
      $$(".slot", slotsBox).forEach(function (b) { b.addEventListener("click", function () { pickSlot(b.getAttribute("data-iso")); }); });
      if (innerWidth < 900) slotsBox.scrollIntoView({ block: "start", behavior: still() ? "auto" : "smooth" });
    }
    function whenText(iso) { var d = new Date(iso); return fmtDay.format(d) + ", " + fmtTime.format(d); }
    function pickSlot(iso) {
      chosen = iso; cal.hidden = true; slotsBox.hidden = true; form.hidden = false; $("#bk-when").textContent = whenText(iso); $("#bk-err").textContent = ""; $("#f-name").focus();
    }
    $("#bk-back").addEventListener("click", function () { form.hidden = true; cal.hidden = false; slotsBox.hidden = false; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = { name: $("#f-name").value.trim(), business: $("#f-biz").value.trim(), type: $("#f-type").value, phone: $("#f-phone").value.trim(), email: $("#f-email").value.trim(), start: chosen, lang: LANG };
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email), okPhone = (v.phone.replace(/\D/g, "").length >= 8);
      if (!v.name || !v.business || !v.type || !okEmail || !okPhone) { $("#bk-err").textContent = T.bk_err_fields; return; }
      var btn = $("#bk-submit"); btn.disabled = true; btn.textContent = T.bk_sending;
      var send = DEMO ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 700); })
        : fetch(SET.bookingApi.replace(/\/$/, "") + "/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) })
          .then(function (r) { if (r.status === 409) throw "taken"; if (!r.ok) throw "send"; return r.json(); });
      send.then(function () {
        form.hidden = true; info.hidden = true; done.hidden = false; $("#bk-done-when").textContent = whenText(chosen); $("#bk-done h2").focus && done.querySelector("h2").setAttribute("tabindex", "-1"); done.querySelector("h2").focus();
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = T.bk_confirm;
        if (err === "taken") { $("#bk-err").textContent = T.bk_err_taken; var dk = keyOf(new Date(chosen)); slots[dk] = (slots[dk] || []).filter(function (x) { return x !== chosen; }); }
        else $("#bk-err").textContent = T.bk_err_send;
      });
    });
    function show() {
      load(view).then(function () {
        draw();
        if (!chosenDay) slotsBox.innerHTML = "<h3>" + T.bk_pick_day + "</h3>";
      }).catch(function (e) { draw(); slotsBox.innerHTML = '<p class="bk-empty">' + (e === "closed" ? T.bk_closed : T.bk_err_load) + "</p>"; });
    }
    $("#cal-prev").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); show(); });
    $("#cal-next").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); show(); });
    show();
  }

  /* ---------- legal pages: mark the section in view ---------- */
  var legalNav = $$(".legal nav a[href^='#']");
  if (legalNav.length && "IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) legalNav.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "0px 0px -70% 0px" });
    $$(".legal article h2[id]").forEach(function (h) { lio.observe(h); });
  }
})();
