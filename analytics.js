(() => {
  const endpoint = "https://portfolio-feedback.denis-ermakov.workers.dev/event";
  const sourceLabels = {
    af: "Альфа-Банк",
    av: "Авито",
    bln: "Билайн",
    hh: "HH",
    hirehi: "HireHi",
    habr_career: "Хабр Карьера",
    direct_contact: "Прямой контакт",
    kas: "Kaspersky",
    lam: "Lamoda",
    linkedin: "LinkedIn",
    mgf: "МегаФон",
    mts: "МТС",
    oz: "Ozon",
    playerok: "Playerok",
    resume_pdf: "Резюме (PDF)",
    sbr: "Сбер",
    smk: "Самокат",
    tb: "Т-Банк",
    getmatch: "Getmatch",
    vk: "VK",
    vtb: "ВТБ",
    wb: "Wildberries",
    x5: "X5 Group",
    ya: "Яндекс",
    owner: "Мои проверки",
  };
  const caseNames = {
    "/gptest.html": "ГПтест",
    "/coalition.html": "Коалиция",
    "/mappy.html": "Mappy",
    "/admin.html": "Staff Admin Panel",
  };
  const sourceStorageKey = "portfolio-visit-source";
  const ownerModeKey = "portfolio-owner-mode";
  const disabledModeKey = "portfolio-analytics-disabled";
  const parameters = new URLSearchParams(window.location.search);

  const analyticsMode = parameters.get("analytics");
  if (analyticsMode === "owner") {
    localStorage.setItem(ownerModeKey, "1");
  }

  if (analyticsMode === "off") {
    sessionStorage.setItem(disabledModeKey, "1");
  }

  if (analyticsMode === "public") {
    localStorage.removeItem(ownerModeKey);
    sessionStorage.removeItem(disabledModeKey);
  }

  if (analyticsMode === "owner" || analyticsMode === "off" || analyticsMode === "public") {
    parameters.delete("analytics");
    const cleanUrl = `${window.location.pathname}${parameters.size ? `?${parameters}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
  }

  const isOwner = localStorage.getItem(ownerModeKey) === "1";
  const trackingDisabled = sessionStorage.getItem(disabledModeKey) === "1";

  function getSource() {
    if (isOwner) return "owner";

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
  if (source !== "unknown" && source !== "owner") {
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
    if (trackingDisabled) return;

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
