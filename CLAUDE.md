# Portfolio Website — CLAUDE.md

## Проект
Статическое портфолио Дениса Ермакова на GitHub Pages.
Репозиторий: `DenisErmakov182/denis-ermakov-portfolio`
Живой сайт: https://denisermakov182.github.io/denis-ermakov-portfolio/ (или кастомный домен)

## Стек
- Чистый HTML/CSS/JS — без фреймворков, без сборщиков
- `styles.css` — общие стили (index.html)
- `script.js` — поведение главной страницы (свайп, тема, язык, форма, уведомления)
- Кейсы — самодостаточные HTML-файлы со встроенным CSS и JS

## Файловая структура
```
index.html          # Главная
styles.css          # Стили главной
script.js           # JS главной
gptest.html         # Кейс ГПтест (шаблон для остальных кейсов)
coalition.html      # Кейс Коалиция (акцент: #3b82f6, синий)
mappy.html          # Кейс Mappy (акцент: #ff4575, розовый)
admin.html          # Кейс Staff Admin Panel (акцент: #6366f1, индиго)
assets/
  Denisphoto.webp   # Портрет (intro + swipe)
  cv-preview.png    # Превью резюме
  denis-ermakov.pdf # PDF резюме
  gptest/           # Скрины кейса ГПтест
  coalition/        # Скрины кейса Коалиция
  mappy/            # Скрины кейса Mappy
  admin/            # Скрины кейса Staff Admin Panel
  staff/            # dashboard.png для карточки на главной
cases/              # Материалы кейсов (НЕ в git)
```

## Темы и язык
- Тема: `data-theme="dark"/"light"` на `<html>`, хранится в `localStorage`
- Язык: `data-ru` / `data-en` атрибуты на элементах, `applyLang()` в JS каждого кейса
- CSS переменные: `--ink`, `--muted`, `--bg`, `--bg-secondary`, `--light`, `--accent`
- Dark mode: `[data-theme="dark"]` переопределяет переменные

## Паттерны кейс-страниц (gptest.html — эталон)
- `.hero-block` → заголовок + hero-cover с img
- `.case-row` → `.case-label` (левая колонка, 304px) + `.case-content` (правая)
- `.case-group` / `.case-group--sm` → группирует row + img-block
- `.img-block` → серый фон, border-radius 32px, изображения внутри
- `.scroll-block` → горизонтальный скролл-трек (опросы, экраны)
- `.survey-card` → карточка с баром или колонками (`.survey-rows` / `.survey-cols`)
- `.metric-pill` → пилюля с `.metric-val` и `.metric-lbl`
- Акцент цвет задаётся как `--accent` или именованная переменная (`--pink`, `--blue`)

## Внешние сервисы
- **GitHub Pages** — хостинг, деплой автоматически при пуше в `main`
- **Cloudflare Workers** — прокси для Telegram Bot API (избегает CORS)
  - URL: `https://portfolio-feedback.denis-ermakov.workers.dev/?text=<encoded>`
  - Используется для: форма обратной связи (отказ), уведомления о скачивании/шеринге резюме
- **Telegram Bot** — `PortfolioFeedbackBot` (токен хранится в Cloudflare Worker, не в коде)
  - Chat ID владельца: `829803642`
- **Framer** — оригинальный дизайн (ermakov.framer.website), откуда берём тексты и картинки при создании кейсов

## Как добавить новый кейс
1. Скопировать структуру из `gptest.html` или `coalition.html`
2. Скачать изображения с Framer CDN через `curl` в `assets/<name>/`
3. Задать акцент-цвет `--accent` в `:root`
4. Добавить ссылку в `index.html` на карточку кейса
5. `git add` + `git commit` + `git push`

## Уведомления в Telegram
При клике «Скачать ПДФ» или «Поделиться» в `script.js` вызывается:
```js
fetch("https://portfolio-feedback.denis-ermakov.workers.dev/?text=" + encodeURIComponent(text))
```
Worker отправляет сообщение в бот. Прямые вызовы `api.telegram.org` из браузера — CORS, не работают.

## Git workflow
- Ветка: `main` (единственная)
- Пуш = деплой (GitHub Pages следит за main)
- Коммит-сообщения на английском, imperative mood
