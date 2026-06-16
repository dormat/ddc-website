"""Wix image URL helpers and bulk download for local asset mirroring."""

from __future__ import annotations

import json
import re
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SCRAPED_DIR = ROOT / "scraped"
ASSETS_DIR = ROOT / "assets" / "images"
ALIASES_PATH = ROOT / "assets" / "image_aliases.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; DDC-mirror/1.0)"}

WIX_URL_RE = re.compile(r"https://static\.wixstatic\.com/media/[^\s\"'<>]+")
_aliases_cache: dict[str, str] | None = None


def media_basename(url: str) -> str:
    if "/media/" not in url:
        return ""
    return url.split("/media/")[-1].split("/v1/")[0].split("?")[0]


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


def wix_full_url(url: str, max_dim: int = 1200) -> str:
    """Return a high-quality Wix URL (used only for downloading)."""
    base = media_basename(url)
    if not base:
        return url
    return f"https://static.wixstatic.com/media/{base}/v1/fill/w_{max_dim},h_{max_dim},al_c,q_90,enc_auto/{base}"


def wix_original_url(url: str) -> str:
    """Return the original media file URL without transforms."""
    base = media_basename(url)
    if not base:
        return url
    return f"https://static.wixstatic.com/media/{base}"


def local_image_path(basename: str) -> Path:
    return ASSETS_DIR / basename


def collect_wix_urls_from_text(text: str) -> set[str]:
    return set(WIX_URL_RE.findall(text))


def collect_all_media_basenames() -> dict[str, str]:
    """Map media basename -> best download URL."""
    mapping: dict[str, str] = {}

    paths = list(SCRAPED_DIR.rglob("*.json"))
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for url in collect_wix_urls_from_text(text):
            base = media_basename(url)
            if not base:
                continue
            # Prefer original-quality URL for each media id
            mapping[base] = wix_original_url(url)

    return mapping


def download_image(url: str, dest: Path) -> bool:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        if len(resp.content) < 100:
            return False
        dest.write_bytes(resp.content)
        return True
    except Exception:
        return False


def download_all_images(*, force: bool = False) -> tuple[int, int]:
    """Download every Wix media file referenced in scraped data."""
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    mapping = collect_all_media_basenames()

    ok = 0
    skipped = 0
    failed = 0

    for basename, url in sorted(mapping.items()):
        dest = local_image_path(basename)
        if dest.exists() and not force:
            skipped += 1
            continue

        if download_image(url, dest):
            ok += 1
            print(f"  Downloaded: {basename} ({dest.stat().st_size} bytes)")
        else:
            # Retry with high-quality transformed URL
            if download_image(wix_full_url(url), dest):
                ok += 1
                print(f"  Downloaded (hq): {basename} ({dest.stat().st_size} bytes)")
            else:
                failed += 1
                print(f"  FAILED: {basename}")

    print(f"Images: {ok} downloaded, {skipped} skipped, {failed} failed ({len(mapping)} total)")
    return ok, failed


def rewrite_to_local(url: str, assets_root: Path) -> str:
    """Rewrite a Wix CDN URL to a local /assets/images/ path if the file exists."""
    basename = media_basename(url)
    if not basename:
        return url
    local_name = local_image_name(basename)
    local = assets_root / "images" / local_name
    if local.exists():
        return f"/assets/images/{local_name}"
    legacy = assets_root / "images" / basename
    if legacy.exists():
        return f"/assets/images/{basename}"
    return url
