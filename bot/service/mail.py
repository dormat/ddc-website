"""Outbound mail for assistant purchase / lab requests via Firestore mail queue."""

from __future__ import annotations

import logging
import os
import re
from typing import Any

from google.cloud import firestore

log = logging.getLogger(__name__)

SERVICE_EMAIL = os.environ.get("SERVICE_EMAIL", "service@ddc.co.il")
MAIL_COLLECTION = os.environ.get("MAIL_COLLECTION", "mail")
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "control-applications-ddc")
ADMIN_ORIGIN = os.environ.get(
    "ADMIN_ORIGIN", "https://control-applications-admin.web.app"
).rstrip("/")

_db: firestore.Client | None = None


def db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client(project=PROJECT_ID)
    return _db


def _kind_label(kind: str) -> str:
    if kind == "purchase":
        return "בקשת רכישה / הצעת מחיר"
    if kind == "lab":
        return "קריאת שירות"
    return "פנייה"


_DATE_FIELDS = {"openedAt", "serviceCallDate", "deliveryDate"}
_ISO_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")


def _display_date(value: str, sep: str = "-") -> str:
    """Show calendar dates as day-month-year in outbound mail."""
    text = str(value or "").strip()
    match = _ISO_DATE.match(text)
    if not match:
        return text
    year, month, day = match.groups()
    return f"{day}{sep}{month}{sep}{year}"


def _field(fields: dict, *keys: str) -> str:
    for key in keys:
        value = str(fields.get(key) or "").strip()
        if value:
            return value
    return ""


def format_lab_service_mail(
    fields: dict,
    serial_number: str = "",
    request_id: str = "",
) -> tuple[str, str]:
    """Sectioned Hebrew body for the internal service-call email."""
    import html as html_lib

    serial = str(serial_number or fields.get("serialNumber") or "").strip()
    opened = _display_date(
        _field(fields, "openedAt", "serviceCallDate"),
        sep="/",
    )
    sections = [
        (
            "פרטי הקריאה",
            [
                ("מספר קריאה", serial),
                ("תאריך פתיחה", opened),
                ("לקוח בהסכם שירות", _field(fields, "serviceAgreement")),
            ],
        ),
        (
            "פרטי הלקוח",
            [
                ("שם חברה", _field(fields, "companyName")),
                ("ח.פ. / תעודת זהות", _field(fields, "companyId", "nationalId")),
                ("איש קשר", _field(fields, "contactName", "fullName")),
                ("טלפון", _field(fields, "phone")),
                ("דואר אלקטרוני", _field(fields, "email")),
            ],
        ),
        (
            "פרטי האתר והציוד",
            [
                ("שם אתר / פרויקט", _field(fields, "siteName")),
                ("מדינה", _field(fields, "country")),
                ("סוג ציוד", _field(fields, "equipmentType", "model", "device")),
                ("כמות", _field(fields, "quantity")),
            ],
        ),
        (
            "פרטי הפנייה",
            [
                ("תיאור התקלה", _field(fields, "faultDescription")),
            ],
        ),
        (
            "פרטי החותם",
            [
                ("שם החותם ותפקיד", _field(fields, "signerName")),
            ],
        ),
    ]
    title = f"קריאת שירות חדשה – {serial}" if serial else "קריאת שירות חדשה"
    text_lines = [title, ""]
    html_parts = [
        '<div dir="rtl" style="direction:rtl;text-align:right;'
        'font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;">',
        (
            '<p style="margin:0 0 1.1em;text-align:right;font-size:20px;'
            'font-weight:700;line-height:1.3;">'
            f"{html_lib.escape(title)}</p>"
        ),
    ]
    for heading, rows in sections:
        text_lines.append(f"{heading}:")
        text_lines.append("")
        html_parts.append(
            '<p style="margin:1.15em 0 0.45em;text-align:right;font-size:17px;'
            'font-weight:700;text-decoration:underline;line-height:1.3;">'
            f"{html_lib.escape(heading)}:</p>"
        )
        for label, value in rows:
            shown = value or "—"
            text_lines.append(f"{label}: {shown}")
            html_parts.append(
                '<p style="margin:0 0 0.35em;text-align:right;">'
                f"<b>{html_lib.escape(label)}:</b> {html_lib.escape(shown)}</p>"
            )
        text_lines.append("")
    if request_id:
        link = f"{ADMIN_ORIGIN}/assistant/requests/{request_id}"
        text_lines.append(f"במערכת הניהול: {link}")
        html_parts.append(
            '<p style="margin:1.2em 0 0;text-align:right;font-size:13px;">'
            f'<a href="{html_lib.escape(link)}">במערכת הניהול</a></p>'
        )
    html_parts.append("</div>")
    return "\n".join(text_lines).strip() + "\n", "".join(html_parts)


def _service_subject(kind: str, serial: str, company: str) -> str:
    if kind == "purchase":
        label = "הצעת מחיר דיגיטלית"
    elif kind == "lab":
        label = "קריאת שרות דיגיטלית"
    else:
        label = "פנייה דיגיטלית"
    parts = [label]
    if serial:
        parts.append(f"מספר {serial}")
    if company:
        parts.append(company)
    return " ".join(parts)


def format_request_body(
    kind: str,
    fields: dict,
    request_id: str = "",
    serial_number: str = "",
) -> str:
    lines = [f"סוג פנייה: {_kind_label(kind)}", ""]
    if serial_number:
        lines.append(f"מספר קריאה: {serial_number}")
        lines.append("")
    labels = {
        "fullName": "שם מלא",
        "companyName": "שם חברה",
        "companyId": "ח.פ. / תעודת זהות",
        "nationalId": "ח.פ. / תעודת זהות",
        "email": "דואר אלקטרוני",
        "phone": "טלפון",
        "country": "מדינה",
        "product": "מוצר",
        "quantity": "כמות",
        "notes": "הערות",
        "openedAt": "תאריך פתיחת קריאת השירות",
        "serviceCallDate": "תאריך פתיחת קריאת השירות",
        "serviceAgreement": "לקוח בהסכם שירות",
        "siteName": "שם אתר / פרויקט",
        "contactName": "איש קשר",
        "deliveryDate": "תאריך מסירה",
        "equipmentType": "סוג ציוד",
        "model": "דגם",
        "faultDescription": "תיאור התקלה",
        "signerName": "שם החותם ותפקיד",
        "device": "מכשיר בשיחה",
        "paymentTermsAccepted": "אושרה התחייבות לתשלום",
        "overtimeTermsAccepted": "אושרו שעות חריגות",
        "repeatCallTermsAccepted": "אושר חיוב בקריאה חוזרת",
        "travelParkingTermsAccepted": "אושרו נסיעות וחניה",
    }
    products = fields.get("products")
    skip_product_keys = False
    if isinstance(products, list) and products:
        skip_product_keys = True
        lines.append("מוצרים:")
        for item in products:
            if not isinstance(item, dict):
                continue
            name = str(item.get("product") or "").strip()
            qty = str(item.get("quantity") or "").strip()
            if not name:
                continue
            lines.append(f"  • {name}" + (f" × {qty}" if qty else ""))
    for key, label in labels.items():
        if skip_product_keys and key in {"product", "quantity"}:
            continue
        value = str(fields.get(key) or "").strip()
        if key in _DATE_FIELDS:
            value = _display_date(value)
        if value:
            lines.append(f"{label}: {value}")
    if request_id:
        lines.append("")
        lines.append(f"במערכת הניהול: {ADMIN_ORIGIN}/assistant/requests/{request_id}")
    lines.append("")
    lines.append("- נשלח מעוזר ישומי בקרה באתר -")
    return "\n".join(lines)


def customer_confirmation(kind: str, name: str) -> str:
    who = (name or "").strip() or "לקוח/ה יקר/ה"
    if kind == "purchase":
        topic = "בקשת הרכישה / הצעת המחיר"
    elif kind == "lab":
        topic = "קריאת השירות"
    else:
        topic = "פנייתכם"
    return (
        f"שלום {who},\n\n"
        f"קיבלנו את {topic} שלכם בישומי בקרה.\n"
        "נציג יחזור אליכם בהקדם.\n\n"
        "לשאלות דחופות:\n"
        f"{SERVICE_EMAIL}\n"
        "03-6474998 שלוחת שירות\n\n"
        "בברכה,\n"
        "ישומי בקרה"
    )


def _text_to_rtl_html(text: str) -> str:
    """Gmail-friendly RTL HTML so Hebrew aligns to the right."""
    import html as html_lib

    blocks = []
    for para in str(text or "").replace("\r\n", "\n").split("\n\n"):
        lines = [html_lib.escape(line) for line in para.split("\n")]
        blocks.append("<p style=\"margin:0 0 1em;text-align:right;\">" + "<br>".join(lines) + "</p>")
    inner = "".join(blocks) or "<p style=\"margin:0;text-align:right;\"></p>"
    return (
        '<div dir="rtl" style="direction:rtl;text-align:right;'
        'font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;">'
        f"{inner}</div>"
    )


def _queue_email(
    *,
    to: str,
    subject: str,
    text: str,
    reply_to: str = "",
    kind: str = "",
    role: str = "",
    html: str = "",
    attachments: list[dict] | None = None,
) -> str:
    body_html = html or _text_to_rtl_html(text)
    message: dict[str, Any] = {
        "subject": subject,
        "text": text,
        "html": body_html,
    }
    if attachments:
        message["attachments"] = attachments
    doc: dict[str, Any] = {
        "to": [to],
        "message": message,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "meta": {
            "source": "assistant",
            "kind": kind,
            "role": role,
        },
    }
    # Trigger Email extension: Reply in Gmail goes to this address.
    if reply_to:
        doc["replyTo"] = reply_to
    _ref = db().collection(MAIL_COLLECTION).document()
    _ref.set(doc)
    return _ref.id


def notify_request(
    kind: str,
    fields: dict,
    request_id: str = "",
    serial_number: str = "",
) -> dict:
    """Queue service + customer emails in Firestore for the Trigger Email extension."""
    customer_email = str(fields.get("email") or "").strip()
    customer_name = str(fields.get("fullName") or fields.get("contactName") or "").strip()
    company = str(fields.get("companyName") or "").strip() or customer_name or customer_email or "פנייה"
    serial = str(serial_number or fields.get("serialNumber") or "").strip()
    subject = _service_subject(kind, serial, company)
    service_html = ""
    if kind == "lab":
        body, service_html = format_lab_service_mail(
            fields,
            serial_number=serial,
            request_id=request_id,
        )
    else:
        body = format_request_body(
            kind,
            fields,
            request_id=request_id,
            serial_number=serial,
        )
    confirm = customer_confirmation(kind, customer_name)
    if serial and kind == "lab":
        confirm = (
            f"שלום {customer_name or 'לקוח/ה יקר/ה'},\n\n"
            f"קיבלנו את קריאת השירות שלכם בישומי בקרה.\n"
            f"מספר הקריאה שלכם: {serial}\n"
            "נציג יחזור אליכם בהקדם.\n\n"
            "לשאלות דחופות:\n"
            f"{SERVICE_EMAIL}\n"
            "03-6474998 שלוחת שירות\n\n"
            "בברכה,\n"
            "ישומי בקרה"
        )
    result = {
        "serviceEmail": False,
        "customerEmail": False,
        "channel": "firestore-mail",
        "serviceMailId": "",
        "customerMailId": "",
        "serialNumber": serial,
        "pdfAttached": False,
    }

    attachments: list[dict] = []
    if kind == "lab":
        try:
            import lab_pdf

            attachments.append(
                lab_pdf.pdf_attachment(
                    fields=fields,
                    serial_number=serial,
                    request_id=request_id,
                )
            )
            result["pdfAttached"] = True
        except Exception:
            log.exception("Failed to build service-call PDF")

    try:
        result["serviceMailId"] = _queue_email(
            to=SERVICE_EMAIL,
            subject=subject,
            text=body,
            reply_to=customer_email,
            kind=kind,
            role="service",
            html=service_html,
            attachments=attachments or None,
        )
        result["serviceEmail"] = True
    except Exception:
        log.exception("Failed to queue service email")

    if customer_email:
        try:
            result["customerMailId"] = _queue_email(
                to=customer_email,
                subject="ישומי בקרה - קיבלנו את פנייתכם"
                + (f" ({serial})" if serial else ""),
                text=confirm,
                reply_to=SERVICE_EMAIL,
                kind=kind,
                role="customer",
                attachments=attachments or None,
            )
            result["customerEmail"] = True
        except Exception:
            log.exception("Failed to queue customer email")

    return result


PUBLIC_SITE_ORIGIN = os.environ.get(
    "PUBLIC_SITE_ORIGIN", "https://control-applications-ddc.web.app"
).rstrip("/")


def _customer_name(fields: dict) -> str:
    return str(fields.get("fullName") or fields.get("contactName") or "").strip()


def hot_lead_alert(fields: dict, request_id: str = "") -> str:
    name = _customer_name(fields) or str(fields.get("email") or "").strip()
    subject = f"[ישומי בקרה] ליד חם - {name or 'בקשת רכישה'}"
    lines = [
        "זוהתה בקשת רכישה כליד חם (כמות > 1, דחיפות בהערות, או מוצר גבוה).",
        "",
        format_request_body("purchase", fields, request_id=request_id),
    ]
    return _queue_email(
        to=SERVICE_EMAIL,
        subject=subject,
        text="\n".join(lines),
        reply_to=str(fields.get("email") or "").strip(),
        kind="purchase",
        role="hot-lead",
    )


def csat_invite(*, email: str, name: str, token: str, kind: str = "lab") -> str:
    who = (name or "").strip() or "לקוח/ה יקר/ה"
    link = f"{PUBLIC_SITE_ORIGIN}/he/csat/?t={token}"
    topic = "קריאת השירות" if kind == "lab" else "פנייתכם"
    text = (
        f"שלום {who},\n\n"
        f"סיימנו לטפל ב{topic}. נשמח לשמוע איך היה השירות.\n"
        f"המשוב קצר ולוקח פחות מדקה:\n{link}\n\n"
        "בברכה,\n"
        "ישומי בקרה"
    )
    return _queue_email(
        to=email,
        subject="ישומי בקרה - איך היה השירות?",
        text=text,
        reply_to=SERVICE_EMAIL,
        kind=kind,
        role="csat-invite",
    )


def csat_thanks(
    *,
    email: str,
    name: str,
    marketing_consent: bool = False,
    settings: dict | None = None,
) -> str:
    who = (name or "").strip() or "לקוח/ה יקר/ה"
    settings = settings or {}
    lines = [
        f"שלום {who},",
        "",
        "תודה רבה על המשוב החיובי!",
        "שמחים שסייענו.",
    ]
    if marketing_consent:
        review = str(settings.get("googleReviewUrl") or "").strip()
        upsell_title = str(settings.get("upsellTitle") or "").strip()
        upsell_url = str(settings.get("upsellUrl") or "").strip()
        upsell_blurb = str(settings.get("upsellBlurb") or "").strip()
        if review:
            lines.extend(["", "אם תרצו, אפשר גם לדרג אותנו בגוגל:", review])
        if upsell_url:
            lines.append("")
            if upsell_title:
                lines.append(upsell_title)
            if upsell_blurb:
                lines.append(upsell_blurb)
            lines.append(upsell_url)
    lines.extend(["", "בברכה,", "ישומי בקרה"])
    return _queue_email(
        to=email,
        subject="ישומי בקרה - תודה על המשוב",
        text="\n".join(lines),
        reply_to=SERVICE_EMAIL,
        kind="lab",
        role="csat-thanks",
    )


def csat_clarify(*, email: str, name: str) -> str:
    who = (name or "").strip() or "לקוח/ה יקר/ה"
    text = (
        f"שלום {who},\n\n"
        "תודה על המשוב.\n"
        "נשמח להבין מה אפשר לשפר — אפשר להשיב למייל הזה בקצרה.\n\n"
        f"לשאלות: {SERVICE_EMAIL}\n"
        "03-6474998 שלוחת שירות\n\n"
        "בברכה,\n"
        "ישומי בקרה"
    )
    return _queue_email(
        to=email,
        subject="ישומי בקרה - נשמח לשמוע עוד",
        text=text,
        reply_to=SERVICE_EMAIL,
        kind="lab",
        role="csat-clarify",
    )


def csat_bad_alert(
    *,
    fields: dict,
    request_id: str,
    rating: int,
    comment: str,
    resolved: bool,
) -> str:
    name = _customer_name(fields) or str(fields.get("email") or "").strip()
    subject = f"[ישומי בקרה] משוב שלילי CSAT - {name or request_id}"
    thumb = "👍" if resolved else "👎"
    lines = [
        "התקבל משוב שלילי / לא מרוצה. הקריאה נפתחה מחדש ל־in_progress.",
        "",
        f"דירוג: {rating}/5",
        f"אגודל: {thumb}",
        f"הערה: {(comment or '').strip() or '—'}",
        "",
        format_request_body("lab", fields, request_id=request_id),
    ]
    return _queue_email(
        to=SERVICE_EMAIL,
        subject=subject,
        text="\n".join(lines),
        reply_to=str(fields.get("email") or "").strip(),
        kind="lab",
        role="csat-bad",
    )


def quote_followup(*, email: str, name: str, day: int, fields: dict | None = None) -> str:
    who = (name or "").strip() or "לקוח/ה יקר/ה"
    fields = fields or {}
    product = str(fields.get("product") or "").strip()
    day = int(day)
    if day <= 3:
        opener = "רצינו לוודא שקיבלתם את הצעת המחיר."
    elif day <= 7:
        opener = "עברו כמה ימים מאז הצעת המחיר — נשמח לעזור אם יש שאלות."
    else:
        opener = "עדיין מחכים לתשובה לגבי הצעת המחיר. נשמח לסייע."
    lines = [
        f"שלום {who},",
        "",
        opener,
    ]
    if product:
        lines.append(f"לגבי: {product}")
    lines.extend(
        [
            "",
            f"לשאלות: {SERVICE_EMAIL}",
            "03-6474998 שלוחת שירות",
            "",
            "בברכה,",
            "ישומי בקרה",
        ]
    )
    return _queue_email(
        to=email,
        subject=f"ישומי בקרה - מעקב הצעת מחיר ({day} ימים)",
        text="\n".join(lines),
        reply_to=SERVICE_EMAIL,
        kind="purchase",
        role=f"quote-followup-{day}",
    )
