#!/usr/bin/env python3
"""Remove duplicate and unreferenced images from assets/images/."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "assets" / "images"
ALIASES_PATH = ROOT / "assets" / "image_aliases.json"
CONTENT_DIR = ROOT / "content"
SCRIPTS_DIR = ROOT / "scripts"

IMAGE_REF_RE = re.compile(
    r"/assets/images/([^\s\"'<>?{}\\]+)|"
    r"(?:^|[^\w/])images/([^\s\"'<>?{}\\]+)"
)
CONFIG_IMAGE_RE = re.compile(
    r'"([a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|gif|webp|svg))"'
)
HASH_NAME_RE = re.compile(r"^[0-9a-f]{6,}_|~mv2")

KEEP_ALWAYS = frozenset({
    "logo.png",
    "logo-icon.png",
    "favicon.png",
    "hero-bg.jpg",
    "hero-product.png",
    "flag-us.png",
    "flag-il.png",
    "flag-spain.jpg",
})


def image_filename(src: str) -> str:
    return src.rsplit("/", 1)[-1].split("?")[0]


def is_valid_name(name: str) -> bool:
    return bool(name) and "{" not in name and "}" not in name


def load_aliases() -> dict[str, str]:
    if not ALIASES_PATH.exists():
        return {}
    return json.loads(ALIASES_PATH.read_text(encoding="utf-8"))


def collect_referenced_names() -> set[str]:
    refs: set[str] = set()

    for path in CONTENT_DIR.rglob("*.json"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in IMAGE_REF_RE.finditer(text):
            name = match.group(1) or match.group(2)
            if is_valid_name(name):
                refs.add(image_filename(name))

    for path in (SCRIPTS_DIR / "config.py", SCRIPTS_DIR / "build_site.py"):
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in IMAGE_REF_RE.finditer(text):
            name = match.group(1) or match.group(2)
            if is_valid_name(name):
                refs.add(image_filename(name))

    config_text = (SCRIPTS_DIR / "config.py").read_text(encoding="utf-8", errors="ignore")
    for match in CONFIG_IMAGE_RE.finditer(config_text):
        refs.add(match.group(1))

    for path in CONTENT_DIR.rglob("slideshow.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        slides = data if isinstance(data, list) else data.get("slides", [])
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            for key in ("image", "src", "background", "bg"):
                val = slide.get(key, "")
                if val:
                    name = image_filename(val)
                    if is_valid_name(name):
                        refs.add(name)

    return refs


def resolve_to_file(name: str, aliases: dict[str, str]) -> str | None:
    if (ASSETS_DIR / name).is_file():
        return name
    target = aliases.get(name)
    if target and (ASSETS_DIR / target).is_file():
        return target
    return None


def pick_canonical(names: list[str], referenced: set[str]) -> str:
    referenced_names = [n for n in names if n in referenced]
    if referenced_names:
        return sorted(referenced_names, key=len)[0]

    def score(name: str) -> tuple[int, int, str]:
        hashy = 1 if HASH_NAME_RE.search(name) else 0
        return (hashy, len(name), name)

    return sorted(names, key=score)[0]


def replace_in_text(text: str, mapping: dict[str, str]) -> str:
    """Replace image filenames only in /assets/images/ URL paths."""
    if not mapping:
        return text

    def repl_path(match: re.Match) -> str:
        old = image_filename(match.group(1) or match.group(2))
        new = mapping.get(old)
        if not new or new == old:
            return match.group(0)
        return match.group(0).replace(old, new, 1)

    return IMAGE_REF_RE.sub(repl_path, text)


def normalize_alias_refs(aliases: dict[str, str]) -> int:
    """Rewrite content that still points at hash filenames to friendly aliases."""
    updated = 0
    mapping = {
        key: value
        for key, value in aliases.items()
        if key != value and (ASSETS_DIR / value).is_file()
    }
    if not mapping:
        return 0

    for path in CONTENT_DIR.rglob("*.json"):
        raw = path.read_text(encoding="utf-8")
        new = replace_in_text(raw, mapping)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            updated += 1
    return updated


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    aliases = load_aliases()
    if not dry_run:
        normalized = normalize_alias_refs(aliases)
        if normalized:
            print(f"Normalized hash image refs in {normalized} content file(s)")
    referenced_raw = collect_referenced_names()

    resolved: dict[str, str] = {}
    missing: list[str] = []
    for name in sorted(referenced_raw):
        file_name = resolve_to_file(name, aliases)
        if file_name:
            resolved[name] = file_name
        else:
            missing.append(name)

    if missing:
        print(f"WARNING: {len(missing)} referenced image(s) missing on disk:")
        for name in missing[:20]:
            print(f"  {name}")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")

    keep_files = set(resolved.values())
    for name in KEEP_ALWAYS:
        if (ASSETS_DIR / name).is_file():
            keep_files.add(name)

    by_hash: dict[str, list[str]] = defaultdict(list)
    for path in ASSETS_DIR.iterdir():
        if path.is_file():
            digest = hashlib.md5(path.read_bytes()).hexdigest()
            by_hash[digest].append(path.name)

    rename_map: dict[str, str] = {}
    for names in by_hash.values():
        if len(names) < 2:
            continue
        canonical = pick_canonical(names, keep_files | set(resolved.keys()))
        keep_files.add(canonical)
        for name in names:
            if name != canonical:
                rename_map[name] = canonical

    on_disk = {p.name for p in ASSETS_DIR.iterdir() if p.is_file()}
    to_delete = sorted(name for name in on_disk if name not in keep_files)

    ref_updates = dict(rename_map)
    updated_files = 0
    for path in list(CONTENT_DIR.rglob("*.json")) + [
        SCRIPTS_DIR / "config.py",
        SCRIPTS_DIR / "build_site.py",
    ]:
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        new = replace_in_text(raw, ref_updates)
        if new != raw:
            updated_files += 1
            if not dry_run:
                path.write_text(new, encoding="utf-8")

    if not dry_run:
        for name in to_delete:
            (ASSETS_DIR / name).unlink(missing_ok=True)

        new_aliases: dict[str, str] = {}
        for key, value in aliases.items():
            value = rename_map.get(value, value)
            if (ASSETS_DIR / value).is_file() and key != value:
                new_aliases[key] = value
        ALIASES_PATH.write_text(
            json.dumps(new_aliases, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    remaining = len(keep_files) if dry_run else len([p for p in ASSETS_DIR.iterdir() if p.is_file()])
    print(f"Referenced: {len(referenced_raw)} names -> {len(keep_files)} files kept")
    print(f"Duplicate groups: {len([g for g in by_hash.values() if len(g) > 1])}")
    print(f"Files to delete: {len(to_delete)}")
    print(f"Content files updated: {updated_files}")
    print(f"Images remaining: {remaining}")
    if dry_run:
        print("(dry run — no files changed)")


if __name__ == "__main__":
    main()
