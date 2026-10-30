/* Виниловая пластинка в интро: несколько дорожек, иглой управляет кнопка.
   Записи 1922–1924 годов из National Jukebox (Library of Congress), общественное достояние в США. */
(function () {
  const BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "";
  const widget = document.getElementById("vinyl-widget");
  const row = document.getElementById("vinyl-now");
  const text = document.getElementById("vinyl-now-text");
  const prevBtn = document.getElementById("vinyl-prev");
  const nextBtn = document.getElementById("vinyl-next");
  if (!widget || !row || !text || !prevBtn || !nextBtn) return;

  const tracks = [
    { file: "assets/vinyl/bessie-oh-daddy-blues.mp3", artist: "Bessie Smith", title: "Oh Daddy Blues", year: 1923 },
    { file: "assets/vinyl/edith-wilson-pensacola-blues.mp3", artist: "Edith Wilson", title: "Pensacola Blues", year: 1922 },
    { file: "assets/vinyl/virginians-memphis-blues.mp3", artist: "The Virginians", title: "Memphis Blues", year: 1922 },
    { file: "assets/vinyl/fletcher-henderson-muscle-shoals-blues.mp3", artist: "Fletcher Henderson", title: "Muscle Shoals Blues", year: 1924 },
    { file: "assets/vinyl/ted-lewis-bees-knees.mp3", artist: "Ted Lewis Jazz Band", title: "Bees' Knees", year: 1922 },
  ];

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.85;
  let index = 0;
  let loaded = false;

  const isEn = () => localStorage.getItem("lang") === "en";

  function render() {
    const tr = tracks[index];
    row.hidden = false;
    text.replaceChildren();
    const who = document.createElement("b");
    who.textContent = tr.artist;
    text.append(who, ` · ${tr.title}, ${tr.year}`);
    text.title = text.textContent;
    if ("mediaSession" in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: tr.title, artist: tr.artist, album: "National Jukebox" });
    }
  }

  function setPlaying(on) {
    widget.classList.toggle("is-playing", on);
    widget.setAttribute("aria-pressed", on ? "true" : "false");
    widget.setAttribute("aria-label", on ? (isEn() ? "Lift the needle" : "Снять иглу") : (isEn() ? "Play the record" : "Поставить пластинку"));
  }

  function load(i) {
    index = ((i % tracks.length) + tracks.length) % tracks.length;
    audio.src = BASE + tracks[index].file;
    loaded = true;
    render();
  }

  function play() {
    window.dispatchEvent(new CustomEvent("portfolio:audio", { detail: "vinyl" }));
    if (!loaded) load(index);
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function pause() {
    audio.pause();
    setPlaying(false);
  }

  widget.addEventListener("click", () => (audio.paused ? play() : pause()));
  nextBtn.addEventListener("click", () => { load(index + 1); play(); });
  prevBtn.addEventListener("click", () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else { load(index - 1); play(); }
  });
  audio.addEventListener("ended", () => { load(index + 1); play(); });
  audio.addEventListener("error", () => setPlaying(false));

  // включилось радио — снимаем иглу
  window.addEventListener("portfolio:audio", (ev) => {
    if (ev.detail !== "vinyl" && !audio.paused) { pause(); row.hidden = true; }
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => { if (audio.paused) play(); });
    navigator.mediaSession.setActionHandler("pause", () => { if (!audio.paused) pause(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => nextBtn.click());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevBtn.click());
  }
})();
