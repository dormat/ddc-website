"""Apply cms/data/public.json onto the static site build (exact UI, CMS content)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CMS_PUBLIC = ROOT / "cms" / "data" / "public.json"

_snapshot: dict[str, Any] | None = None
_loaded = False


def load_cms_snapshot() -> dict[str, Any] | None:
    global _snapshot, _loaded
    if _loaded:
        return _snapshot
    _loaded = True
    if not CMS_PUBLIC.exists():
        _snapshot = None
        return None
    try:
        _snapshot = json.loads(CMS_PUBLIC.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        _snapshot = None
    return _snapshot


def cms_product(slug: str) -> dict[str, Any] | None:
    snap = load_cms_snapshot()
    if not snap:
        return None
    for row in snap.get("products") or []:
        if row.get("slug") == slug:
            return row
    return None


def cms_solution(slug: str) -> dict[str, Any] | None:
    snap = load_cms_snapshot()
    if not snap:
        return None
    for row in snap.get("solutions") or []:
        if row.get("slug") == slug:
            return row
    return None


def cms_industry(slug: str) -> dict[str, Any] | None:
    snap = load_cms_snapshot()
    if not snap:
        return None
    for row in snap.get("industries") or []:
        if row.get("slug") == slug:
            return row
    return None


def lang_enabled(row: dict[str, Any], lang: str) -> bool:
    if not row.get("enabled", True):
        return False
    key = {"he": "enabledHe", "en": "enabledEn", "es": "enabledEs"}.get(lang, "enabledEn")
    return bool(row.get(key, True))


def product_visible_on_site(slug: str, lang: str) -> bool:
    """Whether a product should appear on the public site for this language.

    Unchecking "Show on website" in admin sets enabled=false and hides the product
    without deleting it. Products not present in the CMS snapshot stay visible
    (legacy content-only pages).
    """
    if not slug:
        return False
    row = cms_product(slug)
    if not row:
        return True
    return lang_enabled(row, lang)


def apply_cms_overrides(
    *,
    solution_labels: dict,
    solution_framing: dict,
    industry_offers: dict,
    contact: dict,
) -> None:
    """Mutate in-memory config maps from the CMS snapshot when present."""
    snap = load_cms_snapshot()
    if not snap:
        print("CMS snapshot not found — building from content/ JSON only.")
        return

    print(f"Applying CMS snapshot ({snap.get('updatedAt', 'unknown')})")

    for sol in snap.get("solutions") or []:
        slug = sol.get("slug")
        if not slug:
            continue
        for lang in ("he", "en", "es"):
            tr = (sol.get("translations") or {}).get(lang) or {}
            if tr.get("title") and lang in solution_labels and slug in solution_labels[lang]:
                solution_labels[lang][slug] = tr["title"]
            if tr.get("lead") and lang in solution_framing and slug in solution_framing[lang]:
                solution_framing[lang][slug] = tr["lead"]

    for ind in snap.get("industries") or []:
        slug = ind.get("slug")
        if not slug:
            continue
        for lang in ("he", "en", "es"):
            tr = (ind.get("translations") or {}).get(lang) or {}
            if tr.get("offer") and lang in industry_offers:
                industry_offers.setdefault(lang, {})[slug] = tr["offer"]

    settings = snap.get("settings") or {}
    if settings.get("contact_phone"):
        contact["phone"] = settings["contact_phone"]
    if settings.get("contact_email"):
        contact["email"] = settings["contact_email"]
    if settings.get("brand_name"):
        contact["brand"] = settings["brand_name"]


def cms_page(key: str) -> dict[str, Any] | None:
    snap = load_cms_snapshot()
    if not snap:
        return None
    for row in snap.get("pages") or []:
        if row.get("key") == key:
            return row
    return None


def merge_cms_into_site_page(page: dict, slug: str, lang: str) -> dict:
    """Overlay CMS page translations onto static pages (about).

    CMS bodies are plain text (blank line = paragraph). Site templates keep the design.
    """
    import html as html_lib

    key = slug or "home"
    if key not in {"about"}:
        return page
    row = cms_page(key)
    if not row:
        return page
    if not lang_enabled(row, lang):
        return page
    tr = (row.get("translations") or {}).get(lang) or {}
    title = (tr.get("title") or "").strip()
    body = (tr.get("body") or "").strip()
    if title:
        page["title"] = title
    if body:
        # If legacy HTML slipped in, collapse to plain text first.
        if "<" in body:
            plain = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
            plain = re.sub(r"</(p|div|h[1-6]|li)>", "\n\n", plain, flags=re.I)
            plain = re.sub(r"<[^>]+>", "", plain)
            plain = html_lib.unescape(plain)
            body = re.sub(r"\n{3,}", "\n\n", plain).strip()
        paras = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
        page["rich_text"] = paras
        page["content_html"] = "".join(
            f'<div class="rich-text"><p>{html_lib.escape(p)}</p></div>\n' for p in paras
        )
    return page


def merge_cms_into_product_page(page: dict, slug: str, lang: str) -> dict | None:
    """Overlay CMS fields onto a product content page. Returns None if disabled."""
    import html as html_lib

    row = cms_product(slug)
    if not row:
        return page
    if not lang_enabled(row, lang):
        return None
    tr = (row.get("translations") or {}).get(lang) or {}
    if tr.get("title"):
        page["title"] = tr["title"]
    if tr.get("description"):
        page["description"] = tr["description"]
    body = (tr.get("body") or "").strip()
    if body:
        if "<" in body:
            plain = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
            plain = re.sub(r"</(p|div|h[1-6]|li)>", "\n\n", plain, flags=re.I)
            plain = re.sub(r"<[^>]+>", "", plain)
            plain = html_lib.unescape(plain)
            body = re.sub(r"\n{3,}", "\n\n", plain).strip()
        # One <p> per line so the public site matches admin line breaks / blank lines.
        lines = body.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        page["rich_text"] = [ln.strip() for ln in lines if ln.strip()]
        html_parts: list[str] = ['<div class="rich-text product-description-body">']
        blank_run = 0
        for line in lines:
            if not line.strip():
                blank_run += 1
                continue
            cls = "product-desc-line product-desc-line--break" if blank_run else "product-desc-line"
            blank_run = 0
            html_parts.append(f'<p class="{cls}">{html_lib.escape(line.strip())}</p>')
        html_parts.append("</div>")
        if len(html_parts) > 2:
            page["content_html"] = "".join(html_parts)

    # Prefer CMS media for the product carousel (admin list = slider images).
    media_items = [
        m
        for m in (row.get("media") or [])
        if (m.get("kind") or "").lower() in {"hero", "image", "gallery"}
        and (m.get("url") or "").strip()
        and m.get("enabled", True) is not False
        and m.get({"he": "enabledHe", "en": "enabledEn", "es": "enabledEs"}[lang], True) is not False
    ]
    if media_items:
        images = []
        for m in media_items:
            url = (m.get("url") or "").strip()
            if not url.startswith("/") and not url.startswith("http"):
                url = f"/assets/images/{url}"
            images.append({
                "src": url,
                "alt": (m.get("label") or m.get("alt") or "").strip(),
            })
        page["images"] = images
        page["gallery"] = []
        page["og_image"] = images[0]["src"]
        # Drop scraped figures so collect_product_gallery uses CMS images only.
        if page.get("content_html"):
            page["content_html"] = re.sub(
                r"<figure\b[\s\S]*?</figure>",
                "",
                page["content_html"],
                flags=re.I,
            )

    # CMS schematics / documents (optional per-language URL overrides).
    cms_docs = []
    for m in row.get("media") or []:
        kind = (m.get("kind") or "").lower()
        if kind not in {"schematic", "document"}:
            continue
        if m.get("enabled", True) is False:
            continue
        if m.get({"he": "enabledHe", "en": "enabledEn", "es": "enabledEs"}[lang], True) is False:
            continue
        override = {"he": "urlHe", "en": "urlEn", "es": "urlEs"}[lang]
        url = (m.get(override) or m.get("url") or "").strip()
        if not url:
            continue
        if url.startswith("/assets/documents/"):
            filename = url.rsplit("/", 1)[-1]
        elif url.startswith("http"):
            filename = url.rsplit("/", 1)[-1].split("?")[0]
        else:
            filename = url
            url = f"/assets/documents/{filename}"
        label = "שרטוטים" if kind == "schematic" else "הורד מסמכים"
        cms_docs.append({"label": label, "url": url, "file": filename})
    if cms_docs:
        page["documents"] = cms_docs

    return page


def industry_clients_from_cms(slug: str, lang: str) -> list[str] | None:
    row = cms_industry(slug)
    if not row or not lang_enabled(row, lang):
        return None
    tr = (row.get("translations") or {}).get(lang) or {}
    clients = tr.get("clients")
    return clients if isinstance(clients, list) else None


def industry_title_from_cms(slug: str, lang: str) -> str | None:
    row = cms_industry(slug)
    if not row or not lang_enabled(row, lang):
        return None
    tr = (row.get("translations") or {}).get(lang) or {}
    title = (tr.get("title") or "").strip()
    return title or None


def industry_hero_from_cms(slug: str) -> str | None:
    row = cms_industry(slug)
    if not row:
        return None
    hero = (row.get("heroImageUrl") or "").strip()
    return hero or None


def solution_home_description_from_cms(slug: str, lang: str) -> str | None:
    """Short home-screen blurb for a solution (stored as translation body)."""
    row = cms_solution(slug)
    if not row or not lang_enabled(row, lang):
        return None
    tr = (row.get("translations") or {}).get(lang) or {}
    text = (tr.get("homeDescription") or tr.get("body") or "").strip()
    return text or None
