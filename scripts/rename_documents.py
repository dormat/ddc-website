#!/usr/bin/env python3
"""Rename product PDFs to {english-slug}-sketch.pdf / {english-slug}-doc.pdf."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
DOCUMENTS_DIR = ROOT / "assets" / "documents"

LABEL_KIND = {
    "שרטוטים": "sketch",
    "הורד מסמכים": "doc",
}

TRANSFER_SWITCH_RENAMES = {
    "9a8771_79a15aeb71c24ecca86367ec9ea25818.pdf": "transfer-switch-controller-gen1-sketch.pdf",
    "9a8771_b330554d3df1480fb6135ac66cfc2a92.pdf": "transfer-switch-controller-gen2-sketch.pdf",
    "9a8771_c418d80bd8024e08a29facd47123fc63.pdf": "transfer-switch-controller-gen3-2-breakers-sketch.pdf",
    "9a8771_77deb5e6f898498388ced2756713f65b.pdf": "transfer-switch-controller-gen3-3-breakers-sketch.pdf",
}


def product_target_name(slug: str, kind: str) -> str:
    return f"{slug}-{kind}.pdf"


def slug_doc_targets() -> dict[tuple[str, str], str]:
    """(slug, kind) -> target filename from Hebrew product documents."""
    targets: dict[tuple[str, str], str] = {}
    for path in sorted((CONTENT_DIR / "he").glob("*.json")):
        page = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(page, dict):
            continue
        slug = path.stem
        for doc in page.get("documents") or []:
            kind = LABEL_KIND.get(doc.get("label", ""), "")
            if kind:
                targets[(slug, kind)] = product_target_name(slug, kind)
    return targets


def build_old_to_targets() -> dict[str, set[str]]:
    old_to_targets: dict[str, set[str]] = {}
    for path in sorted((CONTENT_DIR / "he").glob("*.json")):
        page = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(page, dict):
            continue
        slug = path.stem
        for doc in page.get("documents") or []:
            old = doc.get("file", "")
            kind = LABEL_KIND.get(doc.get("label", ""), "")
            if not old or not kind:
                continue
            old_to_targets.setdefault(old, set()).add(product_target_name(slug, kind))
    return old_to_targets


def rename_pdf_files(old_to_targets: dict[str, set[str]]) -> None:
    for old, targets in sorted(old_to_targets.items()):
        src = DOCUMENTS_DIR / old
        if not src.exists():
            print(f"  SKIP missing: {old}")
            continue
        ordered = sorted(targets)
        primary = DOCUMENTS_DIR / ordered[0]
        if not primary.exists():
            src.rename(primary)
            print(f"  Renamed: {old} -> {primary.name}")
        elif primary.resolve() != src.resolve():
            shutil.copy2(src, primary)
            src.unlink()
            print(f"  Renamed via copy: {old} -> {primary.name}")
        for extra in ordered[1:]:
            dest = DOCUMENTS_DIR / extra
            if not dest.exists():
                shutil.copy2(primary, dest)
                print(f"  Copied shared PDF: {primary.name} -> {extra}")

    for old, new in TRANSFER_SWITCH_RENAMES.items():
        src = DOCUMENTS_DIR / old
        dest = DOCUMENTS_DIR / new
        if not src.exists():
            if dest.exists():
                continue
            print(f"  SKIP missing transfer switch PDF: {old}")
            continue
        if dest.exists():
            if dest.resolve() != src.resolve():
                src.unlink()
            continue
        src.rename(dest)
        print(f"  Renamed: {old} -> {new}")


def update_json_documents() -> None:
    slug_targets = slug_doc_targets()
    for lang in ("he", "en", "es"):
        for path in sorted((CONTENT_DIR / lang).glob("*.json")):
            page = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(page, dict):
                continue
            slug = path.stem
            docs = page.get("documents")
            if not docs:
                continue
            changed = False
            for doc in docs:
                kind = LABEL_KIND.get(doc.get("label", ""), "")
                target = slug_targets.get((slug, kind)) if kind else None
                if target and doc.get("file") != target:
                    doc["file"] = target
                    changed = True
            if changed:
                path.write_text(json.dumps(page, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"  Updated {path.relative_to(ROOT)}")


def replace_in_file(path: Path, mapping: dict[str, str]) -> bool:
    text = path.read_text(encoding="utf-8")
    new_text = text
    for old, new in mapping.items():
        new_text = new_text.replace(old, new)
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    print(f"  Updated refs in {path.relative_to(ROOT)}")
    return True


def update_build_site(mapping: dict[str, str]) -> None:
    replace_in_file(ROOT / "scripts" / "build_site.py", mapping)


def full_rename_mapping() -> dict[str, str]:
    mapping = dict(TRANSFER_SWITCH_RENAMES)
    for old, targets in build_old_to_targets().items():
        mapping[old] = sorted(targets)[0]
    return mapping


def main() -> None:
    old_to_targets = build_old_to_targets()
    mapping = full_rename_mapping()

    print("Renaming PDF files...")
    rename_pdf_files(old_to_targets)

    print("Updating product JSON document filenames...")
    update_json_documents()

    print("Updating build_site.py transfer switch references...")
    update_build_site(mapping)

    print("Done.")


if __name__ == "__main__":
    main()
