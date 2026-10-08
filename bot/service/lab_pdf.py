"""Generate a printable Hebrew service-call PDF for email attachment."""

from __future__ import annotations

import base64
import io
import re
from pathlib import Path

from bidi.algorithm import get_display
from fpdf import FPDF

ASSETS = Path(__file__).resolve().parent / "assets"
LOGO = ASSETS / "logo-he.png"

# Prefer bundled fonts (local/dev), then system DejaVu (Cloud Run image).
_FONT_CANDIDATES = [
    Path(__file__).resolve().parent / "fonts" / "DejaVuSans.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/usr/share/fonts/dejavu/DejaVuSans.ttf"),
]
_FONT_BOLD_CANDIDATES = [
    Path(__file__).resolve().parent / "fonts" / "DejaVuSans-Bold.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"),
]


def _first_existing(paths: list[Path]) -> Path:
    for path in paths:
        if path.is_file():
            return path
    raise FileNotFoundError(
        "No PDF font found. Install fonts-dejavu-core or place DejaVuSans.ttf under bot/service/fonts/."
    )


FONT_REG = _first_existing(_FONT_CANDIDATES)
FONT_BOLD = next((p for p in _FONT_BOLD_CANDIDATES if p.is_file()), FONT_REG)


def _he(text: str) -> str:
    return get_display(str(text or "").strip())


_ISO_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
_DATE_FIELDS = {"openedAt", "serviceCallDate", "deliveryDate"}


def _display_date(value: str) -> str:
    text = str(value or "").strip()
    match = _ISO_DATE.match(text)
    if not match:
        return text
    year, month, day = match.groups()
    return f"{day}-{month}-{year}"


TERMS = [
    "התחייבות לתשלום חשבונית עבור השירות והחלקים לפי המחירון. תשלום: שוטף+30. המחירים אינם כוללים מע\"מ. השירות על בסיס טכנאי פנוי.",
    "שעות חריגות מא'-ה' 08:00–17:00: שעתיים ראשונות +25%, ולאחר מכן +50%.",
    "הזמנה לפי שעות: חיוב כל שעות העבודה גם בקריאת שירות חוזרת לאותה תקלה.",
    "נסיעה לפי תעריף טכנאי ושעות לפי WAZE. חניה על חשבון המזמין.",
]


class ServiceCallPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=False)
        self.add_font("HePDF", "", str(FONT_REG))
        self.add_font("HePDF", "B", str(FONT_BOLD))

    def footer(self) -> None:
        self.set_y(-14)
        self.set_draw_color(180, 180, 180)
        self.set_line_width(0.2)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(1.2)
        self.set_font("HePDF", "", 7.5)
        self.set_text_color(70, 70, 70)
        self.cell(0, 3.6, _he("רחוב הברזל 25 ת\"א 6971035  ·  www.ddc.co.il"), align="C", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 3.6, _he("טל' 03-6474998  ·  פקס 03-6474598  ·  service@ddc.co.il"), align="C")


def _field(data: dict, key: str) -> str:
    value = str(data.get(key) or "").strip()
    if key in _DATE_FIELDS:
        return _display_date(value)
    return value


def _inline_row(pdf: FPDF, cells: list[tuple[str, str, float]]) -> None:
    usable = pdf.epw
    total = sum(weight for _, _, weight in cells) or 1
    y = pdf.get_y()
    height = 7.2
    x = pdf.l_margin + usable
    pdf.set_font("HePDF", "", 9)
    pdf.set_text_color(17, 17, 17)
    for label, value, weight in cells:
        width = usable * weight / total
        x -= width
        text = f"{label}: {value}" if value else f"{label}:"
        pdf.set_xy(x + 0.6, y)
        pdf.set_draw_color(210, 210, 210)
        pdf.cell(width - 1.2, height, _he(text), align="R", border="B")
    pdf.set_xy(pdf.l_margin, y + height + 0.8)


def _block(pdf: FPDF, label: str, value: str, height: float = 22) -> None:
    pdf.set_font("HePDF", "B", 9)
    pdf.set_text_color(17, 17, 17)
    pdf.cell(0, 5, _he(label), align="R", new_x="LMARGIN", new_y="NEXT")
    y = pdf.get_y()
    pdf.set_draw_color(190, 190, 190)
    pdf.set_line_width(0.2)
    pdf.rect(pdf.l_margin, y, pdf.epw, height)
    pdf.set_xy(pdf.l_margin + 1.5, y + 1.2)
    pdf.set_font("HePDF", "", 9)
    pdf.multi_cell(pdf.epw - 3, 4.4, _he(value or "—"), align="R")
    pdf.set_y(y + height + 2)


def build_service_call_pdf(
    *,
    fields: dict,
    serial_number: str = "",
    request_id: str = "",  # API compat only; never printed (filename uses it in pdf_attachment)
) -> bytes:
    _ = request_id
    data = dict(fields or {})
    if serial_number:
        data["serialNumber"] = serial_number
    opened = _display_date(str(data.get("openedAt") or data.get("serviceCallDate") or "").strip())

    pdf = ServiceCallPDF()
    pdf.set_margins(12, 10, 12)
    pdf.add_page()
    pdf.set_text_color(17, 17, 17)

    if LOGO.is_file():
        pdf.image(str(LOGO), x=pdf.w - pdf.r_margin - 38, y=8, w=38)
    pdf.set_xy(pdf.l_margin, 9)
    pdf.set_font("HePDF", "B", 14)
    pdf.cell(pdf.epw - 42, 7, _he("בקשה להזמנת שירות"), align="R")
    pdf.set_font("HePDF", "", 9)
    bits = ["מעודכן 01/2026"]
    if serial_number:
        bits.append(f"מספר {serial_number}")
    if opened:
        bits.append(opened)
    x_right = pdf.w - pdf.r_margin - 42
    for part in bits:
        vis = _he(part)
        width = pdf.get_string_width(vis) + 3.2
        x_right -= width
        pdf.set_xy(x_right, 16.5)
        pdf.cell(width, 5, vis, align="R")
    pdf.set_y(24)
    pdf.set_draw_color(0, 173, 239)
    pdf.set_line_width(0.45)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(3)

    pdf.set_font("HePDF", "", 8.5)
    pdf.multi_cell(
        0,
        4.2,
        _he("אבקש לקבל שירות למערכת בקרת המבנה. החשבונית תירשם על שם החברה וח.פ. שלהלן."),
        align="R",
    )
    pdf.ln(1.5)

    _inline_row(
        pdf,
        [
            ("שם לחשבונית", _field(data, "companyName"), 1.4),
            ("ח.פ.", _field(data, "companyId") or _field(data, "nationalId"), 1),
        ],
    )
    _inline_row(
        pdf,
        [
            ("שם האתר", _field(data, "siteName"), 1.3),
            ("תאריך", opened, 0.8),
            ("הסכם שירות", _field(data, "serviceAgreement"), 0.9),
        ],
    )
    _inline_row(
        pdf,
        [
            ("שם המבקש", _field(data, "contactName"), 1.1),
            ("טלפון", _field(data, "phone"), 0.9),
            ("מייל", _field(data, "email"), 1.3),
        ],
    )
    _inline_row(
        pdf,
        [
            ("ציוד", _field(data, "equipmentType") or _field(data, "model") or _field(data, "device"), 1.5),
            ("כמות", _field(data, "quantity"), 0.5),
            ("מדינה", _field(data, "country"), 0.7),
        ],
    )
    pdf.ln(1)
    fault = _field(data, "faultDescription")
    if len(fault) > 420:
        fault = fault[:417].rstrip() + "..."
    _block(pdf, "תיאור התקלות", fault, height=24)
    _inline_row(pdf, [("חותמת + שם מפורט", _field(data, "signerName"), 1)])

    pdf.ln(1.5)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("HePDF", "B", 9)
    pdf.cell(0, 5, _he("תנאים שאושרו בטופס"), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("HePDF", "", 7.5)
    agreements = [
        ("paymentTermsAccepted", TERMS[0]),
        ("overtimeTermsAccepted", TERMS[1]),
        ("repeatCallTermsAccepted", TERMS[2]),
        ("travelParkingTermsAccepted", TERMS[3]),
    ]
    for key, line in agreements:
        agreed = _field(data, key) == "כן"
        mark = "כן" if agreed else "לא"
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 3.6, _he(f"[{mark}] {line}"), align="R")
    marketing = _field(data, "marketingConsent")
    if marketing:
        pdf.ln(0.8)
        pdf.set_font("HePDF", "", 8)
        pdf.cell(0, 4, _he(f"הסכמה שיווקית: {marketing}"), align="R")

    out = io.BytesIO()
    pdf.output(out)
    return out.getvalue()


def pdf_attachment(
    *,
    fields: dict,
    serial_number: str = "",
    request_id: str = "",
) -> dict:
    raw = build_service_call_pdf(
        fields=fields,
        serial_number=serial_number,
    )
    filename = f"service-call-{serial_number or request_id or 'form'}.pdf"
    return {
        "filename": filename,
        "content": base64.b64encode(raw).decode("ascii"),
        "encoding": "base64",
        "contentType": "application/pdf",
    }
