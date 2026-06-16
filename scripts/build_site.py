#!/usr/bin/env python3
"""Build static HTML site from scraped Wix content."""

from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path

from config import ASSETS, CONTACT, HOME_GALLERY_IMAGES, HOME_PAGE_TITLE, HUB_DISPLAY_TITLES, HUB_PAGES, NAV, PRODUCT_CODE_ALIASES, PRODUCT_SLUGS, PRODUCT_SUBCATEGORY_EN, PROJECTS, SITE_CONFIG, WIX_TO_LOCAL_SLUG
from image_assets import ASSETS_DIR, local_image_name, wix_original_url
from slugs import (
    CANONICAL_SLUG_SET,
    CANONICAL_TITLES_EN,
    all_canonical_slugs,
    canonical_slug,
    resolve_source_file,
    to_canonical_slug,
)
from document_assets import (
    DOCUMENT_LABELS_EN,
    DOCUMENT_LABEL_ORDER,
    local_document_path,
    rewrite_document_url,
)

ROOT = Path(__file__).resolve().parent.parent
SCRAPED_DIR = ROOT / "scraped"
SITE_DIR = ROOT / "site"
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def asset_path(relative: str) -> str:
    return f"/assets/{relative.lstrip('/')}"


def page_href(lang: str, slug: str) -> str:
    base = f"/{SITE_CONFIG[lang]['locale_path']}"
    slug = canonical_slug(slug)
    if not slug:
        return f"{base}/"
    return f"{base}/{slug}/"


def split_figures(content: str) -> tuple[str, list[str]]:
    """Separate figure/gallery elements from rich-text before filtering."""
    figures = re.findall(
        r"<figure class=\"(?:content-image|gallery-image)\">.*?</figure>",
        content,
        re.DOTALL,
    )
    text_only = re.sub(
        r"<figure class=\"(?:content-image|gallery-image)\">.*?</figure>",
        "",
        content,
        flags=re.DOTALL,
    )
    gallery_cards = re.findall(
        r"<a class=\"gallery-card\".*?</a>",
        text_only,
        re.DOTALL,
    )
    text_only = re.sub(r"<a class=\"gallery-card\".*?</a>", "", text_only, flags=re.DOTALL)
    return text_only, figures + gallery_cards


def filter_page_content(content: str, slug: str) -> str:
    """Remove duplicate footer/header blocks scraped from Wix master page."""
    if not content:
        return content

    # Remove footer contact blocks (white text on navy - duplicated in our footer)
    footer_markers = [
        "יצירת קשר",
        "Contact Us",
        "שעות פתיחה",
        "Opening Hour",
        "© Copyright",
        "cal@ddc.co.il",
        "כתובת",
        "Address",
        "Adress",
    ]
    parts = content.split('<div class="rich-text">')
    filtered = []
    for i, part in enumerate(parts):
        if i == 0:
            if part.strip():
                filtered.append(part)
            continue
        block = '<div class="rich-text">' + part
        block_text = re.sub(r"<[^>]+>", " ", block)
        if any(marker in block_text for marker in footer_markers):
            continue
        # On homepage, skip hero duplicate text
        if slug == "" and ("אלנט | ניטור" in block_text or "ELNET | POWER" in block_text):
            continue
        if "ישומי בקרה בע״מ" in block_text and len(block_text.strip()) < 40:
            continue
        filtered.append(block)

    result = "".join(filtered)

    # Remove duplicate logo images from content
    result = re.sub(
        r'<figure class="content-image"><img[^>]*Screen[^>]*></figure>',
        "",
        result,
    )
    return result.strip()


def rewrite_wix_urls(content: str) -> str:
    """Rewrite Wix CDN image URLs to local assets."""
    def replacer(match: re.Match) -> str:
        url = match.group(0)
        basename = media_basename(url)
        if basename:
            local_name = local_image_name(basename)
            if (ASSETS_DIR / local_name).exists():
                return asset_path(f"images/{local_name}")
            local = ASSETS_DIR / basename
            if local.exists():
                return asset_path(f"images/{basename}")
        return url

    return re.sub(r"https://static\.wixstatic\.com/media/[^\s\"'<>]+", replacer, content)


def rewrite_image_url(url: str) -> str:
    if not url:
        return url
    basename = media_basename(url)
    if basename:
        local_name = local_image_name(basename)
        if (ASSETS_DIR / local_name).exists():
            return asset_path(f"images/{local_name}")
        if (ASSETS_DIR / basename).exists():
            return asset_path(f"images/{basename}")
    return url


def render_nav(lang: str, current_slug: str) -> str:
    items = NAV[lang]
    parts = ['<nav class="main-nav" aria-label="Main navigation"><ul class="nav-list">']
    for item in items:
        is_active = _is_nav_active(item, current_slug, lang)
        active_cls = " active" if is_active else ""
        has_children = "children" in item and item["children"]
        if has_children:
            expand_label = "הצג תפריט משנה" if lang == "he" else "Show submenu"
            parts.append(f'<li class="nav-item has-dropdown{active_cls}">')
            parts.append(
                f'<a class="nav-link" href="{item["href"]}">{html.escape(item["label"])}</a>'
            )
            parts.append(
                f'<button type="button" class="nav-submenu-toggle" aria-expanded="false" '
                f'aria-label="{html.escape(expand_label)}">'
                f'<span class="nav-submenu-chevron" aria-hidden="true"></span></button>'
            )
            parts.append('<ul class="dropdown">')
            for child in item["children"]:
                parts.append(
                    f'<li><a href="{child["href"]}">{html.escape(child["label"])}</a></li>'
                )
            parts.append("</ul></li>")
        else:
            parts.append(f'<li class="nav-item{active_cls}">')
            parts.append(
                f'<a class="nav-link" href="{item["href"]}">{html.escape(item["label"])}</a></li>'
            )
    parts.append("</ul></nav>")
    return "\n".join(parts)


def _is_nav_active(item: dict, slug: str, lang: str) -> bool:
    current = canonical_slug(slug.rstrip("/"))
    item_slug = canonical_slug(item["href"].strip("/").split("/", 1)[-1].rstrip("/"))
    if item_slug == current:
        return True
    for child in item.get("children", []):
        child_slug = canonical_slug(child["href"].strip("/").split("/", 1)[-1].rstrip("/"))
        if child_slug == current:
            return True
    return False


def render_language_switcher(current_lang: str, current_slug: str = "") -> str:
    labels = {"he": "עברית", "en": "English"}
    flags = {
        "en": asset_path("images/flag-us.png"),
        "he": asset_path("images/flag-il.png"),
    }
    parts = ['<div class="lang-switcher" role="group" aria-label="Language">']
    for lang_code in ("en", "he"):
        label = labels[lang_code]
        flag = flags[lang_code]
        href = page_href(lang_code, current_slug)
        if lang_code == current_lang:
            parts.append(
                f'<span class="lang-flag-link lang-active" aria-current="true" title="{html.escape(label)}">'
                f'<img src="{flag}" alt="{html.escape(label)}" class="lang-flag" width="28" height="21" />'
                f"</span>"
            )
        else:
            parts.append(
                f'<a href="{href}" class="lang-flag-link" title="{html.escape(label)}" aria-label="{html.escape(label)}">'
                f'<img src="{flag}" alt="" class="lang-flag" width="28" height="21" />'
                f"</a>"
            )
    parts.append("</div>")
    return "\n".join(parts)


def render_logo(lang: str) -> str:
    cfg = SITE_CONFIG[lang]
    brand = html.escape(cfg["brand"])
    home = f"/{lang}/"
    if lang == "en":
        return f"""<a href="{home}" class="logo-link logo-link-en">
  <img src="/assets/images/logo-icon.png" alt="{brand}" class="logo logo-en-icon" width="44" height="44">
  <span class="logo-en-text">{brand}</span>
</a>"""
    return f'<a href="{home}" class="logo-link"><img src="/assets/images/logo.png" alt="{brand}" class="logo"></a>'


CONTACT_FIELD_LABELS = {
    "he": {
        "contact": "יצירת קשר",
        "phone": "טלפון",
        "fax": "פקס",
        "email": "דואר אלקטרוני",
        "hours": "שעות פתיחה",
        "address": "כתובת",
    },
    "en": {
        "contact": "Contact Us",
        "phone": "Phone",
        "fax": "Fax",
        "email": "Email",
        "hours": "Opening Hours",
        "address": "Address",
    },
}

PRODUCT_COMPARISON_URL = "http://c.ddc.co.il/comparison/"

TRANSFER_SWITCH_DRAWINGS = {
    "he": {
        "title": "בקרי החלפה - שרטוטים",
        "download_label": "הורדת שרטוטים",
        "items": [
            {
                "title": "בקר החלפה - דור 1",
                "description": "ניתן לזיהוי בפנל אחורי - קונקטור J5 בעל 7 מהדקים",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_9a131c870f074acfa894399dc914855d~mv2.jpg",
                        "alt": "CO17_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_24212278028b4ffca213f684e38d2448~mv2.png",
                        "alt": "ELNet-CO.png",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_79a15aeb71c24ecca86367ec9ea25818.pdf",
                    "file": "9a8771_79a15aeb71c24ecca86367ec9ea25818.pdf",
                },
            },
            {
                "title": "בקר החלפה - דור 2",
                "description": "ניתן לזיהוי בפנל אחורי - קונקטור J5 בעל 6 מהדקים",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_6c15b3fb654b401495482c845883a34d~mv2.jpg",
                        "alt": "CO19_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_24212278028b4ffca213f684e38d2448~mv2.png",
                        "alt": "ELNet-CO.png",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_b330554d3df1480fb6135ac66cfc2a92.pdf",
                    "file": "9a8771_b330554d3df1480fb6135ac66cfc2a92.pdf",
                },
            },
            {
                "title": "בקר החלפה - דור 3",
                "subtitle": "(מערכת עם 2 מפסקים)",
                "description": "ניתן לזיהוי בחזית המכשיר - בורר מצבים",
                "note": "בחלק מהדגמים קונקטור J2 אינו קיים",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_c3f8fac7ba064c82a4d436c9269a7c2c~mv2.jpg",
                        "alt": "CO20_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_ee2fe79dea3d47f0bf70d46c845e7276~mv2.jpg",
                        "alt": "בקר CO 19.jpg",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_c418d80bd8024e08a29facd47123fc63.pdf",
                    "file": "9a8771_c418d80bd8024e08a29facd47123fc63.pdf",
                },
            },
            {
                "title": "בקר החלפה - דור 3",
                "subtitle": "(מערכת עם 3 מפסקים)",
                "description": "ניתן לזיהוי בחזית המכשיר - בורר מצבים",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_c3f8fac7ba064c82a4d436c9269a7c2c~mv2.jpg",
                        "alt": "CO20_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_ee2fe79dea3d47f0bf70d46c845e7276~mv2.jpg",
                        "alt": "בקר CO 19.jpg",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_77deb5e6f898498388ced2756713f65b.pdf",
                    "file": "9a8771_77deb5e6f898498388ced2756713f65b.pdf",
                },
            },
        ],
    },
    "en": {
        "title": "Transfer switch controllers - Sketches",
        "download_label": "Download sketches",
        "items": [
            {
                "title": "Transfer switch controller - 1st generation",
                "description": "Can be identified on the rear panel - connector J5 with 7 clamps",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_9a131c870f074acfa894399dc914855d~mv2.jpg",
                        "alt": "CO17_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_24212278028b4ffca213f684e38d2448~mv2.png",
                        "alt": "ELNet-CO.png",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_79a15aeb71c24ecca86367ec9ea25818.pdf",
                    "file": "9a8771_79a15aeb71c24ecca86367ec9ea25818.pdf",
                },
            },
            {
                "title": "Transfer switch controller - 2nd generation",
                "description": "Can be identified on the rear panel - connector J5 with 6 clamps",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_6c15b3fb654b401495482c845883a34d~mv2.jpg",
                        "alt": "CO19_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_24212278028b4ffca213f684e38d2448~mv2.png",
                        "alt": "ELNet-CO.png",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_b330554d3df1480fb6135ac66cfc2a92.pdf",
                    "file": "9a8771_b330554d3df1480fb6135ac66cfc2a92.pdf",
                },
            },
            {
                "title": "Transfer switch controller - 3rd generation",
                "subtitle": "(System with 2 breakers)",
                "description": "Can be identified on the front of the device - mode selector",
                "note": "In some models the J2 connector is not present",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_c3f8fac7ba064c82a4d436c9269a7c2c~mv2.jpg",
                        "alt": "CO20_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_ee2fe79dea3d47f0bf70d46c845e7276~mv2.jpg",
                        "alt": "CO 19 controller",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_c418d80bd8024e08a29facd47123fc63.pdf",
                    "file": "9a8771_c418d80bd8024e08a29facd47123fc63.pdf",
                },
            },
            {
                "title": "Transfer switch controller - 3rd generation",
                "subtitle": "(System with 3 breakers)",
                "description": "Can be identified on the front of the device - mode selector",
                "images": [
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_c3f8fac7ba064c82a4d436c9269a7c2c~mv2.jpg",
                        "alt": "CO20_Back.jpg",
                    },
                    {
                        "src": "https://static.wixstatic.com/media/9a8771_ee2fe79dea3d47f0bf70d46c845e7276~mv2.jpg",
                        "alt": "CO 19 controller",
                    },
                ],
                "document": {
                    "url": "https://www.ddc.co.il/_files/ugd/9a8771_77deb5e6f898498388ced2756713f65b.pdf",
                    "file": "9a8771_77deb5e6f898498388ced2756713f65b.pdf",
                },
            },
        ],
    },
}

PRODUCT_COMPARISON_COPY = {
    "he": {
        "title": "השוואת מוצרים",
        "intro": "מערכת השוואת המוצרים שלנו מאפשרת לבחור דגמי ELNet, להשוות ביניהם ולמצוא התאמה לדגמי מתחרים.",
        "features": [
            "השוואה בין דגמי ELNet לפי קטגוריות",
            "התאמת דגמי מתחרים לדגמי ELNet המקבילים",
            "גישה לדגמים מוזלים, מונים עם תקשורת ואנרגיה, אנלייזרים ועוד",
        ],
        "button": "כניסה למערכת השוואת מוצרים",
        "note": "מידע שגוי? נשמח לתקן — ",
    },
    "en": {
        "title": "Product Comparison",
        "intro": "Our product comparison tool lets you browse ELNet models, compare specifications side by side, and find equivalents to competitor products.",
        "features": [
            "Compare ELNet meter models by category",
            "Match competitor products to equivalent ELNet models",
            "Browse discounted models, communication & energy meters, analyzers, and more",
        ],
        "button": "Open product comparison",
        "note": "Found incorrect information? Let us know at ",
    },
}

CONTACT_FORM_COPY = {
    "he": {
        "title": "צרו קשר",
        "intro": "נשמח לשמוע מכם. מלאו את הטופס ונחזור אליכם בהקדם האפשרי.",
        "name": "שם מלא",
        "email": "דואר אלקטרוני",
        "phone": "טלפון",
        "message": "הודעה",
        "submit": "שליחה",
        "sending": "שולח...",
        "success": "תודה! פנייתכם נשלחה בהצלחה. ניצור איתכם קשר בהקדם.",
        "popup_title": "תודה",
        "close": "סגירה",
        "error": "לא הצלחנו לשלוח את ההודעה. נסו שוב או צרו קשר בטלפון.",
        "subject": "פנייה חדשה מהאתר",
        "info_heading": "פרטי התקשרות",
    },
    "en": {
        "title": "Contact Us",
        "intro": "We would love to hear from you. Fill out the form and we will get back to you as soon as possible.",
        "name": "Full name",
        "email": "Email",
        "phone": "Phone",
        "message": "Message",
        "submit": "Send message",
        "sending": "Sending...",
        "success": "Thank you! Your message was sent successfully. We will be in touch soon.",
        "popup_title": "Thank you",
        "close": "Close",
        "error": "We could not send your message. Please try again or call us.",
        "subject": "New contact from website",
        "info_heading": "Contact details",
    },
}


def contact_field_labels(lang: str) -> dict:
    return CONTACT_FIELD_LABELS[lang]


def render_contact_page(lang: str) -> str:
    """Contact form with company details from site config."""
    cfg = SITE_CONFIG[lang]
    lbl = contact_field_labels(lang)
    copy = CONTACT_FORM_COPY[lang]
    form_action = f"https://formsubmit.co/ajax/{CONTACT['formsubmit_id']}"
    return f"""<article class="page-content contact-page">
  <h1 class="page-title">{html.escape(copy['title'])}</h1>
  <p class="contact-intro">{html.escape(copy['intro'])}</p>
  <div class="contact-layout">
    <form
      class="contact-form"
      id="contact-form"
      action="{html.escape(form_action)}"
      method="POST"
      data-sending-label="{html.escape(copy['sending'])}"
      data-error-message="{html.escape(copy['error'])}"
    >
      <p class="contact-form-error" id="contact-form-error" hidden>{html.escape(copy['error'])}</p>
      <input type="hidden" name="_subject" value="{html.escape(copy['subject'])}" />
      <input type="hidden" name="_captcha" value="false" />
      <input type="text" name="_honey" class="contact-honey" tabindex="-1" autocomplete="off" />
      <div class="contact-field">
        <label for="contact-name">{html.escape(copy['name'])}</label>
        <input type="text" id="contact-name" name="name" required autocomplete="name" />
      </div>
      <div class="contact-field">
        <label for="contact-email">{html.escape(copy['email'])}</label>
        <input type="email" id="contact-email" name="email" required autocomplete="email" />
      </div>
      <div class="contact-field">
        <label for="contact-phone">{html.escape(copy['phone'])}</label>
        <input type="tel" id="contact-phone" name="phone" autocomplete="tel" />
      </div>
      <div class="contact-field">
        <label for="contact-message">{html.escape(copy['message'])}</label>
        <textarea id="contact-message" name="message" rows="6" required></textarea>
      </div>
      <button type="submit" class="btn btn-submit">{html.escape(copy['submit'])}</button>
    </form>
    <aside class="contact-info">
      <h2 class="contact-info-heading">{html.escape(copy['info_heading'])}</h2>
      <p class="contact-brand">{html.escape(cfg['brand'])}</p>
      <dl class="contact-details">
        <div>
          <dt>{html.escape(lbl['phone'])}</dt>
          <dd><a href="tel:{CONTACT['phone']}">{CONTACT['phone']}</a></dd>
        </div>
        <div>
          <dt>{html.escape(lbl['fax'])}</dt>
          <dd>{CONTACT['fax']}</dd>
        </div>
        <div>
          <dt>{html.escape(lbl['email'])}</dt>
          <dd><a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a></dd>
        </div>
        <div>
          <dt>{html.escape(lbl['hours'])}</dt>
          <dd>{html.escape(CONTACT['hours'][lang])}</dd>
        </div>
        <div>
          <dt>{html.escape(lbl['address'])}</dt>
          <dd>{html.escape(CONTACT['address'][lang])}</dd>
        </div>
      </dl>
      <div class="contact-map">
        <iframe
          title="Map"
          src="https://maps.google.com/maps?q=Habarzel+25+Tel+Aviv&output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </aside>
  </div>
  <div class="contact-popup" id="contact-popup" hidden>
    <div class="contact-popup-backdrop" data-contact-popup-close></div>
    <div class="contact-popup-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-popup-title">
      <h2 class="contact-popup-title" id="contact-popup-title">{html.escape(copy['popup_title'])}</h2>
      <p class="contact-popup-message" id="contact-popup-message">{html.escape(copy['success'])}</p>
      <button type="button" class="btn btn-submit" id="contact-popup-close" data-contact-popup-close>{html.escape(copy['close'])}</button>
    </div>
  </div>
</article>"""


def transfer_drawing_document_href(doc: dict) -> str:
    filename = doc.get("file", "")
    if filename and local_document_path(filename).exists():
        return rewrite_document_url(filename)
    return doc.get("url", "#")


def render_transfer_switch_drawings_page(lang: str) -> str:
    """Card layout for transfer-switch controller generations and sketch PDFs."""
    copy = TRANSFER_SWITCH_DRAWINGS[lang]
    items_html: list[str] = []

    for item in copy["items"]:
        images_html = "".join(
            f'<img src="{rewrite_image_url(wix_original_url(img["src"]))}" '
            f'alt="{html.escape(img["alt"])}" loading="lazy"/>'
            for img in item["images"]
        )
        subtitle_html = (
            f'<p class="transfer-drawing-subtitle">{html.escape(item["subtitle"])}</p>'
            if item.get("subtitle")
            else ""
        )
        note_html = (
            f'<p class="transfer-drawing-note">{html.escape(item["note"])}</p>'
            if item.get("note")
            else ""
        )
        doc_href = transfer_drawing_document_href(item["document"])
        items_html.append(
            f"""<section class="transfer-drawing-item">
  <div class="transfer-drawing-images">{images_html}</div>
  <div class="transfer-drawing-copy">
    <h2 class="transfer-drawing-title">{html.escape(item["title"])}</h2>
    {subtitle_html}
    <p class="transfer-drawing-desc">{html.escape(item["description"])}</p>
    {note_html}
    <a class="btn btn-doc transfer-drawing-download" href="{html.escape(doc_href)}" target="_blank" rel="noopener noreferrer">{html.escape(copy["download_label"])}</a>
  </div>
</section>"""
        )

    return f"""<article class="page-content transfer-drawings-page">
  <h1 class="page-title">{html.escape(copy["title"])}</h1>
  <div class="transfer-drawings-list">
    {"".join(items_html)}
  </div>
</article>"""


def render_product_comparison_page(lang: str) -> str:
    """Dedicated layout for the external ELNet comparison tool."""
    copy = PRODUCT_COMPARISON_COPY[lang]
    features = "".join(
        f"<li>{html.escape(item)}</li>" for item in copy["features"]
    )
    return f"""<article class="page-content product-comparison-page">
  <h1 class="page-title">{html.escape(copy['title'])}</h1>
  <div class="comparison-card">
    <div class="comparison-card-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="34" width="12" height="24" rx="2" fill="currentColor" opacity="0.35"/>
        <rect x="26" y="22" width="12" height="36" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="46" y="10" width="12" height="48" rx="2" fill="currentColor"/>
        <path d="M8 30 L28 18 L48 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <p class="comparison-intro">{html.escape(copy['intro'])}</p>
    <ul class="comparison-features">{features}</ul>
    <div class="comparison-actions">
      <a
        href="{html.escape(PRODUCT_COMPARISON_URL)}"
        class="btn btn-comparison"
        target="_blank"
        rel="noopener noreferrer"
      >{html.escape(copy['button'])}<span class="comparison-btn-arrow" aria-hidden="true">→</span></a>
    </div>
    <p class="comparison-note">{html.escape(copy['note'])}<a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a></p>
  </div>
</article>"""


def render_footer(lang: str) -> str:
    cfg = SITE_CONFIG[lang]
    lbl = contact_field_labels(lang)
    brand_block = f"""<div class="footer-brand">
      <p class="footer-brand-name">{html.escape(cfg['brand'])}</p>
    </div>"""
    return f"""<footer class="site-footer">
  <div class="footer-grid">
    {brand_block}
    <div class="footer-contact">
      <h3>{lbl['contact']}</h3>
      <p><strong>{lbl['phone']}:</strong> <a href="tel:{CONTACT['phone']}">{CONTACT['phone']}</a></p>
      <p><strong>{lbl['fax']}:</strong> {CONTACT['fax']}</p>
      <p><strong>{lbl['email']}:</strong> <a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a></p>
      <p><strong>{lbl['hours']}:</strong> {CONTACT['hours'][lang]}</p>
      <p><strong>{lbl['address']}:</strong> {CONTACT['address'][lang]}</p>
    </div>
    <div class="footer-map">
      <iframe
        title="Map"
        src="https://maps.google.com/maps?q=Habarzel+25+Tel+Aviv&output=embed"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; {html.escape(cfg['brand'])}</p>
  </div>
</footer>"""


def load_slides(lang: str) -> list[dict]:
    path = SCRAPED_DIR / lang / "slideshow.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return []


def slide_background_url(slide: dict, lang: str) -> str:
    """Full-width carousel background matching Wix fill-layer sizing."""
    bg = slide.get("bg", "")
    if bg:
        return rewrite_image_url(wix_original_url(bg))

    image = slide.get("image", "")
    if image:
        base = wix_original_url(image)
        match = re.match(
            r"(https://static\.wixstatic\.com/media/[^/]+~mv2\.(?:png|jpg|jpeg|webp))",
            base,
            re.I,
        )
        if match:
            height = 718 if lang == "en" else 590
            media = match.group(1)
            return (
                f"{media}/v1/fill/w_1920,h_{height},al_c,q_85,"
                f"usm_0.66_1.00_0.01,enc_avif,quality_auto"
            )

    return rewrite_image_url(wix_original_url(ASSETS.get("hero_bg", "")))


def slide_overlay_style(slide: dict) -> str:
    opacity = slide.get("bg_opacity")
    if opacity is None:
        opacity = 0.34
    overlay = slide.get("bg_overlay", "white")
    if overlay == "none" or opacity == 0:
        return "background:transparent;"
    if overlay == "dark":
        return f"background:rgba(32, 48, 60, {min(opacity, 0.72)});"
    return f"background:rgba(255, 255, 255, {opacity});"


HOME_SLIDE_LINKS = [
    "power-quality-analyzers",
    "bms-scada-software",
    "plc-ddc-controllers",
    "energy-meters",
    "power-factor-control",
    "energy-meters",
    "bms-scada-software",
]

HOME_SLIDE_EN = [
    {
        "title": "ElNet | Power Quality Monitoring",
        "subtitle": "Monitors and controls your electrical network.",
        "description": (
            "The ElNet power quality control system is built on reliable, accurate hardware "
            "and an easy-to-use interface.\n"
            "The system generates reports and executive summaries compliant with EN50160, "
            "including comprehensive and accurate power event reports."
        ),
    },
    {
        "title": "UniWEB",
        "subtitle": "Your key to an efficient, technological building.",
        "description": (
            "Building control and energy systems\n"
            "An innovative, advanced platform.\n"
            "Energy optimization and management"
        ),
        "accent_subtitle": True,
    },
    {
        "title": "Advanced Controllers for Public Buildings and Industry.",
        "subtitle": "",
        "description": (
            "Precise control and monitoring of air conditioning, electrical, "
            "and all other electromechanical systems in the building."
        ),
    },
    {
        "title": "ElNet MC",
        "subtitle": "Precisely manage energy consumption in your building",
        "description": (
            "An accurate system for cumulative energy measurement and generating "
            "electricity and HVAC consumption bills."
        ),
    },
    {
        "title": "Energy Savings",
        "subtitle": "Save energy and protect the environment.",
        "description": "Choose an environmentally friendly system.",
    },
    {
        "title": "As a first step, measure energy consumption across your systems.",
        "subtitle": "",
        "description": (
            "Awareness of how much energy is consumed is the most effective way "
            "to reduce overall consumption and minimize environmental impact."
        ),
    },
    {
        "title": "Leading technology products at competitive prices",
        "subtitle": "",
        "description": "",
    },
]

HOME_UI = {
    "he": {
        "learn_more": "למידע נוסף",
        "featured": "הפתרונות שלנו",
        "explore": "גלו את המערכות שלנו",
    },
    "en": {
        "learn_more": "Learn more",
        "featured": "Our Solutions",
        "explore": "Explore our systems",
    },
}


def fmt_home_text(text: str) -> str:
    return html.escape(text).replace("\n", "<br>")


def home_slide_link(lang: str, index: int) -> str:
    if index < len(HOME_SLIDE_LINKS):
        return page_href(lang, HOME_SLIDE_LINKS[index])
    return page_href(lang, "")


def load_home_slides(lang: str) -> list[dict]:
    """Homepage content — Hebrew slideshow is the source of truth for images and layout."""
    slides = load_slides("he")
    if not slides:
        return []

    merged: list[dict] = []
    for i, slide in enumerate(slides):
        item = dict(slide)
        if lang == "en" and i < len(HOME_SLIDE_EN):
            item.update(HOME_SLIDE_EN[i])
        merged.append(item)
    return merged


def render_home_slide_body(slide: dict, *, title_tag: str = "h2", title_class: str = "") -> str:
    title = fmt_home_text(slide.get("title", ""))
    subtitle = slide.get("subtitle", "")
    description = slide.get("description", "")
    accent = slide.get("accent_subtitle", False)

    subtitle_class = "home-text-subtitle"
    if accent:
        subtitle_class += " home-text-subtitle-accent"

    parts: list[str] = [f'<{title_tag} class="{title_class}">{title}</{title_tag}>']
    if accent:
        if description:
            parts.append(f'<p class="home-text-desc">{fmt_home_text(description)}</p>')
        if subtitle:
            parts.append(f'<p class="{subtitle_class}">{fmt_home_text(subtitle)}</p>')
    else:
        if subtitle:
            parts.append(f'<p class="{subtitle_class}">{fmt_home_text(subtitle)}</p>')
        if description:
            parts.append(f'<p class="home-text-desc">{fmt_home_text(description)}</p>')
    return "\n          ".join(parts)


def render_home_cta(lang: str, index: int, label: str | None = None, *, variant: str = "primary") -> str:
    text = label or HOME_UI[lang]["learn_more"]
    href = home_slide_link(lang, index)
    return (
        f'<a class="home-btn home-btn--{variant}" href="{href}">'
        f"{html.escape(text)}</a>"
    )


def render_home_hero(slide: dict, lang: str) -> str:
    body = render_home_slide_body(slide, title_tag="h1", title_class="home-hero-title")
    cta = render_home_cta(lang, 0)

    return f"""<section class="home-hero" aria-label="{html.escape(HOME_UI[lang]['explore'])}">
  <div class="home-hero-inner">
    {body}
    <div class="home-hero-actions">{cta}</div>
  </div>
</section>"""


def render_home_solution_card(slide: dict, lang: str, index: int, *, accent: str = "cyan") -> str:
    body = render_home_slide_body(slide, title_class="home-card-title")
    link = render_home_cta(lang, index, variant="text")

    return f"""<article class="home-solution-card home-solution-card--{accent}">
  <div class="home-card-body">
    {body}
  </div>
  <footer class="home-card-footer">{link}</footer>
</article>"""


def render_home_capability_card(slide: dict, lang: str, index: int) -> str:
    body = render_home_slide_body(slide, title_class="home-card-title")
    link = render_home_cta(lang, index, variant="text")

    return f"""<article class="home-capability-card">
  <div class="home-card-body">
    {body}
  </div>
  <footer class="home-card-footer">{link}</footer>
</article>"""


def render_home_closing(slide: dict, lang: str) -> str:
    title = fmt_home_text(slide.get("title", ""))
    href = page_href(lang, "products")
    label = html.escape(HOME_UI[lang]["explore"])
    cta = f'<a class="home-btn home-btn--primary" href="{href}">{label}</a>'

    return f"""<section class="home-closing">
  <div class="home-closing-inner">
    <h2 class="home-closing-title">{title}</h2>
    {cta}
  </div>
</section>"""


def render_home_content(lang: str) -> str:
    slides = load_home_slides(lang)
    if not slides:
        return ""

    labels = HOME_UI[lang]
    hero = render_home_hero(slides[0], lang)
    featured = ""
    if len(slides) > 3:
        featured = f"""<section class="home-solutions" aria-label="{html.escape(labels['featured'])}">
  <header class="home-section-head">
    <h2 class="home-section-title">{html.escape(labels["featured"])}</h2>
  </header>
  <div class="home-solutions-grid">
    {render_home_solution_card(slides[1], lang, 1, accent="cyan")}
    {render_home_solution_card(slides[3], lang, 3, accent="navy")}
  </div>
</section>"""

    values = ""
    if len(slides) > 5:
        value_cards = [
            render_home_capability_card(slides[2], lang, 2),
            render_home_capability_card(slides[4], lang, 4),
            render_home_capability_card(slides[5], lang, 5),
        ]
        values = f"""<section class="home-capabilities">
  <div class="home-capabilities-grid">{"".join(value_cards)}</div>
</section>"""

    closing = render_home_closing(slides[6], lang) if len(slides) > 6 else ""

    return f'<div class="home-page">{hero}{featured}{values}{closing}</div>'


HOME_CTA_LINKS = {
    "he": [
        {"label": "אודותינו", "slug": "about", "gallery_titles": ["אודותינו"]},
        {"label": "מערכות חשמל", "slug": "power-meters-control", "gallery_titles": ["מערכות חשמל"]},
        {"label": "מערכות בקרה", "slug": "building-automation", "gallery_titles": ["מערכות בקרה"]},
    ],
    "en": [
        {"label": "About us", "slug": "about", "gallery_titles": ["About us"]},
        {"label": "Power meters", "slug": "power-meters-control", "gallery_titles": ["Power meters"]},
        {"label": "Building Automation", "slug": "building-automation", "gallery_titles": ["Building Automation"]},
    ],
}

ABOUT_HERO = {
    "he": {
        "title": "אודות",
        "lead": "מערכות בקרה, מדידה וניטור חשמל — מחויבות לאיכות ולתקנים בינלאומיים.",
    },
    "en": {
        "title": "About us",
        "lead": "Building automation, power metering, and control systems — committed to international quality standards.",
    },
}

ABOUT_STANDARDS = {
    "he": [
        {"code": "ISO 9001", "label": "מערכת ניהול איכות"},
        {"code": "ISO 9000.3", "label": "אבטחת איכות בפיתוח וייצור"},
        {"code": "CE", "label": "עמידה בתקן ובדרישות אירופיות"},
        {"code": "מכון התקנים", "label": "הסמכה מטעם מכון התקנים הישראלי"},
    ],
    "en": [
        {"code": "ISO 9001", "label": "Quality management systems"},
        {"code": "ISO 9000.3", "label": "Development & production QA"},
        {"code": "CE", "label": "European conformity directives"},
        {"code": "SII", "label": "Israeli Standards Institute certified"},
    ],
}

ABOUT_QA = {
    "he": {
        "title": "אבטחת איכות",
        "intro": "אנו מחויבים לספק מוצרים באיכות גבוהה ושירות יעיל — עם בקרת איכות בכל שלבי הפעילות.",
        "scope_heading": "איכות בכל תחומי הפעילות",
        "scope": ["פיתוח", "ייצור", "אספקה", "התקנה"],
    },
    "en": {
        "title": "Quality Assurance",
        "intro": "We are committed to exceptional product quality and efficient service — with quality control across every stage of our work.",
        "scope_heading": "Quality across all activities",
        "scope": ["Development", "Production", "Supply", "Installation"],
    },
}

ABOUT_EXPERTISE = {
    "he": [
        "מערכות ניהול מבנים (BMS)",
        "מוני חשמל ואנרגיה",
        "בקרים מתוכנתים (PLC/DDC)",
        "בקרי החלפה אוטומטיים",
        "בקרי מקדם הספק",
        "בקרת חניונים חכמה",
    ],
    "en": [
        "Building Automation (BMS)",
        "Power Meters & Analysers",
        "PLC / DDC Controllers",
        "Automatic Transfer Switches",
        "Power Factor Control",
        "Smart Parking Systems",
    ],
}


def build_home_gallery_index(page: dict) -> dict[str, str]:
    index: dict[str, str] = {}
    for item in page.get("gallery", []):
        title = (item.get("title") or "").strip()
        src = item.get("src", "")
        if not title or not src:
            continue
        key = normalize_product_name(title)
        if key not in index:
            index[key] = src
    return index


def render_home_cta_grid(page: dict, lang: str) -> str:
    """Render linked text navigation cards for the homepage."""
    links = HOME_CTA_LINKS.get(lang, [])
    cards: list[str] = []

    for item in links:
        href = page_href(lang, item["slug"])
        label = html.escape(item["label"])
        cards.append(
            f'<a class="home-nav-card" href="{href}">'
            f'<span class="home-nav-card-label">{label}</span>'
            f'<span class="home-nav-card-arrow" aria-hidden="true"></span>'
            f"</a>"
        )

    if not cards:
        return ""

    return f'<nav class="home-nav-grid" aria-label="{html.escape(HOME_UI[lang]["explore"])}">{"".join(cards)}</nav>'


def homepage_display_title(page: dict, lang: str) -> str:
    override = HOME_PAGE_TITLE.get(lang)
    if override:
        return override
    return page.get("title") or SITE_CONFIG[lang]["brand"]


def collect_homepage_gallery(page: dict, lang: str) -> list[dict]:
    """Homepage image carousel below the hero — same gallery set for HE and EN."""
    title = homepage_display_title(page, lang)
    images: list[dict] = []
    for filename in HOME_GALLERY_IMAGES:
        if (ASSETS_DIR / filename).exists():
            images.append({"src": asset_path(f"images/{filename}"), "alt": title})
    if images:
        return images

    raw = page.get("content_html", "")
    _, figures = split_figures(raw)
    for fig in figures:
        if 'class="gallery-image"' not in fig:
            continue
        img = figure_to_image(fig)
        src = img.get("src", "")
        alt = img.get("alt", "")
        if not src or is_screen_or_icon(src, alt):
            continue
        if "bullet_ball" in src.lower() or "bullet_ball" in alt.lower():
            continue
        images.append(img)

    unique = dedupe_images(images)
    for img in unique:
        img["alt"] = title
        img["src"] = wix_original_url(img["src"])
    return unique


def render_homepage_body(page: dict, lang: str) -> str:
    """Homepage below hero: site title and image gallery only (no product copy)."""
    display_title = homepage_display_title(page, lang)
    heroes = collect_homepage_gallery(page, lang)
    carousel_html = render_product_carousel(heroes, display_title)
    return f"""<article class="page-content product-detail-page">
  <header class="product-detail-header">
    <h1 class="page-title">{html.escape(display_title)}</h1>
  </header>
  <div class="product-detail-main">
    <div class="product-detail-main-inner">
      <div class="product-detail-copy">
        <div class="wix-content product-description">
          
        </div>
        
      </div>
      <div class="product-detail-media">
        {carousel_html}
        
      </div>
    </div>
  </div>
  
</article>"""


def normalize_product_name(name: str) -> str:
    n = name.lower()
    n = re.sub(r'[״"\'/]', " ", n)
    n = re.sub(r"[^\w\s\u0590-\u05ff]", " ", n)
    return re.sub(r"\s+", " ", n).strip()


def build_slug_index(lang: str) -> dict[str, str]:
    """Map normalized product names to canonical page slugs."""
    index: dict[str, str] = {}
    scraped_dir = SCRAPED_DIR / lang
    for f in scraped_dir.glob("*.json"):
        if f.name in ("manifest.json", "slideshow.json", "slideshow_wix.json", "index.json"):
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(data, dict):
            continue
        slug = canonical_slug(data.get("slug", f.stem))
        index[slug.lower()] = slug
        for part in re.split(r"[-\s]+", slug):
            if len(part) > 3:
                index[part.lower()] = slug
    return index


def build_title_index(lang: str) -> dict[str, str]:
    """Map normalized page titles to slugs."""
    index: dict[str, str] = {}
    scraped_dir = SCRAPED_DIR / lang
    for f in scraped_dir.glob("*.json"):
        if f.name in ("manifest.json", "slideshow.json", "slideshow_wix.json", "index.json"):
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(data, dict):
            continue
        slug = canonical_slug(data.get("slug", f.stem))
        title = re.sub(r"\s*\|.*", "", data.get("title", "")).strip()
        if title:
            index[normalize_product_name(title)] = slug
        index[normalize_product_name(slug.replace("-", " "))] = slug
    return index


def resolve_slug(
    name: str,
    slug_index: dict[str, str],
    lang: str,
    title_index: dict[str, str] | None = None,
) -> str:
    if not name:
        return ""
    norm_name = name.strip()
    for lookup_lang in (lang, "he"):
        override = PRODUCT_SLUGS.get(lookup_lang, {}).get(norm_name)
        if override:
            return canonical_slug(override)

    code_key = normalize_product_name(name)
    code_candidates = [code_key, code_key.replace(" ", "-")]
    base_code = re.sub(r"\s+\d+$", "", code_key).strip()
    if base_code:
        code_candidates.extend([base_code, base_code.replace(" ", "-")])
    for candidate in code_candidates:
        if candidate in PRODUCT_CODE_ALIASES:
            return PRODUCT_CODE_ALIASES[candidate]

    mc_match = re.search(r"\bmc[\s-]?(\d+)\b", code_key)
    if mc_match:
        alias = f"mc-{mc_match.group(1)}"
        if alias in PRODUCT_CODE_ALIASES:
            return PRODUCT_CODE_ALIASES[alias]

    if title_index is None:
        title_index = build_title_index(lang)
    he_title_index = build_title_index("he") if lang != "he" else {}

    norm = normalize_product_name(name)
    for index in (title_index, he_title_index):
        if norm in index:
            return index[norm]

    best_slug = ""
    best_len = 0
    for index in (title_index, he_title_index):
        for title, slug in index.items():
            if norm in title or title in norm:
                overlap = min(len(norm), len(title))
                if overlap > best_len:
                    best_len = overlap
                    best_slug = slug
    if best_slug and best_len >= 8:
        return best_slug

    # Truncated Wix alts: match Hebrew/English product slug overrides by prefix
    for lookup_lang in (lang, "he"):
        entries = sorted(
            PRODUCT_SLUGS.get(lookup_lang, {}).items(),
            key=lambda item: len(normalize_product_name(item[0])),
            reverse=True,
        )
        for title, slug in entries:
            title_norm = normalize_product_name(title)
            if len(norm) >= 8 and (norm in title_norm or title_norm.startswith(norm)):
                return canonical_slug(slug)
            if len(title_norm) >= 8 and (title_norm in norm or norm.startswith(title_norm)):
                return canonical_slug(slug)

    keywords = re.findall(r"[\w\u0590-\u05ff]+", norm)
    best = ""
    best_score = 0
    for key, slug in slug_index.items():
        if len(key) < 4:
            continue
        score = sum(2 if kw in key else 0 for kw in keywords if len(kw) > 3)
        if score > best_score:
            best_score = score
            best = slug
    return best if best_score >= 4 else ""


def product_canonical_slug(
    prod: dict,
    lang: str,
    slug_index: dict[str, str],
    title_index: dict[str, str],
) -> str:
    """Resolve a catalog product entry to a canonical page slug."""
    title = prod.get("title", "")
    candidates: list[str] = []
    for key in ("slug", "wix_slug"):
        val = (prod.get(key) or "").strip()
        if val and val not in candidates:
            candidates.append(val)

    for candidate in candidates:
        canonical = to_canonical_slug(candidate)
        if canonical in CANONICAL_SLUG_SET:
            return canonical
        for loc in (lang, "he", "en"):
            mapped = WIX_TO_LOCAL_SLUG.get(loc, {}).get(candidate)
            if mapped:
                return mapped

    resolved = resolve_slug(title, slug_index, lang, title_index)
    if resolved in CANONICAL_SLUG_SET:
        return resolved

    for candidate in candidates:
        canonical = to_canonical_slug(candidate)
        if canonical in CANONICAL_SLUG_SET:
            return canonical

    return resolved or (to_canonical_slug(candidates[0]) if candidates else "")


def load_product_page(slug: str, lang: str) -> dict | None:
    if not slug:
        return None
    path = SCRAPED_DIR / lang / f"{slug}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def product_thumbnail_src(slug: str, lang: str, fallback: str = "") -> str:
    """Thumbnail for catalog cards — prefer hero image from the product detail page."""
    page = load_product_page(slug, lang)
    if page:
        raw = page.get("content_html", "")
        _, figures = split_figures(raw)
        heroes, _ = collect_product_gallery(page, figures)
        if heroes:
            return rewrite_image_url(heroes[0].get("src", ""))
    if fallback:
        return rewrite_image_url(wix_original_url(fallback))
    return ""


def localize_subcategory(label: str, lang: str) -> str:
    """Map Hebrew catalog subcategory labels to English on the EN site."""
    if lang != "en" or not label:
        return label
    return PRODUCT_SUBCATEGORY_EN.get(label, label)


def catalog_product_title(
    prod: dict,
    slug: str,
    lang: str,
    slug_titles: dict[str, str],
) -> str:
    """Display title for a product catalog card."""
    if lang == "en" and slug:
        en_title = slug_titles.get(slug) or CANONICAL_TITLES_EN.get(slug, "")
        if en_title:
            return en_title
    return prod.get("title", "")


def load_product_catalog(lang: str) -> list[dict]:
    path = SCRAPED_DIR / lang / "products.json"
    if not path.exists():
        path = SCRAPED_DIR / lang / "תמיכה.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return data.get("products") or []


def build_hub_image_index(page: dict) -> dict[str, str]:
    """Map normalized product titles to image URLs from hub page content."""
    index: dict[str, str] = {}
    content = page.get("content_html", "")
    _, figures = split_figures(content)

    def add(alt: str, src: str) -> None:
        alt = html.unescape(alt.strip())
        if not alt or "Screen" in alt or not src:
            return
        key = normalize_product_name(alt)
        if key and key not in index:
            index[key] = src

    for fig in figures:
        alt_m = re.search(r'alt="([^"]+)"', fig)
        src_m = re.search(r'src="([^"]+)"', fig)
        if alt_m and src_m:
            add(alt_m.group(1), src_m.group(1))

    for item in page.get("images", []):
        add(item.get("alt", ""), item.get("src", ""))

    return index


def lookup_hub_card_image(
    name: str,
    image_index: dict[str, str],
    catalog: list[dict],
    slug_index: dict[str, str],
    title_index: dict[str, str],
    lang: str,
) -> str:
    norm = normalize_product_name(name)
    src = image_index.get(norm, "")

    if not src:
        best_key = ""
        best_len = 0
        for key, candidate in image_index.items():
            if norm in key or key in norm:
                overlap = min(len(norm), len(key))
                if overlap > best_len:
                    best_len = overlap
                    best_key = key
        if best_key and best_len >= 8:
            src = image_index[best_key]

    if not src:
        target = resolve_slug(name, slug_index, lang, title_index)
        if target:
            for prod in catalog:
                prod_slug = resolve_slug(prod.get("title", ""), slug_index, lang, title_index)
                if prod.get("slug") == target or prod_slug == target:
                    src = prod.get("src", "")
                    if src:
                        break
            if not src:
                src = product_thumbnail_src(target, lang)

    if src:
        return rewrite_image_url(wix_original_url(src))
    return ""


def safe_escape(text: str) -> str:
    return html.escape(html.unescape(text or ""))


def hub_page_title(page: dict, lang: str, h2_fallback: str = "") -> str:
    page_title = re.sub(r"\s*\|.*", "", page.get("title", "")).strip()
    if page_title:
        return html.unescape(page_title)
    slug = page.get("slug", "")
    if lang == "en" and slug in CANONICAL_TITLES_EN:
        return CANONICAL_TITLES_EN[slug]
    fallback = html.unescape(h2_fallback.strip()) if h2_fallback else ""
    return fallback or slug


HUB_HERO_HEADING_RE = re.compile(r"font-size:7\d+px")
HUB_PRODUCT_NAME_RE = re.compile(
    r'<h4[^>]*>.*?color:#000000;">([^<]+)</span>',
    re.DOTALL,
)


def extract_hub_heading_text(block: str) -> str:
    """Extract visible heading label from a Wix rich-text block."""
    matches = re.findall(r'font-family:[^;]+;">([^<]+)</span>', block)
    if matches:
        return html.unescape(matches[-1].strip())
    plain = re.sub(r"<[^>]+>", " ", block)
    return html.unescape(re.sub(r"\s+", " ", plain).strip())


def is_hub_hero_heading(block: str) -> bool:
    return bool(HUB_HERO_HEADING_RE.search(block))


def parse_hub_sections(content: str) -> list[dict]:
    """Group hub product cards under their preceding h2 category headings."""
    sections: list[dict] = []
    current: dict | None = None
    hero_title = ""

    def ensure_section(title: str) -> dict:
        nonlocal current
        if current is None:
            current = {"title": title, "products": []}
            sections.append(current)
        return current

    for block in re.findall(r'<div class="rich-text">(.*?)</div>', content, re.DOTALL):
        h4_match = HUB_PRODUCT_NAME_RE.search(block)
        if "<h2" in block:
            title = extract_hub_heading_text(block)
            if not title:
                continue
            if is_hub_hero_heading(block):
                hero_title = title
                continue
            current = {"title": title, "products": []}
            sections.append(current)
            continue
        if h4_match:
            name = html.unescape(h4_match.group(1).strip())
            if not name:
                continue
            section = current
            if section is None:
                section = ensure_section(hero_title)
            if name not in section["products"]:
                section["products"].append(name)

    return [section for section in sections if section["products"]]


def build_hub_card(
    name: str,
    *,
    image_index: dict[str, str],
    catalog: list[dict],
    slug_index: dict[str, str],
    title_index: dict[str, str],
    lang: str,
) -> dict:
    target = resolve_slug(name, slug_index, lang, title_index)
    target = to_canonical_slug(target) if target else ""
    href = page_href(lang, target) if target else "#"
    src = lookup_hub_card_image(
        name, image_index, catalog, slug_index, title_index, lang
    )
    return {"title": name, "src": src, "href": href}


def render_hub_product_card(card: dict) -> str:
    img_html = (
        f'<img src="{card["src"]}" alt="{safe_escape(card["title"])}" loading="lazy"/>'
        if card["src"]
        else '<div class="card-placeholder"></div>'
    )
    return (
        f'<a class="product-card" href="{card["href"]}">'
        f'<div class="product-card-image">{img_html}</div>'
        f'<span class="product-card-title">{safe_escape(card["title"])}</span>'
        f"</a>"
    )


def parse_hub_cards(page: dict, lang: str) -> str:
    """Build categorized hub sections from scraped h2/h4 headings + images."""
    slug_index = build_slug_index(lang)
    title_index = build_title_index(lang)
    catalog = load_product_catalog(lang)
    content = page.get("content_html", "")
    image_index = build_hub_image_index(page)
    sections = parse_hub_sections(content)

    if not sections:
        return ""

    h2_sections = re.findall(
        r'<h2[^>]*>.*?font-family:[^;]+;">([^<]+)</span>',
        content,
    )
    main_title = hub_page_title(page, lang, h2_sections[0] if h2_sections else "")

    html_parts = ['<div class="hub-page">']
    if main_title:
        html_parts.append(f'<h1 class="page-title">{safe_escape(main_title)}</h1>')

    for section in sections:
        cards = [
            build_hub_card(
                name,
                image_index=image_index,
                catalog=catalog,
                slug_index=slug_index,
                title_index=title_index,
                lang=lang,
            )
            for name in section["products"]
        ]
        html_parts.append('<section class="hub-section">')
        html_parts.append(
            f'<h2 class="hub-section-title">{safe_escape(section["title"])}</h2>'
        )
        html_parts.append('<div class="card-grid">')
        html_parts.extend(render_hub_product_card(card) for card in cards)
        html_parts.append("</div></section>")

    html_parts.append("</div>")
    return "\n".join(html_parts)


RELATED_PRODUCT_MARKERS = ("מוצרים קשורים", "related products", "related items")


def text_has_related_marker(text: str) -> bool:
    lower = text.lower()
    return any(marker in text or marker in lower for marker in RELATED_PRODUCT_MARKERS)


HEBREW_RE = re.compile(r"[\u0590-\u05ff]")


def clean_image_alt(alt: str, fallback: str) -> str:
    text = (alt or "").strip()
    if not text or HEBREW_RE.search(text):
        return fallback
    return text


def has_related_products_section(page: dict) -> bool:
    for block in page.get("rich_text", []):
        if block and text_has_related_marker(block):
            return True
    content = page.get("content_html", "")
    if content and text_has_related_marker(content):
        return True
    if page.get("related_slugs"):
        return True
    return False


def is_product_detail_page(page: dict) -> bool:
    if has_related_products_section(page):
        return True
    images = page.get("images", [])
    if len(images) < 3:
        return False
    gallery_count = sum(
        1
        for img in images
        if is_gallery_product_image(img.get("src", ""), img.get("alt", ""))
        or is_related_product_image(img.get("src", ""), img.get("alt", ""))
    )
    return gallery_count >= 2


def product_display_title(page: dict) -> str:
    title = re.sub(r"\s*\|.*", "", page.get("title", "")).strip()
    if title:
        return title
    rich = page.get("rich_text", [])
    return rich[0] if rich else page.get("slug", "")


def media_basename(url: str) -> str:
    match = re.search(r"/media/([^/]+)", url)
    return match.group(1) if match else ""


def is_screen_or_icon(src: str, alt: str = "") -> bool:
    if "Screen" in src or "Screen" in alt:
        return True
    return bool(re.search(r"w_2[0-6],h_", src))


def is_product_variant_image(src: str, alt: str = "") -> bool:
    """Product gallery thumbs with numeric labels (e.g. SuperBrain 5/10/20/30/40)."""
    if is_screen_or_icon(src, alt):
        return False
    label = (alt or "").strip()
    if re.fullmatch(r"\d+", label):
        return True
    if "blur" in src and re.search(r"w_8[0-9],h_6", src) and len(label) <= 3:
        return True
    return False


def is_related_product_image(src: str, alt: str = "") -> bool:
    if is_screen_or_icon(src, alt):
        return False
    if is_product_variant_image(src, alt):
        return False
    if re.match(r"CO-EN-", (alt or "").strip()):
        return False
    if "blur" in src:
        return bool(alt and len(alt.strip()) > 2)
    if re.search(r"w_20[0-3],h_20", src):
        return True
    return False


def is_gallery_product_image(src: str, alt: str = "") -> bool:
    if is_screen_or_icon(src, alt):
        return False
    if is_product_variant_image(src, alt):
        return True
    if is_related_product_image(src, alt):
        return False
    # Small thumbs that are not named product variants
    if re.search(r"w_(4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]),h_", src):
        return False
    return True


HUB_CATEGORY_BLOCKS = {
    "מוני אנרגיה",
    "מערכות חשמל",
    "מוני חשמל",
    "מודדים לאיכות חשמל",
    "Energy Meters",
    "Electrical Systems",
}
_HUB_CATEGORY_BLOCKS_CF = {block.casefold() for block in HUB_CATEGORY_BLOCKS}


def filter_product_description(content: str, slug: str) -> str:
    content = filter_page_content(content, slug)
    parts = content.split('<div class="rich-text">')
    filtered: list[str] = []
    for i, part in enumerate(parts):
        if i == 0:
            if part.strip():
                filtered.append(part)
            continue
        block = '<div class="rich-text">' + part
        block_text = re.sub(r"<[^>]+>", " ", block)
        plain = re.sub(r"\s+", " ", block_text).strip()
        if plain.casefold() in _HUB_CATEGORY_BLOCKS_CF:
            continue
        filtered.append(block)
    return "".join(filtered).strip()


def split_content_before_related(content: str) -> str:
    parts = content.split('<div class="rich-text">')
    filtered: list[str] = []
    for i, part in enumerate(parts):
        if i == 0:
            if part.strip():
                filtered.append(part)
            continue
        block = '<div class="rich-text">' + part
        block_text = re.sub(r"<[^>]+>", " ", block)
        if text_has_related_marker(block_text):
            break
        filtered.append(block)
    return "".join(filtered)


def figure_to_image(fig: str) -> dict[str, str]:
    src_m = re.search(r'src="([^"]+)"', fig)
    alt_m = re.search(r'alt="([^"]*)"', fig)
    return {
        "src": src_m.group(1) if src_m else "",
        "alt": alt_m.group(1) if alt_m else "",
    }


def dedupe_images(images: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for img in images:
        key = media_basename(img.get("src", "")) or img.get("src", "")
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(img)
    return unique


def is_ui_screen_capture(src: str, alt: str = "") -> bool:
    label = (alt or "").strip()
    if re.match(r"CO-EN-", label):
        return True
    return is_screen_capture(src)


def is_screen_capture(src: str) -> bool:
    return bool(re.search(r"(?:fit/)?w_1[0-4][0-9],h_1[0-4][0-9]", src))


def collect_product_gallery(page: dict, figures: list[str]) -> tuple[list[dict], list[dict]]:
    candidates: list[dict] = []
    title = product_display_title(page)

    for fig in figures:
        img = figure_to_image(fig)
        src = img.get("src", "")
        alt = img.get("alt", "")
        if not src or not is_gallery_product_image(src, alt):
            continue
        if not alt or alt.endswith(".png"):
            img["alt"] = title
        candidates.append(img)

    for item in page.get("gallery", []):
        src = item.get("src", "")
        if not src or not is_gallery_product_image(src):
            continue
        candidates.append({"src": src, "alt": title})

    for item in page.get("images", []):
        src = item.get("src", "")
        alt = item.get("alt", "")
        if not src:
            continue
        if is_ui_screen_capture(src, alt):
            candidates.append({"src": src, "alt": alt or title})
            continue
        if not is_gallery_product_image(src, alt):
            continue
        label = alt or title
        if re.fullmatch(r"\d+", (alt or "").strip()):
            label = f"{title} — {alt} I/O"
        candidates.append({"src": src, "alt": label})

    og = page.get("og_image", "")
    if og and is_gallery_product_image(og):
        candidates.insert(0, {"src": og, "alt": title})

    unique = dedupe_images(candidates)
    heroes: list[dict] = []
    screens: list[dict] = []
    for img in unique:
        raw_src = img["src"]
        img["src"] = wix_original_url(raw_src)
        if is_ui_screen_capture(raw_src, img.get("alt", "")):
            screens.append(img)
        else:
            heroes.append(img)

    if not heroes and unique:
        heroes = [unique[0]]
        screens = [
            img
            for img in unique[1:]
            if is_ui_screen_capture(img.get("src", ""), img.get("alt", ""))
        ]

    def sort_key(img: dict) -> tuple:
        alt = (img.get("alt") or "").strip()
        if re.fullmatch(r"\d+", alt):
            return (1, int(alt))
        size_match = re.search(r"w_(\d+)", img.get("src", ""))
        size = int(size_match.group(1)) if size_match else 0
        return (0, -size)

    heroes.sort(key=sort_key)
    screens.sort(key=sort_key)

    return heroes, screens


def build_catalog_media_index(catalog: list[dict]) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for prod in catalog:
        mid = media_basename(prod.get("src", ""))
        if mid:
            index[mid] = prod
    return index


def find_catalog_product(
    catalog: list[dict],
    media_index: dict[str, dict],
    *,
    alt: str = "",
    src: str = "",
    slug_index: dict[str, str],
    title_index: dict[str, str],
    lang: str,
) -> dict | None:
    if alt:
        target = resolve_slug(html.unescape(alt), slug_index, lang, title_index)
        if target:
            prod = next((p for p in catalog if p.get("slug") == target), None)
            if not prod:
                prod = catalog_product_for_slug(catalog, target, alt)
            if prod:
                return prod

    mid = media_basename(src)
    if mid and mid in media_index:
        return media_index[mid]

    return None


def catalog_product_for_slug(
    catalog: list[dict],
    slug: str,
    title: str = "",
) -> dict | None:
    slug = to_canonical_slug(slug)
    for prod in catalog:
        if to_canonical_slug(prod.get("slug", "")) == slug:
            return prod
    if title:
        norm_title = normalize_product_name(title)
        for prod in catalog:
            if normalize_product_name(prod.get("title", "")) == norm_title:
                return prod
    slug_norm = normalize_product_name(slug.replace("-", " "))
    for prod in catalog:
        prod_slug_norm = normalize_product_name(prod.get("slug", "").replace("-", " "))
        if prod_slug_norm and prod_slug_norm == slug_norm:
            return prod
    return None


# Generic placeholder reused for many unrelated catalog thumbs on Wix.
CATALOG_PLACEHOLDER_BASENAMES = {
    "9a8771_f40920370b1b4d27892aafe3d29c090e~mv2.png",
}


def image_size_score(src: str) -> int:
    match = re.search(r"w_(\d+)", src)
    return int(match.group(1)) if match else 0


def is_tiny_chrome_image(src: str, alt: str = "") -> bool:
    if not src:
        return True
    if is_screen_or_icon(src, alt):
        return True
    if image_size_score(src) <= 32 and not alt:
        return True
    return False


def extract_page_card_image(page: dict) -> str:
    """Pick the best product photo from a scraped product page."""
    candidates: list[str] = []

    og = page.get("og_image", "")
    if og and not is_tiny_chrome_image(og):
        candidates.append(og)

    for item in page.get("gallery", []):
        src = item.get("src", "")
        if src and not is_tiny_chrome_image(src):
            candidates.append(src)

    for fig in re.findall(
        r'<figure class="(?:content-image|gallery-image)">.*?</figure>',
        page.get("content_html", ""),
        re.DOTALL,
    ):
        img = figure_to_image(fig)
        src = img.get("src", "")
        alt = img.get("alt", "")
        if not src or is_tiny_chrome_image(src, alt):
            continue
        if is_product_variant_image(src, alt):
            continue
        candidates.append(src)

    for item in page.get("images", []):
        src = item.get("src", "")
        alt = item.get("alt", "")
        if not src or is_tiny_chrome_image(src, alt):
            continue
        if is_product_variant_image(src, alt):
            continue
        candidates.append(src)

    if not candidates:
        return ""

    best = max(candidates, key=image_size_score)
    return wix_original_url(best)


def build_product_page_image_index(lang: str) -> dict[str, str]:
    """Map product slug -> best card image from its scraped page."""
    index: dict[str, str] = {}
    scraped_dir = SCRAPED_DIR / lang
    for path in scraped_dir.glob("*.json"):
        if path.name in ("manifest.json", "slideshow.json", "index.json", "תמיכה.json", "products.json"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        slug = canonical_slug(data.get("slug", path.stem))
        image = extract_page_card_image(data)
        if image:
            index[slug] = image
    return index


def pick_card_image(
    prod: dict | None,
    fallback_src: str = "",
    *,
    page_image: str = "",
) -> str:
    candidates: list[str] = []
    if page_image:
        candidates.append(page_image)
    if prod and prod.get("src"):
        prod_base = media_basename(prod["src"])
        if prod_base not in CATALOG_PLACEHOLDER_BASENAMES:
            candidates.append(prod["src"])
    if fallback_src:
        candidates.append(fallback_src)

    for src in candidates:
        original = wix_original_url(src)
        if original:
            return original
    return ""


def build_slug_title_index(lang: str) -> dict[str, str]:
    """Map product slug -> display title from scraped pages."""
    index: dict[str, str] = {}
    scraped_dir = SCRAPED_DIR / lang
    for path in scraped_dir.glob("*.json"):
        if path.name in ("manifest.json", "slideshow.json", "index.json", "תמיכה.json", "products.json"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        slug = canonical_slug(data.get("slug", path.stem))
        title = product_display_title(data)
        if slug and title:
            index[slug] = title
    return index


def collect_related_products(
    page: dict,
    lang: str,
    catalog: list[dict],
    slug_index: dict[str, str],
    title_index: dict[str, str],
    page_images: dict[str, str] | None = None,
    slug_titles: dict[str, str] | None = None,
) -> list[dict]:
    current_slug = page.get("slug", "")
    media_index = build_catalog_media_index(catalog)
    if page_images is None:
        page_images = build_product_page_image_index(lang)
    if slug_titles is None:
        slug_titles = build_slug_title_index(lang)
    related: list[dict] = []
    seen_slugs: set[str] = {current_slug}
    seen_titles: set[str] = set()

    def add_card(prod: dict | None, fallback_src: str = "", fallback_title: str = "") -> None:
        target = ""
        title = ""
        if prod:
            target = product_canonical_slug(prod, lang, slug_index, title_index)
            title = catalog_product_title(prod, target, lang, slug_titles)
        elif fallback_title:
            target = resolve_slug(html.unescape(fallback_title), slug_index, lang, title_index)
            title = fallback_title
            if target and target not in seen_slugs:
                prod = catalog_product_for_slug(catalog, target, fallback_title)
                if prod:
                    target = product_canonical_slug(prod, lang, slug_index, title_index)
                    title = catalog_product_title(prod, target, lang, slug_titles)
        else:
            return

        if not target or target in seen_slugs:
            return
        title = slug_titles.get(target, title)
        norm_title = normalize_product_name(title)
        if norm_title in seen_titles:
            return
        seen_slugs.add(target)
        seen_titles.add(norm_title)
        related.append(
            {
                "title": title,
                "slug": target,
                "src": pick_card_image(
                    prod,
                    fallback_src,
                    page_image=page_images.get(target, ""),
                ),
            }
        )

    for rel_slug in page.get("related_slugs", []):
        title = (
            slug_titles.get(rel_slug)
            or HUB_DISPLAY_TITLES.get(rel_slug)
            or CANONICAL_TITLES_EN.get(rel_slug, "")
        )
        prod = catalog_product_for_slug(catalog, rel_slug, title)
        add_card(prod, page_images.get(rel_slug, ""), title)

    for item in page.get("images", []):
        src = item.get("src", "")
        alt = html.unescape((item.get("alt") or "").strip())
        if not is_related_product_image(src, alt):
            continue
        prod = find_catalog_product(
            catalog,
            media_index,
            alt=alt,
            src=src,
            slug_index=slug_index,
            title_index=title_index,
            lang=lang,
        )
        add_card(prod, src, alt)

    for fig in re.findall(
        r'<figure class="(?:content-image|gallery-image)">.*?</figure>',
        page.get("content_html", ""),
        re.DOTALL,
    ):
        img = figure_to_image(fig)
        src = img.get("src", "")
        alt = html.unescape((img.get("alt") or "").strip())
        if not is_related_product_image(src, alt):
            continue
        prod = find_catalog_product(
            catalog,
            media_index,
            alt=alt,
            src=src,
            slug_index=slug_index,
            title_index=title_index,
            lang=lang,
        )
        add_card(prod, src, alt)

    current = next((p for p in catalog if p.get("slug") == current_slug), None)
    subcats = set()
    if current:
        subcats.update(current.get("subcategories") or [])
        if current.get("subcategory"):
            subcats.update(s.strip() for s in current["subcategory"].split(",") if s.strip())

    if subcats and len(related) < 2:
        for prod in catalog:
            prod_subs = set(prod.get("subcategories") or [])
            if prod.get("subcategory"):
                prod_subs.update(s.strip() for s in prod["subcategory"].split(",") if s.strip())
            if not subcats.intersection(prod_subs):
                continue
            add_card(prod)

    return related


def render_product_carousel(images: list[dict], default_alt: str) -> str:
    if not images:
        return ""

    items: list[str] = []
    dots: list[str] = []
    for i, img in enumerate(images):
        active = " is-active" if i == 0 else ""
        src = rewrite_image_url(img.get("src", ""))
        alt = html.escape(clean_image_alt(img.get("alt", ""), default_alt))
        items.append(
            f'<div class="carousel-slide{active}" data-index="{i}">'
            f'<img src="{src}" alt="{alt}" loading="lazy"/>'
            f"</div>"
        )
        dots.append(
            f'<button class="carousel-dot{active}" aria-label="Slide {i + 1}" '
            f'data-index="{i}"></button>'
        )

    controls = ""
    if len(images) > 1:
        controls = """
  <button class="carousel-prev" aria-label="Previous image">&#10094;</button>
  <button class="carousel-next" aria-label="Next image">&#10095;</button>"""

    return f"""<section class="product-carousel carousel" aria-label="Product images">
  <div class="carousel-track">{"".join(items)}</div>{controls}
  <div class="carousel-dots">{"".join(dots)}</div>
</section>"""


def render_product_screens(images: list[dict], default_alt: str, lang: str) -> str:
    if not images:
        return ""

    heading = "תצוגות מסך" if lang == "he" else "Screen views"
    parts = [
        '<section class="product-screens" aria-label="Product screen views">',
        f'<h3 class="product-screens-title">{html.escape(heading)}</h3>',
        '<div class="product-screens-grid">',
    ]
    for img in images:
        src = rewrite_image_url(img.get("src", ""))
        alt = html.escape(img.get("alt") or default_alt)
        parts.append(f'<img src="{src}" alt="{alt}" loading="lazy"/>')
    parts.append("</div></section>")
    return "\n".join(parts)


def render_related_product_cards(cards: list[dict], lang: str) -> str:
    if not cards:
        return ""

    heading = "מוצרים קשורים" if lang == "he" else "Related Items"
    parts = [
        '<section class="related-products">',
        f'<h2 class="related-products-title">{html.escape(heading)}</h2>',
        '<div class="card-grid related-products-grid">',
    ]
    for card in cards:
        title = card.get("title", "")
        slug = card.get("slug", "")
        href = page_href(lang, slug) if slug else "#"
        src = rewrite_image_url(wix_original_url(card.get("src", "")))
        img_html = (
            f'<img src="{src}" alt="{html.escape(title)}" loading="lazy"/>'
            if src
            else '<div class="card-placeholder"></div>'
        )
        parts.append(
            f'<a class="product-card" href="{href}">'
            f'<div class="product-card-image">{img_html}</div>'
            f'<span class="product-card-title">{html.escape(title)}</span>'
            f"</a>"
        )
    parts.append("</div></section>")
    return "\n".join(parts)


def render_product_documents(page: dict, lang: str) -> str:
    docs = page.get("documents") or []
    if not docs:
        return ""

    order = {label: index for index, label in enumerate(DOCUMENT_LABEL_ORDER)}
    sorted_docs = sorted(docs, key=lambda doc: order.get(doc.get("label", ""), 99))
    buttons: list[str] = []
    for doc in sorted_docs:
        filename = doc.get("file", "")
        label = doc.get("label", "")
        if not filename or not label:
            continue
        if not local_document_path(filename).exists():
            continue
        href = rewrite_document_url(filename)
        display = DOCUMENT_LABELS_EN.get(label, label) if lang == "en" else label
        buttons.append(
            f'<a class="btn btn-doc" href="{href}" target="_blank" '
            f'rel="noopener noreferrer">{html.escape(display)}</a>'
        )

    if not buttons:
        return ""

    return f'<div class="product-documents">{"".join(buttons)}</div>'


def render_product_detail_page(page: dict, lang: str) -> str:
    slug = page.get("slug", "")
    display_title = product_display_title(page)
    raw = page.get("content_html", "")
    text_part, figures = split_figures(raw)
    text_part = split_content_before_related(text_part)
    content = filter_product_description(text_part, slug)
    content = rewrite_wix_urls(content)

    content = re.sub(
        r'<div class="rich-text"><h[1-3][^>]*>.*?</h[1-3]></div>\s*',
        "",
        content,
        count=1,
        flags=re.DOTALL,
    )

    catalog = load_product_catalog(lang)
    slug_index = build_slug_index(lang)
    title_index = build_title_index(lang)
    heroes, screens = collect_product_gallery(page, figures)
    related = collect_related_products(page, lang, catalog, slug_index, title_index)

    carousel_html = render_product_carousel(heroes, display_title)
    screens_html = render_product_screens(screens, display_title, lang)
    documents_html = render_product_documents(page, lang)
    related_html = render_related_product_cards(related, lang)

    return f"""<article class="page-content product-detail-page">
  <header class="product-detail-header">
    <h1 class="page-title">{html.escape(display_title)}</h1>
  </header>
  <div class="product-detail-main">
    <div class="product-detail-main-inner">
      <div class="product-detail-copy">
        <div class="wix-content product-description">
          {content}
        </div>
        {documents_html}
      </div>
      <div class="product-detail-media">
        {carousel_html}
        {screens_html}
      </div>
    </div>
  </div>
  {related_html}
</article>"""


def render_projects_grid(
    lang: str,
    images: list[dict],
    *,
    heading: str | None = None,
    section_id: str = "",
) -> str:
    """Render linked project category cards."""
    projects = PROJECTS.get(lang, [])
    if not projects:
        return ""

    id_attr = f' id="{html.escape(section_id)}"' if section_id else ""
    parts = [f'<section class="about-projects hub-page"{id_attr}>']
    if heading:
        parts.append(f'<h2 class="hub-section-title about-projects-title">{html.escape(heading)}</h2>')
    parts.append('<div class="card-grid">')

    for proj in projects:
        img_src = ""
        for img in images:
            src = img.get("src", "")
            alt = img.get("alt", "")
            if proj["img"] in src or proj["img"] in alt:
                if "Screen" not in src:
                    img_src = rewrite_image_url(wix_original_url(src))
                    break
        img_html = (
            f'<img src="{img_src}" alt="{html.escape(proj["title"])}" loading="lazy"/>'
            if img_src
            else '<div class="card-placeholder"></div>'
        )
        href = page_href(lang, proj["slug"])
        parts.append(
            f'<a class="product-card project-card" href="{href}">'
            f'<div class="product-card-image">{img_html}</div>'
            f'<span class="product-card-title">{html.escape(proj["title"])}</span>'
            f"</a>"
        )

    parts.append("</div></section>")
    return "\n".join(parts)


CANONICAL_MEDIA_LANG = "he"


def load_typical_projects_images(_lang: str) -> list[dict]:
    """Project card images always come from the Hebrew scrape for parity."""
    scraped_dir = SCRAPED_DIR / CANONICAL_MEDIA_LANG
    for stem in ("typical-projects", "הפרוייקטים-שלנו"):
        path = scraped_dir / f"{stem}.json"
        if path.exists():
            page = json.loads(path.read_text(encoding="utf-8"))
            return page.get("images", [])
    return []


def merge_project_page_images(page: dict, slug: str) -> dict:
    """Prefer Hebrew media assets so EN/HE project pages share the same images."""
    merged = dict(page)
    images = list(page.get("images", []))
    he_path = SCRAPED_DIR / CANONICAL_MEDIA_LANG / f"{slug}.json"
    if he_path.exists():
        he_page = json.loads(he_path.read_text(encoding="utf-8"))
        images = dedupe_images(images + he_page.get("images", []))
    merged["images"] = images
    return merged


def normalize_about_markup(content: str, lang: str) -> str:
    """Strip Wix inline styling so Hebrew and English about pages share one design."""
    content = re.sub(r'<span class="wixGuard[^"]*">[^<]*</span>', "", content)
    content = re.sub(r"\s*dir=\"(?:rtl|ltr)\"", "", content)
    content = re.sub(r'\s*style="[^"]*"', "", content)
    content = re.sub(r"<br[^>]*/?>", " ", content)
    content = re.sub(r"<p>\s*</p>", "", content)
    content = re.sub(r"<p[^>]*>\s*(?:<span[^>]*>\s*)*</p>", "", content)

    if lang == "en":
        content = re.sub(
            r'(<div class="rich-text">)\s*'
            r'<p[^>]*>\s*(?:<span[^>]*>\s*)*Control Applications Ltd\.?\s*(?:</span>\s*)*</p>\s*'
            r'(?:<p[^>]*>\s*(?:<span[^>]*>\s*)*</p>\s*)?',
            r"\1",
            content,
            count=1,
            flags=re.DOTALL | re.I,
        )

    content = re.sub(r"<p[^>]*>\s*(?:<span[^>]*>\s*)*</p>", "", content)

    def strip_empty_h3(match: re.Match) -> str:
        inner = re.sub(r"<[^>]+>", "", match.group(0))
        return match.group(0) if inner.strip() else ""

    content = re.sub(r"<h3[^>]*>.*?</h3>", strip_empty_h3, content, flags=re.DOTALL)

    if lang == "en":
        content = re.sub(
            r"(<h3[^>]*>\s*(?:<span[^>]*>\s*)*Quality Assurance\s*(?:</span>\s*)*</h3>\s*)"
            r"<h3[^>]*>(.*?)</h3>",
            r'\1<p class="about-section-body">\2</p>',
            content,
            count=1,
            flags=re.DOTALL | re.I,
        )

    def strip_empty_paragraph(match: re.Match) -> str:
        inner = re.sub(r"<[^>]+>", "", match.group(0))
        return "" if not inner.strip() else match.group(0)

    content = re.sub(r"<p[^>]*>.*?</p>", strip_empty_paragraph, content, flags=re.DOTALL)

    return content.strip()


def filter_about_content(content: str, lang: str) -> str:
    """Clean scraped Wix about-page markup for static layout."""
    content = filter_page_content(content, "about")

    # Remove Wix hero titles (page h1 is rendered separately)
    content = re.sub(
        r'<div class="rich-text"><h[12][^>]*>.*?</h[12]></div>\s*',
        "",
        content,
        flags=re.DOTALL,
    )

    parts = content.split('<div class="rich-text">')
    filtered: list[str] = []
    for i, part in enumerate(parts):
        if i == 0:
            if part.strip():
                filtered.append(part)
            continue
        block = '<div class="rich-text">' + part
        block_text = re.sub(r"<[^>]+>", " ", block)
        # Site header link block (not Quality Assurance body copy)
        if (
            re.search(r"<a[^>]*>[^<]*Control Applications[^<]*</a>", block, re.I)
            and "Quality Assurance" not in block_text
            and "<p " not in block
        ):
            continue
        if "color:#FFFFFF" in block or "color:rgb(255, 255, 255)" in block:
            continue
        if "color_11" in block:
            continue
        # English scrape includes a duplicated body paragraph block
        if lang == "en" and "stands at the center" in block_text:
            continue
        if "Control Applications" in block_text and len(block_text.strip()) < 35:
            continue
        filtered.append(block)

    return normalize_about_markup("".join(filtered).strip(), lang)


def _paragraph_text(paragraph_html: str) -> str:
    return re.sub(r"<[^>]+>", "", paragraph_html).strip()


def _clean_about_paragraph(paragraph_html: str) -> str:
    cleaned = re.sub(r"<span[^>]*>|</span>", "", paragraph_html)
    cleaned = re.sub(r'\sclass="[^"]*"', "", cleaned, count=1)
    return re.sub(
        r"<p([^>]*)>",
        r'<p class="about-story-p"\1>',
        cleaned,
        count=1,
    )


def parse_about_sections(content: str, lang: str) -> dict[str, str | list[str]]:
    """Split filtered about HTML into story paragraphs and quality block."""
    quality_heading = "Quality Assurance" if lang == "en" else "אבטחת איכות"
    quality_html = ""
    qa_pattern = (
        r'<div class="rich-text">\s*<h3[^>]*>.*?'
        + re.escape(quality_heading)
        + r".*?</h3>.*?</div>"
    )
    qa_match = re.search(qa_pattern, content, flags=re.DOTALL | re.I)
    if qa_match:
        quality_html = qa_match.group(0)
        content = content[: qa_match.start()] + content[qa_match.end() :]

    paragraphs = re.findall(r"<p[^>]*>.*?</p>", content, flags=re.DOTALL)
    story = [
        _clean_about_paragraph(p)
        for p in paragraphs
        if _paragraph_text(p)
    ]
    return {"story": story, "quality": quality_html}


def render_about_hero_standards(lang: str) -> str:
    aria = "תקני איכות" if lang == "he" else "Quality standards"
    items = "".join(
        f'<li class="about-hero-standard">{html.escape(item["code"])}</li>'
        for item in ABOUT_STANDARDS[lang]
    )
    return f'<ul class="about-hero-standards" aria-label="{html.escape(aria)}">{items}</ul>'


def render_about_highlights(lang: str) -> str:
    cards = []
    for item in ABOUT_STANDARDS[lang]:
        cards.append(
            f'<div class="about-highlight">'
            f'<span class="about-highlight-value">{html.escape(item["code"])}</span>'
            f'<span class="about-highlight-label">{html.escape(item["label"])}</span>'
            f"</div>"
        )
    return f'<div class="about-highlights">{"".join(cards)}</div>'


def render_about_expertise(lang: str) -> str:
    heading = "What we do" if lang == "en" else "תחומי פעילות"
    items = "".join(
        f'<li class="about-expertise-item">{html.escape(label)}</li>'
        for label in ABOUT_EXPERTISE[lang]
    )
    return f"""<aside class="about-expertise">
  <h2 class="about-expertise-title">{html.escape(heading)}</h2>
  <ul class="about-expertise-list">{items}</ul>
</aside>"""


def render_about_quality(lang: str) -> str:
    qa = ABOUT_QA[lang]
    standards = "".join(
        f'<div class="about-standard-item">'
        f'<span class="about-standard-code">{html.escape(item["code"])}</span>'
        f'<span class="about-standard-detail">{html.escape(item["label"])}</span>'
        f"</div>"
        for item in ABOUT_STANDARDS[lang]
    )
    scope = "".join(
        f'<li class="about-quality-scope-item">{html.escape(item)}</li>'
        for item in qa["scope"]
    )
    return f"""<section class="about-quality">
  <div class="about-quality-card">
    <h2 class="about-quality-title">{html.escape(qa["title"])}</h2>
    <p class="about-quality-intro">{html.escape(qa["intro"])}</p>
    <div class="about-standards-grid">{standards}</div>
    <div class="about-quality-scope">
      <h3 class="about-quality-scope-title">{html.escape(qa["scope_heading"])}</h3>
      <ul class="about-quality-scope-list">{scope}</ul>
    </div>
  </div>
</section>"""


def render_about_page(page: dict, lang: str) -> str:
    """About copy with typical project cards below on the same page."""
    hero = ABOUT_HERO[lang]
    raw = page.get("content_html", "")
    text_part, _figures = split_figures(raw)
    content = filter_about_content(text_part, lang)
    content = rewrite_wix_urls(content)
    sections = parse_about_sections(content, lang)

    logo_src = "/assets/images/logo.png" if lang == "he" else "/assets/images/logo-icon.png"
    logo_class = "about-hero-logo" if lang == "he" else "about-hero-logo about-hero-logo-en"
    logo_alt = "ישומי בקרה" if lang == "he" else "Control Applications"

    story_html = "".join(sections["story"])
    story_block = (
        f'<div class="about-story">{story_html}</div>' if story_html else ""
    )

    projects_heading = "הפרוייקטים שלנו" if lang == "he" else "Typical Projects"
    projects_html = render_projects_grid(
        lang,
        load_typical_projects_images(lang),
        heading=projects_heading,
        section_id="projects",
    )

    return f"""<article class="page-content about-page">
  <header class="about-hero">
    <div class="about-hero-inner">
      <div class="{logo_class}">
        <img src="{logo_src}" alt="{html.escape(logo_alt)}" width="80" height="80" loading="eager"/>
      </div>
      <div class="about-hero-text">
        <h1 class="about-hero-title">{html.escape(hero["title"])}</h1>
        <p class="about-hero-lead">{html.escape(hero["lead"])}</p>
        {render_about_hero_standards(lang)}
      </div>
    </div>
  </header>
  {render_about_highlights(lang)}
  <div class="about-body">
    {story_block}
    {render_about_expertise(lang)}
  </div>
  {render_about_quality(lang)}
  {projects_html}
</article>"""


def render_projects_page(page: dict, lang: str) -> str:
    """Render projects listing with linked cards."""
    heading = "הפרוייקטים שלנו" if lang == "he" else "Typical Projects"
    return render_projects_grid(lang, page.get("images", []), heading=heading)


PROJECT_DETAIL_SLUGS = {proj["slug"] for proj in PROJECTS["he"]}
JUNK_PROJECT_ALTS = frozenset({"english", "hebrew", "spanish", "עברית"})
PROJECT_FOOTER_MARKERS = (
    "יצירת קשר",
    "Contact Us",
    "making contact",
    "שעות פתיחה",
    "Opening Hour",
    "opening hours",
    "© Copyright",
    "cal@ddc.co.il",
    "כתובת",
    "Address",
    "Adress",
    "Control Applications Ltd",
    "ישומי בקרה",
)


def project_config_for_slug(lang: str, slug: str) -> dict | None:
    for proj in PROJECTS.get(lang, []):
        if proj["slug"] == slug:
            return proj
    return None


def is_junk_project_image(img: dict) -> bool:
    alt = (img.get("alt") or "").strip().lower()
    src = (img.get("src") or "").lower()
    if alt in JUNK_PROJECT_ALTS:
        return True
    if "bullet_ball" in alt or "bullet_ball" in src:
        return True
    if "screen" in alt or "screen" in src:
        return True
    if "home-content" in src:
        return True
    if re.search(r"w_2[0-6],h_", src):
        return True
    return False


def score_project_image(img: dict, img_key: str, slug: str) -> int:
    if is_junk_project_image(img):
        return -1
    src = (img.get("src") or "").lower()
    alt = (img.get("alt") or "").lower()
    key = img_key.lower()
    slug_l = slug.lower()
    score = 0
    if key in src or key in alt:
        score += 12
    if slug_l in src:
        score += 8
    if "500" in alt or "w_500" in src or "-content-" in src:
        score += 4
    if src.endswith(".png") or src.endswith(".jpg"):
        score += 1
    return score


def find_project_hero_image(
    page: dict,
    figures: list[str],
    img_key: str,
    slug: str,
) -> dict[str, str]:
    candidates: list[dict[str, str]] = []
    for fig in figures:
        img = figure_to_image(fig)
        if img.get("src"):
            candidates.append(img)
    for img in page.get("images", []):
        if img.get("src"):
            candidates.append(img)

    best: dict[str, str] = {"src": "", "alt": ""}
    best_score = -1
    for img in dedupe_images(candidates):
        score = score_project_image(img, img_key, slug)
        if score > best_score:
            best_score = score
            best = img
    return best


def extract_project_site_list(page: dict, title: str) -> list[str]:
    title_norm = title.strip().lower()
    for block in page.get("rich_text", []):
        if not isinstance(block, str):
            continue
        plain = block.strip()
        if not plain or plain.lower() == title_norm:
            continue
        if any(marker in plain for marker in PROJECT_FOOTER_MARKERS):
            continue
        if "©" in plain:
            continue
        lines = [line.strip() for line in plain.splitlines() if line.strip() and line.strip() != "​"]
        if len(lines) >= 2:
            return lines

    raw = page.get("content_html", "")
    text_part, _ = split_figures(raw)
    text_part = filter_page_content(text_part, page.get("slug", ""))
    lines: list[str] = []
    for para in re.findall(
        r'<p class="font_8[^"]*"[^>]*>(.*?)</p>',
        text_part,
        flags=re.DOTALL,
    ):
        line = re.sub(r"<[^>]+>", "", para)
        line = re.sub(r"\s+", " ", line).strip()
        if line and line.lower() != title_norm:
            lines.append(line)
    return lines


def render_project_site_list(items: list[str]) -> str:
    if not items:
        return ""
    lis = "".join(f"<li>{html.escape(item)}</li>" for item in items)
    return f'<ul class="project-site-list">{lis}</ul>'


def render_project_detail_page(page: dict, lang: str) -> str:
    slug = page.get("slug", "")
    page = merge_project_page_images(page, slug)
    proj = project_config_for_slug(lang, slug)
    title = proj["title"] if proj else re.sub(r"\s*\|.*", "", page.get("title", "")).strip()
    img_key = proj["img"] if proj else slug

    raw = page.get("content_html", "")
    _, figures = split_figures(raw)
    hero = find_project_hero_image(page, figures, img_key, slug)
    site_list = extract_project_site_list(page, title)
    list_html = render_project_site_list(site_list)

    hero_src = rewrite_image_url(hero.get("src", "")) if hero.get("src") else ""
    hero_alt = html.escape(title)
    media_html = ""
    if hero_src:
        media_html = (
            f'<div class="project-hero-frame">'
            f'<img src="{hero_src}" alt="{hero_alt}" class="project-hero-image" loading="lazy"/>'
            f"</div>"
        )

    return f"""<article class="page-content project-detail-page">
  <header class="project-detail-header">
    <h1 class="page-title">{html.escape(title)}</h1>
  </header>
  <div class="project-detail-main">
    <div class="project-detail-main-inner">
      <div class="project-detail-copy">
        {list_html}
      </div>
      <div class="project-detail-media">
        {media_html}
      </div>
    </div>
  </div>
</article>"""


def render_products_page(page: dict, lang: str) -> str:
    """Render full product catalog with category filter."""
    page_title = "מוצרים" if lang == "he" else "Products"
    filter_label = "בחרו תת קטגוריה" if lang == "he" else "Select subcategory"
    all_label = "הכל" if lang == "he" else "All"

    products = page.get("products") or []
    if not products:
        slug_index = build_slug_index(lang)
        title_index = build_title_index(lang)
        seen: set[str] = set()
        for item in page.get("gallery", []):
            title = (item.get("title") or "").strip()
            if not title or title in seen:
                continue
            seen.add(title)
            target = resolve_slug(title, slug_index, lang, title_index)
            products.append(
                {
                    "title": title,
                    "slug": target,
                    "subcategories": [],
                    "src": item.get("src", ""),
                }
            )

    subcats: list[str] = []
    seen_sub: set[str] = set()
    for prod in products:
        for sub in prod.get("subcategories") or []:
            localized = localize_subcategory(sub, lang)
            if localized and localized not in seen_sub:
                seen_sub.add(localized)
                subcats.append(localized)
    subcats.sort()

    filter_html = [
        '<div class="product-filters">',
        f'<label class="product-filter-label" for="product-category-filter">{html.escape(filter_label)}</label>',
        '<select id="product-category-filter" class="product-category-filter" aria-label="'
        f'{html.escape(filter_label)}">',
        f'<option value="">{html.escape(all_label)}</option>',
    ]
    for sub in subcats:
        filter_html.append(f'<option value="{html.escape(sub)}">{html.escape(sub)}</option>')
    filter_html.append("</select></div>")

    slug_index = build_slug_index(lang)
    title_index = build_title_index(lang)
    slug_titles = build_slug_title_index(lang)
    cards_html = ['<div class="card-grid product-card-grid">']
    for prod in products:
        slug = product_canonical_slug(prod, lang, slug_index, title_index)
        title = catalog_product_title(prod, slug, lang, slug_titles)
        href = page_href(lang, slug) if slug else "#"
        src = product_thumbnail_src(slug, lang, prod.get("src", ""))
        subcats_list = prod.get("subcategories") or []
        if not subcats_list and prod.get("subcategory"):
            subcats_list = [s.strip() for s in prod["subcategory"].split(",") if s.strip()]
        data_sub = "|".join(localize_subcategory(s, lang) for s in subcats_list)
        img_html = (
            f'<img src="{src}" alt="{html.escape(title)}" loading="lazy"/>'
            if src
            else '<div class="card-placeholder"></div>'
        )
        cards_html.append(
            f'<a class="product-card" href="{href}" data-subcategories="{html.escape(data_sub)}">'
            f'<div class="product-card-image">{img_html}</div>'
            f'<span class="product-card-title">{html.escape(title)}</span>'
            f"</a>"
        )
    cards_html.append("</div>")

    return (
        f'<article class="page-content">'
        f'<div class="hub-page products-page">'
        f'<h1 class="page-title">{page_title}</h1>'
        f'{"".join(filter_html)}'
        f'{"".join(cards_html)}'
        f"</div></article>"
    )


def render_hero(lang: str, page: dict) -> str:
    """Render homepage sections and CTA image cards."""
    if page.get("slug") != "":
        return ""
    home_content = render_home_content(lang)
    cta_grid = render_home_cta_grid(page, lang)
    if not cta_grid:
        return home_content
    return f"{home_content}\n{cta_grid}"


def render_page_body(lang: str, page: dict) -> str:
    slug = page.get("slug", "")
    title = page.get("title", "")

    # Special page layouts
    if slug == "about":
        return render_about_page(page, lang)

    if slug == "contact":
        return render_contact_page(lang)

    if slug == "product-comparison":
        return render_product_comparison_page(lang)

    if slug == "transfer-switch-drawings":
        return render_transfer_switch_drawings_page(lang)

    if slug == "typical-projects":
        return render_projects_page(page, lang)

    if slug in PROJECT_DETAIL_SLUGS:
        return render_project_detail_page(page, lang)

    if slug == "products":
        return render_products_page(page, lang)

    if slug in HUB_PAGES.get(lang, []):
        hub = parse_hub_cards(page, lang)
        if hub:
            return f"<article class=\"page-content\">{hub}</article>"

    if slug == "":
        return ""

    if is_product_detail_page(page):
        return render_product_detail_page(page, lang)

    # Standard content page
    raw = page.get("content_html", "")
    text_part, figures = split_figures(raw)
    content = filter_page_content(text_part, slug)
    content = rewrite_wix_urls(content)

    # Re-attach figures
    fig_html = ""
    for fig in figures:
        if "Screen" in fig:
            continue
        fig_html += rewrite_wix_urls(fig)

    display_title = ""
    if slug:
        if slug in title:
            display_title = re.sub(r"\s*\|.*", "", title).strip()
        else:
            display_title = slug

    return f"""
<article class="page-content">
  {f'<h1 class="page-title">{html.escape(display_title)}</h1>' if display_title else ''}
  <div class="wix-content">
    {content if content else ''}
    {fig_html}
  </div>
</article>"""


def render_page(lang: str, page: dict) -> str:
    cfg = SITE_CONFIG[lang]
    slug = page.get("slug", "")
    title = page.get("title") or cfg["brand"]
    description = "" if slug == "" else page.get("description", "")
    hero = render_hero(lang, page)
    body = render_page_body(lang, page)
    page_title = homepage_display_title(page, lang) if slug == "" else title

    return f"""<!DOCTYPE html>
<html lang="{cfg['lang']}" dir="{cfg['dir']}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{html.escape(page_title)}</title>
  <meta name="description" content="{html.escape(description)}"/>
  <link rel="icon" href="{asset_path('images/favicon.png')}" type="image/png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Spinnaker&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="{asset_path('css/main.css')}"/>
</head>
<body class="lang-{lang}">
  <header class="site-header">
    <div class="header-inner">
      {render_logo(lang)}
      {render_nav(lang, slug)}
      <div class="header-actions">
        {render_language_switcher(lang, slug)}
        <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
  <main id="main-content">
    {hero}
    {body}
  </main>
  {render_footer(lang)}
  <script src="{asset_path('js/main.js')}"></script>
</body>
</html>"""


def render_slug_redirect(lang: str, target_slug: str, anchor: str = "") -> str:
    target = page_href(lang, target_slug) + anchor
    cfg = SITE_CONFIG[lang]
    return f"""<!DOCTYPE html>
<html lang="{cfg['lang']}" dir="{cfg['dir']}">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="0;url={target}"/>
  <link rel="canonical" href="{target}"/>
  <title>Redirecting…</title>
</head>
<body>
  <p><a href="{target}">Continue</a></p>
</body>
</html>"""


def build_language(lang: str) -> int:
    scraped_dir = SCRAPED_DIR / lang
    if not scraped_dir.exists():
        print(f"No scraped data for {lang}")
        return 0

    out_base = SITE_DIR / lang
    count = 0
    page_slugs = [""] + all_canonical_slugs()

    for slug in page_slugs:
        if slug == "":
            json_path = scraped_dir / "index.json"
            if not json_path.exists():
                continue
            page = json.loads(json_path.read_text(encoding="utf-8"))
            page["slug"] = ""
            out_dir = out_base
        else:
            stem = resolve_source_file(lang, slug, scraped_dir) or slug
            json_path = scraped_dir / f"{stem}.json"
            if not json_path.exists():
                continue
            page = json.loads(json_path.read_text(encoding="utf-8"))
            page["slug"] = slug
            out_dir = out_base / slug

        out_dir.mkdir(parents=True, exist_ok=True)
        if slug == "typical-projects":
            html_content = render_slug_redirect(lang, "about", "#projects")
        else:
            html_content = render_page(lang, page)
        (out_dir / "index.html").write_text(html_content, encoding="utf-8")
        count += 1
        print(f"  Built: /{lang}/{slug or ''}")

    return count


def build_root_redirect() -> None:
    root_index = """<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="0;url=/he/"/>
  <link rel="canonical" href="/he/"/>
  <title>ישומי בקרה בע"מ</title>
</head>
<body>
  <p><a href="/he/">ישומי בקרה בע"מ</a></p>
</body>
</html>"""
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    (SITE_DIR / "index.html").write_text(root_index, encoding="utf-8")


def copy_assets() -> None:
    assets_src = ROOT / "assets"
    assets_dst = SITE_DIR / "assets"
    assets_dst.mkdir(parents=True, exist_ok=True)
    if assets_src.exists():
        for item in assets_src.rglob("*"):
            if item.is_file():
                rel = item.relative_to(assets_src)
                dest = assets_dst / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest)


def main():
    print("Building image aliases...")
    import build_image_aliases
    build_image_aliases.main()

    SITE_DIR.mkdir(parents=True, exist_ok=True)
    copy_assets()
    build_root_redirect()

    total = 0
    for lang in SITE_CONFIG:
        print(f"\n=== Building {lang} ===")
        total += build_language(lang)

    print(f"\nBuilt {total} pages in {SITE_DIR}")


if __name__ == "__main__":
    main()
