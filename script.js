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
  if (!card) return;

  const THRESHOLD = 80;

  let startX = 0, startY = 0, dx = 0;
  let dragging = false, decidedDir = null;

  function setCardTransform(x) {
    const rot = x * 0.07;
    card.style.transform = `translateX(${x}px) rotate(${rot}deg)`;
  }

  function setButtonPress(x) {
    const overThreshold = Math.abs(x) >= THRESHOLD;
    btnReject.classList.toggle("is-pressed", x < 0 && overThreshold);
    btnInvite.classList.toggle("is-pressed", x > 0 && overThreshold);
  }

  function flyOut(dir) {
    card.style.transition = "transform 340ms ease";
    card.style.transform = `translateX(${dir * 700}px) rotate(${dir * 22}deg)`;
    btnReject.classList.remove("is-pressed");
    btnInvite.classList.remove("is-pressed");
    setTimeout(snapBack, 500);
  }

  function snapBack() {
    card.style.transition = "transform 380ms cubic-bezier(0.34,1.56,0.64,1)";
    card.style.transform = "";
  }

  function onStart(x, y) {
    startX = x; startY = y; dx = 0;
    dragging = true; decidedDir = null;
    card.style.transition = "none";
    card.classList.add("is-dragging");
  }

  function onMove(x, y) {
    if (!dragging) return;
    const rawDx = x - startX;
    const rawDy = y - startY;

    if (decidedDir === null) {
      if (Math.abs(rawDx) < 6 && Math.abs(rawDy) < 6) return;
      decidedDir = Math.abs(rawDx) >= Math.abs(rawDy) ? "h" : "v";
    }
    if (decidedDir !== "h") return;

    dx = rawDx;
    setCardTransform(dx);
    setButtonPress(dx);
    return true;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
    btnReject.classList.remove("is-pressed");
    btnInvite.classList.remove("is-pressed");

    if (decidedDir === "h" && Math.abs(dx) >= THRESHOLD) {
      flyOut(dx < 0 ? -1 : 1);
    } else {
      snapBack();
    }
    dx = 0; decidedDir = null;
  }

  // Touch
  card.addEventListener("touchstart", (e) => {
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  card.addEventListener("touchmove", (e) => {
    const prevented = onMove(e.touches[0].clientX, e.touches[0].clientY);
    if (prevented && e.cancelable) e.preventDefault();
  }, { passive: false });

  card.addEventListener("touchend", onEnd);
  card.addEventListener("touchcancel", onEnd);

  // Mouse
  card.addEventListener("mousedown", (e) => {
    onStart(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", (e) => {
    if (dragging) onMove(e.clientX, e.clientY);
  });
  document.addEventListener("mouseup", () => {
    if (dragging) onEnd();
  });

  // Buttons
  btnReject.addEventListener("click", () => flyOut(-1));
  btnInvite.addEventListener("click", () => flyOut(1));
})();

// Language toggle
const langToggle = document.getElementById("lang-toggle");
let currentLang = "ru";

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
