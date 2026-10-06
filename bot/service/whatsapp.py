"""WhatsApp Cloud API door onto the same LT22 assistant.

The business phone stays on the WhatsApp Business app. This webhook answers
customer messages. A refusal or a request for a person stops the bot so a
person can continue on that same number.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

GRAPH = "https://graph.facebook.com/v22.0"
PERSON_RE = re.compile(
    r"נציג|בן אדם|אדם אמיתי|שירות לקוחות|תעבירו|מעביר לאדם|"
    r"talk to (?:a )?(?:person|human|someone|agent)|real person|representative",
    re.IGNORECASE,
)
HEBREW_RE = re.compile(r"[\u0590-\u05FF]")


def whatsapp_configured() -> bool:
    names = ("WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN")
    return all(os.environ.get(name, "").strip() for name in names)


def quiet_window() -> timedelta:
    hours = int(os.environ.get("WHATSAPP_QUIET_HOURS", "24"))
    return timedelta(hours=max(1, hours))


def site_origin() -> str:
    return os.environ.get("PUBLIC_SITE_ORIGIN", "https://control-applications-ddc.web.app").rstrip("/")


def in_hebrew(text: str) -> bool:
    return bool(HEBREW_RE.search(text or ""))


def wants_a_person(text: str) -> bool:
    return bool(PERSON_RE.search(text or ""))


def signature_ok(body: bytes, header: str) -> bool:
    secret = os.environ.get("WHATSAPP_APP_SECRET", "").encode()
    if not secret or not header:
        return False
    digest = hmac.new(secret, body, hashlib.sha256).hexdigest()
    expected = "sha256=" + digest
    if len(expected) != len(header):
        return False
    return hmac.compare_digest(expected, header)


def outbound_answer(answer: str, visitor_text: str, handoff: bool) -> tuple[str, bool]:
    """WhatsApp has no form. A website-style refusal becomes the WhatsApp line and a handoff."""
    import app

    cleaned = (answer or "").strip()
    website = cleaned in {app.REFUSAL_HE, app.REFUSAL_EN}
    mentions_form = "הטופס" in cleaned or "use the form" in cleaned.lower()
    if website or mentions_form:
        cleaned = app.WHATSAPP_REFUSAL_HE if in_hebrew(visitor_text) else app.WHATSAPP_REFUSAL_EN
        handoff = True
    if cleaned in {app.WHATSAPP_REFUSAL_HE, app.WHATSAPP_REFUSAL_EN, app.WHATSAPP_HANDOFF_HE, app.WHATSAPP_HANDOFF_EN}:
        handoff = True
    return cleaned, handoff


def as_utc(value) -> datetime | None:
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def graph_json(method: str, path: str, payload: dict | None = None) -> dict:
    token = os.environ["WHATSAPP_TOKEN"]
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(
        f"{GRAPH}/{path.lstrip('/')}",
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read().decode() or "{}"
    return json.loads(raw)


def send_text(to: str, body: str) -> None:
    graph_json(
        "POST",
        f"{os.environ['WHATSAPP_PHONE_NUMBER_ID']}/messages",
        {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body[:4096]},
        },
    )


def send_image(to: str, link: str, caption: str) -> None:
    graph_json(
        "POST",
        f"{os.environ['WHATSAPP_PHONE_NUMBER_ID']}/messages",
        {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "image",
            "image": {"link": link, "caption": caption[:1024]},
        },
    )


def mark_read(message_id: str) -> None:
    try:
        graph_json(
            "POST",
            f"{os.environ['WHATSAPP_PHONE_NUMBER_ID']}/messages",
            {"messaging_product": "whatsapp", "status": "read", "message_id": message_id},
        )
    except Exception:
        import app

        app.app.logger.exception("Could not mark the WhatsApp message as read")


def download_media(media_id: str) -> tuple[bytes, str]:
    import app

    info = graph_json("GET", media_id)
    url = info.get("url") or ""
    mime = info.get("mime_type") or "image/jpeg"
    if mime not in {"image/jpeg", "image/png", "image/webp"}:
        raise ValueError("bad-photo")
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {os.environ['WHATSAPP_TOKEN']}"})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read(app.MAX_PHOTO_BYTES + 1)
    if not data or len(data) > app.MAX_PHOTO_BYTES:
        raise ValueError("bad-photo")
    return data, mime


def claim_message(message_id: str):
    import app
    from google.api_core.exceptions import Conflict
    from google.cloud import firestore

    ref = app.db().collection("assistantWhatsAppSeen").document(hashlib.sha256(message_id.encode()).hexdigest())
    try:
        ref.create({"messageId": message_id, "status": "processing", "createdAt": firestore.SERVER_TIMESTAMP})
    except Conflict:
        return None
    return ref


def open_conversation(phone: str, name: str) -> tuple[object, dict, bool]:
    """Return the chat ref, chat data, and whether the bot may answer."""
    import app
    from google.cloud import firestore

    thread_ref = app.db().collection("assistantWhatsAppThreads").document(phone)
    thread = thread_ref.get()
    data = thread.to_dict() if thread.exists else None
    updated = as_utc((data or {}).get("updatedAt"))
    expired = updated is None or datetime.now(timezone.utc) - updated >= quiet_window()
    if data and not expired:
        chat_ref = app.db().collection("assistantChats").document(data["conversationId"])
        chat = chat_ref.get()
        if chat.exists:
            return chat_ref, chat.to_dict() or {}, not bool(data.get("handedOff"))
    conversation_id = uuid.uuid4().hex
    chat_ref = app.db().collection("assistantChats").document(conversation_id)
    chat_data = {
        "name": name or phone,
        "contact": phone,
        "channel": "whatsapp",
        "tokenHash": "",
        "messageCount": 0,
        "nextSeq": 0,
        "handedOff": False,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    chat_ref.set(chat_data)
    thread_ref.set(
        {
            "conversationId": conversation_id,
            "handedOff": False,
            "name": name or phone,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    return chat_ref, chat_data, True


def store_message(chat_ref, chat: dict, role: str, text: str, photo_path: str = "", figure_ids: list | None = None) -> dict:
    from google.cloud import firestore

    seq = int(chat.get("nextSeq") or 0)
    chat_ref.collection("messages").add(
        {
            "role": role,
            "text": text,
            "photoPath": photo_path,
            "figureIds": figure_ids or [],
            "seq": seq,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )
    chat["nextSeq"] = seq + 1
    chat_ref.update({"nextSeq": seq + 1, "updatedAt": firestore.SERVER_TIMESTAMP})
    return chat


def touch_thread(phone: str, conversation_id: str, handed_off: bool, name: str) -> None:
    import app
    from google.cloud import firestore

    app.db().collection("assistantWhatsAppThreads").document(phone).set(
        {
            "conversationId": conversation_id,
            "handedOff": handed_off,
            "name": name,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def load_history(chat_ref) -> list[dict]:
    history = []
    for snap in chat_ref.collection("messages").order_by("seq").stream():
        item = snap.to_dict() or {}
        if item.get("role") in {"user", "assistant"} and item.get("text"):
            history.append({"role": item["role"], "text": item["text"]})
    return history


def save_photo(conversation_id: str, data: bytes, mime: str) -> str:
    import app
    import uuid

    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(mime, "jpg")
    path = f"assistant-photos/{conversation_id}/{uuid.uuid4().hex}.{ext}"
    app.photo_bucket().blob(path).upload_from_string(data, content_type=mime)
    return path


def answer_customer(phone: str, name: str, text: str, photo: tuple[bytes, str] | None) -> None:
    import app

    chat_ref, chat, may_answer = open_conversation(phone, name)
    conversation_id = chat_ref.id
    photo_path = ""
    if photo and may_answer:
        photo_path = save_photo(conversation_id, photo[0], photo[1])
    store_message(chat_ref, chat, "user", text, photo_path)
    if not may_answer:
        touch_thread(phone, conversation_id, True, name or chat.get("name") or phone)
        return
    if wants_a_person(text):
        reply = app.WHATSAPP_HANDOFF_HE if in_hebrew(text) else app.WHATSAPP_HANDOFF_EN
        send_text(phone, reply)
        finish_turn(chat_ref, chat, phone, conversation_id, name, reply, [], True)
        return
    if int(chat.get("messageCount") or 0) >= app.MAX_TURNS or not app.reserve_daily_turn():
        limit = app.WHATSAPP_REFUSAL_HE if in_hebrew(text) else app.WHATSAPP_REFUSAL_EN
        send_text(phone, limit)
        finish_turn(chat_ref, chat, phone, conversation_id, name, limit, [], True)
        return

    history = load_history(chat_ref)
    prior = history[:-1] if history and history[-1].get("role") == "user" else history
    model_text = "ערוץ: וואטסאפ\n" + (text or "מה מוצג במסך הזה?")
    device = app.normalize_device(chat.get("device"))
    result = next(item for item in app.reply_attempts(prior, model_text, photo, device) if item)
    answer, handoff = outbound_answer(result["answer"], text, bool(result.get("handoff")))
    send_text(phone, answer)
    figures = app.public_figures(device, result["figureIds"])[:4]
    for figure in figures:
        try:
            send_image(phone, site_origin() + figure["src"], figure.get("title") or "מסך מהמדריך")
        except Exception:
            app.app.logger.exception("Could not send manual screenshot %s", figure.get("id"))
    finish_turn(chat_ref, chat, phone, conversation_id, name, answer, [item["id"] for item in figures], handoff)


def finish_turn(chat_ref, chat, phone, conversation_id, name, answer, figure_ids, handed_off) -> None:
    from google.cloud import firestore

    store_message(chat_ref, chat, "assistant", answer, figure_ids=figure_ids)
    chat_ref.update(
        {
            "messageCount": int(chat.get("messageCount") or 0) + 1,
            "handedOff": handed_off,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    )
    touch_thread(phone, conversation_id, handed_off, name or phone)


def handle_customer_message(message: dict, name: str) -> None:
    import app

    phone = str(message.get("from") or "")
    business = re.sub(r"\D", "", os.environ.get("WHATSAPP_BUSINESS_PHONE", ""))
    if not phone or (business and phone == business):
        return
    kind = message.get("type")
    if kind == "text":
        text = ((message.get("text") or {}).get("body") or "").strip()
        photo = None
    elif kind == "image":
        image = message.get("image") or {}
        text = (image.get("caption") or "").strip() or "מה מוצג במסך הזה?"
        try:
            photo = download_media(image.get("id") or "")
        except Exception:
            app.app.logger.exception("Could not download the WhatsApp photo")
            send_text(phone, "לא הצלחנו לקרוא את התמונה. אפשר לשלוח אותה שוב, או לכתוב את השאלה.")
            return
    else:
        note = "אפשר לשלוח הודעת טקסט, או תמונה של מסך המונה."
        if not in_hebrew(str(message)):
            note = "Send a text message, or a photo of the meter screen."
        send_text(phone, note)
        return
    if not text:
        return
    answer_customer(phone, name, text[: app.MAX_MESSAGE_CHARS], photo)


def incoming_messages(payload: dict) -> list[tuple[dict, str]]:
    found = []
    for entry in payload.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}
            if change.get("field") != "messages":
                continue
            name = ""
            contacts = value.get("contacts") or []
            if contacts:
                name = ((contacts[0].get("profile") or {}).get("name") or "").strip()
            for message in value.get("messages") or []:
                found.append((message, name))
    return found


def register(flask_app) -> None:
    @flask_app.route("/api/whatsapp/webhook", methods=["GET"])
    def verify_webhook():
        from flask import request

        if not whatsapp_configured():
            return flask_app.response_class("whatsapp not configured", status=503, mimetype="text/plain")
        mode = request.args.get("hub.mode", "")
        token = request.args.get("hub.verify_token", "")
        challenge = request.args.get("hub.challenge", "")
        expected = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")
        if mode == "subscribe" and token and expected and len(token) == len(expected) and hmac.compare_digest(token, expected):
            return flask_app.response_class(challenge, status=200, mimetype="text/plain")
        return flask_app.response_class("", status=403)

    @flask_app.route("/api/whatsapp/webhook", methods=["POST"])
    def receive_webhook():
        import app
        from flask import request

        if not whatsapp_configured():
            return flask_app.response_class("", status=503)
        body = request.get_data() or b""
        if not signature_ok(body, request.headers.get("X-Hub-Signature-256", "")):
            return flask_app.response_class("", status=403)
        try:
            payload = json.loads(body.decode() or "{}")
        except json.JSONDecodeError:
            return flask_app.response_class("", status=400)
        for message, name in incoming_messages(payload):
            message_id = str(message.get("id") or "")
            if not message_id:
                continue
            seen = claim_message(message_id)
            if seen is None:
                continue
            sent = False
            try:
                mark_read(message_id)
                handle_customer_message(message, name)
                seen.set({"status": "sent"}, merge=True)
                sent = True
            except app.IncompleteReply:
                app.app.logger.exception("WhatsApp reply was cut off")
                send_text(
                    str(message.get("from") or ""),
                    "לא הצלחנו להשלים את התשובה. נסו לשלוח שוב, או המשיכו כאן עם אדם.",
                )
                sent = True
            except Exception:
                app.app.logger.exception("WhatsApp message failed")
            finally:
                if not sent:
                    seen.delete()
        return flask_app.response_class("", status=200)
