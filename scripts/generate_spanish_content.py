#!/usr/bin/env python3
"""Generate content/es/ JSON files from English source with Spanish translations."""

from __future__ import annotations

import argparse
import copy
import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

from bs4 import BeautifulSoup, NavigableString
from slugs import CANONICAL_TITLES_ES

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "content" / "en"
DST_DIR = ROOT / "content" / "es"

PROTECT_TERMS = [
    "DigiPoint",
    "VeroPoint",
    "SuperBrain",
    "UniArt",
    "UniWeb",
    "ElNet",
    "ELNet",
    "MODBUS",
    "BACnet",
    "BACNET",
    "TCP/IP",
    "RS485",
    "EN50160",
    "PLC",
    "DDC",
    "BMS",
    "SCADA",
    "HMI",
    "HVAC",
    "ATS",
    "PFC",
    "LTC",
    "THD",
    "IGP",
]

SKIP_ENTIRELY = re.compile(
    r"^(?:https?://|mailto:|\+?\d[\d\s\-]*$|cal@ddc\.co\.il$|\.png$|\.jpg$|Screen)",
    re.I,
)

translator = GoogleTranslator(source="en", target="es")
_cache: dict[str, str] = {}


def protect_terms(text: str) -> tuple[str, dict[str, str]]:
    placeholders: dict[str, str] = {}
    for index, term in enumerate(PROTECT_TERMS):
        if term not in text:
            continue
        token = f"__KEEP{index}__"
        text = text.replace(term, token)
        placeholders[token] = term
    return text, placeholders


def restore_terms(text: str, placeholders: dict[str, str]) -> str:
    for token, term in placeholders.items():
        text = text.replace(token, term)
    return text


def translate_text(text: str) -> str:
    if not text or not text.strip():
        return text
    stripped = text.strip()
    if SKIP_ENTIRELY.match(stripped):
        return text
    if stripped in _cache:
        return _cache[stripped]
    protected, placeholders = protect_terms(stripped)
    try:
        if len(protected) > 4500:
            parts = []
            chunk = ""
            for paragraph in protected.split("\n"):
                candidate = f"{chunk}\n{paragraph}".strip() if chunk else paragraph
                if len(candidate) > 4500 and chunk:
                    parts.append(translator.translate(chunk))
                    chunk = paragraph
                else:
                    chunk = candidate
            if chunk:
                parts.append(translator.translate(chunk))
            result = "\n".join(parts)
        else:
            result = translator.translate(protected)
        if not result:
            return text
        result = restore_terms(result, placeholders)
        _cache[stripped] = result
        time.sleep(0.05)
        return result
    except Exception:
        return text


def translate_html(html: str) -> str:
    if not html:
        return html
    soup = BeautifulSoup(html, "lxml")
    for node in soup.find_all(string=True):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if parent and parent.name in ("script", "style"):
            continue
        stripped = str(node).strip()
        if not stripped:
            continue
        translated = translate_text(stripped)
        if translated and translated != stripped:
            node.replace_with(translated)
    body = soup.body
    return "".join(str(child) for child in body.children) if body else str(soup)


def is_product_page(data: dict) -> bool:
    markers = (
        "related products",
        "related items",
        "productos relacionados",
        "מוצרים קשורים",
    )
    for block in data.get("rich_text") or []:
        lower = block.lower()
        if any(marker in lower for marker in markers):
            return True
    return False


def localize_product(prod: dict) -> dict:
    item = copy.deepcopy(prod)
    slug = item.get("slug", "")
    if slug in CANONICAL_TITLES_ES:
        item["title"] = CANONICAL_TITLES_ES[slug]
    elif item.get("title"):
        item["title"] = translate_text(item["title"])
    for field in ("category", "subcategory"):
        if item.get(field):
            item[field] = translate_text(item[field])
    if item.get("subcategories"):
        item["subcategories"] = [translate_text(s) for s in item["subcategories"]]
    return item


def localize_slideshow(slides: list) -> list:
    localized = []
    for slide in slides:
        item = copy.deepcopy(slide)
        for field in ("title", "subtitle", "description"):
            if item.get(field):
                item[field] = translate_text(item[field])
        if item.get("link", "").startswith("/en/"):
            item["link"] = item["link"].replace("/en/", "/es/", 1)
        localized.append(item)
    return localized


def localize_page(en_data: dict | list, filename: str) -> dict | list:
    if isinstance(en_data, list):
        return localize_slideshow(en_data)

    page = copy.deepcopy(en_data)
    slug = page.get("slug") or filename.replace(".json", "")
    product_page = is_product_page(en_data)

    if slug in CANONICAL_TITLES_ES:
        page["title"] = f"{CANONICAL_TITLES_ES[slug]} | Control Applications"
    elif page.get("title"):
        title = re.sub(r"\s*\|.*", "", page["title"]).strip()
        page["title"] = f"{translate_text(title)} | Control Applications"

    if page.get("description"):
        page["description"] = translate_text(page["description"])

    if page.get("rich_text"):
        page["rich_text"] = [translate_text(block) for block in page["rich_text"]]

    if product_page:
        page["content_html"] = en_data.get("content_html", "")
    elif page.get("content_html"):
        page["content_html"] = translate_html(page["content_html"])

    if page.get("products"):
        page["products"] = [localize_product(p) for p in page["products"]]

    for item in page.get("gallery", []):
        if item.get("title"):
            item["title"] = translate_text(item["title"])

    url = page.get("url", "")
    if "elnet-meter.com" in url:
        if slug:
            page["url"] = f"https://www.elnet-meter.com/es/{slug}" if slug != "index" else "https://www.elnet-meter.com/es"
        else:
            page["url"] = "https://www.elnet-meter.com/es"

    return page


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Spanish content JSON from English.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate all files even if they already exist.",
    )
    args = parser.parse_args()

    DST_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC_DIR.glob("*.json"))
    print(f"Translating {len(files)} files from en -> es ...")

    for index, path in enumerate(files, 1):
        out = DST_DIR / path.name
        if out.exists() and not args.force:
            print(f"  [{index}/{len(files)}] {path.name} (skip)")
            continue
        en_data = json.loads(path.read_text(encoding="utf-8"))
        localized = localize_page(en_data, path.name)
        out.write_text(json.dumps(localized, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  [{index}/{len(files)}] {path.name}")

    print(f"\nWrote Spanish content to {DST_DIR}")


if __name__ == "__main__":
    main()
