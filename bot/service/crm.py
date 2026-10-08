"""CRM client upserts shared with the admin Clients area.

Mirrors cms/apps/admin/src/lib/crm-store.ts: dedupe by email, keep stage, owner,
notes, and follow-up, and keep email-less chats on a chat_ document.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from google.cloud import firestore

CLIENTS = "crmClients"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[+\d][\d\s\-()]{6,}$")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean(value, limit: int) -> str:
    return str(value or "").strip()[:limit]


def normalize_email(value) -> str:
    email = _clean(value, 160).lower()
    return email if EMAIL_RE.match(email) else ""


def _phone(value) -> str:
    phone = _clean(value, 40)
    if not phone or EMAIL_RE.match(phone):
        return ""
    return phone


def _fill(current: str, incoming: str) -> str:
    return current if str(current or "").strip() else str(incoming or "").strip()


def _as_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item or "").strip()]


def _union(current: list[str], extra: list[str]) -> tuple[list[str], list[str]]:
    nxt = list(current)
    added = []
    for item in extra:
        if not item or item in nxt:
            continue
        nxt.append(item)
        added.append(item)
    return nxt, added


def _client_from(doc_id: str, data: dict) -> dict:
    stage = str(data.get("stage") or "new")
    if stage not in {"new", "contacted", "quoted", "won", "lost"}:
        stage = "new"
    source = str(data.get("source") or "assistant")
    if source not in {"assistant", "manual", "csv"}:
        source = "assistant"
    return {
        "id": doc_id,
        "name": str(data.get("name") or ""),
        "company": str(data.get("company") or ""),
        "email": normalize_email(data.get("email")),
        "phone": str(data.get("phone") or ""),
        "source": source,
        "ownerMemberId": str(data.get("ownerMemberId") or ""),
        "stage": stage,
        "nextFollowUp": str(data.get("nextFollowUp") or ""),
        "notes": str(data.get("notes") or ""),
        "assistantChatIds": _as_list(data.get("assistantChatIds")),
        "assistantRequestIds": _as_list(data.get("assistantRequestIds")),
        "createdAt": data.get("createdAt") or _now(),
        "createdByMemberId": str(data.get("createdByMemberId") or ""),
    }


def _activity(client, doc_id: str, kind: str, text: str) -> None:
    client.collection(CLIENTS).document(doc_id).collection("activity").add(
        {
            "type": kind,
            "text": text[:1000],
            "memberId": "",
            "memberEmail": "",
            "at": _now(),
        }
    )


def upsert_assistant_client(
    client: firestore.Client,
    *,
    name: str = "",
    company: str = "",
    email: str = "",
    phone: str = "",
    chat_id: str = "",
    request_id: str = "",
) -> None:
    """Best-effort. Callers should catch failures so the assistant request still succeeds."""
    email_key = normalize_email(email)
    chat_id = _clean(chat_id, 80)
    request_id = _clean(request_id, 80)
    incoming = {
        "name": _clean(name, 120),
        "company": _clean(company, 160),
        "phone": _phone(phone),
        "email": email_key,
    }
    if email_key:
        found = list(col.where("email", "==", email_key).limit(1).stream())
        target_id = found[0].id if found else email_key
    elif chat_id:
        target_id = f"chat_{chat_id}"
    elif request_id:
        target_id = f"request_{request_id}"
    else:
        return
    if not any(incoming.values()) and not chat_id and not request_id:
        return

    col = client.collection(CLIENTS)
    orphan_ids = []
    if chat_id and f"chat_{chat_id}" != target_id:
        orphan_ids.append(f"chat_{chat_id}")
    if request_id and f"request_{request_id}" != target_id:
        orphan_ids.append(f"request_{request_id}")
    orphans = []
    for orphan_id in orphan_ids:
        snap = col.document(orphan_id).get()
        if snap.exists:
            orphans.append(_client_from(snap.id, snap.to_dict() or {}))

    target_snap = col.document(target_id).get()
    existing = _client_from(target_snap.id, target_snap.to_dict() or {}) if target_snap.exists else None
    now = _now()
    base = existing or {
        "id": target_id,
        "name": "",
        "company": "",
        "email": email_key,
        "phone": "",
        "source": "assistant",
        "ownerMemberId": "",
        "stage": "new",
        "nextFollowUp": "",
        "notes": "",
        "assistantChatIds": [],
        "assistantRequestIds": [],
        "createdAt": now,
        "createdByMemberId": "",
    }
    if not existing and email_key and orphans:
        moved = orphans[0]
        for key in (
            "name",
            "company",
            "phone",
            "ownerMemberId",
            "stage",
            "nextFollowUp",
            "notes",
            "source",
            "createdAt",
            "createdByMemberId",
        ):
            base[key] = moved[key]
        base["assistantChatIds"] = list(moved["assistantChatIds"])
        base["assistantRequestIds"] = list(moved["assistantRequestIds"])

    base["name"] = _fill(base["name"], incoming["name"])
    base["company"] = _fill(base["company"], incoming["company"])
    base["phone"] = _fill(base["phone"], incoming["phone"])
    base["email"] = email_key or base["email"]
    for orphan in orphans:
        base["name"] = _fill(base["name"], orphan["name"])
        base["company"] = _fill(base["company"], orphan["company"])
        base["phone"] = _fill(base["phone"], orphan["phone"])
        base["assistantChatIds"], _added = _union(base["assistantChatIds"], orphan["assistantChatIds"])
        base["assistantRequestIds"], _added = _union(base["assistantRequestIds"], orphan["assistantRequestIds"])

    base["assistantChatIds"], chat_added = _union(base["assistantChatIds"], [chat_id] if chat_id else [])
    base["assistantRequestIds"], request_added = _union(
        base["assistantRequestIds"], [request_id] if request_id else []
    )
    contact_changed = not existing or any(
        base[key] != existing[key] for key in ("name", "company", "phone", "email")
    )
    links_changed = bool(chat_added or request_added or orphans)
    if existing and not contact_changed and not links_changed:
        return
    col.document(target_id).set(
        {
            "name": base["name"],
            "company": base["company"],
            "email": base["email"],
            "phone": base["phone"],
            "source": base["source"] or "assistant",
            "ownerMemberId": base["ownerMemberId"],
            "stage": base["stage"],
            "nextFollowUp": base["nextFollowUp"],
            "notes": base["notes"],
            "assistantChatIds": base["assistantChatIds"],
            "assistantRequestIds": base["assistantRequestIds"],
            "createdAt": base["createdAt"] or now,
            "updatedAt": now,
            "createdByMemberId": base["createdByMemberId"],
        }
    )
    created = not existing and not (email_key and orphans)
    if created:
        _activity(client, target_id, "created", "Created from the assistant")
    if not existing and email_key and orphans:
        _activity(client, target_id, "linked", "Merged the assistant record onto this email")
    linked_bits = [f"chat {item}" for item in chat_added] + [f"request {item}" for item in request_added]
    if (existing or orphans) and linked_bits:
        _activity(client, target_id, "linked", "Linked " + ", ".join(linked_bits))
    if email_key:
        for orphan in orphans:
            if orphan["id"] != target_id:
                col.document(orphan["id"]).delete()
