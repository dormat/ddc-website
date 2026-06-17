#!/usr/bin/env python3
"""Sync product document metadata from Hebrew into EN/ES content JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"

SITE_DOCUMENT_BASE = {
    "he": "https://www.ddc.co.il",
    "en": "https://www.elnet-meter.com",
    "es": "https://www.elnet-meter.com",
}

DOCUMENT_LABEL_ORDER = ("שרטוטים", "הורד מסמכים")


def localize_document_url(url: str, lang: str) -> str:
    if not url:
        return url
    base = SITE_DOCUMENT_BASE[lang]
    return re.sub(r"https?://[^/]+", base, url)


def merged_documents(he_docs: list[dict], page_docs: list[dict], lang: str) -> list[dict]:
    by_file: dict[str, dict] = {}
    for doc in he_docs:
        filename = doc.get("file", "")
        if not filename:
            continue
        by_file[filename] = {
            "label": doc.get("label", ""),
            "url": localize_document_url(doc.get("url", ""), lang),
            "file": filename,
        }
    for doc in page_docs:
        filename = doc.get("file", "")
        if filename and filename in by_file and doc.get("url"):
            by_file[filename]["url"] = doc["url"]
    order = {label: index for index, label in enumerate(DOCUMENT_LABEL_ORDER)}
    return sorted(by_file.values(), key=lambda item: (order.get(item.get("label", ""), 99), item.get("file", "")))


def main() -> None:
    updated = 0
    for he_path in sorted((CONTENT_DIR / "he").glob("*.json")):
        he_page = json.loads(he_path.read_text(encoding="utf-8"))
        if not isinstance(he_page, dict):
            continue
        he_docs = he_page.get("documents") or []
        if not he_docs:
            continue

        for lang in ("en", "es"):
            path = CONTENT_DIR / lang / he_path.name
            if not path.exists():
                continue
            page = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(page, dict):
                continue
            docs = merged_documents(he_docs, page.get("documents") or [], lang)
            if docs == page.get("documents"):
                continue
            page["documents"] = docs
            path.write_text(json.dumps(page, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            updated += 1
            print(f"Updated {path.relative_to(ROOT)}")

    print(f"Done. Updated {updated} file(s).")


if __name__ == "__main__":
    main()
