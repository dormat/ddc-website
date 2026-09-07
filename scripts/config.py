"""Site configuration for DDC / Control Applications."""

SITE_CONFIG = {
    "he": {
        "base_url": "https://www.ddc.co.il",
        "sitemap": "he-sitemap.xml",
        "lang": "he",
        "dir": "rtl",
        "brand": 'ישומי בקרה בע"מ',
        "locale_path": "he",
    },
    "en": {
        "base_url": "https://www.elnet-meter.com",
        "sitemap": "en-sitemap.xml",
        "lang": "en",
        "dir": "ltr",
        "brand": "Control Applications",
        "locale_path": "en",
    },
    "es": {
        "base_url": "https://www.elnet-meter.com",
        "sitemap": "es-sitemap.xml",
        "lang": "es",
        "dir": "ltr",
        "brand": "Control Applications",
        "locale_path": "es",
    },
}

HOME_PAGE_TITLE = {
    "he": None,
    "en": (
        "Control Applications - Building automation, electrical network monitoring, "
        "and power & energy metering"
    ),
    "es": (
        "Control Applications - Automatización de edificios, monitoreo de redes eléctricas "
        "y medición de energía"
    ),
}

# Lower homepage image carousel (shared across locales)
HOME_GALLERY_IMAGES = [
    "home-content-6.png",
    "about-us.jpg",
    "home-content-8-2.png",
    "pq-gr.png",
    "building-automation.png",
    "home-content-5-2.jpg",
]

CONTACT = {
    "phone": "+972-3-6474998",
    "fax": "+972-3-6474598",
    "email": "info@ddc.co.il",
    "formsubmit_id": "af7e7b6fe375e0d28a0457f291f95336",
    "address": {
        "he": "רחוב הברזל 25, תל אביב, 6971035, ישראל",
        "en": "Habarzel 25, Tel Aviv, 6971035, Israel",
        "es": "Habarzel 25, Tel Aviv, 6971035, Israel",
    },
    "hours": {
        "he": "ראשון - חמישי, 08:00 - 17:00",
        "en": "Sun - Thu, 08:00 - 17:00",
        "es": "Dom - Jue, 08:00 - 17:00",
    },
}

# Navigation structure (canonical English URL paths, localized labels)
NAV = {
    "he": [
        {"label": "בית", "href": "/he/"},
        {
            "label": "אודות",
            "href": "/he/about/",
        },
        {
            "label": "מערכות בקרה",
            "href": "/he/building-automation/",
            "children": [
                {"label": "בקרים מתוכנתים (DDC + PLC)", "href": "/he/plc-ddc-controllers/"},
                {"label": "בקרת חניונים", "href": "/he/parking-control/"},
                {"label": "בקרת אינסטלציה", "href": "/he/plumbing-control/"},
                {"label": "מערכות לאיתור הצפות", "href": "/he/flood-detection-systems/"},
                {"label": "תוכנות, HMI BMS, SCADA", "href": "/he/bms-scada-software/"},
                {"label": "בקרי החלפה", "href": "/he/transfer-switches/"},
                {"label": "בקרים לשיפור מקדם הספק", "href": "/he/power-factor-control/"},
            ],
        },
        {
            "label": "מערכות חשמל",
            "href": "/he/power-meters-control/",
            "children": [
                {"label": "מודדים לאיכות חשמל", "href": "/he/power-quality-analyzers/"},
                {"label": "מוני אנרגיה", "href": "/he/energy-meters/"},
                {"label": "מוני חשמל", "href": "/he/electrical-meters/"},
                {"label": "בקרי החלפה", "href": "/he/transfer-switches/"},
                {"label": "בקרי החלפה - שרטוטים", "href": "/he/transfer-switch-drawings/"},
                {"label": "בקרים לשיפור מקדם הספק", "href": "/he/power-factor-control/"},
                {"label": "תוכנת Elnet חשבונות ואיכות חשמל", "href": "/he/elnet-billing-software/"},
                {"label": "השוואת מוצרים", "href": "/he/product-comparison/"},
            ],
        },
        {"label": "מוצרים", "href": "/he/products/"},
        {"label": "צרו קשר", "href": "/he/contact/"},
    ],
    "en": [
        {"label": "Home", "href": "/en/"},
        {
            "label": "About",
            "href": "/en/about/",
        },
        {
            "label": "Building Automation",
            "href": "/en/building-automation/",
            "children": [
                {"label": "PLC & DDC controllers", "href": "/en/plc-ddc-controllers/"},
                {"label": "CO System", "href": "/en/parking-control/"},
                {"label": "Flood detecting and control systems", "href": "/en/flood-detection-systems/"},
                {"label": "BMS software packages", "href": "/en/bms-scada-software/"},
                {"label": "Automatic transfer switch controllers", "href": "/en/transfer-switches/"},
                {"label": "Power factor controllers", "href": "/en/power-factor-control/"},
            ],
        },
        {
            "label": "Power meters & control",
            "href": "/en/power-meters-control/",
            "children": [
                {"label": "Power Analyzers", "href": "/en/power-quality-analyzers/"},
                {"label": "Energy Meters", "href": "/en/energy-meters/"},
                {"label": "Electrical meters", "href": "/en/electrical-meters/"},
                {"label": "Automatic transfer switch controllers", "href": "/en/transfer-switches/"},
                {"label": "Transfer switch sketches", "href": "/en/transfer-switch-drawings/"},
                {"label": "Power factor controllers", "href": "/en/power-factor-control/"},
                {"label": "ElNet software packages", "href": "/en/elnet-billing-software/"},
                {"label": "Product comparison", "href": "/en/product-comparison/"},
            ],
        },
        {"label": "Products", "href": "/en/products/"},
        {"label": "Contact", "href": "/en/contact/"},
    ],
    "es": [
        {"label": "Inicio", "href": "/es/"},
        {
            "label": "Nosotros",
            "href": "/es/about/",
        },
        {
            "label": "Automatización de edificios",
            "href": "/es/building-automation/",
            "children": [
                {"label": "Controladores PLC y DDC", "href": "/es/plc-ddc-controllers/"},
                {"label": "Sistema CO", "href": "/es/parking-control/"},
                {"label": "Sistemas de detección y control de inundaciones", "href": "/es/flood-detection-systems/"},
                {"label": "Paquetes de software BMS", "href": "/es/bms-scada-software/"},
                {"label": "Controladores de interruptores de transferencia automática", "href": "/es/transfer-switches/"},
                {"label": "Controladores de factor de potencia", "href": "/es/power-factor-control/"},
            ],
        },
        {
            "label": "Medidores y control eléctrico",
            "href": "/es/power-meters-control/",
            "children": [
                {"label": "Analizadores de energía", "href": "/es/power-quality-analyzers/"},
                {"label": "Medidores de energía", "href": "/es/energy-meters/"},
                {"label": "Medidores eléctricos", "href": "/es/electrical-meters/"},
                {"label": "Controladores de interruptores de transferencia automática", "href": "/es/transfer-switches/"},
                {"label": "Esquemas de interruptores de transferencia", "href": "/es/transfer-switch-drawings/"},
                {"label": "Controladores de factor de potencia", "href": "/es/power-factor-control/"},
                {"label": "Paquetes de software ElNet", "href": "/es/elnet-billing-software/"},
                {"label": "Comparación de productos", "href": "/es/product-comparison/"},
            ],
        },
        {"label": "Productos", "href": "/es/products/"},
        {"label": "Contacto", "href": "/es/contact/"},
    ],
}

# Key template assets (local files under assets/images/)
ASSETS = {
    "logo": "logo.png",
    "favicon": "favicon.png",
    "hero_product": "hero-product.png",
    "hero_bg": "hero-bg.jpg",
    "bullet": "bullet_ball_green_edited.png",
}

SKIP_PATH_PREFIXES = (
    "copy-of-מדידות",
    "copy-of-מערכות",
    "copy-of-elnet",
    "copy-of-בקרי",
    "copy-of-בקרים",
    "account/",
    "search",
)

# Project verticals — image filename fragment -> page slug
PROJECTS = {
    "he": [
        {"slug": "public-buildings", "title": "מבנים ציבוריים", "img": "typical-projects"},
        {"slug": "hospitals", "title": "בתי חולים", "img": "hospitals"},
        {"slug": "hotels", "title": "בתי מלון", "img": "hotels"},
        {"slug": "universities", "title": "אוניברסיטאות", "img": "universities"},
        {"slug": "museums", "title": "מוזיאונים", "img": "museums"},
        {"slug": "shopping-malls", "title": "קניונים ומרכזי מסחר", "img": "shopping-malls"},
        {"slug": "industrial-hi-tech", "title": "מפעלי תעשייה והיי-טק", "img": "industrial"},
        {"slug": "pharmaceutical-clean-rooms", "title": "תעשיית התרופות וחדרים נקיים", "img": "Pharmaceutical"},
    ],
    "en": [
        {"slug": "public-buildings", "title": "Public Buildings", "img": "typical-projects"},
        {"slug": "hospitals", "title": "Hospitals", "img": "hospitals"},
        {"slug": "hotels", "title": "Hotels", "img": "hotels"},
        {"slug": "universities", "title": "Universities", "img": "universities"},
        {"slug": "museums", "title": "Museums", "img": "museums"},
        {"slug": "shopping-malls", "title": "Shopping Malls", "img": "shopping-malls"},
        {"slug": "industrial-hi-tech", "title": "Industrial & Hi-Tech", "img": "industrial"},
        {"slug": "pharmaceutical-clean-rooms", "title": "Pharmaceutical & Clean Rooms", "img": "Pharmaceutical"},
    ],
    "es": [
        {"slug": "public-buildings", "title": "Edificios públicos", "img": "typical-projects"},
        {"slug": "hospitals", "title": "Hospitales", "img": "hospitals"},
        {"slug": "hotels", "title": "Hoteles", "img": "hotels"},
        {"slug": "universities", "title": "Universidades", "img": "universities"},
        {"slug": "museums", "title": "Museos", "img": "museums"},
        {"slug": "shopping-malls", "title": "Centros comerciales", "img": "shopping-malls"},
        {"slug": "industrial-hi-tech", "title": "Industrial y alta tecnología", "img": "industrial"},
        {"slug": "pharmaceutical-clean-rooms", "title": "Farmacéutica y salas limpias", "img": "Pharmaceutical"},
    ],
}

# Hero / card photos for typical-project pages (overrides watermarked Wix images).
PROJECT_IMAGES = {
    "public-buildings": "813b164e6ecd49b0b09f5f9913d34577.jpg",
    "museums": "museums-hero.jpg",
    "hospitals": "hospitals-hero.jpg",
    "hotels": "hotels-hero.jpg",
    "shopping-malls": "shopping-malls-hero.jpg",
    "pharmaceutical-clean-rooms": "pharmaceutical-clean-rooms-hero.jpg",
}

# A short ElNet highlight set for the home product slider.
HOME_FEATURED_PRODUCTS = (
    "elnet-pq-gr-meter",
    "elnet-lt-meter",
    "elnet-mc-8-meter",
    "elnet-lte-meter",
    "elnet-co-transfer-switch",
    "elnet-pfc-controller",
    "elnet-xp-controller",
)

# Short product image labels -> canonical slug (related-product thumbnails)
PRODUCT_CODE_ALIASES = {
    "pq-gr-6": "elnet-pq-gr-meter",
    "pq-gr": "elnet-pq-gr-meter",
    "pq gr": "elnet-pq-gr-meter",
    "pq gr 6": "elnet-pq-gr-meter",
    "lte-3": "elnet-lte-meter",
    "lte": "elnet-lte-meter",
    "lte 3": "elnet-lte-meter",
    "lt-1": "elnet-lt-meter",
    "lt-2": "elnet-lt-meter",
    "lt-3": "elnet-lt-meter",
    "lt-4": "elnet-lt-meter",
    "lt-5": "elnet-lt-meter",
    "lt 1": "elnet-lt-meter",
    "lt 2": "elnet-lt-meter",
    "lt 3": "elnet-lt-meter",
    "lt 4": "elnet-lt-meter",
    "lt 5": "elnet-lt-meter",
    "lt": "elnet-lt-meter",
    "ltp": "elnet-ltp-meter",
    "vip": "elnet-vip-meter",
    "va": "elnet-va-meter",
    "pic": "elnet-pic-meter",
    "mc-1": "elnet-mc-1-meter",
    "mc-2": "elnet-mc-2-meter",
    "mc-8": "elnet-mc-8-meter",
    "mc-12": "elnet-mc-12-meter",
    "pfc": "elnet-pfc-controller",
    "pfc-1": "elnet-pfc-controller",
    "pfc-2": "elnet-pfc-controller",
    "pfc-3": "elnet-pfc-controller",
    "pfc-4": "elnet-pfc-controller",
    "pfc-5": "elnet-pfc-controller",
    "pfc-6": "elnet-pfc-controller",
    "co": "elnet-co-transfer-switch",
    "cod": "elnet-cod-transfer-switch",
    "ltc": "elnet-ltc-controller",
    "ltc10": "elnet-ltc10-controller",
    "uniart": "uniart-software",
    "uniweb": "uniweb-software",
    "digipoint": "digipoint-controller",
    "superbrain": "superbrain-controller",
    "superbrain dr": "superbrain-dr-controller",
    "superbrain fc": "superbrain-fc-controller",
    "veropoint": "veropoint-controller",
}

# Gallery title overrides when products[] is missing
PRODUCT_SLUGS = {
    "he": {
        "UniArt-4W תוכנה לבקרת מבנה": "uniart-software",
        "CO מערכות לניטור ובקרת גז": "co-gas-monitoring",
        "Flooding sensor": "flooding-sensor",
        "ElNet MC-1 מונה": "elnet-mc-1-meter",
        "ElNet MC-8 מונה": "elnet-mc-8-meter",
        "ElNet MC-2 מונה": "elnet-mc-2-meter",
        "ElNet MC-12 מונה": "elnet-mc-12-meter",
        "ElNet PQ/GR הפרעות ומדידות חשמל": "elnet-pq-gr-meter",
        "Elnet xp בקר למשאבות ניקוז וביוב": "elnet-xp-controller",
        "SuperBrain DR בקר עם ספרית תוכנות": "superbrain-dr-controller",
        "SuperBrain DR": "superbrain-dr-controller",
    },
    "en": {
        "ElNet MC-1 counter": "elnet-mc-1-meter",
        "ElNet MC-2 counter": "elnet-mc-2-meter",
        "ElNet MC-8 counter": "elnet-mc-8-meter",
        "ElNet MC-12 counter": "elnet-mc-12-meter",
        "ELNet MC-1/2": "elnet-mc-2-meter",
        "ElNet MC8/12": "elnet-mc-8-meter",
        "BILLING-SOFTWARE": "elnet-billing-software",
        "ELNET PFC": "elnet-pfc-controller",
        "ElNet LTC10": "elnet-ltc10-controller",
        "ElNet LTC": "elnet-ltc-controller",
        "ElNet COD": "elnet-cod-transfer-switch",
        "ElNet CO": "elnet-co-transfer-switch",
        "ElNet VA": "elnet-va-meter",
        "ElNet VIP": "elnet-vip-meter",
        "ElNet PIC": "elnet-pic-meter",
        "ElNet LTE": "elnet-lte-meter",
        "ElNet LT": "elnet-lt-meter",
        "ElNet LTP": "elnet-ltp-meter",
        "ElNet PQ GR": "elnet-pq-gr-meter",
        "UNIART HMI / SCADA SOFTWARE": "uniart-software",
        "UniWeb": "uniweb-software",
        "Elnet xp": "elnet-xp-controller",
        "CO detecting and control systems": "co-gas-monitoring",
        "Flooding sensor": "flooding-sensor",
        "Flood detecting and control systems": "flood-detection-systems",
        "Power factor controllers": "power-factor-control",
        "BMS software packages": "bms-scada-software",
        "CO System": "parking-control",
        "PLC & DDC controllers": "plc-ddc-controllers",
        "Smart parking": "smart-parking",
        "DigiPoint": "digipoint-controller",
        "SuperBrain FC": "superbrain-fc-controller",
        "VeroPoint": "veropoint-controller",
        "SuperBrain": "superbrain-controller",
        "SuperBrain DR": "superbrain-dr-controller",
    },
    "es": {
        "ElNet MC-1 counter": "elnet-mc-1-meter",
        "ElNet MC-2 counter": "elnet-mc-2-meter",
        "ElNet MC-8 counter": "elnet-mc-8-meter",
        "ElNet MC-12 counter": "elnet-mc-12-meter",
        "ELNet MC-1/2": "elnet-mc-2-meter",
        "ElNet MC8/12": "elnet-mc-8-meter",
        "BILLING-SOFTWARE": "elnet-billing-software",
        "ELNET PFC": "elnet-pfc-controller",
        "ElNet LTC10": "elnet-ltc10-controller",
        "ElNet LTC": "elnet-ltc-controller",
        "ElNet COD": "elnet-cod-transfer-switch",
        "ElNet CO": "elnet-co-transfer-switch",
        "ElNet VA": "elnet-va-meter",
        "ElNet VIP": "elnet-vip-meter",
        "ElNet PIC": "elnet-pic-meter",
        "ElNet LTE": "elnet-lte-meter",
        "ElNet LT": "elnet-lt-meter",
        "ElNet LTP": "elnet-ltp-meter",
        "ElNet PQ GR": "elnet-pq-gr-meter",
        "UNIART HMI / SCADA SOFTWARE": "uniart-software",
        "UniWeb": "uniweb-software",
        "Elnet xp": "elnet-xp-controller",
        "CO detecting and control systems": "co-gas-monitoring",
        "Flooding sensor": "flooding-sensor",
        "Flood detecting and control systems": "flood-detection-systems",
        "Power factor controllers": "power-factor-control",
        "BMS software packages": "bms-scada-software",
        "CO System": "parking-control",
        "PLC & DDC controllers": "plc-ddc-controllers",
        "Smart parking": "smart-parking",
        "DigiPoint": "digipoint-controller",
        "SuperBrain FC": "superbrain-fc-controller",
        "VeroPoint": "veropoint-controller",
        "SuperBrain": "superbrain-controller",
        "SuperBrain DR": "superbrain-dr-controller",
    },
}

# English nav-style labels for hub pages shown as related items
HUB_DISPLAY_TITLES = {
    "flood-detection-systems": "Flood detecting and control systems",
    "power-factor-control": "Power factor controllers",
    "bms-scada-software": "BMS software packages",
    "parking-control": "CO System",
    "plc-ddc-controllers": "PLC & DDC controllers",
}

# Hebrew catalog subcategory labels -> English
PRODUCT_SUBCATEGORY_EN = {
    "בקרי החלפה": "Automatic transfer switch controllers",
    "בקרים לשיפור מקדם הספק": "Power factor controllers",
    "בקרים מתוכנתים (DDC+PLC)": "PLC & DDC controllers",
    "בקרת אינסטלציה": "Plumbing Control",
    "בקרת חניונים": "CO System",
    "מודדים לאיכות חשמל": "Power Analyzers",
    "מוני אנרגיה": "Energy Meters",
    "מוני חשמל": "Electrical meters",
    "מערכות לאיתור הצפות": "Flood detecting and control systems",
    "תוכנות HMI SCADA BMS": "BMS software packages",
    "תוכנת Elnet חשבונות ואיכות חשמל": "ElNet software packages",
}

# Catalog page section order (matches power-meters hub, then remaining families).
PRODUCT_SUBCATEGORY_ORDER = (
    "מודדים לאיכות חשמל",
    "מוני אנרגיה",
    "מוני חשמל",
    "בקרי החלפה",
    "בקרים לשיפור מקדם הספק",
    "תוכנת Elnet חשבונות ואיכות חשמל",
    "בקרים מתוכנתים (DDC+PLC)",
    "תוכנות HMI SCADA BMS",
    "בקרת חניונים",
    "מערכות לאיתור הצפות",
    "בקרת אינסטלציה",
)

PRODUCT_SUBCATEGORY_SLUGS = {
    "מודדים לאיכות חשמל": "power-analyzers",
    "מוני אנרגיה": "energy-meters",
    "מוני חשמל": "electrical-meters",
    "בקרי החלפה": "transfer-switch-controllers",
    "בקרים לשיפור מקדם הספק": "power-factor-controllers",
    "תוכנת Elnet חשבונות ואיכות חשמל": "elnet-software",
    "בקרים מתוכנתים (DDC+PLC)": "plc-ddc-controllers",
    "תוכנות HMI SCADA BMS": "bms-software",
    "בקרת חניונים": "co-system",
    "מערכות לאיתור הצפות": "flood-systems",
    "בקרת אינסטלציה": "plumbing-control",
}

PRODUCT_SUBCATEGORY_ES = {
    "בקרי החלפה": "Controladores de interruptores de transferencia automática",
    "בקרים לשיפור מקדם הספק": "Controladores de factor de potencia",
    "בקרים מתוכנתים (DDC+PLC)": "Controladores PLC y DDC",
    "בקרת אינסטלציה": "Control de fontanería",
    "בקרת חניונים": "Sistema CO",
    "מודדים לאיכות חשמל": "Analizadores de energía",
    "מוני אנרגיה": "Medidores de energía",
    "מוני חשמל": "Medidores eléctricos",
    "מערכות לאיתור הצפות": "Sistemas de detección y control de inundaciones",
    "תוכנות HMI SCADA BMS": "Paquetes de software BMS",
    "תוכנת Elnet חשבונות ואיכות חשמל": "Paquetes de software ElNet",
}

# Hub pages that should render as product/category card grids
HUB_PAGES = {
    "he": [
        "building-automation", "power-meters-control",
        "plc-ddc-controllers", "parking-control", "plumbing-control",
        "flood-detection-systems", "bms-scada-software", "transfer-switches",
        "power-factor-control", "power-quality-analyzers", "energy-meters", "electrical-meters",
        "co-gas-monitoring", "smart-parking",
    ],
    "en": [
        "building-automation", "power-meters-control",
        "plc-ddc-controllers", "parking-control", "plumbing-control",
        "flood-detection-systems", "bms-scada-software", "transfer-switches",
        "power-factor-control", "power-quality-analyzers", "energy-meters", "electrical-meters",
        "co-gas-monitoring", "smart-parking",
    ],
    "es": [
        "building-automation", "power-meters-control",
        "plc-ddc-controllers", "parking-control", "plumbing-control",
        "flood-detection-systems", "bms-scada-software", "transfer-switches",
        "power-factor-control", "power-quality-analyzers", "energy-meters", "electrical-meters",
        "co-gas-monitoring", "smart-parking",
    ],
}

# First-class application doors (existing slugs). Product lists are existing catalog items only.
SOLUTION_ORDER = (
    "power-quality-analyzers",
    "energy-meters",
    "building-automation",
    "parking-control",
    "flood-detection-systems",
    "transfer-switches",
    "power-factor-control",
    "plumbing-control",
)

# Home Solutions section: two practices, side by side.
SOLUTION_GROUPS = (
    {
        "id": "building-automation",
        "slugs": (
            "building-automation",
            "parking-control",
            "flood-detection-systems",
            "plumbing-control",
        ),
        "labels": {
            "he": "בקרת מבנים",
            "en": "Building automation",
            "es": "Automatización de edificios",
        },
        "leads": {
            "he": "בקרה, ניטור וניהול של מערכות אלקטרו-מכניות במבנה.",
            "en": "Control, monitoring and management of electromechanical systems in the building.",
            "es": "Control, monitoreo y gestión de sistemas electromecánicos en el edificio.",
        },
    },
    {
        "id": "power-meters",
        "slugs": (
            "power-quality-analyzers",
            "energy-meters",
            "transfer-switches",
            "power-factor-control",
        ),
        "labels": {
            "he": "ניהול אנרגיה",
            "en": "Energy management",
            "es": "Gestión energética",
        },
        "leads": {
            "he": "מדידה, איכות חשמל, החלפת מקורות ושיפור מקדם הספק.",
            "en": "Metering, power quality, source transfer and power factor improvement.",
            "es": "Medición, calidad de energía, transferencia de fuentes y factor de potencia.",
        },
    },
)

# Products catalog: map Hebrew subcategory labels into the two solution practices.
PRODUCT_GROUP_SUBCATEGORIES = {
    "building-automation": (
        "בקרים מתוכנתים (DDC+PLC)",
        "תוכנות HMI SCADA BMS",
        "בקרת חניונים",
        "מערכות לאיתור הצפות",
        "בקרת אינסטלציה",
    ),
    "power-meters": (
        "מודדים לאיכות חשמל",
        "מוני אנרגיה",
        "מוני חשמל",
        "בקרי החלפה",
        "בקרים לשיפור מקדם הספק",
        "תוכנת Elnet חשבונות ואיכות חשמל",
    ),
}

SOLUTION_PRODUCTS = {
    "power-quality-analyzers": (
        "elnet-pq-gr-meter",
        "elnet-lt-meter",
        "elnet-ltp-meter",
        "elnet-billing-software",
    ),
    "energy-meters": (
        "elnet-mc-1-meter",
        "elnet-mc-2-meter",
        "elnet-mc-8-meter",
        "elnet-mc-12-meter",
        "elnet-pic-meter",
        "elnet-lte-meter",
        "elnet-lt-meter",
        "elnet-ltp-meter",
        "elnet-va-meter",
        "elnet-vip-meter",
        "elnet-billing-software",
    ),
    "building-automation": (
        "digipoint-controller",
        "veropoint-controller",
        "superbrain-controller",
        "superbrain-dr-controller",
        "superbrain-fc-controller",
        "uniart-software",
        "uniweb-software",
    ),
    "parking-control": (
        "co-gas-monitoring",
        "smart-parking",
    ),
    "flood-detection-systems": (
        "flooding-sensor",
    ),
    "transfer-switches": (
        "elnet-cod-transfer-switch",
        "elnet-co-transfer-switch",
    ),
    "power-factor-control": (
        "elnet-pfc-controller",
        "elnet-ltc10-controller",
        "elnet-ltc-controller",
    ),
    "plumbing-control": (
        "elnet-xp-controller",
    ),
}

HOME_HERO_IMAGE = "home-hero-abstract.png"

SOLUTION_IMAGES = {
    "power-quality-analyzers": "home-content-5-2.jpg",
    "energy-meters": "energy-meters-content-5-5.jpg",
    "building-automation": "building-automation-content-5-5.jpg",
    "parking-control": "parking-control-content-5-5.jpg",
    "flood-detection-systems": "flood-detection-systems-content-5-5.jpg",
    "transfer-switches": "transfer-switches-content-5-5.jpg",
    "power-factor-control": "3d2098412dbf46189d3998ae4392e5bc.jpg",
    "plumbing-control": "plumbing-control-content-5-5.jpg",
}

SOLUTION_LABELS = {
    "he": {
        "power-quality-analyzers": "איכות חשמל",
        "energy-meters": "ניהול אנרגיה",
        "building-automation": "בקרת מבנים / BMS",
        "parking-control": "בקרת חניונים",
        "flood-detection-systems": "מערכות לאיתור הצפות",
        "transfer-switches": "בקרי החלפה",
        "power-factor-control": "מקדם הספק",
        "plumbing-control": "בקרת אינסטלציה",
    },
    "en": {
        "power-quality-analyzers": "Power quality",
        "energy-meters": "Energy management",
        "building-automation": "Building automation / BMS",
        "parking-control": "Parking / CO",
        "flood-detection-systems": "Flood detection",
        "transfer-switches": "Generator / transfer switching",
        "power-factor-control": "Power factor",
        "plumbing-control": "Plumbing / drainage pumps",
    },
    "es": {
        "power-quality-analyzers": "Calidad de energía",
        "energy-meters": "Gestión de energía",
        "building-automation": "Automatización de edificios / BMS",
        "parking-control": "Estacionamiento / CO",
        "flood-detection-systems": "Detección de inundaciones",
        "transfer-switches": "Transferencia / generador",
        "power-factor-control": "Factor de potencia",
        "plumbing-control": "Fontanería / bombas de drenaje",
    },
}

# Framing built from existing slideshow / about / hub copy, tightened for the page.
SOLUTION_FRAMING = {
    "he": {
        "power-quality-analyzers": (
            "מנטרת ומבקרת את רשת החשמל שלך. מערכת אלנט לבקרת איכות החשמל מבוססת על חומרה אמינה ומדויקת וממשק ידידותי, "
            "ומפיקה דוחות ותקצירי מנהלים בהתאם לתקן EN50160 לרבות דוח אירועי חשמל מקיף ומדויק."
        ),
        "energy-meters": (
            "ניהול צריכת האנרגיה למינימום הנדרש מתחיל במדידה. מודעות לכמות האנרגיה הנצרכת היא הדרך היעילה להפחתת צריכה "
            "ולהפקת חשבונות צריכת חשמל ומיזוג אוויר."
        ),
        "building-automation": (
            "בקרת מבנים ומערכות אנרגיה — המפתח לבניין יעיל. שליטה, מדידה ובקרה על מיזוג אוויר, חשמל ושאר המערכות "
            "האלקטרו-מכניות, עם תוכנת BMS מבוססת TCP/IP ו-Web SCADA."
        ),
        "parking-control": (
            "ניטור גז CO במפלסי חניה ושליטה בתפוסת חניה חכמה — זיהוי מקום פנוי או תפוס והצגת סיגנל ירוק, אדום או כחול."
        ),
        "flood-detection-systems": (
            "מערכות לאיתור הצפות והחיישן המחובר אליהן — לזיהוי מים במבנה לפני שנגרם נזק למערכות האלקטרו-מכניות."
        ),
        "transfer-switches": (
            "בקרי החלפה חברת חשמל / גנרטור לשמירה על רציפות אספקת החשמל במעבר בין הרשת לגנרטור."
        ),
        "power-factor-control": (
            "חיסכון באנרגיה ושמירה על הסביבה באמצעות בקרים לשיפור מקדם הספק — ElNet PFC, LTC ו-LTC10."
        ),
        "plumbing-control": (
            "בקרה אוטומטית על מפלס מי גשם או ביוב והחלפה בין משאבות ניקוז, כולל הכנסת משאבה נוספת לחיזוק בעת הצורך."
        ),
    },
    "en": {
        "power-quality-analyzers": (
            "Monitor your electrical network. The ElNet power quality system is built on accurate, reliable hardware "
            "and an EN50160 reports generator and events recorder."
        ),
        "energy-meters": (
            "An energy management system starts by measuring consumption and keeping it to the minimum needed. "
            "Awareness of how much energy you use is how you lower cost and produce electricity and HVAC consumption bills."
        ),
        "building-automation": (
            "Building automation and BMS: control, measurement and monitoring of air conditioning, electrical and "
            "electromechanical systems. UniArt / UniWeb is a distributed TCP/IP and Web SCADA platform for saving "
            "energy in public buildings and industry."
        ),
        "parking-control": (
            "CO gas monitoring in parking levels, and smart parking occupancy control that shows whether a space "
            "is free or taken."
        ),
        "flood-detection-systems": (
            "Flood detecting and control systems, including the flooding sensor, for finding water in the building "
            "before it damages electromechanical systems."
        ),
        "transfer-switches": (
            "Automatic transfer switch controllers for utility / generator changeover, to keep electrical supply continuous."
        ),
        "power-factor-control": (
            "Save energy and protect the environment with power factor improvement controllers — ElNet PFC, LTC and LTC10."
        ),
        "plumbing-control": (
            "Automatic rainwater or sewage level control for drainage pumps, including changeover between pumps "
            "and bringing a standby pump in when extra capacity is needed."
        ),
    },
    "es": {
        "power-quality-analyzers": (
            "Monitoree su red eléctrica. El sistema de calidad de energía ElNet se basa en hardware preciso y confiable "
            "y en un generador de informes EN50160 y un registrador de eventos."
        ),
        "energy-meters": (
            "La gestión de energía empieza por medir el consumo y dejarlo en el mínimo necesario. Saber cuánta energía "
            "se usa permite reducir el costo y generar facturas de electricidad y climatización."
        ),
        "building-automation": (
            "Automatización de edificios y BMS: control y medición de aire acondicionado, electricidad y sistemas "
            "electromecánicos. UniArt / UniWeb es una plataforma TCP/IP y Web SCADA para ahorro de energía "
            "en edificios públicos e industria."
        ),
        "parking-control": (
            "Monitoreo de gas CO en niveles de estacionamiento y control de ocupación que indica si una plaza "
            "está libre o ocupada."
        ),
        "flood-detection-systems": (
            "Sistemas de detección y control de inundaciones, incluido el sensor de inundación, para detectar agua "
            "en el edificio antes de que dañe los sistemas electromecánicos."
        ),
        "transfer-switches": (
            "Controladores de transferencia automática red / generador, para mantener el suministro eléctrico continuo."
        ),
        "power-factor-control": (
            "Ahorre energía y proteja el medio ambiente con controladores de factor de potencia — ElNet PFC, LTC y LTC10."
        ),
        "plumbing-control": (
            "Control automático del nivel de agua de lluvia o residuales para bombas de drenaje, con conmutación "
            "entre bombas y refuerzo de una bomba en espera cuando hace falta."
        ),
    },
}

INDUSTRY_FRAMING = {
    "he": (
        "מוצרי החברה מודדים, מנטרים ומנהלים רשתות חשמל ומערכות אלקטרו-מכניות. "
        "הם פועלים בתעשייה, במבנים ציבוריים, בתי מלון, בתי חולים, אוניברסיטאות, מרכזי קניות וקניונים."
    ),
    "en": (
        "Control Applications measures, monitors and controls electrical networks, air conditioning and the "
        "electromechanical systems installed in public buildings. The products are intended for use in industry, "
        "public buildings, hotels, hospitals, universities, shopping centres and more."
    ),
    "es": (
        "Control Applications mide, monitorea y controla redes eléctricas, climatización y los sistemas "
        "electromecánicos de edificios públicos. Los productos se destinan a industria, edificios públicos, "
        "hoteles, hospitales, universidades, centros comerciales y más."
    ),
}

# Per-industry offer copy for the combined Industries page.
INDUSTRY_OFFERS = {
    "he": {
        "public-buildings": (
            "אנו מספקים בקרת מבנים (BMS), מדידת חשמל ואיכות חשמל, בקרת מקדם הספק והחלפת מקורות, "
            "וכן ניטור חניונים, איתור הצפות ובקרת משאבות ניקוז — לניהול אמין של מערכות אלקטרו-מכניות במבני ציבור."
        ),
        "hospitals": (
            "לבתי חולים אנו מציעים בקרת מבנים רציפה, ניטור רשת החשמל ואיכות החשמל, מעבר אוטומטי לרשת/גנרטור, "
            "ובקרה על מיזוג, תאורה ומערכות אלקטרו-מכניות קריטיות — לשמירה על זמינות ובטיחות במתקן הרפואי."
        ),
        "hotels": (
            "במלונות אנו מתקינים בקרת מבנים וחדרים, ניהול אנרגיה ומיזוג, בקרת חניונים וגז CO, "
            "איתור הצפות ובקרת משאבות — להפחתת צריכה ולחוויית אורח יציבה."
        ),
        "universities": (
            "בקמפוסים אנו מספקים BMS מבוזר, מדידת אנרגיה וחשבונות צריכה, ניטור איכות חשמל, "
            "בקרת חניונים והגנה מפני הצפות — לניהול מרכזי של מבנים ומעבדות רבים."
        ),
        "museums": (
            "במוזיאונים אנו מתמקדים בבקרת אקלים וסביבה, ניטור חשמל רציף, "
            "התראה מוקדמת על הצפות ובקרת מערכות אלקטרו-מכניות — להגנה על אוספים ועל תנאי התצוגה."
        ),
        "shopping-malls": (
            "בקניונים ומרכזי מסחר אנו מספקים בקרת מבנים, ניהול אנרגיה, ניטור חניונים וגז CO, "
            "בקרת מקדם הספק והחלפת מקורות — להפעלה יעילה של שטחים גדולים וצריכה משתנה."
        ),
        "industrial-hi-tech": (
            "בתעשייה ובהיי-טק אנו מציעים מדידת אנרגיה ואיכות חשמל, בקרת מקדם הספק, "
            "החלפת מקורות, BMS ובקרת משאבות — לשיפור יעילות, רציפות ייצור והגנה על ציוד רגיש."
        ),
        "pharmaceutical-clean-rooms": (
            "בתעשיית התרופות ובחדרים נקיים אנו מספקים בקרה מדויקת על מערכות סביבה ומיזוג, "
            "ניטור חשמל רציף, הגנה מפני הפסקות באמצעות החלפת מקורות, ואיתור הצפות — לעמידה בדרישות תהליך ואיכות."
        ),
    },
    "en": {
        "public-buildings": (
            "We deliver building automation (BMS), electrical metering and power quality monitoring, "
            "power-factor and transfer-switch control, plus parking/CO monitoring, flood detection and drainage-pump control — "
            "so electromechanical systems in public buildings stay reliable and efficient."
        ),
        "hospitals": (
            "For hospitals we provide continuous building automation, electrical-network and power-quality monitoring, "
            "automatic utility/generator transfer, and control of HVAC and other critical electromechanical systems — "
            "supporting availability and safety across the medical campus."
        ),
        "hotels": (
            "In hotels we install building and room automation, energy and HVAC management, parking and CO control, "
            "flood detection and pump control — reducing consumption while keeping guest comfort stable."
        ),
        "universities": (
            "On campuses we supply distributed BMS, energy metering and billing, power-quality monitoring, "
            "parking control and flood protection — so many buildings and labs can be managed from one platform."
        ),
        "museums": (
            "In museums we focus on climate and environment control, continuous electrical monitoring, "
            "early flood alerts and electromechanical system supervision — protecting collections and exhibition conditions."
        ),
        "shopping-malls": (
            "For malls and retail centres we provide building automation, energy management, parking and CO monitoring, "
            "power-factor improvement and source transfer — efficient operation for large footprints and variable loads."
        ),
        "industrial-hi-tech": (
            "In industry and hi-tech facilities we offer energy and power-quality metering, power-factor control, "
            "source transfer, BMS and pump control — improving efficiency, uptime and protection for sensitive equipment."
        ),
        "pharmaceutical-clean-rooms": (
            "For pharmaceutical plants and clean rooms we deliver precise environmental and HVAC control, "
            "continuous electrical monitoring, transfer switching for supply continuity, and flood detection — "
            "supporting process reliability and quality requirements."
        ),
    },
    "es": {
        "public-buildings": (
            "Ofrecemos automatización de edificios (BMS), medición eléctrica y calidad de energía, "
            "control de factor de potencia y transferencia de fuentes, además de monitoreo de estacionamiento/CO, "
            "detección de inundaciones y control de bombas — para sistemas electromecánicos fiables en edificios públicos."
        ),
        "hospitals": (
            "En hospitales proporcionamos automatización continua, monitoreo de la red y la calidad eléctrica, "
            "transferencia automática red/generador y control de HVAC y sistemas críticos — "
            "para disponibilidad y seguridad en el campus médico."
        ),
        "hotels": (
            "En hoteles instalamos automatización de edificios y habitaciones, gestión de energía y climatización, "
            "control de estacionamiento y CO, detección de inundaciones y control de bombas — "
            "reduciendo consumo y manteniendo el confort del huésped."
        ),
        "universities": (
            "En campus universitarios entregamos BMS distribuido, medición y facturación de energía, "
            "monitoreo de calidad eléctrica, control de estacionamiento y protección contra inundaciones — "
            "para gestionar muchos edificios y laboratorios desde una plataforma."
        ),
        "museums": (
            "En museos nos enfocamos en control climático y ambiental, monitoreo eléctrico continuo, "
            "alertas tempranas de inundación y supervisión electromecánica — protegiendo colecciones y condiciones de exhibición."
        ),
        "shopping-malls": (
            "En centros comerciales ofrecemos automatización de edificios, gestión energética, monitoreo de estacionamiento y CO, "
            "mejora del factor de potencia y transferencia de fuentes — operación eficiente en grandes superficies y cargas variables."
        ),
        "industrial-hi-tech": (
            "En industria y alta tecnología ofrecemos medición de energía y calidad eléctrica, control de factor de potencia, "
            "transferencia de fuentes, BMS y control de bombas — mejorando eficiencia, continuidad y protección del equipo sensible."
        ),
        "pharmaceutical-clean-rooms": (
            "En plantas farmacéuticas y salas limpias entregamos control preciso de ambiente y HVAC, "
            "monitoreo eléctrico continuo, transferencia de fuentes para continuidad del suministro y detección de inundaciones — "
            "apoyando la fiabilidad del proceso y los requisitos de calidad."
        ),
    },
}

USE_CASE_PATTERNS = {
    "he": {
        "hotels": (r"מלון", r"מלונות"),
        "hospitals": (r"בית חולים", r"בתי חולים", r"בתי-חולים"),
        "universities": (r"אוניברסיט",),
        "museums": (r"מוזיאון", r"מוזיאונים", r"מוזאונים"),
        "shopping-malls": (r"קניון", r"מרכזי קניות", r"מרכזי מסחר"),
        "public-buildings": (r"מבני ציבור", r"מבנה ציבור", r"בנייני ציבור", r"מבנים ציבוריים"),
        "industrial-hi-tech": (r"תעשייה", r"מפעל", r"היי-טק", r"הייטק"),
        "pharmaceutical-clean-rooms": (r"תרופות", r"חדרים נקיים", r"חדר נקי", r"תעשייה נקייה"),
    },
    "en": {
        "hotels": (r"hotel",),
        "hospitals": (r"hospital",),
        "universities": (r"universit", r"college", r"collage"),
        "museums": (r"museum",),
        "shopping-malls": (r"mall", r"shopping"),
        "public-buildings": (r"public building", r"office building", r"public and industrial"),
        "industrial-hi-tech": (r"industrial", r"industry", r"hi-?tech", r"factory"),
        "pharmaceutical-clean-rooms": (r"pharmaceutical", r"clean room", r"clean industry"),
    },
    "es": {
        "hotels": (r"hotel",),
        "hospitals": (r"hospital",),
        "universities": (r"universit", r"college", r"collage"),
        "museums": (r"museo", r"museum"),
        "shopping-malls": (r"centro(?:s)? comercial", r"mall", r"shopping"),
        "public-buildings": (r"edificio(?:s)? p[uú]blic", r"public building", r"office building"),
        "industrial-hi-tech": (r"industrial", r"industria", r"hi-?tech", r"f[aá]brica", r"factory"),
        "pharmaceutical-clean-rooms": (
            r"farmac[eé]utic", r"sala(?:s)? limpia", r"industria(?:s)? limpia",
            r"pharmaceutical", r"clean room", r"clean industry",
        ),
    },
}
