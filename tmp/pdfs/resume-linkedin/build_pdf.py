from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer

OUT = "output/pdf/Denis Ermakov.pdf"

NAVY = colors.HexColor("#102E52")
BLUE = colors.HexColor("#24598A")
INK = colors.HexColor("#1F2933")
MUTED = colors.HexColor("#5B6670")
RULE = colors.HexColor("#B8CCE2")

PAGE_W, PAGE_H = A4
LEFT = RIGHT = 15 * mm
TOP = 12 * mm
BOTTOM = 11 * mm

styles = getSampleStyleSheet()
name = ParagraphStyle(
    "Name", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=20,
    leading=23, alignment=TA_CENTER, textColor=NAVY, spaceAfter=2,
)
contact = ParagraphStyle(
    "Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5,
    leading=10.3, alignment=TA_CENTER, textColor=MUTED, spaceAfter=1,
)
summary = ParagraphStyle(
    "Summary", parent=styles["Normal"], fontName="Helvetica", fontSize=8.8,
    leading=10.95, alignment=TA_LEFT, textColor=INK, spaceBefore=6.5, spaceAfter=4.2,
)
section = ParagraphStyle(
    "Section", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.6,
    leading=11.4, textColor=BLUE, spaceBefore=5.7, spaceAfter=2.7,
)
role = ParagraphStyle(
    "Role", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.3,
    leading=10.8, textColor=INK, spaceBefore=1.3, spaceAfter=0,
)
meta = ParagraphStyle(
    "Meta", parent=styles["Normal"], fontName="Helvetica", fontSize=8.2,
    leading=9.6, textColor=MUTED, spaceAfter=1.2,
)
body = ParagraphStyle(
    "Body", parent=styles["Normal"], fontName="Helvetica", fontSize=8.6,
    leading=10.45, textColor=INK, leftIndent=8, firstLineIndent=-6.4,
    spaceAfter=1.6,
)
education = ParagraphStyle(
    "Education", parent=styles["Normal"], fontName="Helvetica", fontSize=8.65,
    leading=10.35, textColor=INK, spaceAfter=0,
)

def bullet(text):
    return Paragraph(text, body, bulletText="•")

def role_block(title, meta_text, bullets):
    items = [Paragraph(title, role), Paragraph(meta_text, meta)]
    items.extend(bullet(item) for item in bullets)
    return KeepTogether(items)

story = [
    Paragraph("DENIS ERMAKOV", name),
    Paragraph(
        "Moscow, Russia | Open to relocation | +7 999 030 8563 | denis2003erm@yandex.ru | Telegram: @mrakov182",
        contact,
    ),
    Paragraph(
        "<link href=\"https://denisermakov182.github.io/denis-ermakov-portfolio/?lang=en&amp;utm_source=resume_pdf&amp;utm_medium=pdf\"><font color=\"#24598A\">Portfolio: denisermakov182.github.io/denis-ermakov-portfolio</font></link> | LinkedIn: linkedin.com/in/denis-ermakov-a548a0388",
        contact,
    ),
    Spacer(1, 2),
    Paragraph("<b>Product Designer with 3+ years of full-time experience in EdTech.</b> I lead product work from research and problem framing to user flows, interface design, handoff, and post-launch iteration. Experience in AI-enabled features, qualitative and quantitative research, usability testing, design systems, and responsive web and mobile interfaces.", summary),
    Paragraph("EXPERIENCE", section),
    role_block(
        "CO KOALITSIYA | Product Designer | Full-time",
        "Mar 2023 - Present | Moscow | EdTech platform used by 3,000+ students",
        [
            "Conducted in-depth teacher interviews and analysed the video-lesson publishing flow. Identified reliance on a third-party upload service, manual timecodes, and missing lesson summaries; defined Time to Publish, CSAT, and AI feature adoption as success metrics.",
            "Designed an end-to-end lesson-editor flow for MP4 upload, progress feedback, transcription, timecode generation, and AI summaries. Created loading, processing, success, and error states, an interactive prototype, and interaction specifications in Figma.",
            "Participated in handoff, discussed technical constraints with developers, and ran design reviews. After release, video publishing time decreased by 40%, teacher CSAT increased by 18%, and 64% of teachers used transcription and AI summaries.",
            "Redesigned student and teacher dashboard scenarios and developed Figma components, variants, variables, typography, color tokens, and interface states to reduce duplication and streamline handoff.",
        ],
    ),
    Paragraph("SELECTED PRODUCT PROJECTS", section),
    role_block(
        "GPTEST | Independent Product Designer",
        "Apr 2026 - Jun 2026 | AI EdTech web product",
        [
            "Conducted Product Discovery through a survey of 127 students; defined the target audience, Jobs to Be Done, and value proposition. Competitor analysis shifted the focus from question generation to answer checking, error explanations, test storage, and progress analytics.",
            "Created information architecture, user flows, and an interactive MVP prototype for desktop and mobile. Worked within the constraints of AI generation, APIs, responsive layout, Next.js, and Directus.",
            "Launched the product and prioritised the next iteration backlog by impact on the primary scenario.",
            "Redesigned the file library, generation, test-taking, and results flows. Added attempt history, progress analytics, exit protection, auto-scroll, and generation feedback; all four usability-test participants completed the primary scenario without assistance.",
        ],
    ),
    role_block(
        "MAPPY | Independent Product Designer",
        "Jan 2026 - Jun 2026 | Geo-service for saving places and friends' recommendations",
        [
            "Conducted in-depth interviews and a quantitative survey with 57 respondents, then formulated four product hypotheses around saving places, preserving personal context, search, and return visits.",
            "Designed information architecture and user flows for maps, saved places, and friends. Created separate scenarios for visited and planned places, including ratings, photos, categories, descriptions, and privacy settings.",
            "Ran two iterations of usability testing and simplified place creation, visit statuses, and filtering by category, rating, owner, and status.",
            "Designed social features and a responsive UI kit with components, variants, and tokens. Prepared the production PWA with authentication, places, photos, geolocation, friends, and privacy controls.",
        ],
    ),
    Paragraph("EDUCATION", section),
    Paragraph("<b>International Banking Institute named after Anatoliy Sobchak</b><br/>Business Informatics, currently pursuing | Online programme, part-time", education),
    Paragraph("LANGUAGES", section),
    Paragraph("Russian - Native | English - B2 (Upper-Intermediate)", education),
]

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=LEFT,
    rightMargin=RIGHT,
    topMargin=TOP,
    bottomMargin=BOTTOM,
    title="Denis Ermakov",
    author="Denis Ermakov",
)
doc.build(story)
