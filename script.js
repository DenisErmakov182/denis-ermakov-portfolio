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
