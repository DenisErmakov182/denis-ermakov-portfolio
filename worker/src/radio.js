// Радио для портфолио: подбор станций по зоне посетителя и название трека из потока.
// Звук через Worker не идёт: браузер играет поток напрямую со станции.

const RADIO_BROWSER = "https://de1.api.radio-browser.info/json/stations/search";
const USER_AGENT = "portfolio-radio/1.0";
const SKIP_TAGS = /news|talk|politic|sport|religio|christian|islam|podcast/i;

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...extra,
    },
  });
}

// Станции страны посетителя: только рабочие https-потоки, музыка, свой регион выше в списке.
async function stations(request, url) {
  const cf = request.cf || {};
  const country = (url.searchParams.get("cc") || cf.country || "RU").toUpperCase().slice(0, 2);
  const region = (cf.region || "").toLowerCase();
  const city = cf.city || "";

  const query = new URLSearchParams({
    countrycode: country,
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: "120",
  });
  const upstream = await fetch(`${RADIO_BROWSER}?${query}`, {
    headers: { "user-agent": USER_AGENT },
    cf: { cacheTtl: 6 * 60 * 60, cacheEverything: true },
  });
  if (!upstream.ok) return json({ error: "catalog unavailable" }, 502);

  const list = (await upstream.json())
    .filter((s) => s.lastcheckok === 1 && /^https:\/\//.test(s.url_resolved) && !SKIP_TAGS.test(s.tags || ""))
    .map((s) => ({
      id: s.stationuuid,
      name: s.name.trim(),
      url: s.url_resolved,
      place: s.state || "",
      tags: (s.tags || "").split(",").slice(0, 3).join(", "),
      homepage: s.homepage || "",
      local: region && (s.state || "").toLowerCase().includes(region) ? 1 : 0,
    }));

  // свой регион первым, дальше по популярности (порядок каталога сохраняется)
  list.sort((a, b) => b.local - a.local);

  return json(
    { country, region: cf.region || "", city, stations: list.slice(0, 10) },
    200,
    { "cache-control": "private, max-age=600" }
  );
}

// Название трека из ICY-метаданных: читаем поток до первого блока метаданных и закрываем.
async function nowPlaying(url) {
  const target = url.searchParams.get("u") || "";
  let stream;
  try {
    stream = new URL(target);
  } catch {
    return json({ error: "bad url" }, 400);
  }
  // Защита от обращений к внутренним адресам: только https и обычные доменные имена.
  const host = stream.hostname;
  if (stream.protocol !== "https:" || !host.includes(".") || /^[\d.]+$/.test(host) || /(^|\.)(local|internal|localhost)$/.test(host)) {
    return json({ error: "not allowed" }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(`https://radio.cache/now?u=${encodeURIComponent(target)}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let title = null;
  try {
    const response = await fetch(stream.href, {
      headers: { "icy-metadata": "1", "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    const metaint = parseInt(response.headers.get("icy-metaint") || "0", 10);
    if (response.ok && metaint > 0 && response.body) {
      const reader = response.body.getReader();
      const need = metaint + 1 + 255 * 16;
      let buf = new Uint8Array(0);
      while (buf.length < need) {
        const { value, done } = await reader.read();
        if (done) break;
        const next = new Uint8Array(buf.length + value.length);
        next.set(buf);
        next.set(value, buf.length);
        buf = next;
        if (buf.length > metaint) {
          const len = buf[metaint] * 16;
          if (buf.length >= metaint + 1 + len) break;
        }
      }
      reader.cancel().catch(() => {});
      if (buf.length > metaint) {
        const len = buf[metaint] * 16;
        const meta = new TextDecoder("utf-8").decode(buf.slice(metaint + 1, metaint + 1 + len));
        const match = meta.match(/StreamTitle='([^']*)'/);
        if (match && match[1].trim()) title = match[1].trim().slice(0, 140);
      }
    }
  } catch {
    // станция недоступна или не отдаёт метаданные — вернём null
  }

  const reply = json({ title }, 200, { "cache-control": "public, max-age=15" });
  await cache.put(cacheKey, reply.clone());
  return reply;
}

export async function handleRadio(request, url) {
  if (request.method !== "GET") return json({ error: "method" }, 405);
  if (url.pathname === "/radio/stations") return stations(request, url);
  if (url.pathname === "/radio/now") return nowPlaying(url);
  return null;
}
