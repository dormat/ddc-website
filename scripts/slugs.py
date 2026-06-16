"""Canonical English URL slugs for the static site."""

from __future__ import annotations

from pathlib import Path

# All published pages (English slug paths under /he/ and /en/)
CANONICAL_SLUGS: list[str] = [
    "about",
    "typical-projects",
    "building-automation",
    "power-meters-control",
    "products",
    "contact",
    "quality-assurance",
    "product-comparison",
    "transfer-switch-drawings",
    "bms-certifications",
    "elnet-certifications",
    "plc-ddc-controllers",
    "parking-control",
    "plumbing-control",
    "flood-detection-systems",
    "flooding-sensor",
    "bms-scada-software",
    "transfer-switches",
    "power-factor-control",
    "smart-parking",
    "co-gas-monitoring",
    "power-quality-analyzers",
    "energy-meters",
    "electrical-meters",
    "elnet-billing-software",
    "public-buildings",
    "hospitals",
    "hotels",
    "universities",
    "museums",
    "shopping-malls",
    "industrial-hi-tech",
    "pharmaceutical-clean-rooms",
    "uniart-software",
    "uniweb-software",
    "digipoint-controller",
    "veropoint-controller",
    "superbrain-controller",
    "superbrain-dr-controller",
    "superbrain-fc-controller",
    "elnet-mc-1-meter",
    "elnet-mc-2-meter",
    "elnet-mc-8-meter",
    "elnet-mc-12-meter",
    "elnet-co-transfer-switch",
    "elnet-cod-transfer-switch",
    "elnet-pfc-controller",
    "elnet-ltc-controller",
    "elnet-ltc10-controller",
    "elnet-va-meter",
    "elnet-vip-meter",
    "elnet-pic-meter",
    "elnet-lte-meter",
    "elnet-lt-meter",
    "elnet-ltp-meter",
    "elnet-pq-gr-meter",
    "elnet-xp-controller",
]

CANONICAL_TITLES_EN: dict[str, str] = {
    "about": "About",
    "typical-projects": "Typical Projects",
    "building-automation": "Building Automation",
    "power-meters-control": "Power Meters & Control",
    "products": "Products",
    "contact": "Contact",
    "quality-assurance": "Quality Assurance",
    "product-comparison": "Product Comparison",
    "transfer-switch-drawings": "Transfer Switch Sketches",
    "bms-certifications": "BMS Certifications",
    "elnet-certifications": "ElNet Certifications",
    "plc-ddc-controllers": "PLC & DDC Controllers",
    "parking-control": "Parking Control",
    "plumbing-control": "Plumbing Control",
    "flood-detection-systems": "Flood Detection Systems",
    "flooding-sensor": "Flooding Sensor",
    "bms-scada-software": "BMS / SCADA Software",
    "transfer-switches": "Transfer Switches",
    "power-factor-control": "Power Factor Control",
    "smart-parking": "Smart Parking",
    "co-gas-monitoring": "CO Gas Monitoring",
    "power-quality-analyzers": "Power Quality Analyzers",
    "energy-meters": "Energy Meters",
    "electrical-meters": "Electrical Meters",
    "elnet-billing-software": "ElNet Billing Software",
    "public-buildings": "Public Buildings",
    "hospitals": "Hospitals",
    "hotels": "Hotels",
    "universities": "Universities",
    "museums": "Museums",
    "shopping-malls": "Shopping Malls",
    "industrial-hi-tech": "Industrial & Hi-Tech",
    "pharmaceutical-clean-rooms": "Pharmaceutical & Clean Rooms",
    "uniart-software": "UniArt Software",
    "uniweb-software": "UniWeb Software",
    "digipoint-controller": "DigiPoint Controller",
    "veropoint-controller": "VeroPoint Controller",
    "superbrain-controller": "SuperBrain Controller",
    "superbrain-dr-controller": "SuperBrain DR Controller",
    "superbrain-fc-controller": "SuperBrain FC Controller",
    "elnet-mc-1-meter": "ElNet MC-1 Meter",
    "elnet-mc-2-meter": "ElNet MC-2 Meter",
    "elnet-mc-8-meter": "ElNet MC-8 Meter",
    "elnet-mc-12-meter": "ElNet MC-12 Meter",
    "elnet-co-transfer-switch": "ElNet CO Transfer Switch",
    "elnet-cod-transfer-switch": "ElNet COD Transfer Switch",
    "elnet-pfc-controller": "ElNet PFC Controller",
    "elnet-ltc-controller": "ElNet LTC Controller",
    "elnet-ltc10-controller": "ElNet LTC10 Controller",
    "elnet-va-meter": "ElNet VA Meter",
    "elnet-vip-meter": "ElNet VIP Meter",
    "elnet-pic-meter": "ElNet PIC Meter",
    "elnet-lte-meter": "ElNet LTE Meter",
    "elnet-lt-meter": "ElNet LT Meter",
    "elnet-ltp-meter": "ElNet LTP Meter",
    "elnet-pq-gr-meter": "ElNet PQ/GR Meter",
    "elnet-xp-controller": "ElNet XP Controller",
}

CANONICAL_SLUG_SET = frozenset(CANONICAL_SLUGS)

# Old Wix / Hebrew URL paths -> canonical English slug (for link resolution only)
LEGACY_SLUG_MAP: dict[str, str] = {
    "אודות": "about",
    "הפרוייקטים-שלנו": "typical-projects",
    "בקרת-מבנים-1": "building-automation",
    "מדידות-ובקרת-חשמל": "power-meters-control",
    "תמיכה": "products",
    "צרו-קשר": "contact",
    "copy-of-צרו-קשר": "quote-request",
    "אבטחת-איכות": "quality-assurance",
    "השוואת-מוצרים": "product-comparison",
    "co": "transfer-switch-drawings",
    "בקרים-מתוכנתים-ddc-plc": "plc-ddc-controllers",
    "בקרת-חניונים": "parking-control",
    "בקרת-אינסטלציה": "plumbing-control",
    "מערכות-לאיתור-הצפות": "flood-detection-systems",
    "תוכנות-hmi-bms-scada": "bms-scada-software",
    "בקרי-החלפה": "transfer-switches",
    "בקרה-לשיפור-מקדם-הספק": "power-factor-control",
    "חניה-חכמה": "smart-parking",
    "מערכות-לניטור-ובקרת-גזco": "co-gas-monitoring",
    "מודדים-לאיכות-חשמל": "power-quality-analyzers",
    "מוני-אנרגיה": "energy-meters",
    "מוני-חשמל": "electrical-meters",
    "תוכנת-elnet-חשבונות-ואיכות-חשמל": "elnet-billing-software",
    "מבנים-ציבוריים": "public-buildings",
    "copy-of-public-buildings": "public-buildings",
    "בתי-חולים": "hospitals",
    "copy-of-hospitals": "hospitals",
    "בתי-מלון": "hotels",
    "copy-of-hotels": "hotels",
    "אוניברסיטאות": "universities",
    "copy-of-universities": "universities",
    "מוזיאונים": "museums",
    "copy-of-museums": "museums",
    "קניונים-ומרכזי-מסחר": "shopping-malls",
    "copy-of-shoping-malls": "shopping-malls",
    "מפעלי-תעשייה-והיי-טק": "industrial-hi-tech",
    "copy-of-industrial-factories-and-hi-tech": "industrial-hi-tech",
    "תעשיית-התרופות-וחדרים-נקיים": "pharmaceutical-clean-rooms",
    "copy-of-pharmaceutical-industry-and-c": "pharmaceutical-clean-rooms",
    "תוכנת-uniart-לבקרת-מבנים": "uniart-software",
    "תוכנת-uniweb-לבקרת-מבנים": "uniweb-software",
    "digipoint-בקר-מתוכנת-דיגיטלי": "digipoint-controller",
    "veropoint-בקר-עם-כרטיסי-הרחבה": "veropoint-controller",
    "superbrain-בקר-עם-ספרית-תוכנות": "superbrain-controller",
    "superbrain-dr-בקר-עם-ספרית-תוכנות": "superbrain-dr-controller",
    "superbrain-fc-בקר-ליחידות-מפוח-נחשו": "superbrain-fc-controller",
    "elnet-mc-1-מונה": "elnet-mc-1-meter",
    "elnet-mc-2-מונה-6-2-ערוצים": "elnet-mc-2-meter",
    "elnet-mc-2-מונה-": "elnet-mc-2-meter",
    "elnet-mc-8-מונה-8-24-ערוצים": "elnet-mc-8-meter",
    "elnet-mc-8-מונה": "elnet-mc-8-meter",
    "elnet-mc12-מונה-36-12-ערוצים": "elnet-mc-12-meter",
    "elnet-mc-12-מונה": "elnet-mc-12-meter",
    "elnet-co-בקר-החלפה-ח-ח-גנרטור": "elnet-co-transfer-switch",
    "elnet-co-בקר-החלפה-ח״ח/גנרטור": "elnet-co-transfer-switch",
    "elnet-cod-בקר-החלפה-ח-ח-גנרטור": "elnet-cod-transfer-switch",
    "elnet-cod-בקר-החלפה-ח״ח/-גנרטור": "elnet-cod-transfer-switch",
    "elnet-pfc-בקר-לשיפור-מקדם-הספק": "elnet-pfc-controller",
    "elnet-ltc-בקר-לשיפור-מקדם-הספק": "elnet-ltc-controller",
    "elnet-ltc10-בקר-לשיפור-מקדם-הספק": "elnet-ltc10-controller",
    "elnet-va-מדידות-חשמל-כלליות": "elnet-va-meter",
    "elnet-vip-מדידות-חשמל-כלליות": "elnet-vip-meter",
    "elnet-pic-מונה-תעו-ז": "elnet-pic-meter",
    "elnet-pic-מונה-תעו״ז": "elnet-pic-meter",
    "elnet-lte-אנרגיה-ומדידות-חשמל": "elnet-lte-meter",
    "elnet-lt-תעו-ז-הרמוניות-ועוד": "elnet-lt-meter",
    "elnet-lt-תעו״ז,-הרמוניות": "elnet-lt-meter",
    "elnet-ltp-זרם-זליגה-הרמוניות-ועוד": "elnet-ltp-meter",
    "elnet-pq-gr-הפרעות-ומדידות-חשמל": "elnet-pq-gr-meter",
    "elnet-pq/gr-הפרעות-ומדידות-חשמל": "elnet-pq-gr-meter",
    "elnet-xp-בקר-למשאבות-ניקוד-וביוב": "elnet-xp-controller",
    "elnet-xp-בקר-למשאבות-ניקוז-וביוב": "elnet-xp-controller",
    "co-מערכות-לניטור-ובקרת-גז": "co-gas-monitoring",
}


def to_canonical_slug(raw: str) -> str:
    """Map a legacy or Wix slug to the canonical English URL slug."""
    if not raw:
        return ""
    raw = raw.strip()
    if raw in CANONICAL_SLUG_SET:
        return raw
    return LEGACY_SLUG_MAP.get(raw, raw)


def canonical_slug(slug: str) -> str:
    return to_canonical_slug(slug)


def all_canonical_slugs() -> list[str]:
    return list(CANONICAL_SLUGS)


def resolve_source_file(lang: str, canonical: str, scraped_dir) -> str | None:
    """Return JSON filename stem for a canonical page in a language."""
    if canonical == "":
        return "index" if (scraped_dir / "index.json").exists() else None
    path = scraped_dir / f"{canonical}.json"
    if path.exists():
        return canonical
    return None
