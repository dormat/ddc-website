#!/usr/bin/env python3
"""Build descriptive image filenames and rename local assets."""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from urllib.parse import unquote

from image_assets import ASSETS_DIR, image_filename, url_tail_filename
from slugs import all_canonical_slugs, resolve_source_file

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
ALIASES_PATH = ROOT / "assets" / "image_aliases.json"
SITE_LANGS = ("he", "en", "es")
IMAGE_REF_RE = re.compile(r"/assets/images/[^\s\"'<>?\\]+|images/[^\s\"'<>?\\]+")

KEEP_NAMES = {
    "logo.png",
    "logo-icon.png",
    "favicon.png",
    "hero-bg.jpg",
    "hero-product.png",
    "bullet_ball_green_edited.png",
}

HASH_RE = re.compile(r"^[0-9a-f]{6,}_[0-9a-f]{32}|^[0-9a-f]{32}\.|~mv2")
SLUG_SAFE_RE = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = SLUG_SAFE_RE.sub("-", text)
    return text.strip("-") or "image"


def is_hash_name(name: str) -> bool:
    if name in KEEP_NAMES:
        return False
    base = name.rsplit(".", 1)[0]
    return bool(HASH_RE.search(base)) or base.startswith(
        ("9a8771_", "035244_", "422dc5_", "871799_", "b25591_", "11062b_")
    )


def meaningful_alt(alt: str) -> str:
    alt = unquote(alt or "").strip()
    if not alt or alt.lower() in {"add a title", "image", "photo"}:
        return ""
    if is_hash_name(alt):
        return ""
    return slugify(Path(alt).stem)


def url_display_name(url: str) -> str:
    if "/media/" not in url:
        return ""
    tail = unquote(url.split("/")[-1].split("?")[0])
    stem = Path(tail).stem
    if not stem or is_hash_name(tail):
        return ""
    return slugify(stem)


def collect_image_refs() -> list[dict]:
    refs: list[dict] = []
    pages: list[tuple[str, str, dict]] = []

    for lang in SITE_LANGS:
        content_dir = CONTENT_DIR / lang
        if not content_dir.exists():
            continue
        for canonical in [""] + all_canonical_slugs():
            if canonical == "":
                path = content_dir / "index.json"
            else:
                stem = resolve_source_file(lang, canonical, content_dir) or canonical
                path = content_dir / f"{stem}.json"
                if not path.exists():
                    path = content_dir / f"{canonical}.json"
            if not path.exists():
                continue
            page = json.loads(path.read_text(encoding="utf-8"))
            pages.append((lang, canonical or "home", page))

    for lang, page_slug, page in pages:
        for idx, img in enumerate(page.get("images", [])):
            refs.append(
                {
                    "basename": image_filename(img.get("src", "")),
                    "page": page_slug,
                    "role": "content",
                    "index": idx,
                    "alt": img.get("alt", ""),
                    "src": img.get("src", ""),
                    "lang": lang,
                }
            )
        for idx, item in enumerate(page.get("gallery", [])):
            refs.append(
                {
                    "basename": image_filename(item.get("src", "")),
                    "page": page_slug,
                    "role": "gallery",
                    "index": idx,
                    "alt": item.get("title", ""),
                    "src": item.get("src", ""),
                    "lang": lang,
                }
            )
        for idx, prod in enumerate(page.get("products", [])):
            for key, role in (("image", "product"), ("thumb", "thumb")):
                if prod.get(key):
                    refs.append(
                        {
                            "basename": image_filename(prod[key]),
                            "page": page_slug,
                            "role": role,
                            "index": idx,
                            "alt": prod.get("title", ""),
                            "src": prod[key],
                            "lang": lang,
                        }
                    )
            for sidx, src in enumerate(prod.get("screens", [])):
                refs.append(
                    {
                        "basename": image_filename(src),
                        "page": page_slug,
                        "role": "screen",
                        "index": sidx,
                        "alt": prod.get("title", ""),
                        "src": src,
                        "lang": lang,
                    }
                )
        for idx, match in enumerate(IMAGE_REF_RE.findall(page.get("content_html", ""))):
            refs.append(
                {
                    "basename": image_filename(match),
                    "page": page_slug,
                    "role": "html",
                    "index": idx,
                    "alt": image_filename(match),
                    "src": match,
                    "lang": lang,
                }
            )

    return refs


def find_existing_file(refs: list[dict], basename: str) -> str | None:
    """Match a hash basename to an already-renamed local file."""
    ext = Path(basename).suffix or ".jpg"
    candidates: list[str] = []

    for ref in refs:
        alt = unquote(ref.get("alt", "")).strip()
        if alt:
            candidates.append(alt)
        alt_name = meaningful_alt(alt)
        if alt_name:
            candidates.append(f"{alt_name}{ext}")
        src = ref.get("src", "")
        if src:
            tail = image_filename(src) if src.startswith("/assets/") else url_tail_filename(src)
            if tail:
                candidates.append(tail)

    seen: set[str] = set()
    for name in candidates:
        if not name or name in seen:
            continue
        seen.add(name)
        if (ASSETS_DIR / name).is_file():
            return name
    return None


def choose_alias_name(basename: str, refs: list[dict], used: set[str]) -> str:
    ext = Path(basename).suffix or ".jpg"
    ref = refs[0]
    page = ref["page"]
    role = ref["role"]
    idx = ref["index"] + 1

    for r in refs:
        alt_name = meaningful_alt(r.get("alt", ""))
        if alt_name:
            candidate = f"{alt_name}{ext}"
            if candidate not in used and not is_hash_name(candidate):
                return candidate

    for r in refs:
        url_name = url_display_name(r.get("src", ""))
        if not url_name:
            stem = Path(basename).stem
            if not is_hash_name(basename):
                url_name = slugify(stem)
        if url_name:
            candidate = f"{url_name}{ext}"
            if candidate not in used:
                return candidate

    base = f"{page}-{role}-{idx}{ext}"
    candidate = base
    n = 2
    while candidate in used:
        candidate = f"{page}-{role}-{idx}-{n}{ext}"
        n += 1
    return candidate


def main() -> None:
    refs_by_base: dict[str, list[dict]] = {}
    for ref in collect_image_refs():
        base = ref.get("basename")
        if not base:
            continue
        refs_by_base.setdefault(base, []).append(ref)

    aliases: dict[str, str] = {}
    if ALIASES_PATH.exists():
        stored = json.loads(ALIASES_PATH.read_text(encoding="utf-8"))
        for old_base, new_name in stored.items():
            if (ASSETS_DIR / new_name).is_file():
                aliases[old_base] = new_name

    used_names: set[str] = set(KEEP_NAMES)
    used_names.update(aliases.values())

    for path in ASSETS_DIR.glob("*"):
        if path.is_file() and not is_hash_name(path.name):
            used_names.add(path.name)

    for basename in sorted(refs_by_base):
        refs = refs_by_base[basename]
        src = ASSETS_DIR / basename

        if not src.exists():
            existing = find_existing_file(refs, basename)
            if existing:
                aliases[basename] = existing
                used_names.add(existing)
            continue

        if basename in KEEP_NAMES or not is_hash_name(basename):
            aliases[basename] = basename
            used_names.add(basename)
            continue

        if basename in aliases:
            used_names.add(aliases[basename])
            continue

        new_name = choose_alias_name(basename, refs, used_names)
        aliases[basename] = new_name
        used_names.add(new_name)

    renamed = 0
    for old_base, new_name in sorted(aliases.items()):
        if old_base == new_name:
            continue
        old_path = ASSETS_DIR / old_base
        new_path = ASSETS_DIR / new_name
        if not old_path.exists():
            continue
        if new_path.exists():
            continue
        shutil.move(str(old_path), str(new_path))
        renamed += 1
        print(f"  {old_base} -> {new_name}")

    ALIASES_PATH.write_text(json.dumps(aliases, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nRenamed {renamed} images; {len(aliases)} aliases saved to {ALIASES_PATH}")


if __name__ == "__main__":
    main()
