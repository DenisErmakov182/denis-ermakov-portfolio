from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Link


SOURCE = Path("/Users/denisermakov/Downloads/Продуктовый дизайнер-4.pdf")
OUTPUT = Path("tmp/pdfs/denis-ermakov-resume-with-portfolio-link.pdf")
PORTFOLIO_URL = (
    "https://denisermakov182.github.io/denis-ermakov-portfolio/"
    "?utm_source=resume_pdf&utm_medium=pdf"
)

# The URL is line-wrapped in the exported HH PDF. Rectangles are in PDF
# coordinates (origin at bottom-left) and cover the two visible URL fragments.
URL_RECTS = [
    (181.5, 678.5, 545.0, 689.5),
    (126.5, 665.5, 214.0, 676.5),
]

reader = PdfReader(SOURCE)
writer = PdfWriter()
writer.clone_document_from_reader(reader)

for rect in URL_RECTS:
    writer.add_annotation(
        page_number=0,
        annotation=Link(rect=rect, border=[0, 0, 0], url=PORTFOLIO_URL),
    )

with OUTPUT.open("wb") as output_file:
    writer.write(output_file)
