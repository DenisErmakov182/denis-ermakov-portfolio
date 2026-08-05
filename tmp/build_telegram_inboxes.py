from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from lxml import html

VAULT = Path('/Users/denisermakov/Library/Mobile Documents/iCloud~md~obsidian/Documents/Портфолио/Отклики/Входящие Telegram вакансии')
START = datetime(2026, 7, 16, tzinfo=timezone(timedelta(hours=3)))


def message_parts(source: Path):
    document = html.parse(str(source)).getroot()
    messages = document.xpath(
        "//div[contains(concat(' ', normalize-space(@class), ' '), ' message ') "
        "and contains(concat(' ', normalize-space(@class), ' '), ' default ') "
        "and contains(concat(' ', normalize-space(@class), ' '), ' clearfix ')]"
    )
    for message in messages:
        dates = message.xpath(".//div[contains(concat(' ', normalize-space(@class), ' '), ' date ') and @title]")
        texts = message.xpath(".//div[contains(concat(' ', normalize-space(@class), ' '), ' text ')]")
        if not dates or not texts:
            continue
        timestamp = datetime.strptime(dates[0].get('title'), '%d.%m.%Y %H:%M:%S UTC%z')
        if timestamp < START:
            continue
        text = '\n'.join(part.strip() for part in texts[0].itertext() if part.strip())
        links = [link.get('href') for link in texts[0].xpath('.//a[@href]') if link.get('href', '').startswith('http')]
        yield timestamp, text, links


def escape_cell(value: str) -> str:
    return value.replace('|', '\\|').replace('\n', ' ').strip()


def parse_daily_items(source: Path):
    rows = []
    for timestamp, text, links in message_parts(source):
        blocks = re.split(r'(?m)(?=^\d+\.\s)', text)
        items = []
        for block in blocks:
            match = re.match(r'(?s)^(\d+)\.\s*([^\n]+)(.*)$', block)
            if not match:
                continue
            number = int(match.group(1))
            title = match.group(2).strip()
            detail = match.group(3)
            grade = re.search(r'(?m)^#([^\n]+)', detail)
            format_match = re.search(r'🏠\s*Формат:\s*\n?#([^\n]+)(?:\n([^\n]+))?', detail)
            salary_match = re.search(r'💰\s*Вилка:\s*\n?([^\n]+)', detail)
            items.append((number, title, grade.group(1).strip() if grade else 'не указан',
                          ' · '.join(part.strip() for part in format_match.groups() if part and part.strip()) if format_match else 'не указан',
                          salary_match.group(1).strip() if salary_match else 'не указана'))
        if not items:
            continue
        vacancy_links = [href for href in links if not href.startswith('https://t.me/') and 'tribute/' not in href]
        for number, title, grade, format_value, salary in items:
            url = vacancy_links[number - 1] if len(vacancy_links) >= number else 'ссылка не извлечена'
            rows.append((timestamp.date().isoformat(), title, grade, format_value, salary, url))
    return rows


def table(lines, rows):
    grouped = defaultdict(list)
    for row in rows:
        grouped[row[0]].append(row)
    for date, entries in sorted(grouped.items()):
        lines.extend([f'## {date}', '', '| Вакансия | Грейд | Формат | Вилка | Ссылка | Статус |', '| --- | --- | --- | --- | --- | --- |'])
        for _, title, grade, format_value, salary, url in entries:
            link = f'[Открыть]({url})' if url.startswith('http') else url
            lines.append(f'| {escape_cell(title)} | {escape_cell(grade)} | {escape_cell(format_value)} | {escape_cell(salary)} | {link} | К разбору |')
        lines.append('')


def write_designers():
    source = Path('/Users/denisermakov/Downloads/Telegram Desktop/ChatExport_2026-07-30 (1)/messages.html')
    rows = parse_daily_items(source)
    lines = [
        '---', 'type: telegram-vacancy-inbox', 'channel: "Вакансии дизайнерам"', 'exported: 2026-07-30',
        f'source_file: "{source}"', 'period: "2026-07-16 - 2026-07-30"', f'vacancies_count: {len(rows)}', 'status: "В работе"', '---', '',
        '# Вакансии дизайнерам — входящие 2026-07-16 - 2026-07-30', '',
        'Полный список вакансий из двухнедельного экспорта. Исходный статус каждой строки — «К разбору»: он не означает, что отклик отправлен.', '',
        'Возможные результаты анализа: **К отклику**, **Сохранить**, **Пропустить**.', ''
    ]
    table(lines, rows)
    target = VAULT / '2026-07-30 Вакансии дизайнерам.md'
    target.write_text('\n'.join(lines), encoding='utf-8')
    return target, len(rows)


def write_uxui():
    source = Path('/Users/denisermakov/Downloads/Telegram Desktop/ChatExport_2026-07-30/messages.html')
    rows = [
        ('2026-07-16', 'X5 Group — старший (Senior) продуктовый дизайнер', '3 - 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135236058'),
        ('2026-07-17', 'РТЛабс (Госуслуги) — стажёр продуктовый дизайнер', 'без опыта', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135291941'),
        ('2026-07-17', '2ГИС — Senior web-дизайнер, B2B Платформа', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135286005'),
        ('2026-07-22', 'Ozon — старший продуктовый дизайнер, внутренние сервисы', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135434079'),
        ('2026-07-22', 'Ozon — старший продуктовый дизайнер, Покупки', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135413593'),
        ('2026-07-22', 'Сбер — продуктовый дизайнер, Сбер Прайм', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135392821'),
        ('2026-07-23', '2ГИС — Principal Product Designer', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135490492'),
        ('2026-07-24', 'Сбер — UI/UX-дизайнер', '3 - 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135547699'),
        ('2026-07-27', 'РТЛабс (Госуслуги) — продуктовый дизайнер', 'более 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135569049'),
        ('2026-07-28', 'Золотое Яблоко — тимлид UX/UI-дизайнер', '3 - 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135614448'),
        ('2026-07-28', 'Сбер — дизайнер-аналитик (Риски)', '1 - 3 года', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135608799'),
        ('2026-07-29', 'Сбер — продуктовый дизайнер', '3 - 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135672378'),
        ('2026-07-30', 'Bell Integrator — продуктовый дизайнер', '3 - 6 лет', 'не указан', 'не указана', 'https://krasnodar.hh.ru/vacancy/135721171'),
    ]
    lines = [
        '---', 'type: telegram-vacancy-inbox', 'channel: "Вакансии UX UI дизайнеров"', 'exported: 2026-07-30',
        f'source_file: "{source}"', 'period: "2026-07-16 - 2026-07-30"', f'vacancies_count: {len(rows)}', 'status: "В работе"', '---', '',
        '# Вакансии UX UI дизайнеров — входящие 2026-07-16 - 2026-07-30', '',
        'Полный список вакансий из двухнедельного экспорта. Исходный статус каждой строки — «К разбору»: он не означает, что отклик отправлен.', '',
        'Возможные результаты анализа: **К отклику**, **Сохранить**, **Пропустить**.', ''
    ]
    table(lines, rows)
    target = VAULT / '2026-07-30 Вакансии UX UI дизайнеров.md'
    target.write_text('\n'.join(lines), encoding='utf-8')
    return target, len(rows)


for path, count in (write_designers(), write_uxui()):
    print(f'{path.name}: {count} вакансий')
