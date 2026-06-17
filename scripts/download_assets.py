#!/usr/bin/env python3
"""Verify that every image referenced in page content exists under assets/images/."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from image_assets import ASSETS_DIR, CONTENT_DIR, image_filename

ROOT = Path(__file__).resolve().parent.parent
IMAGE_REF_RE = re.compile(r"/assets/images/[^\s\"'<>?\\]+|images/[^\s\"'<>?\\]+")


def collect_image_refs(text: str) -> set[str]:
    refs: set[str] = set()
    for match in IMAGE_REF_RE.findall(text):
        name = image_filename(match)
        if name:
            refs.add(name)
    return refs


def main() -> None:
    missing: dict[str, list[str]] = {}

    for path in sorted(CONTENT_DIR.rglob("*.json")):
        text = path.read_text(encoding="utf-8")
        for name in collect_image_refs(text):
            if not (ASSETS_DIR / name).is_file():
                missing.setdefault(name, []).append(str(path.relative_to(ROOT)))

    if missing:
        print(f"Missing {len(missing)} image file(s):", file=sys.stderr)
        for name, sources in sorted(missing.items())[:20]:
            print(f"  {name} (e.g. {sources[0]})", file=sys.stderr)
        sys.exit(1)

    print("OK: all referenced images exist locally.")


if __name__ == "__main__":
    main()
