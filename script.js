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

document.querySelectorAll(".mappy-visual, .staff-visual").forEach((caseVisual) => {
  const enableAnimation = () => caseVisual.classList.add("is-hover");
  const disableAnimation = () => caseVisual.classList.remove("is-hover");

  caseVisual.addEventListener("pointerenter", enableAnimation);
  caseVisual.addEventListener("pointerleave", disableAnimation);
  caseVisual.addEventListener("focus", enableAnimation);
  caseVisual.addEventListener("blur", disableAnimation);
});

let activeStaffRow = null;
let handledStaffRowByPointer = false;

document.addEventListener(
  "pointerdown",
  (event) => {
    const row = event.target.closest(".staff-row-overlay");

    if (!row) {
      return;
    }

    event.preventDefault();
    activeStaffRow = row;
    row.classList.add("is-pressed");
  },
  true
);

document.addEventListener(
  "pointerup",
  (event) => {
    const row = event.target.closest(".staff-row-overlay");

    if (!activeStaffRow) {
      return;
    }

    event.preventDefault();
    activeStaffRow.classList.remove("is-pressed");

    if (row === activeStaffRow) {
      activeStaffRow.classList.toggle("is-selected");
      handledStaffRowByPointer = true;
    }

    activeStaffRow = null;
  },
  true
);

document.addEventListener(
  "pointercancel",
  () => {
    if (!activeStaffRow) {
      return;
    }

    activeStaffRow.classList.remove("is-pressed");
    activeStaffRow = null;
  },
  true
);

document.addEventListener(
  "click",
  (event) => {
    const row = event.target.closest(".staff-row-overlay");

    if (!row) {
      return;
    }

    event.preventDefault();

    if (handledStaffRowByPointer) {
      handledStaffRowByPointer = false;
      return;
    }

    row.classList.toggle("is-selected");
  },
  true
);

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

  function showFeedback() {
    swipeDefault.classList.add("is-hidden");
    swipeFeedback.setAttribute("aria-hidden", "false");
    swipeFeedback.classList.add("is-visible");
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
      setTimeout(snapBack, 640);
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

  function onStart(x, y) {
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

  btnReject.addEventListener("click", () => flyOut(-1));
  btnInvite.addEventListener("click", () => flyOut(1));

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

// Language toggle
const langToggle = document.getElementById("lang-toggle");
let currentLang = "ru";

// Fix intro width once at load so centering never shifts on language change
const introEl = document.querySelector(".intro");
if (introEl) introEl.style.minWidth = introEl.offsetWidth + "px";

if (langToggle) {
  langToggle.addEventListener("click", () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    langToggle.classList.toggle("is-eng", currentLang === "en");

    const els = document.querySelectorAll("[data-ru]");

    els.forEach((el) => el.classList.add("lang-blur"));

    setTimeout(() => {
      els.forEach((el) => {
        const content = currentLang === "en" ? el.dataset.en : el.dataset.ru;
        if (el.dataset.html) {
          el.innerHTML = content;
        } else {
          el.textContent = content;
        }
        el.classList.remove("lang-blur");
      });
    }, 220);
  });
}
