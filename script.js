const siteHeader = document.getElementById("site-header");
if (siteHeader) {
  window.addEventListener("scroll", () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });
}

const revealElements = document.querySelectorAll(".reveal");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -32px 0px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

document.querySelectorAll(".mappy-visual").forEach((caseVisual) => {
  const enableAnimation = () => caseVisual.classList.add("is-hover");
  const disableAnimation = () => caseVisual.classList.remove("is-hover");

  caseVisual.addEventListener("pointerenter", enableAnimation);
  caseVisual.addEventListener("pointerleave", disableAnimation);
  caseVisual.addEventListener("focus", enableAnimation);
  caseVisual.addEventListener("blur", disableAnimation);
});

// Swipe widget
(function () {
  const card = document.getElementById("swipe-card");
  const btnReject = document.getElementById("btn-reject");
  const btnInvite = document.getElementById("btn-invite");
  const swipeEmojis = card.closest(".swipe-wrap").querySelector(".swipe-emojis");
  const emojiRejects = document.querySelectorAll(".swipe-emoji-reject");
  const emojiInvites = document.querySelectorAll(".swipe-emoji-invite");
  if (!card) return;

  const THRESHOLD = 225;
  let startX = 0, startY = 0, dx = 0;
  let dragging = false, decidedDir = null;

  function setCardTransform(x) {
    card.style.transform = `translateX(${x}px) rotate(${x * 0.07}deg)`;
    swipeEmojis.style.transform = `translateX(${x}px)`;
  }

  function updateEffects(x) {
    const showEmoji = Math.abs(x) >= 50;

    if (window.innerWidth >= 640) {
      const blurStart = 180;
      const blurP = Math.max(0, Math.min(1, (Math.abs(x) - blurStart) / (THRESHOLD - blurStart)));
      const blur = (blurP * 4).toFixed(1);
      const opacity = (1 - blurP * 0.3).toFixed(2);
      card.style.filter = blurP > 0 ? `blur(${blur}px)` : "";
      card.style.opacity = blurP > 0 ? opacity : "";
      swipeEmojis.style.filter = card.style.filter;
      swipeEmojis.style.opacity = card.style.opacity;
    }

    if (x < 0) {
      emojiRejects.forEach(e => e.classList.toggle("is-visible", showEmoji));
      emojiInvites.forEach(e => e.classList.remove("is-visible"));
    } else if (x > 0) {
      emojiInvites.forEach(e => e.classList.toggle("is-visible", showEmoji));
      emojiRejects.forEach(e => e.classList.remove("is-visible"));
    } else {
      clearEffects();
    }
  }

  function clearEffects() {
    card.style.filter = "";
    card.style.opacity = "";
    swipeEmojis.style.filter = "";
    swipeEmojis.style.opacity = "";
    emojiRejects.forEach(e => e.classList.remove("is-visible"));
    emojiInvites.forEach(e => e.classList.remove("is-visible"));
  }

  function setButtonPress(x) {
    const over = Math.abs(x) >= THRESHOLD;
    btnReject.classList.toggle("is-pressed", x < 0 && over);
    btnInvite.classList.toggle("is-pressed", x > 0 && over);
  }

  const swipeDefault = document.getElementById("swipe-default");
  const swipeFeedback = document.getElementById("swipe-feedback");
  const swipeFeedbackForm = document.getElementById("swipe-feedback-form");
  const swipeInvite = document.getElementById("swipe-invite");

  function showFeedback() {
    swipeDefault.classList.add("is-hidden");
    swipeFeedback.setAttribute("aria-hidden", "false");
    swipeFeedback.classList.add("is-visible");
  }

  function showInvite() {
    swipeDefault.classList.add("is-hidden");
    swipeInvite.setAttribute("aria-hidden", "false");
    swipeInvite.classList.add("is-visible");
  }

  function hideInvite() {
    swipeInvite.classList.remove("is-visible");
    swipeInvite.setAttribute("aria-hidden", "true");
    card.style.transition = "none";
    card.style.opacity = "";
    card.style.filter = "";
    card.style.transform = "";
    swipeEmojis.style.transition = "none";
    swipeEmojis.style.transform = "";
    setTimeout(() => {
      swipeDefault.classList.remove("is-hidden");
    }, 300);
  }

  function notifyTelegram(text) {
    fetch("https://portfolio-feedback.denis-ermakov.workers.dev/?text=" + encodeURIComponent(text)).catch(() => {});
  }

  const inviteDownloadBtn = document.getElementById("invite-download");
  if (inviteDownloadBtn) {
    inviteDownloadBtn.addEventListener("click", () => {
      window.portfolioAnalytics?.track("resume_download");
    });
  }

  const inviteShareBtn = document.getElementById("invite-share");
  if (inviteShareBtn) {
    inviteShareBtn.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          const resp = await fetch("assets/denis-ermakov.pdf");
          const blob = await resp.blob();
          const file = new File([blob], "CV — Денис Ермаков.pdf", { type: "application/pdf" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "CV — Денис Ермаков", files: [file] });
          } else {
            await navigator.share({
              title: "Денис Ермаков — Продуктовый дизайнер",
              text: "Посмотри портфолио Дениса Ермакова",
              url: window.location.href,
            });
          }
        } catch (e) {
          // user cancelled or error — do nothing
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        const orig = inviteShareBtn.innerHTML;
        inviteShareBtn.textContent = "Ссылка скопирована!";
        setTimeout(() => { inviteShareBtn.innerHTML = orig; }, 2000);
      }
    });
  }

  function hideFeedback() {
    swipeFeedback.classList.remove("is-visible");
    swipeFeedback.setAttribute("aria-hidden", "true");
    // Reset card instantly while it's off-screen / behind the feedback panel
    card.style.transition = "none";
    card.style.opacity = "";
    card.style.filter = "";
    card.style.transform = "";
    swipeEmojis.style.transition = "none";
    swipeEmojis.style.transform = "";
    setTimeout(() => {
      swipeDefault.classList.remove("is-hidden");
    }, 300);
  }

  if (swipeFeedbackForm) {
    swipeFeedbackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const company = document.getElementById("sf-company").value.trim() || "—";
      const role = document.getElementById("sf-role").value.trim() || "—";
      const feedback = document.getElementById("sf-feedback").value.trim() || "—";
      const text = `🔴 Отказ\n\n🏢 Компания: ${company}\n👤 Роль: ${role}\n💬 Что не понравилось: ${feedback}`;
      fetch("https://portfolio-feedback.denis-ermakov.workers.dev/?text=" + encodeURIComponent(text)).catch(() => {});
      swipeFeedbackForm.reset();
      hideFeedback();
    });
  }

  function flyOut(dir) {
    const mobile = window.innerWidth < 640;
    // longer flight (460ms) → card stays visible inside section ~130ms → blur clearly noticeable
    const blurDelay = mobile ? 9999 : 40;
    const fx = `opacity 420ms cubic-bezier(0.4,0,1,1) ${blurDelay}ms, filter 420ms cubic-bezier(0.4,0,1,1) ${blurDelay}ms`;

    card.style.transition = `transform 460ms ease, ${fx}`;
    card.style.transform = `translateX(${dir * 700}px) rotate(${dir * 22}deg)`;
    card.style.opacity = "0";
    card.style.filter = "blur(7px)";
    swipeEmojis.style.transition = `transform 460ms ease, ${fx}`;
    swipeEmojis.style.transform = `translateX(${dir * 700}px)`;
    swipeEmojis.style.opacity = "0";
    swipeEmojis.style.filter = "blur(7px)";
    btnReject.classList.remove("is-pressed");
    btnInvite.classList.remove("is-pressed");
    clearEffects();
    if (dir === -1) {
      setTimeout(showFeedback, 320);
    } else {
      setTimeout(showInvite, 320);
    }
  }

  function snapBack() {
    card.style.transition = "none";
    card.style.opacity = "";
    card.style.filter = "";
    swipeEmojis.style.transition = "none";
    swipeEmojis.style.opacity = "";
    swipeEmojis.style.filter = "";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const spring = "transform 380ms cubic-bezier(0.34,1.56,0.64,1)";
      card.style.transition = spring;
      card.style.transform = "";
      swipeEmojis.style.transition = spring;
      swipeEmojis.style.transform = "";
    }));
  }

  // Hint animation — plays once when section becomes visible, cancels on interaction
  let hintPlayed = false;
  let hintTimer = null;

  function playHint() {
    if (hintPlayed) return;
    hintPlayed = true;
    card.classList.add("hint");
    card.addEventListener("animationend", () => card.classList.remove("hint"), { once: true });
  }

  function cancelHint() {
    hintPlayed = true;
    clearTimeout(hintTimer);
    card.classList.remove("hint");
  }

  const swipeSection = card.closest(".swipe-section");
  if (swipeSection && "IntersectionObserver" in window) {
    const hintObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        hintTimer = setTimeout(playHint, 1200);
        hintObserver.disconnect();
      }
    }, { threshold: 0.5 });
    hintObserver.observe(swipeSection);
  }

  function onStart(x, y) {
    cancelHint();
    startX = x; startY = y; dx = 0;
    dragging = true; decidedDir = null;
    card.style.transition = "none";
    card.style.filter = "";
    card.style.opacity = "";
    swipeEmojis.style.transition = "none";
    swipeEmojis.style.filter = "";
    swipeEmojis.style.opacity = "";
    card.classList.add("is-dragging");
  }

  function onMove(x, y) {
    if (!dragging) return;
    const rawDx = x - startX, rawDy = y - startY;
    if (decidedDir === null) {
      if (Math.abs(rawDx) < 6 && Math.abs(rawDy) < 6) return;
      decidedDir = Math.abs(rawDx) >= Math.abs(rawDy) ? "h" : "v";
    }
    if (decidedDir !== "h") return;
    dx = rawDx;
    setCardTransform(dx);
    setButtonPress(dx);
    updateEffects(dx);
    return true;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
    btnReject.classList.remove("is-pressed");
    btnInvite.classList.remove("is-pressed");
    clearEffects();
    if (decidedDir === "h" && Math.abs(dx) >= THRESHOLD) {
      flyOut(dx < 0 ? -1 : 1);
    } else {
      snapBack();
    }
    dx = 0; decidedDir = null;
  }

  card.addEventListener("touchstart", (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  card.addEventListener("touchmove", (e) => { if (onMove(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
  card.addEventListener("touchend", onEnd);
  card.addEventListener("touchcancel", onEnd);

  card.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY));
  document.addEventListener("mousemove", (e) => { if (dragging) onMove(e.clientX, e.clientY); });
  document.addEventListener("mouseup", () => { if (dragging) onEnd(); });

  btnReject.addEventListener("click", () => { cancelHint(); flyOut(-1); });
  btnInvite.addEventListener("click", () => { cancelHint(); flyOut(1); });

  // Hover tilt
  card.addEventListener("mousemove", (e) => {
    if (dragging) return;
    const r = card.getBoundingClientRect();
    const tx = ((e.clientX - r.left) / r.width - 0.5) * 6;
    const ty = ((e.clientY - r.top) / r.height - 0.5) * 6;
    card.style.transition = "transform 80ms ease";
    card.style.transform = `translateX(${tx}px) translateY(${ty}px) scale(1.02)`;
  });

  card.addEventListener("mouseleave", () => {
    if (dragging) return;
    card.style.transition = "transform 420ms cubic-bezier(0.34,1.56,0.64,1)";
    card.style.transform = "";
  });
})();

// Theme toggle
(function () {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function isDarkActive() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      toggle.classList.add("is-dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      toggle.classList.remove("is-dark");
      localStorage.setItem("theme", "light");
    }
  }

  // Sync toggle state with what the inline script already applied
  if (isDarkActive()) toggle.classList.add("is-dark");

  toggle.addEventListener("click", () => applyTheme(!isDarkActive()));
})();

// Language toggle
const langToggle = document.getElementById("lang-toggle");
const langFromUrl = new URLSearchParams(window.location.search).get("lang");
let currentLang = ["ru", "en"].includes(langFromUrl)
  ? langFromUrl
  : localStorage.getItem("lang") || "ru";

if (["ru", "en"].includes(langFromUrl)) {
  localStorage.setItem("lang", langFromUrl);
}

// Fix intro width once at load so centering never shifts on language change
const introEl = document.querySelector(".intro");
if (introEl) introEl.style.minWidth = introEl.offsetWidth + "px";

function applyLang(lang, animate) {
  document.documentElement.lang = lang;
  langToggle?.classList.toggle("is-eng", lang === "en");
  const els = document.querySelectorAll("[data-ru]");
  const phEls = document.querySelectorAll("[data-ph-ru]");
  phEls.forEach((el) => {
    el.placeholder = lang === "en" ? el.dataset.phEn : el.dataset.phRu;
  });
  document.querySelectorAll("[data-src-ru]").forEach((el) => {
    el.src = lang === "en" ? el.dataset.srcEn : el.dataset.srcRu;
  });
  document.querySelectorAll("[data-href-ru]").forEach((el) => {
    el.href = lang === "en" ? el.dataset.hrefEn : el.dataset.hrefRu;
  });
  if (animate) {
    els.forEach((el) => el.classList.add("lang-blur"));
    setTimeout(() => {
      els.forEach((el) => {
        const content = lang === "en" ? el.dataset.en : el.dataset.ru;
        if (el.dataset.html) el.innerHTML = content;
        else el.textContent = content;
        el.classList.remove("lang-blur");
      });
    }, 220);
  } else {
    els.forEach((el) => {
      const content = lang === "en" ? el.dataset.en : el.dataset.ru;
      if (el.dataset.html) el.innerHTML = content;
      else el.textContent = content;
    });
  }
}

if (currentLang === "en") applyLang("en", false);

if (langToggle) {
  langToggle.addEventListener("click", () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    localStorage.setItem("lang", currentLang);
    applyLang(currentLang, true);
  });
}

// Desktop-only: hovering "от прототипа до продакшена" highlights the ГПтест
// and Mappy case cards below, since both were built with AI dev tools.
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const aiGlowCards = ["case-card-gptest", "case-card-mappy"];
  const toggleAiGlow = (on) => {
    aiGlowCards.forEach((id) => {
      const card = document.getElementById(id);
      if (card) card.classList.toggle("ai-glow", on);
    });
  };
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(".ai-highlight")) toggleAiGlow(true);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(".ai-highlight")) toggleAiGlow(false);
  });
}
