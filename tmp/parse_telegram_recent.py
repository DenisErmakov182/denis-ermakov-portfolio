from __future__ import annotations

from datetime import datetime, timezone, timedelta
from pathlib import Path
from lxml import html

SOURCE = Path('/Users/denisermakov/Downloads/Telegram Desktop/ChatExport_2026-07-30 (1)/messages.html')
OUT = Path('tmp/telegram-designers-2026-07-16-to-30.md')
START = datetime(2026, 7, 16, tzinfo=timezone(timedelta(hours=3)))


def clean_text(node):
    return '\n'.join(part.strip().replace('\xa0', ' ') for part in node.itertext() if part.strip())


document = html.parse(str(SOURCE)).getroot()
channel = ' '.join(document.xpath("//div[@class='page_header']//div[contains(@class, 'text')]/text()")[-1].split())
items = []
for message in document.xpath("//div[contains(concat(' ', normalize-space(@class), ' '), ' message ') and contains(concat(' ', normalize-space(@class), ' '), ' default ') and contains(concat(' ', normalize-space(@class), ' '), ' clearfix ')]"):
    dates = message.xpath(".//div[contains(concat(' ', normalize-space(@class), ' '), ' date ') and @title]")
    texts = message.xpath(".//div[contains(concat(' ', normalize-space(@class), ' '), ' text ')]")
    date = dates[0] if dates else None
    text = texts[0] if texts else None
    if date is None or text is None:
        continue
    timestamp = datetime.strptime(date.get('title'), '%d.%m.%Y %H:%M:%S UTC%z')
    if timestamp < START:
        continue
    links = []
    for link in text.xpath('.//a[@href]'):
        href = link.get('href')
        if href.startswith('http'):
            label = ' '.join(link.itertext()).strip() or href
            links.append((label, href))
    items.append((timestamp, clean_text(text), links))

lines = [
    '---',
    'type: telegram-vacancy-inbox',
    f'channel: "{channel}"',
    'exported: 2026-07-30',
    f'source_file: "{SOURCE}"',
    'status: "Не разобрано"',
    '---',
    '',
    '# Вакансии UX UI дизайнеров — входящие 2026-07-16 - 2026-07-30',
    '',
    'Источник: экспорт Telegram `ChatExport_2026-07-30/messages.html`. '
    'Ниже сохранены все сообщения за последние две недели из экспорта; это не подтверждённые отклики.',
    '',
]
for timestamp, text, links in items:
    lines.extend([
        f'## {timestamp:%Y-%m-%d} {timestamp:%H:%M}',
        '',
        text,
        '',
    ])
    if links:
        lines.append('### Ссылки')
        lines.append('')
        lines.extend(f'- [{label}]({href})' for label, href in links)
        lines.append('')
    lines.extend(['Статус разбора: не разобрано.', ''])

OUT.write_text('\n'.join(lines), encoding='utf-8')
print(f'{len(items)} сообщений → {OUT}')
