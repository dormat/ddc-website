"""Local image path helpers for site assets."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
ASSETS_DIR = ROOT / "assets" / "images"
ALIASES_PATH = ROOT / "assets" / "image_aliases.json"

_aliases_cache: dict[str, str] | None = None


def image_filename(src: str) -> str:
    """Return the bare image filename from a local asset path."""
    if not src:
        return ""
    if src.startswith("/assets/images/"):
        return src.rsplit("/", 1)[-1]
    if src.startswith("images/"):
        return src.rsplit("/", 1)[-1]
    if "/" not in src and "." in src:
        return src
    return src.rsplit("/", 1)[-1]


def url_tail_filename(url: str) -> str:
    tail = unquote(url.split("/")[-1].split("?")[0])
    return tail if "." in tail else ""


def local_asset_path(filename: str) -> str:
    return f"/assets/images/{filename}"


def clear_aliases_cache() -> None:
    global _aliases_cache
    _aliases_cache = None


def load_image_aliases() -> dict[str, str]:
    global _aliases_cache
    if _aliases_cache is None:
        if ALIASES_PATH.exists():
            _aliases_cache = json.loads(ALIASES_PATH.read_text(encoding="utf-8"))
        else:
            _aliases_cache = {}
    return _aliases_cache


def local_image_name(basename: str) -> str:
    return load_image_aliases().get(basename, basename)


def find_local_image_file(basename: str, *, hints: list[str] | None = None) -> str | None:
    if not basename:
        return None

    aliases = load_image_aliases()
    candidates: list[str] = []

    if basename in aliases:
        candidates.append(aliases[basename])
    candidates.append(basename)

    for hint in hints or []:
        hint = unquote(hint or "").strip()
        if not hint:
            continue
        candidates.append(hint)
        if "." not in hint:
            for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
                candidates.append(f"{hint}{ext}")

    seen: set[str] = set()
    for name in candidates:
        if not name or name in seen:
            continue
        seen.add(name)
        if (ASSETS_DIR / name).is_file():
            return name
    return None


def resolve_image_src(url: str) -> str:
    """Normalize an image reference to a site-root /assets/images/ path."""
    if not url:
        return url
    basename = image_filename(url)
    if url.startswith("/assets/images/"):
        if (ASSETS_DIR / basename).is_file():
            return url
        found = find_local_image_file(basename)
        return local_asset_path(found) if found else url
    if url.startswith("images/"):
        if (ASSETS_DIR / basename).is_file():
            return f"/assets/{url}"
        found = find_local_image_file(basename)
        return local_asset_path(found) if found else f"/assets/{url}"
    if not url.startswith("http"):
        if (ASSETS_DIR / basename).is_file():
            return local_asset_path(basename)
        found = find_local_image_file(basename)
        if found:
            return local_asset_path(found)
    return url
