(() => {
  const endpoint = "https://portfolio-feedback.denis-ermakov.workers.dev/event";
  const sourceLabels = {
    hh: "HH",
    hirehi: "HireHi",
    habr_career: "Хабр Карьера",
    direct_contact: "Прямой контакт",
  };
  const caseNames = {
    "/gptest.html": "ГПтест",
    "/coalition.html": "Коалиция",
    "/mappy.html": "Mappy",
    "/admin.html": "Staff Admin Panel",
  };
  const sourceStorageKey = "portfolio-visit-source";

  function getSource() {
    const source = new URLSearchParams(window.location.search).get("utm_source");
    if (sourceLabels[source]) {
      sessionStorage.setItem(sourceStorageKey, source);
      return source;
    }

    return sessionStorage.getItem(sourceStorageKey) || "unknown";
  }

  const source = getSource();

  // Keep the source visible across every internal portfolio page. This lets a
  // visitor share the current URL after returning from a case study without
  // losing the original source. External links and downloads stay untouched.
  if (source !== "unknown") {
    const portfolioRoot = new URL("./", window.location.href).pathname;
    const portfolioPages = new Set([
      portfolioRoot,
      `${portfolioRoot}index.html`,
      ...Object.keys(caseNames).map((path) => `${portfolioRoot}${path.slice(1)}`),
    ]);

    document.querySelectorAll("a[href]").forEach((link) => {
      const target = new URL(link.href, window.location.href);
      const isInternalPortfolioPage = target.origin === window.location.origin
        && portfolioPages.has(target.pathname);
      if (!isInternalPortfolioPage) return;

      target.searchParams.set("utm_source", source);
      link.href = target.toString();
    });
  }

  function track(eventType, options = {}) {
    const caseName = options.caseName || null;
    const eventKey = `portfolio-event:${eventType}:${caseName || ""}`;
    if (sessionStorage.getItem(eventKey)) return;

    sessionStorage.setItem(eventKey, "1");
    const payload = JSON.stringify({
      eventType,
      source,
      caseName,
      pagePath: window.location.pathname,
    });

    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }

  window.portfolioAnalytics = { track };

  track("portfolio_visit");

  const caseName = Object.entries(caseNames).find(([path]) =>
    window.location.pathname.endsWith(path)
  )?.[1];
  if (caseName) track("case_open", { caseName });

  document.querySelectorAll('[download][href*="denis-ermakov"]').forEach((link) => {
    link.addEventListener("click", () => track("resume_download"));
  });

  document.querySelectorAll('a[href*="t.me/mrakov182"]').forEach((link) => {
    link.addEventListener("click", () => track("telegram_click"));
  });
})();
