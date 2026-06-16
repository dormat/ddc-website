#!/usr/bin/env python3
"""Patch billing software page JSON with Wix gallery images."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GALLERY = [
    (
        "9a8771_f5301f25ab054197a58f008f1bbfcb8b~mv2.png",
        "Billing Prog.png",
        "ElNet Billing & PQ Software",
        "תוכנת Elnet חשבונות ואיכות חשמל",
    ),
    (
        "9a8771_48ddd53815f34793985a30b03bafcd33~mv2.png",
        "elnetweb-1png",
        "ELNetWeb Billing",
        "ELNetWeb Billing",
    ),
    (
        "9a8771_64ad373b7a944046a9d9c62c94e05974~mv2.png",
        "elnet-pqweb-catalogpng",
        "ELNetWeb PQ catalog",
        "קטלוג ELNetWeb PQ",
    ),
    (
        "9a8771_6ff6d859f4b24eef9ef465de6b546ba9~mv2.png",
        "elnet-pqweb-1png",
        "ELNetWeb PQ",
        "ELNetWeb PQ",
    ),
    (
        "9a8771_102d4e18451f48e1b70a6cda0af2ddba~mv2.png",
        "billing-3png",
        "ELNetWeb Billing screen",
        "מסך ELNetWeb Billing",
    ),
    (
        "9a8771_bf3dd99eae7047e09cef5f47e5a99b0e~mv2.png",
        "billing-20png",
        "ELNetWeb Billing screen",
        "מסך ELNetWeb Billing",
    ),
]


def wix_url(base: str, filename: str, w: int = 987, h: int = 638) -> str:
    if base.startswith("9a8771_f5301"):
        w, h = 444, 444
    elif "960" in filename or "elnetweb" in filename or "pqweb" in filename:
        w, h = 960, 960
    return (
        f"https://static.wixstatic.com/media/{base}/v1/fill/"
        f"w_{w},h_{h},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/{filename}"
    )


def figures_html(lang: str) -> str:
    parts: list[str] = []
    for base, filename, alt_en, alt_he in GALLERY:
        alt = alt_he if lang == "he" else alt_en
        url = wix_url(base, filename)
        parts.append(
            f'<figure class="content-image"><img src="{url}" alt="{alt}" loading="lazy"/></figure>'
        )
    return "\n".join(parts)


def patch(path: Path, lang: str) -> None:
    page = json.loads(path.read_text(encoding="utf-8"))
    html = page["content_html"]
    if "<figure class=\"content-image\">" in html:
        html = html.split("<figure class=\"content-image\">", 1)[0].rstrip()
    page["content_html"] = html + "\n" + figures_html(lang)

    images: list[dict] = []
    gallery: list[dict] = []
    for base, filename, alt_en, alt_he in GALLERY:
        alt = alt_he if lang == "he" else alt_en
        src = wix_url(base, filename)
        images.append({"src": src, "alt": alt})
        gallery.append({"src": src, "alt": alt})

    page["images"] = images
    page["gallery"] = gallery
    path.write_text(json.dumps(page, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    patch(ROOT / "scraped/en/elnet-billing-software.json", "en")
    patch(ROOT / "scraped/he/elnet-billing-software.json", "he")
    print("Patched billing software gallery in en/he JSON")


if __name__ == "__main__":
    main()
