"""Product assistant for Control Applications meters/controllers.

Cloud Run calls Gemini with the project service account. Each device has its own
manual pack. Manual text is cached per device when the model allows it; a photo
is sent only on the turn that includes one.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, Response, jsonify, request, stream_with_context
from google.cloud import firestore, storage

KNOWLEDGE_DIR = Path(os.environ.get("KNOWLEDGE_DIR", Path(__file__).resolve().parents[1] / "knowledge"))
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "control-applications-ddc")
GEMINI_LOCATION = os.environ.get("GEMINI_LOCATION", "europe-west4")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
PHOTO_BUCKET = os.environ.get("PHOTO_BUCKET", "control-applications-ddc-assistant")
MAX_MESSAGE_CHARS = 2000
MAX_PHOTO_BYTES = 4_000_000
MAX_TURNS = int(os.environ.get("MAX_TURNS", "30"))
MAX_DAILY_TURNS = int(os.environ.get("MAX_DAILY_TURNS", "150"))
CACHE_TTL_SECONDS = 6 * 60 * 60

REFUSAL_HE = (
    "אין לי תשובה לזה כרגע. אם זו שאלה על מסך, מקש או הגדרה במכשיר — אשמח לנסות שוב. "
    "אפשר גם לפנות לשירות: service@ddc.co.il או בטלפון 03-6474998 שלוחת שירות."
)
REFUSAL_EN = (
    "I don't have an answer for that right now. If it's about a screen, key, or setting on the device, "
    "I'm happy to try again. You can also contact service: service@ddc.co.il or phone 03-6474998 (service extension)."
)
SERVICE_CONTACT_HE = "service@ddc.co.il או 03-6474998 שלוחת שירות"
DEFAULT_DEVICE = "lt22"
KNOWN_DEVICES = ("lt22", "mc8", "pfc", "pfc10")
INCOMPLETE_HE = (
    "רגע, התשובה נקטעה לי באמצע. נסו לשלוח שוב, ואם זה חוזר — "
    + SERVICE_CONTACT_HE
    + "."
)
ERROR_HE = (
    "משהו השתבש לי עכשיו. נסו שוב בעוד רגע, ואם זה ממשיך — "
    + SERVICE_CONTACT_HE
    + "."
)
WHATSAPP_REFUSAL_HE = "אין לי מספיק מידע על זה כאן. אני עוצר, ואפשר להמשיך בשיחה הזו עם אדם מאיתנו."
WHATSAPP_REFUSAL_EN = "I don't have enough on that here. I'll stop, and someone from our team can continue in this chat."
WHATSAPP_HANDOFF_HE = "בסדר. אני עוצר כאן, ואפשר להמשיך בשיחה הזו עם אדם מאיתנו."
WHATSAPP_HANDOFF_EN = "All right. I'll stop here, and someone from our team can continue in this chat."
OUTPUT_TOKENS = 8192
OUTPUT_TOKENS_RETRY = 32768

DEFAULT_ORIGINS = (
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://control-applications-ddc.web.app",
    "https://control-applications-ddc.firebaseapp.com",
    "https://control-applications-cms.web.app",
    "https://control-applications-preview.web.app",
    "https://ddc.co.il",
    "https://www.ddc.co.il",
)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[+\d][\d\s\-()]{7,}$")

app = Flask(__name__)
_lock = threading.Lock()
_caches: dict[str, dict[str, object]] = {}
_ip_hits: dict[str, list[float]] = {}
_db: firestore.Client | None = None
_bucket = None
_genai = None
_device_meta: dict[str, dict] | None = None
_figures_by_device: dict[str, list[dict]] = {}
_notes_cache: dict[str, object] = {"text": None, "updatedAt": "", "fetchedAt": 0.0}


def allowed_origins() -> set[str]:
    extra = os.environ.get("ALLOWED_ORIGINS", "")
    values = list(DEFAULT_ORIGINS)
    if extra.strip():
        values.extend(part.strip() for part in extra.split(",") if part.strip())
    return set(values)


def normalize_device(value: str | None) -> str:
    device = str(value or DEFAULT_DEVICE).strip().lower()
    if device not in KNOWN_DEVICES:
        return DEFAULT_DEVICE
    if not (KNOWLEDGE_DIR / device / "manual.md").is_file():
        return DEFAULT_DEVICE
    return device


def load_devices() -> dict[str, dict]:
    global _device_meta
    if _device_meta is not None:
        return _device_meta
    path = KNOWLEDGE_DIR / "devices.json"
    items = []
    if path.is_file():
        try:
            items = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            app.logger.exception("Could not load devices.json")
    meta: dict[str, dict] = {}
    for item in items if isinstance(items, list) else []:
        device_id = normalize_device(str(item.get("id") or ""))
        meta[device_id] = {
            "id": device_id,
            "label": str(item.get("label") or device_id.upper()),
            "subtitle": str(item.get("subtitle") or ""),
            "productName": str(item.get("productName") or item.get("label") or device_id.upper()),
        }
    if DEFAULT_DEVICE not in meta:
        meta[DEFAULT_DEVICE] = {
            "id": DEFAULT_DEVICE,
            "label": "LT22",
            "subtitle": "מונה אנרגיה ELNet",
            "productName": "מונה אנרגיה ELNet LT22",
        }
    _device_meta = meta
    return meta


def device_label(device_id: str) -> str:
    return load_devices().get(normalize_device(device_id), {}).get("label") or device_id.upper()


def product_name(device_id: str) -> str:
    return (
        load_devices().get(normalize_device(device_id), {}).get("productName")
        or device_label(device_id)
    )


def load_text(name: str) -> str:
    return (KNOWLEDGE_DIR / name).read_text(encoding="utf-8").strip()


def load_device_manual(device_id: str) -> str:
    device = normalize_device(device_id)
    path = KNOWLEDGE_DIR / device / "manual.md"
    if path.is_file():
        return path.read_text(encoding="utf-8").strip()
    # Backward compatibility for the original LT22 flat file.
    if device == DEFAULT_DEVICE:
        return load_text("lt22.md")
    return ""


def load_figures(device_id: str) -> list[dict]:
    device = normalize_device(device_id)
    if device in _figures_by_device:
        return _figures_by_device[device]
    path = KNOWLEDGE_DIR / device / "figures.json"
    if not path.is_file() and device == DEFAULT_DEVICE:
        path = KNOWLEDGE_DIR / "figures.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        data = []
    figures = data if isinstance(data, list) else []
    _figures_by_device[device] = figures
    return figures


def figure_by_id(device_id: str, number: int) -> dict | None:
    for item in load_figures(device_id):
        if item.get("id") == number:
            return item
    return None


def invalidate_manual_cache(device_id: str | None = None) -> None:
    """Drop Gemini cache(s) so the next question picks up new notes/manuals."""
    with _lock:
        if device_id:
            device = normalize_device(device_id)
            _caches.pop(device, None)
        else:
            _caches.clear()


def load_notes() -> str:
    """Admin-edited notes in Firestore, with the local notes.md file as fallback."""
    now = time.time()
    cached_text = _notes_cache.get("text")
    if isinstance(cached_text, str) and now - float(_notes_cache.get("fetchedAt") or 0) < 20:
        return cached_text
    text = ""
    updated = ""
    try:
        snap = db().collection("assistantConfig").document("notes").get()
        if snap.exists:
            data = snap.to_dict() or {}
            text = str(data.get("text") or "").strip()
            updated = str(data.get("updatedAt") or "")
    except Exception:
        app.logger.exception("Could not load assistant notes from Firestore")
    if not text:
        try:
            text = load_text("notes.md")
        except Exception:
            text = ""
    previous = str(_notes_cache.get("updatedAt") or "")
    _notes_cache["text"] = text
    _notes_cache["updatedAt"] = updated
    _notes_cache["fetchedAt"] = now
    if previous and updated and previous != updated:
        invalidate_manual_cache()
    return text


def system_instruction(device_id: str) -> str:
    device = normalize_device(device_id)
    label = device_label(device)
    product = product_name(device)
    catalog = "\n".join(f'{item["id"]}: {item["title"]}' for item in load_figures(device))
    return f"""You are the product assistant for the {product} ({label}), made by ישומי בקרה / Control Applications.
Answer only from the {label} product material and the notes included in this conversation. You have no other sources and no tools. Do not answer about other products.
If the visitor's whole message is only a greeting or a thank-you, and it contains no question, reply with one short warm sentence and invite them to ask. If the message asks anything, answer that question immediately. Do not greet them first, and do not use a stock hello such as "היי, שמחים שפניתם. במה אפשר לעזור?" when they already asked something.
If the answer is not in that material, write a short warm refusal in the visitor's language (1–3 sentences) and nothing else. Vary the wording each time; do not sound like a template or a system error.
A good refusal: say you don't know the answer for that, invite a follow-up about screens, keys, or settings when that fits, and for anything else point to service@ddc.co.il or phone 03-6474998 שלוחת שירות (service extension). You may also mention the contact form further down the page.
Never mention a manual, user guide, handbook, documentation source, מדריך, or that you are reading from materials. Do not say you "don't have it in front of you." Just say you don't know / don't have an answer, and offer human help via service email/phone.
Set handoff to false on a normal answer, a clarifying question, or a greeting. Set handoff to true when you refuse, or when the visitor asks to speak with a person.
Set needsMore to true only when your answer is asking the visitor for more detail before you can help (for example a vague malfunction, missing symptoms, unclear which screen, or you need a photo). In that case ask one clear question, keep figureIds empty unless a screenshot already helps, and do not wrap up the conversation.
Set needsMore to false when you gave a complete answer, a greeting, or a refusal. The website shows a "anything else?" follow-up only when needsMore is false.
If the visitor message starts with the line "ערוץ: וואטסאפ", this turn is WhatsApp. Refuse warmly without mentioning a form or a web page, say you will stop so a person can continue in that same chat, and do not repeat the channel line.
Do not say that any section was removed, hidden, or restricted.
If the visitor asks about technician function codes, service codes, a cold reset, calibration, deleting stored energy history, or a code that performs those actions, refuse warmly and nothing else. Do not name such a code, and do not say that a list of codes exists.
Do not invent specifications.
Safety: any step that involves live electrical work, wiring, installation, CT/PT connections, capacitor banks, opening a panel, or changing supply-side settings must clearly say it is for a certified electrician only. Do not give DIY electrical instructions. Prefer describing what the screen shows and what a qualified electrician should check. Repeat the electrician limit whenever relevant, not only once.
When a step is only for a certified electrician, say that clearly without naming a manual.
If the visitor asks to open a lab test / service intake / "בדיקת מוצר במעבדה" / "קריאת שירות", tell them briefly that a service form is available in the chat (or via service), and set needsMore to false. Do not invent form fields yourself.
If the visitor attaches a photo: match it to a known {label} screen, read the numbers you can see, and explain what each field means. Do not say whether those readings are good or bad, and do not judge the wiring. If the photo is not a {label} screen, refuse warmly.
Keep on-screen labels as they appear on the device.
When a screenshot would help, put its figure number in figureIds. Use only numbers from this list, and leave figureIds empty when no screenshot is needed. When you mention a screenshot in the answer, call it by that same number, for example איור 37. The visitor sees that number under the image. Do not renumber the images as image 1, image 2, תמונה 1, or the first/second image.
Never tell the visitor that answers come from a manual.
{catalog}

Tone examples only (rewrite in your own words; never copy them verbatim):
Hebrew web: {REFUSAL_HE}
English web: {REFUSAL_EN}
WhatsApp Hebrew: {WHATSAPP_REFUSAL_HE}
WhatsApp English: {WHATSAPP_REFUSAL_EN}
"""


def knowledge_prefix(device_id: str) -> str:
    device = normalize_device(device_id)
    notes = load_notes()
    if not notes:
        notes = "אין הערות נוספות."
    return (
        f"חומר מוצר {device_label(device)}:\n\n"
        + load_device_manual(device)
        + "\n\nהערות נוספות:\n"
        + notes
    )


def db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client(project=PROJECT_ID)
    return _db


def photo_bucket():
    global _bucket
    if _bucket is None:
        _bucket = storage.Client(project=PROJECT_ID).bucket(PHOTO_BUCKET)
    return _bucket


def genai_client():
    global _genai
    if _genai is None:
        from google import genai

        _genai = genai.Client(vertexai=True, project=PROJECT_ID, location=GEMINI_LOCATION)
    return _genai


def _create_cache(device_id: str) -> None:
    """Build the cached manual in the background. A question must not wait on this."""
    from google.genai import types

    device = normalize_device(device_id)
    try:
        cache = genai_client().caches.create(
            model=GEMINI_MODEL,
            config=types.CreateCachedContentConfig(
                display_name=f"{device}-manual",
                system_instruction=system_instruction(device),
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=knowledge_prefix(device))],
                    )
                ],
                ttl=f"{CACHE_TTL_SECONDS}s",
            ),
        )
    except Exception:
        app.logger.exception(
            "Gemini cache was not created for %s; the manual will be sent with each question",
            device,
        )
        with _lock:
            entry = _caches.setdefault(device, {})
            entry["started"] = False
        return
    with _lock:
        _caches[device] = {
            "name": cache.name,
            "until": time.time() + CACHE_TTL_SECONDS - 60,
            "started": False,
        }


def cached_manual(device_id: str) -> str | None:
    """Return a ready cache name, or None so the request sends the manual inline."""
    device = normalize_device(device_id)
    now = time.time()
    with _lock:
        entry = _caches.get(device) or {}
        name = entry.get("name")
        until = float(entry.get("until") or 0)
        if isinstance(name, str) and name and now < until:
            return name
        if entry.get("started"):
            return None
        _caches[device] = {"name": None, "until": 0.0, "started": True}
    threading.Thread(target=_create_cache, args=(device,), daemon=True).start()
    return None


def origin_allowed() -> bool:
    origin = request.headers.get("Origin", "")
    return origin in allowed_origins()


def client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def ip_allowed(ip: str) -> bool:
    now = time.time()
    window = [stamp for stamp in _ip_hits.get(ip, []) if now - stamp < 3600]
    if len(window) >= 40:
        _ip_hits[ip] = window
        return False
    window.append(now)
    _ip_hits[ip] = window
    return True


def valid_contact(value: str) -> bool:
    return bool(EMAIL_RE.match(value) or PHONE_RE.match(value))


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def today_key() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def reserve_daily_turn() -> bool:
    ref = db().collection("assistantUsage").document(today_key())
    transaction = db().transaction()

    @firestore.transactional
    def update(transaction):
        snap = ref.get(transaction=transaction)
        count = int(snap.get("count") or 0) if snap.exists else 0
        if count >= MAX_DAILY_TURNS:
            return False
        transaction.set(ref, {"count": count + 1, "updatedAt": firestore.SERVER_TIMESTAMP}, merge=True)
        return True

    return bool(update(transaction))


def json_error(status: int, message: str):
    response = jsonify({"error": message})
    response.status_code = status
    return response


def public_figures(device_id: str, ids: list[int]) -> list[dict]:
    found = []
    seen = set()
    for number in ids:
        if number in seen:
            continue
        item = figure_by_id(device_id, number)
        if item:
            seen.add(number)
            found.append({"id": item["id"], "title": item["title"], "src": item["src"]})
    return found


def finish_reason_name(response) -> str:
    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        return ""
    reason = getattr(candidates[0], "finish_reason", None)
    return str(getattr(reason, "name", None) or reason or "")


def complete_reply(response) -> dict | None:
    """A reply is usable only when the JSON object finished in full."""
    if "MAX_TOKENS" in finish_reason_name(response):
        return None
    try:
        raw = (response.text or "").strip()
    except Exception:
        return None
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict) or not isinstance(parsed.get("answer"), str):
        return None
    ids = parsed.get("figureIds", [])
    if not isinstance(ids, list):
        return None
    answer = parsed["answer"].strip() or REFUSAL_HE
    clean_ids = []
    for number in ids:
        try:
            clean_ids.append(int(number))
        except (TypeError, ValueError):
            continue
    handoff = parsed.get("handoff") is True
    # Refusals / handoffs are finished turns; never keep the chat waiting for more detail.
    needs_more = (not handoff) and parsed.get("needsMore") is True
    return {
        "answer": answer,
        "figureIds": clean_ids,
        "handoff": handoff,
        "needsMore": needs_more,
    }


class IncompleteReply(Exception):
    pass


def reply_attempts(
    history: list[dict],
    message: str,
    photo: tuple[bytes, str] | None,
    device_id: str = DEFAULT_DEVICE,
):
    from google.genai import types

    device = normalize_device(device_id)
    contents: list[types.Content] = []
    cache_name = cached_manual(device)
    if not cache_name:
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=knowledge_prefix(device))])
        )
        contents.append(
            types.Content(
                role="model",
                parts=[types.Part.from_text(text="אענה רק לפי חומר המוצר וההערות שקיבלתי.")],
            )
        )
    for turn in history[-12:]:
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=turn["text"])]))

    parts: list[types.Part] = []
    if photo:
        data, mime = photo
        parts.append(types.Part.from_bytes(data=data, mime_type=mime))
        parts.append(
            types.Part.from_text(
                text=(
                    f"המבקר צירף תמונה של המכשיר שלו ({device_label(device)}). זהו התור הנוכחי.\n"
                    + message
                )
            )
        )
    else:
        parts.append(types.Part.from_text(text=message))
    contents.append(types.Content(role="user", parts=parts))

    thinking = getattr(types, "ThinkingConfig", None)

    def generate(max_output_tokens: int):
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=max_output_tokens,
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "answer": {"type": "STRING"},
                    "figureIds": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                    "handoff": {"type": "BOOLEAN"},
                    "needsMore": {"type": "BOOLEAN"},
                },
                "required": ["answer", "figureIds", "needsMore"],
            },
        )
        # Gemini 2.5 counts hidden reasoning against the output cap.
        if thinking is not None:
            config.thinking_config = thinking(thinking_budget=0)
        if cache_name:
            config.cached_content = cache_name
        else:
            config.system_instruction = system_instruction(device)
        return genai_client().models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )

    reply = complete_reply(generate(OUTPUT_TOKENS))
    if reply:
        yield reply
        return
    app.logger.warning("Assistant reply was cut off; retrying with a higher token limit")
    yield None
    reply = complete_reply(generate(OUTPUT_TOKENS_RETRY))
    if reply:
        yield reply
        return
    app.logger.error("Assistant reply was still cut off after retry")
    raise IncompleteReply()


def read_photo() -> tuple[bytes, str] | None:
    payload = request.get_json(silent=True) or {}
    encoded = payload.get("photoBase64") or ""
    if not encoded:
        return None
    mime = payload.get("photoMime") or "image/jpeg"
    if mime not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise ValueError("bad-photo")
    try:
        data = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        raise ValueError("bad-photo") from exc
    if not data or len(data) > MAX_PHOTO_BYTES:
        raise ValueError("bad-photo")
    return data, mime


def apply_cors(response):
    origin = request.headers.get("Origin", "")
    if origin in allowed_origins():
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Content-Type, X-Cron-Secret"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.after_request
def after(response):
    return apply_cors(response)


@app.route("/api/assistant/session", methods=["OPTIONS"])
@app.route("/api/assistant/session/update", methods=["OPTIONS"])
@app.route("/api/assistant/message", methods=["OPTIONS"])
@app.route("/api/assistant/log", methods=["OPTIONS"])
@app.route("/api/assistant/rating", methods=["OPTIONS"])
@app.route("/api/assistant/request", methods=["OPTIONS"])
def options():
    return apply_cors(app.response_class("", status=204))


def _clean_field(value, max_len: int = 500) -> str:
    return str(value or "").strip()[:max_len]


def validate_purchase_fields(fields: dict) -> str | None:
    if len(_clean_field(fields.get("fullName"), 80)) < 2:
        return "הזינו שם מלא."
    if len(_clean_field(fields.get("companyName"), 120)) < 2:
        return "הזינו שם חברה."
    company_id = _clean_field(fields.get("companyId") or fields.get("nationalId"), 40)
    if len(company_id) < 5:
        return "הזינו ח.פ. או תעודת זהות."
    fields["companyId"] = company_id
    email = _clean_field(fields.get("email"), 120)
    if not EMAIL_RE.match(email):
        return "הזינו דואר אלקטרוני תקין."
    phone = _clean_field(fields.get("phone"), 40)
    if phone and not PHONE_RE.match(phone):
        return "מספר הטלפון לא נראה תקין."
    if len(_clean_field(fields.get("country"), 80)) < 2:
        return "בחרו או הזינו מדינה."
    if len(_clean_field(fields.get("product"), 120)) < 1:
        return "בחרו או כתבו את המוצר."
    qty = _clean_field(fields.get("quantity"), 20)
    if not qty:
        return "הזינו כמות."
    return None


def validate_lab_fields(fields: dict) -> str | None:
    if len(_clean_field(fields.get("companyName"), 120)) < 2:
        return "הזינו שם חברה לחיוב."
    if len(_clean_field(fields.get("companyId"), 40)) < 2:
        return "הזינו ח.פ. או תעודת זהות."
    agreement = _clean_field(fields.get("serviceAgreement"), 10)
    if agreement not in {"כן", "לא"}:
        return "בחרו האם הלקוח בהסכם שירות."
    # openedAt / serviceCallDate accepted when present (fixed display from client).
    if len(_clean_field(fields.get("contactName"), 80)) < 2:
        return "הזינו שם איש קשר."
    if not PHONE_RE.match(_clean_field(fields.get("phone"), 40)):
        return "הזינו טלפון נייד תקין."
    if not EMAIL_RE.match(_clean_field(fields.get("email"), 120)):
        return "הזינו דואר אלקטרוני תקין."
    if len(_clean_field(fields.get("country"), 80)) < 2:
        return "בחרו או הזינו מדינה."
    if len(_clean_field(fields.get("equipmentType"), 120)) < 2:
        return "הזינו סוג ציוד / דגם."
    if len(_clean_field(fields.get("faultDescription"), 2000)) < 5:
        return "תארו את התקלה בקצרה."
    if len(_clean_field(fields.get("signerName"), 120)) < 2:
        return "הזינו שם מלא ותפקיד החותם."
    return None


def _request_chat_summary(kind: str, fields: dict, request_id: str) -> str:
    import mail

    label = mail._kind_label(kind)
    body = mail.format_request_body(kind, fields, request_id=request_id)
    # Drop the trailing admin/footer lines for the in-chat copy.
    lines = [line for line in body.splitlines() if not line.startswith("במערכת הניהול:") and line != "- נשלח מעוזר ישומי בקרה באתר -"]
    while lines and not lines[-1].strip():
        lines.pop()
    lines.insert(0, f"נשלח טופס: {label}")
    return "\n".join(lines)


def _ensure_request_chat(conversation_id: str, fields: dict) -> str:
    """Attach a form to an existing chat, or create a Calls entry when none exists."""
    name = _clean_field(fields.get("contactName") or fields.get("fullName"), 80)
    contact = _clean_field(fields.get("phone") or fields.get("email"), 120)
    device_raw = _clean_field(fields.get("device") or fields.get("equipmentType") or fields.get("model"), 40)
    device = normalize_device(device_raw) if device_raw else "OTHER"

    if conversation_id:
        chat_ref = db().collection("assistantChats").document(conversation_id)
        if chat_ref.get().exists:
            return conversation_id

    conversation_id = uuid.uuid4().hex
    db().collection("assistantChats").document(conversation_id).set(
        {
            "name": name or "לקוח/ה",
            "contact": contact or "",
            "device": device,
            "channel": "web",
            "tokenHash": "",
            "messageCount": 0,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    return conversation_id


def _chat_next_seq(chat) -> int:
    next_seq = chat.get("nextSeq")
    if next_seq is not None:
        try:
            return int(next_seq)
        except (TypeError, ValueError):
            pass
    try:
        return int(chat.get("messageCount") or 0) * 2
    except (TypeError, ValueError):
        return 0


def _append_chat_messages(
    chat_ref,
    entries: list[dict],
    *,
    bump_gemini_turns: int = 0,
) -> None:
    """Append transcript rows with a monotonic seq. UI/form rows do not count as Gemini turns."""
    if not entries:
        return
    chat = chat_ref.get()
    if not chat.exists:
        return
    seq = _chat_next_seq(chat)
    messages = chat_ref.collection("messages")
    now = firestore.SERVER_TIMESTAMP
    for entry in entries:
        role = str(entry.get("role") or "").strip()
        text = str(entry.get("text") or "").strip()
        if role not in {"user", "assistant"} or not text:
            continue
        doc = {
            "role": role,
            "text": text[:4000],
            "kind": str(entry.get("kind") or "ui")[:20],
            "photoPath": str(entry.get("photoPath") or ""),
            "figureIds": list(entry.get("figureIds") or []),
            "seq": seq,
            "createdAt": now,
        }
        request_id = str(entry.get("requestId") or "").strip()
        if request_id:
            doc["requestId"] = request_id[:80]
        messages.add(doc)
        seq += 1
    patch: dict = {"nextSeq": seq, "updatedAt": now}
    if bump_gemini_turns:
        patch["messageCount"] = int(chat.get("messageCount") or 0) + int(bump_gemini_turns)
    chat_ref.update(patch)


def _log_request_on_chat(conversation_id: str, kind: str, fields: dict, request_id: str) -> None:
    chat_ref = db().collection("assistantChats").document(conversation_id)
    if not chat_ref.get().exists:
        return
    summary = _request_chat_summary(kind, fields, request_id)
    ack = (
        "תודה! קיבלנו את קריאת השירות. נציג יחזור אליכם."
        if kind == "lab"
        else "תודה! קיבלנו את בקשת הרכישה. נציג יחזור אליכם במייל."
    )
    _append_chat_messages(
        chat_ref,
        [
            {"role": "user", "text": summary, "kind": "form", "requestId": request_id},
            {"role": "assistant", "text": ack, "kind": "form", "requestId": request_id},
        ],
    )


def _require_chat_auth(conversation_id: str, token: str):
    if not conversation_id or not token:
        return None, json_error(400, "השיחה נקטעה. רעננו את העמוד ונפתח שיחה חדשה.")
    chat_ref = db().collection("assistantChats").document(conversation_id)
    chat = chat_ref.get()
    if not chat.exists:
        return None, json_error(400, "השיחה נקטעה. רעננו את העמוד ונפתח שיחה חדשה.")
    stored = chat.get("tokenHash") or ""
    if not stored or not hmac.compare_digest(stored, token_hash(token)):
        return None, json_error(403, "השיחה נקטעה. רעננו את העמוד ונפתח שיחה חדשה.")
    return (chat_ref, chat), None


@app.post("/api/assistant/request")
def create_request():
    import csat
    import mail

    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    if not ip_allowed(client_ip()):
        return json_error(429, "קיבלנו הרבה פניות עכשיו. נסו שוב בעוד כמה דקות.")
    payload = request.get_json(silent=True) or {}
    kind = str(payload.get("kind") or "").strip().lower()
    if kind not in {"purchase", "lab"}:
        return json_error(400, "סוג הפנייה לא נתמך.")
    raw_fields = payload.get("fields") if isinstance(payload.get("fields"), dict) else {}
    fields = {str(k)[:40]: _clean_field(v, 2000) for k, v in raw_fields.items()}
    error = validate_purchase_fields(fields) if kind == "purchase" else validate_lab_fields(fields)
    if error:
        return json_error(400, error)

    marketing_consent = csat.parse_marketing_consent(fields.get("marketingConsent"))
    fields["marketingConsent"] = "כן" if marketing_consent else "לא"

    conversation_id = _clean_field(payload.get("conversationId"), 80)
    request_id = uuid.uuid4().hex
    hot = kind == "purchase" and csat.is_hot_lead(fields)

    try:
        conversation_id = _ensure_request_chat(conversation_id, fields)
    except Exception:
        app.logger.exception("Could not attach request to chat")
        conversation_id = conversation_id or ""

    doc = {
        "kind": kind,
        "status": "new",
        "fields": fields,
        "conversationId": conversation_id,
        "adminNotes": "",
        "marketingConsent": marketing_consent,
        "hotLead": hot,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "acknowledgedAt": None,
        "email": {
            "service": False,
            "customer": False,
            "channel": "",
        },
    }
    try:
        db().collection("assistantRequests").document(request_id).set(doc)
    except Exception:
        app.logger.exception("Could not save assistant request")
        return json_error(503, "לא הצלחנו לשמור את הפנייה. נסו שוב, או פנו ל-" + SERVICE_CONTACT_HE + ".")

    if conversation_id:
        try:
            _log_request_on_chat(conversation_id, kind, fields, request_id)
        except Exception:
            app.logger.exception("Could not log request on chat")

    mail_result = {"serviceEmail": False, "customerEmail": False, "channel": ""}
    try:
        mail_result = mail.notify_request(kind, fields, request_id=request_id)
        patch = {
            "email": {
                "service": bool(mail_result.get("serviceEmail")),
                "customer": bool(mail_result.get("customerEmail")),
                "channel": str(mail_result.get("channel") or ""),
                "serviceMailId": str(mail_result.get("serviceMailId") or ""),
                "customerMailId": str(mail_result.get("customerMailId") or ""),
            },
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        if hot:
            try:
                patch["email"]["hotLeadMailId"] = mail.hot_lead_alert(fields, request_id=request_id)
                mail_result["hotLead"] = True
            except Exception:
                app.logger.exception("Hot lead alert failed")
                mail_result["hotLead"] = False
        db().collection("assistantRequests").document(request_id).update(patch)
    except Exception:
        app.logger.exception("Request email notify failed")

    return jsonify(
        {
            "ok": True,
            "requestId": request_id,
            "conversationId": conversation_id,
            "hotLead": hot,
            "email": mail_result,
        }
    )


@app.post("/api/assistant/session")
def create_session():
    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    if not ip_allowed(client_ip()):
        return json_error(429, "קיבלנו הרבה פניות עכשיו. נסו שוב בעוד כמה דקות, או השאירו פרטים בטופס בהמשך העמוד.")
    payload = request.get_json(silent=True) or {}
    provisional = bool(payload.get("provisional"))
    name = str(payload.get("name") or "").strip()
    contact = str(payload.get("contact") or "").strip()
    device_raw = str(payload.get("device") or "").strip()
    device = normalize_device(device_raw) if device_raw else ""
    if provisional:
        if not name:
            name = "מבקר/ת"
        if len(name) > 80:
            return json_error(400, "הזינו שם קצר יותר.")
        if contact and not valid_contact(contact):
            contact = ""
    elif len(name) < 2 or len(name) > 80 or not valid_contact(contact):
        return json_error(400, "הזינו שם, וטלפון או דואר אלקטרוני.")
    if not device:
        device = "OTHER" if provisional else normalize_device("")
    token = uuid.uuid4().hex + uuid.uuid4().hex
    conversation_id = uuid.uuid4().hex
    try:
        db().collection("assistantChats").document(conversation_id).set(
            {
                "name": name,
                "contact": contact,
                "device": device,
                "channel": "web",
                "tokenHash": token_hash(token),
                "messageCount": 0,
                "nextSeq": 0,
                "provisional": provisional,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            }
        )
    except Exception:
        app.logger.exception("Could not save the conversation")
        return json_error(503, "לא הצלחתי לפתוח שיחה עכשיו. נסו שוב בעוד רגע, או השאירו פרטים בטופס בהמשך העמוד.")
    return jsonify({"conversationId": conversation_id, "token": token})


@app.post("/api/assistant/session/update")
def update_session():
    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("conversationId") or "")
    token = str(payload.get("token") or "")
    auth, err = _require_chat_auth(conversation_id, token)
    if err:
        return err
    chat_ref, _chat = auth
    patch: dict = {"updatedAt": firestore.SERVER_TIMESTAMP}
    name = str(payload.get("name") or "").strip()
    contact = str(payload.get("contact") or "").strip()
    device_raw = str(payload.get("device") or "").strip()
    if name and len(name) <= 80:
        patch["name"] = name
    if contact and valid_contact(contact):
        patch["contact"] = contact
    if device_raw:
        if device_raw.strip().lower() in {"other", "OTHER".lower()}:
            patch["device"] = "OTHER"
        else:
            patch["device"] = normalize_device(device_raw)
    if len(patch) > 1:
        patch["provisional"] = False
        chat_ref.update(patch)
    return jsonify({"ok": True})


@app.post("/api/assistant/log")
def log_transcript():
    """Persist UI transcript (chips, bot copy, menus) without calling Gemini."""
    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    if not ip_allowed(client_ip()):
        return json_error(429, "קיבלנו הרבה פניות עכשיו. נסו שוב בעוד כמה דקות.")
    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("conversationId") or "")
    token = str(payload.get("token") or "")
    auth, err = _require_chat_auth(conversation_id, token)
    if err:
        return err
    chat_ref, _chat = auth
    raw_messages = payload.get("messages")
    if not isinstance(raw_messages, list):
        raw_messages = [payload]
    entries = []
    for item in raw_messages[:40]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "").strip()
        text = str(item.get("text") or "").strip()
        kind = str(item.get("kind") or "ui").strip().lower() or "ui"
        if role not in {"user", "assistant"} or not text:
            continue
        if kind not in {"ui", "system"}:
            kind = "ui"
        entries.append({"role": role, "text": text[:4000], "kind": kind})
    if not entries:
        return json_error(400, "אין הודעות לשמירה.")
    try:
        _append_chat_messages(chat_ref, entries)
    except Exception:
        app.logger.exception("Could not append transcript")
        return json_error(503, "לא הצלחנו לשמור את השיחה.")
    return jsonify({"ok": True, "saved": len(entries)})


@app.post("/api/assistant/message")
def post_message():
    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    if not ip_allowed(client_ip()):
        return json_error(429, "קיבלנו הרבה פניות עכשיו. נסו שוב בעוד כמה דקות, או השאירו פרטים בטופס בהמשך העמוד.")
    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("conversationId") or "")
    token = str(payload.get("token") or "")
    message = str(payload.get("message") or "").strip()
    if not message or len(message) > MAX_MESSAGE_CHARS:
        return json_error(400, "כתבו שאלה קצרה על המכשיר.")
    try:
        photo = read_photo()
    except ValueError:
        return json_error(400, "אפשר לצרף תמונת מסך בלבד, עד 4MB.")

    auth, err = _require_chat_auth(conversation_id, token)
    if err:
        return err
    chat_ref, chat = auth
    device = normalize_device(chat.get("device"))
    count = int(chat.get("messageCount") or 0)
    if count >= MAX_TURNS:
        return json_error(429, "הגענו לאורך שיחה נחמד. אפשר להתחיל שיחה חדשה, או להשאיר פרטים בטופס בהמשך העמוד.")
    if not reserve_daily_turn():
        return json_error(429, "היום כבר ענו להרבה שאלות כאן. השאירו פרטים בטופס בהמשך העמוד, ונחזור אליכם.")

    history = []
    for snap in chat_ref.collection("messages").order_by("seq").stream():
        item = snap.to_dict() or {}
        if item.get("kind") in {"ui", "form", "system"}:
            continue
        if item.get("role") in {"user", "assistant"} and item.get("text"):
            history.append({"role": item["role"], "text": item["text"]})

    photo_path = ""
    if photo:
        data, mime = photo
        ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}[mime]
        photo_path = f"assistant-photos/{conversation_id}/{uuid.uuid4().hex}.{ext}"
        blob = photo_bucket().blob(photo_path)
        blob.upload_from_string(data, content_type=mime)

    def saved_payload(result: dict) -> dict:
        shown = public_figures(device, result["figureIds"])
        _append_chat_messages(
            chat_ref,
            [
                {
                    "role": "user",
                    "text": message,
                    "kind": "gemini",
                    "photoPath": photo_path,
                },
                {
                    "role": "assistant",
                    "text": result["answer"],
                    "kind": "gemini",
                    "figureIds": [item["id"] for item in shown],
                },
            ],
            bump_gemini_turns=1,
        )
        return {
            "answer": result["answer"],
            "figures": shown,
            "needsMore": bool(result.get("needsMore")),
            "handoff": bool(result.get("handoff")),
        }

    wants_progress = "application/x-ndjson" in request.headers.get("Accept", "")
    if not wants_progress:
        try:
            result = next(item for item in reply_attempts(history, message, photo, device) if item)
        except IncompleteReply:
            return json_error(503, INCOMPLETE_HE)
        except Exception:
            app.logger.exception("Gemini request failed")
            return json_error(503, ERROR_HE)
        return jsonify(saved_payload(result))

    def progress():
        try:
            attempts = reply_attempts(history, message, photo, device)
            result = next(attempts)
            if result is None:
                # Pad past small proxy buffers so the waiting text can update
                # before the longer retry finishes.
                yield json.dumps({"status": "retrying"}, ensure_ascii=False) + "\n" + (" " * 2048) + "\n"
                result = next(attempts)
            if not result:
                yield json.dumps({"error": INCOMPLETE_HE}, ensure_ascii=False) + "\n"
                return
            yield json.dumps(saved_payload(result), ensure_ascii=False) + "\n"
        except IncompleteReply:
            yield json.dumps({"error": INCOMPLETE_HE}, ensure_ascii=False) + "\n"
        except Exception:
            app.logger.exception("Gemini request failed")
            yield json.dumps({"error": ERROR_HE}, ensure_ascii=False) + "\n"

    response = Response(stream_with_context(progress()), mimetype="application/x-ndjson")
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.post("/api/assistant/rating")
def post_rating():
    if not origin_allowed():
        return json_error(403, "השיחה זמינה רק מאתר ישומי בקרה.")
    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("conversationId") or "")
    token = str(payload.get("token") or "")
    try:
        rating = int(payload.get("rating"))
    except (TypeError, ValueError):
        rating = 0
    if not conversation_id or not token:
        return json_error(400, "השיחה לא התחילה. רעננו את העמוד ונסו שוב.")
    if rating < 1 or rating > 5:
        return json_error(400, "בחרו דירוג בין 1 ל-5.")
    chat_ref = db().collection("assistantChats").document(conversation_id)
    chat = chat_ref.get()
    if not chat.exists:
        return json_error(400, "השיחה לא התחילה. רעננו את העמוד ונסו שוב.")
    stored = chat.get("tokenHash") or ""
    if not hmac.compare_digest(stored, token_hash(token)):
        return json_error(403, "השיחה לא התחילה. רעננו את העמוד ונסו שוב.")
    chat_ref.update(
        {
            "rating": rating,
            "ratedAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    return jsonify({"ok": True, "rating": rating})


@app.get("/health")
def health():
    return jsonify({"ok": True})


import csat
import whatsapp

csat.register(
    app,
    db=db,
    client_ip=client_ip,
    apply_cors=apply_cors,
    json_error=json_error,
    origin_allowed=origin_allowed,
)
whatsapp.register(app)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8081")), debug=False)
