#!/usr/bin/env python3
"""Turn product PDFs into per-device assistant knowledge packs.

Run from the repo root:

  bot/.venv/bin/python bot/prepare_manual.py            # all devices with a PDF
  bot/.venv/bin/python bot/prepare_manual.py lt22 mc8   # selected devices
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE = Path(__file__).resolve().parent / "knowledge"
DOWNLOADS = Path.home() / "Downloads"

# LT22 technician function codes — drop any line that still contains one.
LT22_FORBIDDEN_CODES = (
    "6475",
    "6425",
    "6427",
    "5621",
    "6499",
    "5555",
    "1010",
    "1155",
    "965",
    "962",
    "918",
    "906",
    "177",
    "2022",
    "2023",
    "2024",
    "967",
    "917",
)
LT22_CODE_RE = re.compile(r"(?<!\d)(?:" + "|".join(LT22_FORBIDDEN_CODES) + r")(?!\d)")

CAPTION_LINE_RE = re.compile(r"^איור\s*(\d+)\s*$")
CAPTION_LOOSE_RE = re.compile(r"איור\s*(\d+)\b")
TOC_DOTS_RE = re.compile(r"\.{3,}|…")


@dataclass
class DeviceSpec:
    id: str
    label: str
    subtitle: str
    product_name: str
    pdf_name: str
    drop_headers: tuple[str, ...] = ()
    strip_section_start: str | None = None
    strip_section_end: str | None = None
    forbidden_line_re: re.Pattern[str] | None = None
    extra_drop_substrings: tuple[str, ...] = ()


DEVICES: dict[str, DeviceSpec] = {
    "lt22": DeviceSpec(
        id="lt22",
        label="LT22",
        subtitle="מונה אנרגיה ELNet",
        product_name="מונה אנרגיה ELNet LT22",
        pdf_name="LT22_User_Manual_HE.pdf",
        drop_headers=("מדריך למשתמש והתקנה", "LT22 –", "– LT22"),
        strip_section_start=r"^8\.1\b",
        strip_section_end=r"^8\.2\b",
        forbidden_line_re=LT22_CODE_RE,
        extra_drop_substrings=("קודי פונקציה", "קוד פונקציה", "איפוס קר"),
    ),
    "mc8": DeviceSpec(
        id="mc8",
        label="MC8",
        subtitle="שמונה מדי אנרגיה תלת-פאזיים",
        product_name="מונה אנרגיה ELNet MC8",
        pdf_name="MC8_Manual_HE.pdf",
        drop_headers=("MC8 –", "מדריך למשתמש ולטכנאי"),
        strip_section_start=r"^17\.\s*קודי שירות",
        strip_section_end=r"^18\.",
        extra_drop_substrings=("קודי שירות",),
    ),
    "pfc": DeviceSpec(
        id="pfc",
        label="PFC",
        subtitle="בקר מקדם הספק",
        product_name="בקר מקדם הספק ELNet PFC",
        pdf_name="PFC_Manual_HE.pdf",
        drop_headers=("PFC –", "מדריך למשתמש ולטכנאי"),
        strip_section_start=r"^17\.\s*קודי שירות",
        strip_section_end=r"^18\.",
        extra_drop_substrings=("קודי שירות",),
    ),
    "pfc10": DeviceSpec(
        id="pfc10",
        label="PFC10",
        subtitle="בקר מקדם הספק ומד אנרגיה",
        product_name="בקר מקדם הספק ומד אנרגיה ELNet PFC10",
        pdf_name="PFC10_Manual_HE.pdf",
        drop_headers=("PFC10 –", "מדריך למשתמש ולטכנאי"),
        strip_section_start=r"^17\.\s*קודי שירות",
        strip_section_end=r"^18\.",
        extra_drop_substrings=("קודי שירות",),
    ),
}


def page_lines(page: pymupdf.Page) -> list[tuple[float, str]]:
    """Lines in reading order. Spans on a line are taken right to left."""
    data = page.get_text("dict", sort=True)
    buckets: dict[float, list] = {}
    for block in data["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            y = round(line["bbox"][1], 0)
            buckets.setdefault(y, []).extend(line["spans"])
    lines: list[tuple[float, str]] = []
    for y in sorted(buckets):
        spans = sorted(buckets[y], key=lambda span: -span["bbox"][0])
        text = "".join(span["text"] for span in spans)
        text = re.sub(r"[ \t]+", " ", text).strip()
        if text:
            lines.append((y, text))
    return lines


def is_toc_line(text: str) -> bool:
    return bool(TOC_DOTS_RE.search(text))


def keep_line(spec: DeviceSpec, text: str) -> bool:
    if text in spec.drop_headers:
        return False
    if any(text.startswith(header) and is_toc_line(text) for header in spec.drop_headers):
        return False
    if re.fullmatch(r"\d{1,3}", text):
        return False
    for needle in spec.extra_drop_substrings:
        if needle in text and (is_toc_line(text) or re.search(r"\b8\.1\b", text) or text.startswith("17.")):
            return False
    if spec.id == "lt22":
        if "קודי פונקציה" in text or "קוד פונקציה" in text or re.search(r"\b8\.1\b", text):
            return False
        if "איפוס קר" in text or ("כיול" in text and "קוד" in text):
            return False
    if spec.forbidden_line_re and spec.forbidden_line_re.search(text):
        return False
    # Drop service-code references that may sit outside section 17.
    if re.search(r"קוד\s*\d{3,4}\b", text):
        return False
    if "קודי שירות" in text:
        return False
    if re.search(r"סעיף\s*17", text):
        return False
    return True


def clean_manual_lines(spec: DeviceSpec, raw_lines: list[str]) -> list[str]:
    output: list[str] = []
    skipping = False
    start_re = re.compile(spec.strip_section_start) if spec.strip_section_start else None
    end_re = re.compile(spec.strip_section_end) if spec.strip_section_end else None
    for line in raw_lines:
        if start_re and start_re.match(line) and not is_toc_line(line):
            skipping = True
            continue
        if skipping and end_re and end_re.match(line) and not is_toc_line(line):
            skipping = False
        if skipping:
            continue
        if is_toc_line(line) and start_re and start_re.search(line):
            continue
        if spec.id == "lt22" and line.startswith("8. קודי פונקציה"):
            line = "8. תקלות ונתונים טכניים"
        if keep_line(spec, line):
            output.append(line)
    return output


def save_figure(doc: pymupdf.Document, xref: int, dest: Path) -> None:
    pix = pymupdf.Pixmap(doc, xref)
    if pix.colorspace is not None and pix.n >= 4 and pix.alpha == 0:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    elif pix.alpha:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    dest.parent.mkdir(parents=True, exist_ok=True)
    pix.save(dest, jpg_quality=78)


def pair_figures(doc: pymupdf.Document) -> list[dict]:
    figures: list[dict] = []
    for page in doc:
        captions: list[tuple[int, float, str]] = []
        for y, text in page_lines(page):
            match = CAPTION_LINE_RE.match(text)
            if match:
                number = int(match.group(1))
                captions.append((number, y, f"איור {number}"))
                continue
            for match in CAPTION_LOOSE_RE.finditer(text):
                number = int(match.group(1))
                title = text[match.end() :].strip(" :：–-")
                # Avoid swallowing the next "איור N" on the same line.
                title = CAPTION_LOOSE_RE.split(title, maxsplit=1)[0].strip(" :：–-")
                captions.append((number, y, title[:80] or f"איור {number}"))
        images = sorted(page.get_image_info(xrefs=True), key=lambda info: info["bbox"][1])
        used: set[int] = set()
        for number, y, title in captions:
            best = None
            best_gap = 10**9
            for index, info in enumerate(images):
                if index in used:
                    continue
                gap = y - info["bbox"][3]
                if -40 <= gap <= 80 and gap < best_gap:
                    best = index
                    best_gap = gap
            if best is None:
                for index, _info in enumerate(images):
                    if index not in used:
                        best = index
                        break
            if best is None:
                continue
            used.add(best)
            figures.append(
                {
                    "id": number,
                    "title": title,
                    "xref": images[best]["xref"],
                    "page": page.number + 1,
                }
            )
    figures.sort(key=lambda item: item["id"])
    return figures


def prepare_device(spec: DeviceSpec) -> None:
    pdf = DOWNLOADS / spec.pdf_name
    if not pdf.is_file():
        raise SystemExit(f"Missing manual PDF for {spec.id}: {pdf}")

    doc = pymupdf.open(pdf)
    raw_lines: list[str] = []
    for page in doc:
        raw_lines.extend(text for _, text in page_lines(page))
    manual_lines = clean_manual_lines(spec, raw_lines)
    manual = "\n".join(manual_lines).strip() + "\n"

    if spec.id == "lt22":
        leaked = sorted(set(LT22_CODE_RE.findall(manual)))
        if leaked:
            raise SystemExit(f"Technician codes still in LT22 text: {', '.join(leaked)}")
        if "קודי פונקציה" in manual or re.search(r"\b8\.1\b", manual):
            raise SystemExit("Section 8.1 heading is still in the LT22 text")
    if re.search(r"^17\.\s*קודי שירות", manual, re.M):
        raise SystemExit(f"Service-code section still present in {spec.id}")

    figures = pair_figures(doc)
    figure_dir = ROOT / "assets" / "assistant" / spec.id
    figure_dir.mkdir(parents=True, exist_ok=True)
    for old in figure_dir.glob("*"):
        if old.is_file():
            old.unlink()

    catalog = []
    seen: set[int] = set()
    for figure in figures:
        number = figure["id"]
        if number in seen:
            continue
        seen.add(number)
        filename = f"{number}.jpg"
        save_figure(doc, figure["xref"], figure_dir / filename)
        catalog.append(
            {
                "id": number,
                "title": figure["title"],
                "src": f"/assets/assistant/{spec.id}/{filename}",
            }
        )

    out_dir = KNOWLEDGE / spec.id
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "manual.md").write_text(manual, encoding="utf-8")
    (out_dir / "figures.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out_dir / "meta.json").write_text(
        json.dumps(
            {
                "id": spec.id,
                "label": spec.label,
                "subtitle": spec.subtitle,
                "productName": spec.product_name,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"[{spec.id}] characters={len(manual)} figures={len(catalog)} -> {figure_dir}")
    if catalog:
        missing = [n for n in range(1, catalog[-1]["id"] + 1) if n not in seen]
        if missing:
            print(f"[{spec.id}] figure numbers without an image: {missing}")


def write_devices_index() -> None:
    available = []
    for device_id, spec in DEVICES.items():
        meta_path = KNOWLEDGE / device_id / "meta.json"
        manual_path = KNOWLEDGE / device_id / "manual.md"
        if not meta_path.is_file() or not manual_path.is_file():
            continue
        available.append(
            {
                "id": spec.id,
                "label": spec.label,
                "subtitle": spec.subtitle,
                "productName": spec.product_name,
            }
        )
    KNOWLEDGE.mkdir(parents=True, exist_ok=True)
    (KNOWLEDGE / "devices.json").write_text(
        json.dumps(available, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    notes = KNOWLEDGE / "notes.md"
    if not notes.exists():
        notes.write_text("", encoding="utf-8")
    # Keep a compatibility copy of LT22 at the old paths while callers migrate.
    lt22_dir = KNOWLEDGE / "lt22"
    if (lt22_dir / "manual.md").is_file():
        (KNOWLEDGE / "lt22.md").write_text((lt22_dir / "manual.md").read_text(encoding="utf-8"), encoding="utf-8")
    if (lt22_dir / "figures.json").is_file():
        (KNOWLEDGE / "figures.json").write_text(
            (lt22_dir / "figures.json").read_text(encoding="utf-8"),
            encoding="utf-8",
        )


def main() -> None:
    selected = [part.lower() for part in sys.argv[1:]]
    if selected:
        unknown = [name for name in selected if name not in DEVICES]
        if unknown:
            raise SystemExit(f"Unknown device(s): {', '.join(unknown)}")
        targets = [DEVICES[name] for name in selected]
    else:
        targets = [spec for spec in DEVICES.values() if (DOWNLOADS / spec.pdf_name).is_file()]
        if not targets:
            raise SystemExit("No device PDFs found in Downloads")

    for spec in targets:
        prepare_device(spec)
    write_devices_index()
    print(f"devices.json updated with {[spec.id for spec in targets if (KNOWLEDGE / spec.id / 'manual.md').is_file()]}")


if __name__ == "__main__":
    main()
