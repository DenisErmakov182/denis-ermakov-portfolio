const allowedOrigins = new Set([
  "https://denisermakov182.github.io",
]);

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
  unknown: "Прямой / неизвестный",
};

const eventLabels = {
  portfolio_visit: "новый посетитель",
  case_open: "открыт кейс",
  resume_download: "скачано резюме",
  telegram_click: "клик на Telegram",
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://denisermakov182.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}

function moscowTime() {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

async function telegram(env, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Telegram ${method} failed: ${responseText.slice(0, 500)}`);
  }
  return responseText ? JSON.parse(responseText) : null;
}

async function saveEvent(env, event) {
  await env.ANALYTICS_DB.prepare(
    "INSERT INTO events (event_type, source, case_name, page_path) VALUES (?, ?, ?, ?)"
  ).bind(event.eventType, event.source, event.caseName, event.pagePath).run();
}

function formatEvent(event) {
  const lines = [
    `Портфолио: ${eventLabels[event.eventType]}`,
  ];

  if (event.eventType === "case_open" && event.caseName) {
    lines[0] = `Портфолио: открыт кейс «${event.caseName}»`;
  }

  lines.push(`Источник: ${sourceLabels[event.source]}`);
  lines.push(`Дата и время: ${moscowTime()}`);
  return lines.join("\n");
}

async function buildSummary(env, period) {
  // D1 stores CURRENT_TIMESTAMP in UTC. Shift to Moscow before truncating the
  // date, then shift back, so “today” starts at 00:00 Europe/Moscow.
  const since = period === "week"
    ? "datetime('now', '-7 days')"
    : "datetime('now', '+3 hours', 'start of day', '-3 hours')";
  const { results } = await env.ANALYTICS_DB.prepare(
    `SELECT event_type, source, case_name, COUNT(*) AS total FROM events WHERE created_at >= ${since} AND source <> 'owner' GROUP BY event_type, source, case_name ORDER BY total DESC`
  ).all();

  const title = period === "week" ? "📊 Портфолио — 7 дней" : "📊 Портфолио — сегодня";
  if (!results.length) return `${title}\n\nСобытий пока нет.`;

  const visits = results.filter((row) => row.event_type === "portfolio_visit");
  const cases = results.filter((row) => row.event_type === "case_open");
  const resumeDownloads = results.filter((row) => row.event_type === "resume_download");
  const telegramClicks = results.filter((row) => row.event_type === "telegram_click");
  const sum = (rows) => rows.reduce((total, row) => total + row.total, 0);
  const sources = visits.map((row) => `${sourceLabels[row.source]} — ${row.total}`).join(", ");
  const caseList = cases.map((row) => `${row.case_name} — ${row.total}`).join(", ");

  return [
    title,
    "",
    `Заходы: ${sum(visits)}`,
    sources ? `Источники: ${sources}` : null,
    caseList ? `Кейсы: ${caseList}` : null,
    `Скачивания резюме: ${sum(resumeDownloads)}`,
    `Клики на Telegram: ${sum(telegramClicks)}`,
  ].filter(Boolean).join("\n");
}

async function handleBotUpdate(env, update) {
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (String(chatId) !== env.TELEGRAM_CHAT_ID) return;

  const action = callback?.data || message?.text;
  if (action === "/start") {
    await telegram(env, "sendMessage", {
      chat_id: chatId,
      text: "Статистика портфолио",
      reply_markup: {
        inline_keyboard: [[
          { text: "Сегодня", callback_data: "today" },
          { text: "7 дней", callback_data: "week" },
        ]],
      },
    });
    return;
  }

  if (callback) {
    // Telegram expects the callback acknowledgement promptly. Do this before
    // reading D1, otherwise a slow query can leave the button spinning.
    try {
      await telegram(env, "answerCallbackQuery", { callback_query_id: callback.id });
    } catch (error) {
      console.error("Could not acknowledge Telegram callback", error);
    }
  }

  const period = action === "week" || action === "/week" ? "week" : "today";
  const summary = await buildSummary(env, period);
  if (callback) {
    try {
      await telegram(env, "editMessageText", {
        chat_id: chatId,
        message_id: callback.message.message_id,
        text: summary,
        reply_markup: {
          inline_keyboard: [[
            { text: "Сегодня", callback_data: "today" },
            { text: "7 дней", callback_data: "week" },
          ]],
        },
      });
    } catch (error) {
      console.error("Could not update Telegram statistics message", error);
      await telegram(env, "sendMessage", { chat_id: chatId, text: summary });
    }
    return;
  }

  await telegram(env, "sendMessage", { chat_id: chatId, text: summary });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === "/event" && request.method === "POST") {
      const event = await request.json();
      const validTypes = new Set(Object.keys(eventLabels));
      const validSources = new Set(Object.keys(sourceLabels));
      const validCases = new Set(["ГПтест", "Коалиция", "Mappy", "Staff Admin Panel"]);

      if (!allowedOrigins.has(origin) || !validTypes.has(event.eventType) || !validSources.has(event.source)) {
        return new Response("Invalid event", { status: 400, headers: corsHeaders(origin) });
      }

      const caseName = event.caseName && validCases.has(event.caseName) ? event.caseName : null;
      const pagePath = typeof event.pagePath === "string" && event.pagePath.startsWith("/")
        ? event.pagePath.slice(0, 120)
        : "/";
      const sanitizedEvent = { ...event, caseName, pagePath };

      await saveEvent(env, sanitizedEvent);
      // A plain visit is retained for the summary but does not interrupt Denis.
      // Notifications are reserved for deliberate actions in the portfolio.
      if (sanitizedEvent.eventType !== "portfolio_visit" && sanitizedEvent.source !== "owner") {
        await telegram(env, "sendMessage", {
          chat_id: env.TELEGRAM_CHAT_ID,
          text: formatEvent(sanitizedEvent),
        });
      }

      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/telegram/webhook" && request.method === "POST") {
      await handleBotUpdate(env, await request.json());
      return new Response("ok");
    }

    // Совместимость с уже работающей формой обратной связи и старым уведомлением о резюме.
    if (request.method === "GET" && url.searchParams.has("text")) {
      await telegram(env, "sendMessage", {
        chat_id: env.TELEGRAM_CHAT_ID,
        text: url.searchParams.get("text").slice(0, 3500),
      });
      return new Response("ok");
    }

    return new Response("Not found", { status: 404 });
  },
};
