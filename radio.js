/* Радио в интро: станция из зоны посетителя, play/пауза, следующая станция, название трека.
   Зону и треки отдаёт Worker (/radio/stations, /radio/now). Пока Worker не развёрнут,
   станции берутся напрямую из открытого каталога Radio Browser по языку и часовому поясу браузера. */
(function () {
  const widget = document.getElementById("radio-widget");
  const nowRow = document.getElementById("radio-now");
  const nowText = document.getElementById("radio-now-text");
  const nextBtn = document.getElementById("radio-next");
  if (!widget || !nowRow || !nowText || !nextBtn) return;

  const WORKER = "https://portfolio-feedback.denis-ermakov.workers.dev";
  const CATALOG = "https://de1.api.radio-browser.info/json/stations/search";
  const SKIP_TAGS = /news|talk|politic|sport|religio|christian|islam|podcast/i;
  const TZ_COUNTRY = {
    "Europe/Moscow": "RU", "Europe/Kaliningrad": "RU", "Europe/Samara": "RU", "Asia/Yekaterinburg": "RU",
    "Asia/Omsk": "RU", "Asia/Novosibirsk": "RU", "Asia/Krasnoyarsk": "RU", "Asia/Irkutsk": "RU",
    "Asia/Yakutsk": "RU", "Asia/Vladivostok": "RU", "Europe/Kyiv": "UA", "Europe/Kiev": "UA",
    "Europe/Minsk": "BY", "Asia/Almaty": "KZ", "Europe/London": "GB", "Europe/Berlin": "DE",
    "Europe/Paris": "FR", "Europe/Madrid": "ES", "Europe/Rome": "IT", "America/New_York": "US",
    "America/Chicago": "US", "America/Los_Angeles": "US", "America/Toronto": "CA",
  };

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.85;

  let stations = null;
  let place = "";
  let index = 0;
  let wantPlay = false;
  let failures = 0;
  let trackTimer = 0;
  let tracksOk = true;
  let track = "";

  const lang = () => (localStorage.getItem("lang") === "en" ? "en" : "ru");
  const t = (ru, en) => (lang() === "en" ? en : ru);

  function setState(state) {
    widget.classList.toggle("is-playing", state === "playing");
    widget.classList.toggle("is-loading", state === "loading");
    widget.setAttribute("aria-pressed", state === "playing" || state === "loading" ? "true" : "false");
    widget.setAttribute("aria-label", state === "idle" ? t("Включить радио", "Play radio") : t("Выключить радио", "Stop radio"));
  }

  function renderNow() {
    const s = stations && stations[index];
    if (!s) return;
    nowRow.hidden = false;
    nowText.replaceChildren();
    const name = document.createElement("b");
    name.textContent = s.name;
    nowText.append(name);
    const extra = track || place || "";
    if (extra) nowText.append(" · " + extra);
    nowText.title = nowText.textContent;
    if ("mediaSession" in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track || s.name, artist: s.name, album: place });
    }
  }

  async function getJson(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function countryCode() {
    const fromTz = TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone];
    if (fromTz) return fromTz;
    const m = (navigator.language || "").match(/-([A-Za-z]{2})$/);
    return m ? m[1].toUpperCase() : "RU";
  }

  async function loadStations() {
    try {
      const data = await getJson(`${WORKER}/radio/stations`, 6000);
      if (data && data.stations && data.stations.length) {
        place = data.city || data.region || "";
        return data.stations;
      }
    } catch (e) {
      tracksOk = false; // Worker недоступен — только станция без названия трека
    }
    const params = new URLSearchParams({
      countrycode: countryCode(), hidebroken: "true", order: "clickcount", reverse: "true", limit: "80",
    });
    const list = await getJson(`${CATALOG}?${params}`, 8000);
    return list
      .filter((s) => s.lastcheckok === 1 && /^https:\/\//.test(s.url_resolved) && !SKIP_TAGS.test(s.tags || ""))
      .slice(0, 10)
      .map((s) => ({ id: s.stationuuid, name: s.name.trim(), url: s.url_resolved, place: s.state || "" }));
  }

  async function fetchTrack() {
    clearTimeout(trackTimer);
    if (!tracksOk || !wantPlay || !stations) return;
    const s = stations[index];
    try {
      const data = await getJson(`${WORKER}/radio/now?u=${encodeURIComponent(s.url)}`, 7000);
      if (stations[index] === s) {
        track = (data && data.title) || "";
        renderNow();
      }
    } catch (e) {
      tracksOk = false;
    }
    if (tracksOk && wantPlay) trackTimer = setTimeout(fetchTrack, 20000);
  }

  function startStation(i) {
    index = ((i % stations.length) + stations.length) % stations.length;
    track = "";
    clearTimeout(trackTimer);
    setState("loading");
    renderNow();
    audio.src = stations[index].url;
    audio.play().catch(() => onFail());
  }

  function onFail() {
    if (!wantPlay || !stations) return;
    failures += 1;
    if (failures >= stations.length) {
      wantPlay = false;
      failures = 0;
      setState("idle");
      nowRow.hidden = false;
      nowText.textContent = t("Не удалось включить станцию, попробуйте позже", "Couldn't start a station, try again later");
      return;
    }
    startStation(index + 1);
  }

  async function start() {
    window.dispatchEvent(new CustomEvent("portfolio:audio", { detail: "radio" }));
    wantPlay = true;
    failures = 0;
    setState("loading");
    if (!stations) {
      try {
        stations = await loadStations();
      } catch (e) {
        stations = null;
      }
      if (!stations || !stations.length) {
        wantPlay = false;
        setState("idle");
        nowRow.hidden = false;
        nowText.textContent = t("Станции для вашей зоны не нашлись", "No stations found for your area");
        return;
      }
    }
    if (!wantPlay) return; // нажали ещё раз, пока грузилось
    startStation(index);
  }

  function stop() {
    wantPlay = false;
    clearTimeout(trackTimer);
    audio.pause();
    audio.removeAttribute("src"); // у живого потока при возобновлении нужен свежий эфир, а не буфер
    audio.load();
    setState("idle");
  }

  audio.addEventListener("playing", () => {
    failures = 0;
    setState("playing");
    renderNow();
    fetchTrack();
  });
  audio.addEventListener("error", () => { if (wantPlay) onFail(); });
  audio.addEventListener("stalled", () => {
    // поток завис — даём 8 секунд и переключаемся
    const s = stations && stations[index];
    setTimeout(() => { if (wantPlay && s === stations[index] && audio.readyState < 3) onFail(); }, 8000);
  });

  widget.addEventListener("click", () => (wantPlay ? stop() : start()));
  // играет что-то другое (пластинка) — выключаем радио
  window.addEventListener("portfolio:audio", (ev) => { if (ev.detail !== "radio" && wantPlay) { stop(); nowRow.hidden = true; } });
  nextBtn.addEventListener("click", () => {
    if (!stations) return;
    wantPlay = true;
    failures = 0;
    startStation(index + 1);
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => { if (!wantPlay) start(); });
    navigator.mediaSession.setActionHandler("pause", () => { if (wantPlay) stop(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => nextBtn.click());
  }
})();
