#!/usr/bin/env python3
"""Patch billing software page JSON with local gallery images."""

from __future__ import annotations

import json
from pathlib import Path

from image_assets import local_asset_path

ROOT = Path(__file__).resolve().parent.parent

GALLERY = [
    ("elnet-billing-and-pq-software.png", "ElNet Billing & PQ Software", "תוכנת Elnet חשבונות ואיכות חשמל"),
    ("elnetweb-1png.png", "ELNetWeb Billing", "ELNetWeb Billing"),
    ("elnetweb-pq-catalog.png", "ELNetWeb PQ catalog", "קטלוג ELNetWeb PQ"),
    ("elnet-pqweb-1png.png", "ELNetWeb PQ", "ELNetWeb PQ"),
    ("billing-3png.png", "ELNetWeb Billing screen", "מסך ELNetWeb Billing"),
    ("billing-20png.png", "ELNetWeb Billing screen", "מסך ELNetWeb Billing"),
]


def figures_html(lang: str) -> str:
    parts: list[str] = []
    for filename, alt_en, alt_he in GALLERY:
        alt = alt_he if lang == "he" else alt_en
        url = local_asset_path(filename)
        parts.append(
            f'<figure class="content-image"><img src="{url}" alt="{alt}" loading="lazy"/></figure>'
        )
    return "\n".join(parts)


def main() -> None:
    for lang in ("he", "en", "es"):
        path = ROOT / "content" / lang / "elnet-billing-software.json"
        if not path.exists():
            continue
        page = json.loads(path.read_text(encoding="utf-8"))
        html = figures_html(lang)
        if lang == "he":
            marker = '<div class="rich-text"><h2 class="font_2'
        else:
            marker = '<div class="rich-text"><h2'
        if marker in page.get("content_html", ""):
            before, _, after = page["content_html"].partition(marker)
            page["content_html"] = before + html + "\n" + marker + after
        else:
            page["content_html"] = html + "\n" + page.get("content_html", "")
        path.write_text(json.dumps(page, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Patched {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
