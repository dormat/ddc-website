"""CSAT public API + hourly cron for invites and quote follow-ups."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
import time
from datetime import datetime, timedelta, timezone

from flask import jsonify, request
from google.cloud import firestore

import mail

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "control-applications-ddc")
CRON_SECRET = os.environ.get("ASSISTANT_CRON_SECRET", "").strip()
CSAT_SECRET_ENV = os.environ.get("ASSISTANT_CSAT_SECRET", "").strip()

HOT_NOTE_RE = re.compile(r"דחוף|בהקדם|ASAP|urgent|השבוע|מיידי", re.I)
HOT_PRODUCT_RE = re.compile(
    r"מערכת|billing|ניטור|energy\s*monitoring|מונה\s*חשמל\s*מערכת",
    re.I,
)

_csat_ip_hits: dict[str, list[float]] = {}


def csat_secret() -> bytes:
    if CSAT_SECRET_ENV:
        return CSAT_SECRET_ENV.encode("utf-8")
    # Stable fallback derived from project id (override with ASSISTANT_CSAT_SECRET in prod).
    return hashlib.sha256(f"csat:{PROJECT_ID}".encode("utf-8")).digest()


def make_csat_token(request_id: str) -> str:
    rid = str(request_id or "").strip()
    sig = hmac.new(csat_secret(), rid.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
    raw = f"{rid}.{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def parse_csat_token(token: str) -> str | None:
    raw = str(token or "").strip()
    if not raw or len(raw) > 200:
        return None
    pad = "=" * (-len(raw) % 4)
    try:
        decoded = base64.urlsafe_b64decode(raw + pad).decode("utf-8")
    except Exception:
        return None
    if "." not in decoded:
        return None
    rid, sig = decoded.rsplit(".", 1)
    rid = rid.strip()
    if not rid or len(rid) > 80:
        return None
    expected = hmac.new(csat_secret(), rid.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
    if not hmac.compare_digest(sig, expected):
        return None
    return rid


def parse_marketing_consent(raw) -> bool:
    if isinstance(raw, bool):
        return raw
    value = str(raw or "").strip().lower()
    return value in {"1", "true", "yes", "y", "כן", "ken"}


def is_hot_lead(fields: dict) -> bool:
    qty_raw = str(fields.get("quantity") or "").strip()
    try:
        qty = float(qty_raw.replace(",", "."))
    except ValueError:
        qty = 1.0
    if qty > 1:
        return True
    notes = str(fields.get("notes") or "")
    if HOT_NOTE_RE.search(notes):
        return True
    product = str(fields.get("product") or fields.get("equipmentType") or "")
    return bool(HOT_PRODUCT_RE.search(product))


def _as_dt(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except ValueError:
            return None
    return None


def csat_ip_allowed(ip: str) -> bool:
    now = time.time()
    window = [stamp for stamp in _csat_ip_hits.get(ip, []) if now - stamp < 3600]
    if len(window) >= 60:
        _csat_ip_hits[ip] = window
        return False
    window.append(now)
    _csat_ip_hits[ip] = window
    return True


def load_followup_settings(db) -> dict:
    try:
        snap = db.collection("assistantConfig").document("settings").get()
        if not snap.exists:
            return {}
        data = snap.to_dict() or {}
        return {
            "googleReviewUrl": str(data.get("googleReviewUrl") or "").strip(),
            "upsellTitle": str(data.get("upsellTitle") or "").strip(),
            "upsellUrl": str(data.get("upsellUrl") or "").strip(),
            "upsellBlurb": str(data.get("upsellBlurb") or "").strip(),
        }
    except Exception:
        return {}


def register(app, *, db, client_ip, apply_cors, json_error, origin_allowed):
    @app.route("/api/assistant/csat", methods=["OPTIONS"])
    def csat_options():
        return apply_cors(app.response_class("", status=204))

    @app.get("/api/assistant/csat")
    def get_csat():
        if not csat_ip_allowed(client_ip()):
            return json_error(429, "יותר מדי בקשות. נסו שוב בעוד כמה דקות.")
        token = str(request.args.get("t") or "").strip()
        request_id = parse_csat_token(token)
        if not request_id:
            return json_error(400, "הקישור לא תקין או שפג תוקפו.")
        snap = db().collection("assistantRequests").document(request_id).get()
        if not snap.exists:
            return json_error(404, "לא מצאנו את הפנייה.")
        data = snap.to_dict() or {}
        fields = data.get("fields") if isinstance(data.get("fields"), dict) else {}
        name = str(fields.get("fullName") or fields.get("contactName") or "").strip()
        csat = data.get("csat") if isinstance(data.get("csat"), dict) else {}
        already = bool(csat.get("submittedAt") or csat.get("rating"))
        return jsonify(
            {
                "ok": True,
                "name": name,
                "kind": str(data.get("kind") or "lab"),
                "alreadySubmitted": already,
            }
        )

    @app.post("/api/assistant/csat")
    def post_csat():
        if not csat_ip_allowed(client_ip()):
            return json_error(429, "יותר מדי בקשות. נסו שוב בעוד כמה דקות.")
        payload = request.get_json(silent=True) or {}
        token = str(payload.get("token") or "").strip()
        request_id = parse_csat_token(token)
        if not request_id:
            return json_error(400, "הקישור לא תקין או שפג תוקפו.")
        try:
            rating = int(payload.get("rating"))
        except (TypeError, ValueError):
            rating = 0
        if rating < 1 or rating > 5:
            return json_error(400, "בחרו דירוג בין 1 ל-5.")
        resolved = payload.get("resolved")
        if isinstance(resolved, str):
            resolved = resolved.strip().lower() in {"1", "true", "yes", "כן"}
        else:
            resolved = bool(resolved)
        comment = str(payload.get("comment") or "").strip()[:2000]

        ref = db().collection("assistantRequests").document(request_id)
        snap = ref.get()
        if not snap.exists:
            return json_error(404, "לא מצאנו את הפנייה.")
        data = snap.to_dict() or {}
        existing = data.get("csat") if isinstance(data.get("csat"), dict) else {}
        if existing.get("submittedAt") or existing.get("rating"):
            return jsonify({"ok": True, "alreadySubmitted": True})

        fields = data.get("fields") if isinstance(data.get("fields"), dict) else {}
        email = str(fields.get("email") or "").strip()
        name = str(fields.get("fullName") or fields.get("contactName") or "").strip()
        marketing = bool(data.get("marketingConsent")) or parse_marketing_consent(
            fields.get("marketingConsent")
        )
        now_iso = datetime.now(timezone.utc).isoformat()
        csat_doc = {
            "resolved": resolved,
            "rating": rating,
            "comment": comment,
            "submittedAt": now_iso,
        }
        update: dict = {
            "csat": csat_doc,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        bad = (not resolved) or rating <= 2
        if bad:
            note = (
                f"\n[{now_iso[:16]}Z] CSAT שלילי: {rating}/5 "
                f"{'👎' if not resolved else '👍'}"
                + (f" — {comment}" if comment else "")
            )
            prev_notes = str(data.get("adminNotes") or "")
            update["status"] = "in_progress"
            update["adminNotes"] = (prev_notes + note).strip()[:20_000]
            try:
                mail.csat_bad_alert(
                    fields=fields,
                    request_id=request_id,
                    rating=rating,
                    comment=comment,
                    resolved=resolved,
                )
            except Exception:
                app.logger.exception("CSAT bad alert failed")
        elif rating == 3:
            if email:
                try:
                    mail.csat_clarify(email=email, name=name)
                except Exception:
                    app.logger.exception("CSAT clarify email failed")
        else:
            if email:
                try:
                    settings = load_followup_settings(db())
                    mail.csat_thanks(
                        email=email,
                        name=name,
                        marketing_consent=marketing,
                        settings=settings,
                    )
                except Exception:
                    app.logger.exception("CSAT thanks email failed")

        ref.update(update)
        return jsonify({"ok": True, "alreadySubmitted": False})

    @app.post("/api/assistant/cron")
    def run_cron():
        secret = str(request.headers.get("X-Cron-Secret") or "").strip()
        if not CRON_SECRET or not secret or not hmac.compare_digest(secret, CRON_SECRET):
            return json_error(403, "Forbidden")

        now = datetime.now(timezone.utc)
        invite_cutoff = now - timedelta(hours=24)
        sent_invites = 0
        sent_quotes = {3: 0, 7: 0, 14: 0}
        errors = 0

        # CSAT invites: lab requests done for >= 24h without invite.
        try:
            query = (
                db()
                .collection("assistantRequests")
                .where("status", "==", "done")
                .limit(200)
            )
            for snap in query.stream():
                data = snap.to_dict() or {}
                if str(data.get("kind") or "") != "lab":
                    continue
                if data.get("csatInviteSentAt"):
                    continue
                csat = data.get("csat") if isinstance(data.get("csat"), dict) else {}
                if csat.get("submittedAt") or csat.get("rating"):
                    continue
                done_at = _as_dt(data.get("doneAt"))
                if not done_at or done_at > invite_cutoff:
                    continue
                fields = data.get("fields") if isinstance(data.get("fields"), dict) else {}
                email = str(fields.get("email") or "").strip()
                if not email:
                    continue
                name = str(fields.get("fullName") or fields.get("contactName") or "").strip()
                token = make_csat_token(snap.id)
                try:
                    mail.csat_invite(email=email, name=name, token=token, kind="lab")
                    snap.reference.update(
                        {
                            "csatInviteSentAt": firestore.SERVER_TIMESTAMP,
                            "csatToken": token,
                            "updatedAt": firestore.SERVER_TIMESTAMP,
                        }
                    )
                    sent_invites += 1
                except Exception:
                    errors += 1
                    app.logger.exception("CSAT invite cron failed for %s", snap.id)
        except Exception:
            errors += 1
            app.logger.exception("CSAT invite query failed")

        # Quote follow-ups at 3 / 7 / 14 days after quoteSentAt.
        try:
            query = (
                db()
                .collection("assistantRequests")
                .where("kind", "==", "purchase")
                .limit(300)
            )
            for snap in query.stream():
                data = snap.to_dict() or {}
                quote_at = _as_dt(data.get("quoteSentAt"))
                if not quote_at:
                    continue
                age_days = (now - quote_at).total_seconds() / 86400.0
                fields = data.get("fields") if isinstance(data.get("fields"), dict) else {}
                email = str(fields.get("email") or "").strip()
                if not email:
                    continue
                name = str(fields.get("fullName") or fields.get("contactName") or "").strip()
                for day, flag in ((3, "quoteFollowup3Sent"), (7, "quoteFollowup7Sent"), (14, "quoteFollowup14Sent")):
                    if age_days < day or data.get(flag):
                        continue
                    try:
                        mail.quote_followup(email=email, name=name, day=day, fields=fields)
                        snap.reference.update(
                            {
                                flag: firestore.SERVER_TIMESTAMP,
                                "updatedAt": firestore.SERVER_TIMESTAMP,
                            }
                        )
                        sent_quotes[day] += 1
                        data[flag] = True
                    except Exception:
                        errors += 1
                        app.logger.exception("Quote follow-up day %s failed for %s", day, snap.id)
        except Exception:
            errors += 1
            app.logger.exception("Quote follow-up query failed")

        return jsonify(
            {
                "ok": True,
                "csatInvites": sent_invites,
                "quoteFollowups": sent_quotes,
                "errors": errors,
            }
        )
