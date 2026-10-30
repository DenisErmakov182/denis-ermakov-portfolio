const SCRIPT_BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "";
/* Виджеты интро: прокрутка цифры «3 года опыта» и вращающийся глобус «СПБ-МСК».
   Самодостаточный файл: подключается и на сайте, и в лаборатории (lab/). */
/* ── Виджеты в интро: прокрутка цифры и вращающийся глобус ── */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Счётчик «3 года опыта»: цифра прокручивается от 0 до конечной при показе и по наведению
  document.querySelectorAll(".intro-widget").forEach((widget) => {
    const strip = widget.querySelector(".iw-counter-strip");
    if (!strip || reduceMotion) return;
    const roll = () => {
      strip.classList.add("is-armed");
      void strip.offsetHeight;
      requestAnimationFrame(() => strip.classList.remove("is-armed"));
    };
    if ("IntersectionObserver" in window) {
      strip.classList.add("is-armed");
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setTimeout(roll, 350);
        }
      }, { threshold: 0.6 });
      io.observe(widget);
    }
    widget.addEventListener("mouseenter", roll);
  });

  // «4 проекта в проде»: табло с створками. Верх цифры откидывается вниз, под ним открывается следующая;
  // цифры быстро листаются 0 → 9, затем 0 → 4 с замедлением на финале
  document.querySelectorAll(".iw-flap").forEach((flap) => {
    const widget = flap.closest(".intro-widget");
    const target = flap.textContent.trim() || "4";
    if (reduceMotion || !flap.animate) return;

    flap.innerHTML = '<span class="iw-flap-top"><b></b></span><span class="iw-flap-bot"><b></b></span><span class="iw-flap-ftop"><b></b></span><span class="iw-flap-fbot"><b></b></span>';
    flap.classList.add("is-built");
    const top = flap.querySelector(".iw-flap-top b");
    const bot = flap.querySelector(".iw-flap-bot b");
    const ftop = flap.querySelector(".iw-flap-ftop");
    const fbot = flap.querySelector(".iw-flap-fbot");
    const put = (el, d) => { (el.tagName === "B" ? el : el.firstChild).textContent = d; };
    const show = (d) => [top, bot, ftop, fbot].forEach((el) => put(el, d));
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const n = parseInt(target, 10);
    const seq = [];
    for (let i = 0; i <= 9; i++) seq.push(i);
    for (let i = 0; i <= n; i++) seq.push(i);
    show(target);

    async function turn(from, to, dur) {
      put(top, to); put(bot, from); put(ftop, from); put(fbot, to);
      ftop.style.visibility = fbot.style.visibility = "visible";
      const a = ftop.animate(
        [{ transform: "rotateX(0)", filter: "brightness(1)" }, { transform: "rotateX(-90deg)", filter: "brightness(0.45)" }],
        { duration: dur, easing: "ease-in", fill: "forwards" });
      const b = fbot.animate(
        [{ transform: "rotateX(90deg)", filter: "brightness(0.6)" }, { transform: "rotateX(0)", filter: "brightness(1)" }],
        { duration: dur, delay: dur, easing: "cubic-bezier(0.3, 1.5, 0.5, 1)", fill: "both" });
      await wait(dur * 2);
      a.cancel(); b.cancel();
      ftop.style.visibility = fbot.style.visibility = "hidden";
      put(bot, to);
    }

    let run = 0;
    const play = async () => {
      const id = ++run;
      show(seq[0]);
      await wait(120);
      for (let i = 1; i < seq.length; i++) {
        if (id !== run) return;
        // последние четыре переворота замедляются
        const tail = seq.length - 1 - i;
        await turn(seq[i - 1], seq[i], tail < 4 ? 55 + (4 - tail) * 38 : 55);
      }
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setTimeout(play, 350);
        }
      }, { threshold: 0.6 });
      io.observe(widget);
    }
    widget.addEventListener("mouseenter", play);
  });

  // Глобус: орфографическая проекция суши из assets/globe/land-mask.png.
  // При наведении виджет увеличивает глобус и поворачивает его к региону Москва — Петербург.
  const canvas = document.getElementById("globe");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const geoWidget = canvas.closest(".intro-widget");
  const N = canvas.width;
  const R = N / 2 - 2;
  const RAD = Math.PI / 180;
  const TILT0 = 23 * RAD; // обычный наклон оси
  const TILT_ZOOM = 66 * RAD; // север ближе к зрителю: Россия оказывается в нижней, видимой части
  const SPEED = 12 * RAD; // рад/с, оборот за 30 с
  const START_LON = 20 * RAD;
  const SPB = { lat: 59.93 * RAD, lon: 30.32 * RAD };
  const MSK = { lat: 55.75 * RAD, lon: 37.62 * RAD };
  const ZOOM_LON = 34 * RAD;

  const OCEAN = [18, 84, 214];
  const LAND = [86, 196, 112];
  const LIGHT = (function () { const v = [-0.5, 0.55, 0.68]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

  // один раз: положение каждого пикселя на диске и освещение
  const n = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const nx = (x + 0.5 - N / 2) / R;
      const ny = -(y + 0.5 - N / 2) / R;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1.02) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d2));
      n.push({
        i: (y * N + x) * 4,
        nx, ny, nz,
        shade: 0.34 + 0.78 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]),
        rim: Math.pow(1 - nz, 2.6),
        a: Math.max(0, Math.min(1, (R + 0.6 - Math.sqrt(d2) * R) / 1.4)),
      });
    }
  }

  let mask = null;
  const MW = 1024;
  const MH = 512;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = MW;
    c.height = MH;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, MW, MH).data;
    mask = new Uint8Array(MW * MH);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4];
    draw(lon, TILT0, 0);
    start();
  };
  img.src = SCRIPT_BASE + "assets/globe/land-mask.png";

  function sample(u, v) {
    const fx = u * MW - 0.5;
    const fy = Math.max(0, Math.min(MH - 1.001, v * MH - 0.5));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const xa = ((x0 % MW) + MW) % MW;
    const xb = (xa + 1) % MW;
    const m00 = mask[y0 * MW + xa];
    const m10 = mask[y0 * MW + xb];
    const m01 = mask[(y0 + 1) * MW + xa];
    const m11 = mask[(y0 + 1) * MW + xb];
    return ((m00 * (1 - tx) + m10 * tx) * (1 - ty) + (m01 * (1 - tx) + m11 * tx) * ty) / 255;
  }

  const frame = ctx.createImageData(N, N);

  function project(p, centerLon, cosT, sinT) {
    const lp = p.lon - centerLon;
    const bx = Math.cos(p.lat) * Math.sin(lp);
    const by = Math.sin(p.lat);
    const bz = Math.cos(p.lat) * Math.cos(lp);
    return { x: N / 2 + bx * R, y: N / 2 - (by * cosT - bz * sinT) * R, z: by * sinT + bz * cosT };
  }

  function dot(x, y, a, glowR, dotR, rgb) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g.addColorStop(0, `rgba(${rgb}, ${0.85 * a})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 244, 235, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  // e — степень увеличения (0…1): 0 — общий вид с одной точкой, 1 — две точки МСК и СПБ
  function draw(centerLon, tilt, e) {
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const out = frame.data;
    out.fill(0);
    for (let k = 0; k < n.length; k++) {
      const p = n[k];
      const by = p.ny * cosT + p.nz * sinT;
      const bz = -p.ny * sinT + p.nz * cosT;
      let u = (Math.atan2(p.nx, bz) + centerLon + Math.PI) / (2 * Math.PI);
      u -= Math.floor(u);
      const f = sample(u, (Math.PI / 2 - Math.asin(Math.max(-1, Math.min(1, by)))) / Math.PI);
      const sh = p.shade;
      let r = OCEAN[0] + (LAND[0] - OCEAN[0]) * f;
      let g = OCEAN[1] + (LAND[1] - OCEAN[1]) * f;
      let b = OCEAN[2] + (LAND[2] - OCEAN[2]) * f;
      r = r * sh + 120 * p.rim;
      g = g * sh + 170 * p.rim;
      b = b * sh + 255 * p.rim;
      out[p.i] = Math.min(255, r);
      out[p.i + 1] = Math.min(255, g);
      out[p.i + 2] = Math.min(255, b);
      out[p.i + 3] = 255 * p.a;
    }
    ctx.putImageData(frame, 0, 0);

    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 380);
    const mid = { lat: (SPB.lat + MSK.lat) / 2, lon: (SPB.lon + MSK.lon) / 2 };
    const pm = project(mid, centerLon, cosT, sinT);
    if (pm.z > 0.08 && e < 1) {
      dot(pm.x, pm.y, Math.min(1, (pm.z - 0.08) * 3) * (1 - e), 11 + 4 * pulse, 3.2, "255, 90, 70");
    }
    if (e > 0) {
      for (const p of [SPB, MSK]) {
        const q = project(p, centerLon, cosT, sinT);
        if (q.z > 0.05) dot(q.x, q.y, Math.min(1, q.z * 4) * e, 6 + 2 * pulse, 2.7, "255, 100, 80");
      }
    }
  }

  // состояние: lon — долгота по центру, e — степень увеличения
  let lon = START_LON;
  let e = 0;
  let target = 0;
  let raf = 0;
  let visible = true;
  let last = 0;
  const ease = (t) => t * t * (3 - 2 * t);
  const shortest = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };

  function step(dt) {
    e += (target - e) * (1 - Math.exp(-dt * 6));
    if (Math.abs(target - e) < 0.002) e = target;
    lon -= SPEED * (1 - e) * dt;
    if (target) lon += shortest(lon, ZOOM_LON) * (1 - Math.exp(-dt * 5));
    draw(lon, TILT0 + (TILT_ZOOM - TILT0) * ease(e), ease(e));
  }

  function loop(ts) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    step(dt);
    if (!reduceMotion || e !== target) raf = requestAnimationFrame(loop);
  }
  function start() {
    if (raf || !mask) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  // наведение: на тач-экранах переключается касанием
  if (geoWidget) {
    const setZoom = (on) => {
      target = on ? 1 : 0;
      geoWidget.classList.toggle("is-zoom", on);
      start();
    };
    geoWidget.addEventListener("pointerenter", (ev) => { if (ev.pointerType !== "touch") setZoom(true); });
    geoWidget.addEventListener("pointerleave", (ev) => { if (ev.pointerType !== "touch") setZoom(false); });
    geoWidget.addEventListener("click", (ev) => { if (ev.pointerType === "touch" || ev.detail === 0) setZoom(!geoWidget.classList.contains("is-zoom")); });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((en) => en.isIntersecting);
      if (visible) start();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
})();
