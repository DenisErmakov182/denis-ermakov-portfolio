from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer

OUT = "output/pdf/Денис Ермаков — продуктовый дизайнер.pdf"

FONT_REGULAR = "/Users/denisermakov/Library/Fonts/TTNormsPro-Regular.ttf"
FONT_BOLD = "/Users/denisermakov/Library/Fonts/TTNormsPro-Bold.ttf"
pdfmetrics.registerFont(TTFont("TTNorms", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("TTNorms-Bold", FONT_BOLD))
pdfmetrics.registerFontFamily("TTNorms", normal="TTNorms", bold="TTNorms-Bold")

NAVY = colors.HexColor("#102E52")
BLUE = colors.HexColor("#24598A")
INK = colors.HexColor("#1F2933")
MUTED = colors.HexColor("#5B6670")

styles = getSampleStyleSheet()
name = ParagraphStyle(
    "Name", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=20,
    leading=23, alignment=TA_CENTER, textColor=NAVY, spaceAfter=2,
)
contact = ParagraphStyle(
    "Contact", parent=styles["Normal"], fontName="TTNorms", fontSize=8.7,
    leading=10.4, alignment=TA_CENTER, textColor=MUTED, spaceAfter=1,
)
summary = ParagraphStyle(
    "Summary", parent=styles["Normal"], fontName="TTNorms", fontSize=9,
    leading=11.1, alignment=TA_LEFT, textColor=INK, spaceBefore=6.5, spaceAfter=4.2,
)
section = ParagraphStyle(
    "Section", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=9.7,
    leading=11.5, textColor=BLUE, spaceBefore=5.8, spaceAfter=2.8,
)
role = ParagraphStyle(
    "Role", parent=styles["Normal"], fontName="TTNorms-Bold", fontSize=9.5,
    leading=11.1, textColor=INK, spaceBefore=1.3, spaceAfter=0,
)
meta = ParagraphStyle(
    "Meta", parent=styles["Normal"], fontName="TTNorms", fontSize=8.35,
    leading=9.8, textColor=MUTED, spaceAfter=1.3,
)
body = ParagraphStyle(
    "Body", parent=styles["Normal"], fontName="TTNorms", fontSize=8.75,
    leading=10.55, textColor=INK, leftIndent=8, firstLineIndent=-6.4,
    spaceAfter=1.7,
)
compact = ParagraphStyle(
    "Compact", parent=styles["Normal"], fontName="TTNorms", fontSize=8.7,
    leading=10.4, textColor=INK, spaceAfter=0,
)


def bullet(text):
    return Paragraph(text, body, bulletText="•")


def role_block(title, meta_text, bullets):
    items = [Paragraph(title, role), Paragraph(meta_text, meta)]
    items.extend(bullet(item) for item in bullets)
    return KeepTogether(items)


story = [
    Paragraph("ДЕНИС ЕРМАКОВ", name),
    Paragraph(
        "Москва, Россия | Готов к переезду | +7 999 030 8563 | denis2003erm@yandex.ru | Telegram: @mrakov182",
        contact,
    ),
    Paragraph(
        '<link href="https://denisermakov182.github.io/denis-ermakov-portfolio/?utm_source=resume_pdf&amp;utm_medium=pdf"><font color="#24598A">Портфолио: denisermakov182.github.io/denis-ermakov-portfolio</font></link> | LinkedIn: linkedin.com/in/denis-ermakov-a548a0388',
        contact,
    ),
    Spacer(1, 2),
    Paragraph(
        "<b>Продуктовый дизайнер с 3+ годами full-time опыта в EdTech.</b> Веду работу от исследования и постановки проблемы до проектирования сценариев, передачи в разработку и итераций после запуска. Работаю с AI-функциями, качественными и количественными исследованиями, usability-тестами, дизайн-системами и адаптивными веб- и мобильными интерфейсами.",
        summary,
    ),
    Paragraph("ОПЫТ РАБОТЫ", section),
    role_block(
        "ЦО «Коалиция» | Продуктовый дизайнер | Полная занятость",
        "Март 2023 - настоящее время | Москва | EdTech-платформа, 3 000+ учеников",
        [
            "Провёл интервью с преподавателями и разобрал сценарий публикации видеоуроков. Выявил зависимость от стороннего загрузчика, ручные таймкоды и отсутствие конспекта; определил TTP, CSAT и adoption AI-функций как метрики успеха.",
            "Спроектировал единый сценарий в редакторе урока: загрузка MP4, прогресс, транскрибация, таймкоды и AI-конспект. Проработал состояния, интерактивный прототип и спецификации для разработки.",
            "Участвовал в handoff, обсуждении ограничений и дизайн-ревью. После запуска время публикации сократилось на 40%, CSAT вырос на 18%, AI-функциями воспользовались 64% преподавателей.",
            "Перепроектировал сценарии кабинетов ученика и преподавателя и развивал дизайн-систему: компоненты, варианты, переменные, типографику, цвета и состояния.",
        ],
    ),
    Paragraph("ВЫБРАННЫЕ ПРОДУКТОВЫЕ ПРОЕКТЫ", section),
    role_block(
        "ГПтест | Независимый продуктовый проект",
        "Апрель 2026 - июнь 2026 | AI EdTech веб-сервис",
        [
            "Провёл Product Discovery: опрос на 127 ответов, сегментация аудитории, JTBD и конкурентный анализ. Изменил фокус с генерации вопросов на проверку ответов, объяснение ошибок и аналитику прогресса.",
            "Спроектировал информационную архитектуру, пользовательские сценарии и интерактивный MVP для desktop и mobile с учётом ограничений AI-генерации, API и адаптивной вёрстки.",
            "Запустил продукт, собрал обратную связь и приоритизировал следующую итерацию по влиянию на основной сценарий.",
            "Переработал библиотеку, генерацию, прохождение и результаты; добавил историю попыток, прогресс, защиту от выхода и понятную обратную связь. В usability-тесте все участники прошли основной сценарий без подсказок.",
        ],
    ),
    role_block(
        "Mappy | Независимый продуктовый проект",
        "Январь 2026 - июнь 2026 | Геосервис для сохранения мест и рекомендаций друзей",
        [
            "Провёл интервью и опрос 57 человек; сформулировал четыре продуктовые гипотезы о сохранении мест, личном контексте, поиске и возвращении к спискам.",
            "Спроектировал IA и сценарии для карты, сохранённых мест и друзей: статусы «Уже был» и «Планирую», оценки, фото, категории, описания и приватность.",
            "Провёл две итерации usability-тестов и упростил добавление места, статусы и фильтрацию.",
            "Довёл продукт до production PWA с авторизацией, местами, фото, геолокацией, друзьями и приватностью; собрал адаптивный UI Kit на компонентах, вариантах и токенах.",
        ],
    ),
    Paragraph("ОБРАЗОВАНИЕ", section),
    Paragraph("<b>Международный банковский институт имени Анатолия Собчака</b><br/>Бизнес-информатика | Онлайн-программа, part-time | Обучаюсь", compact),
    Paragraph("КЛЮЧЕВЫЕ КОМПЕТЕНЦИИ", section),
    Paragraph("Product Discovery · UX Research · Глубинные интервью · JTBD · User Flow · Информационная архитектура · Usability Testing · Figma · Дизайн-системы · Handoff · Продуктовая аналитика", compact),
]

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=15 * mm,
    rightMargin=15 * mm,
    topMargin=12 * mm,
    bottomMargin=11 * mm,
    title="Денис Ермаков — продуктовый дизайнер",
    author="Денис Ермаков",
)
doc.build(story)
