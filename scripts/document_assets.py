"""Product document (PDF) helpers and download utilities."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests

ROOT = Path(__file__).resolve().parent.parent
DOCUMENTS_DIR = ROOT / "assets" / "documents"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; DDC-mirror/1.0)"}

DOCUMENT_LABEL_ORDER = ("שרטוטים", "הורד מסמכים")
DOCUMENT_LABELS_EN = {
    "שרטוטים": "Schematics",
    "הורד מסמכים": "Download Docs",
}

DOCUMENT_LABEL_ALIASES = {
    "Schematics": "שרטוטים",
    "Sketches": "שרטוטים",
    "Download Docs": "הורד מסמכים",
    "Download Documents": "הורד מסמכים",
}


def document_filename(url: str) -> str:
    """Derive a stable local PDF filename from a document URL."""
    path = unquote(urlparse(url).path)
    name = path.rstrip("/").split("/")[-1]
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    return re.sub(r"[^\w.\-]", "_", name)


def local_document_path(filename: str) -> Path:
    return DOCUMENTS_DIR / filename


def rewrite_document_url(filename: str) -> str:
    return f"/assets/documents/{filename}"


def download_document(url: str, dest: Path) -> bool:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=90, allow_redirects=True)
        resp.raise_for_status()
        content = resp.content
        if len(content) < 200:
            return False
        if content[:4] != b"%PDF":
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return True
    except Exception:
        return False


def download_documents(docs: list[dict], *, force: bool = False) -> tuple[int, int]:
    """Download document files referenced in scraped page data."""
    ok = 0
    failed = 0
    seen: set[str] = set()
    for doc in docs:
        filename = doc.get("file", "")
        url = doc.get("url", "")
        if not filename or not url or filename in seen:
            continue
        seen.add(filename)
        dest = local_document_path(filename)
        if dest.exists() and not force:
            ok += 1
            continue
        if download_document(url, dest):
            ok += 1
            print(f"  Downloaded document: {filename} ({dest.stat().st_size} bytes)")
        else:
            failed += 1
            print(f"  FAILED document: {filename} <- {url}")
    return ok, failed
