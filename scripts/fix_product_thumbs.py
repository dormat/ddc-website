#!/usr/bin/env python3
"""Sync product catalog thumbnails from individual product detail pages."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from build_site import product_canonical_slug, product_thumbnail_src, build_slug_index, build_title_index
from image_assets import wix_full_url


def patch_products(lang: str) -> int:
    path = ROOT / "scraped" / lang / "products.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    products = data.get("products") or []
    slug_index = build_slug_index(lang)
    title_index = build_title_index(lang)
    updated = 0

    for prod in products:
        slug = product_canonical_slug(prod, lang, slug_index, title_index)
        thumb = product_thumbnail_src(slug, lang, prod.get("src", ""))
        if not thumb:
            continue
        # Store a high-quality Wix URL for download_assets / offline use
        new_src = wix_full_url(thumb, max_dim=400)
        if prod.get("src") != new_src:
            prod["src"] = new_src
            if slug:
                prod["slug"] = slug
            updated += 1

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return updated


def main() -> None:
    for lang in ("en", "he"):
        n = patch_products(lang)
        print(f"Updated {n} product thumbnails in scraped/{lang}/products.json")


if __name__ == "__main__":
    main()
