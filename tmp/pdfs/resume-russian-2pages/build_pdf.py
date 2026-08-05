from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = "output/pdf/Денис Ермаков — продуктовый дизайнер.pdf"
PHOTO = "assets/Denisphoto.png"
FONT_REGULAR = "/Users/denisermakov/Library/Fonts/TTNormsPro-Regular.ttf"
FONT_BOLD = "/Users/denisermakov/Library/Fonts/TTNormsPro-Bold.ttf"

pdfmetrics.registerFont(TTFont("TTNorms", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("TTNorms-Bold", FONT_BOLD))
pdfmetrics.registerFontFamily("TTNorms", normal="TTNorms", bold="TTNorms-Bold")

PAGE_W, PAGE_H = A4
LEFT = RIGHT = 16 * mm
TOP = 16 * mm
BOTTOM = 15 * mm
INK = colors.HexColor("#151515")
MUTED = colors.HexColor("#777777")
LIGHT = colors.HexColor("#A8A8A8")
RULE = colors.HexColor("#D0D0D0")
BLUE = colors.HexColor("#24598A")

styles = getSampleStyleSheet()
name = ParagraphStyle("Name", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=22, leading=25, textColor=INK, spaceAfter=2)
subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="TTNorms", fontSize=9.2, leading=11.3, textColor=INK, spaceAfter=0)
contact = ParagraphStyle("Contact", parent=styles["Normal"], fontName="TTNorms", fontSize=8.95, leading=11.3, textColor=INK, spaceAfter=0)
section = ParagraphStyle("Section", parent=styles["Normal"], fontName="TTNorms", fontSize=10.2, leading=12, textColor=LIGHT, spaceBefore=8, spaceAfter=1.5)
target = ParagraphStyle("Target", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=13, leading=16, textColor=INK, spaceBefore=3, spaceAfter=3)
target_meta = ParagraphStyle("TargetMeta", parent=styles["Normal"], fontName="TTNorms", fontSize=9, leading=12.2, textColor=INK, spaceAfter=0)
company = ParagraphStyle("Company", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=12.2, leading=14.5, textColor=INK, spaceAfter=0)
location = ParagraphStyle("Location", parent=styles["Normal"], fontName="TTNorms", fontSize=8.8, leading=10.8, textColor=MUTED, spaceAfter=3)
role = ParagraphStyle("Role", parent=styles["Normal"], fontName="TTNorms", fontSize=10.4, leading=13, textColor=INK, spaceBefore=3, spaceAfter=4)
intro = ParagraphStyle("Intro", parent=styles["Normal"], fontName="TTNorms", fontSize=9.15, leading=11.7, textColor=INK, spaceAfter=4)
body = ParagraphStyle("Body", parent=styles["Normal"], fontName="TTNorms", fontSize=9.1, leading=11.65, textColor=INK, leftIndent=7, firstLineIndent=-6, spaceAfter=3.2)
date = ParagraphStyle("Date", parent=styles["Normal"], fontName="TTNorms", fontSize=8.6, leading=10.2, textColor=MUTED)
education = ParagraphStyle("Education", parent=styles["Normal"], fontName="TTNorms", fontSize=9.2, leading=11.7, textColor=INK, spaceAfter=4)
skills = ParagraphStyle("Skills", parent=styles["Normal"], fontName="TTNorms", fontSize=9.0, leading=12.3, textColor=INK)


def p(text, style):
    return Paragraph(text, style)


def heading(label):
    return [p(label, section), HRFlowable(width="100%", thickness=0.55, color=RULE, spaceAfter=6)]


def bullet(text):
    return Paragraph(text, body, bulletText="•")


def experience_block(date_text, company_text, location_text, role_text, intro_text, bullets):
    details = [
        p(company_text, company),
        p(location_text, location),
        p(role_text, role),
        p(intro_text, intro),
        *[bullet(item) for item in bullets],
    ]
    table = Table(
        [[p(date_text, date), details]],
        colWidths=[31 * mm, 147 * mm],
        hAlign="LEFT",
    )
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("TTNorms", 7.7)
    canvas.setFillColor(LIGHT)
    canvas.drawString(LEFT, 10 * mm, "Денис Ермаков · Резюме обновлено 30 июля 2026")
    canvas.drawRightString(PAGE_W - RIGHT, 10 * mm, str(doc.page))
    canvas.restoreState()


photo = Image(PHOTO, width=32 * mm, height=32 * mm)
header_text = [
    p("Ермаков Денис Дмитриевич", name),
    p("Мужчина, 22 года, родился 30 декабря 2003", subtitle),
    Spacer(1, 4),
    p("+7 (999) 030 8563 — предпочитаемый способ связи", contact),
    p("denis2003erm@yandex.ru", contact),
    p("Telegram: @mrakov182", contact),
    p('<link href="https://denisermakov182.github.io/denis-ermakov-portfolio/?utm_source=oz&amp;utm_medium=resume"><font color="#24598A">Портфолио: denisermakov182.github.io/denis-ermakov-portfolio</font></link>', contact),
    Spacer(1, 3),
    p("Проживает: Москва · Гражданство: Россия · Готов к переезду и командировкам", contact),
]
header = Table([[photo, header_text]], colWidths=[37 * mm, 141 * mm], hAlign="LEFT")
header.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))

story = [
    header,
    *heading("ЖЕЛАЕМАЯ ДОЛЖНОСТЬ И ФОРМАТ"),
    p("Продуктовый дизайнер", target),
    p("Полная занятость · Удалённо, гибрид или офис", target_meta),
    *heading("ОПЫТ РАБОТЫ — 3 ГОДА 5 МЕСЯЦЕВ"),
    experience_block(
        "Март 2023 -\nнастоящее время\n\n3 года 5 месяцев",
        "ЦО «Коалиция»",
        "Москва · EdTech-платформа для подготовки к ОГЭ, ЕГЭ и олимпиадам · 3 000+ учеников",
        "Продуктовый дизайнер",
        "Веду продуктовые задачи от исследования до запуска и проверки результата.",
        [
            "Провёл интервью с преподавателями и разобрал сценарий публикации видеоуроков. Выявил зависимость от стороннего загрузчика, ручные таймкоды и отсутствие конспекта; определил TTP, CSAT и adoption AI-функций как метрики успеха.",
            "Спроектировал единый сценарий в редакторе урока: загрузка MP4, прогресс, транскрибация, таймкоды и AI-конспект. Проработал состояния, интерактивный прототип и спецификации для разработки.",
            "Участвовал в handoff, обсуждении ограничений и дизайн-ревью. После запуска время публикации сократилось на 40%, CSAT вырос на 18%, AI-функциями воспользовались 64% преподавателей.",
            "Перепроектировал сценарии кабинетов ученика и преподавателя и развивал дизайн-систему: компоненты, варианты, переменные, типографику, цвета и состояния.",
        ],
    ),
    *heading("ВЫБРАННЫЕ ПРОДУКТОВЫЕ ПРОЕКТЫ"),
    experience_block(
        "Апрель 2026 -\nиюнь 2026\n\n3 месяца",
        "ГПтест",
        "Независимый проект · AI EdTech веб-сервис",
        "Продуктовый дизайнер",
        "Сервис для создания и прохождения тестов по материалам пользователя.",
        [
            "Провёл Product Discovery: опрос на 127 ответов, сегментация аудитории, JTBD и конкурентный анализ. Изменил фокус с генерации вопросов на проверку ответов, объяснение ошибок и аналитику прогресса.",
            "Спроектировал информационную архитектуру, пользовательские сценарии и интерактивный MVP для desktop и mobile с учётом ограничений AI-генерации, API и адаптивной вёрстки.",
            "Запустил продукт, собрал обратную связь и приоритизировал следующую итерацию по влиянию на основной сценарий.",
            "Переработал библиотеку, генерацию, прохождение и результаты; добавил историю попыток, прогресс, защиту от выхода и понятную обратную связь. В usability-тесте все участники прошли основной сценарий без подсказок.",
        ],
    ),
    experience_block(
        "Январь 2026 -\nиюнь 2026\n\n6 месяцев",
        "Mappy",
        "Независимый проект · Геосервис для сохранения мест и рекомендаций друзей",
        "Продуктовый дизайнер",
        "Геосервис, в котором пользователь сохраняет места и получает рекомендации друзей.",
        [
            "Провёл интервью и опрос 57 человек; сформулировал четыре продуктовые гипотезы о сохранении мест, личном контексте, поиске и возвращении к спискам.",
            "Спроектировал IA и сценарии для карты, сохранённых мест и друзей: статусы «Уже был» и «Планирую», оценки, фото, категории, описания и приватность.",
            "Провёл две итерации usability-тестов и упростил добавление места, статусы и фильтрацию.",
            "Довёл продукт до production PWA с авторизацией, местами, фото, геолокацией, друзьями и приватностью; собрал адаптивный UI Kit на компонентах, вариантах и токенах.",
        ],
    ),
    *heading("ОБРАЗОВАНИЕ"),
    p("<b>Международный банковский институт имени Анатолия Собчака</b><br/>Бизнес-информатика · Онлайн-программа, part-time · Обучаюсь", education),
    *heading("КЛЮЧЕВЫЕ КОМПЕТЕНЦИИ"),
    p("Product Discovery · UX Research · Глубинные интервью · JTBD · User Flow · Информационная архитектура · Usability Testing · Figma · Дизайн-системы · Handoff · Продуктовая аналитика", skills),
]

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=LEFT,
    rightMargin=RIGHT,
    topMargin=TOP,
    bottomMargin=BOTTOM,
    title="Денис Ермаков — продуктовый дизайнер",
    author="Денис Ермаков",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
