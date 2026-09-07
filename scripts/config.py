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
    "email": "cal@ddc.co.il",
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

# First-class application doors (existing slugs). Five doors fold the old eight hubs
# where the job is the same. Product lists are existing catalog items only.
SOLUTION_ORDER = (
    "power-quality-analyzers",  # Energy and power quality (absorbs energy-meters)
    "building-automation",
    "parking-control",
    "transfer-switches",  # Generator transfer and power factor
    "flood-detection-systems",  # Water in the building (absorbs plumbing-control)
)

SOLUTION_PRODUCTS = {
    "power-quality-analyzers": (
        "elnet-pq-gr-meter",
        "elnet-lt-meter",
        "elnet-ltp-meter",
        "elnet-mc-1-meter",
        "elnet-mc-2-meter",
        "elnet-mc-8-meter",
        "elnet-mc-12-meter",
        "elnet-pic-meter",
        "elnet-lte-meter",
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
    "transfer-switches": (
        "elnet-cod-transfer-switch",
        "elnet-co-transfer-switch",
        "elnet-pfc-controller",
        "elnet-ltc10-controller",
        "elnet-ltc-controller",
    ),
    "flood-detection-systems": (
        "flooding-sensor",
        "elnet-xp-controller",
    ),
}

HOME_HERO_IMAGE = "home-hero-abstract.png"

SOLUTION_IMAGES = {
    "power-quality-analyzers": "home-content-5-2.jpg",
    "building-automation": "building-automation-content-5-5.jpg",
    "parking-control": "parking-control-content-5-5.jpg",
    "transfer-switches": "transfer-switches-content-5-5.jpg",
    "flood-detection-systems": "flood-detection-systems-content-5-5.jpg",
}

SOLUTION_LABELS = {
    "he": {
        "power-quality-analyzers": "אנרגיה ואיכות חשמל",
        "building-automation": "בקרת מבנים / BMS",
        "parking-control": "בקרת חניונים / CO",
        "transfer-switches": "החלפת גנרטור ומקדם הספק",
        "flood-detection-systems": "מים במבנה",
    },
    "en": {
        "power-quality-analyzers": "Energy and power quality",
        "building-automation": "Building automation / BMS",
        "parking-control": "Parking / CO",
        "transfer-switches": "Generator transfer and power factor",
        "flood-detection-systems": "Water in the building",
    },
    "es": {
        "power-quality-analyzers": "Energía y calidad de energía",
        "building-automation": "Automatización de edificios / BMS",
        "parking-control": "Estacionamiento / CO",
        "transfer-switches": "Transferencia de generador y factor de potencia",
        "flood-detection-systems": "Agua en el edificio",
    },
}

# Framing built from existing slideshow / about / hub copy, tightened for the page.
SOLUTION_FRAMING = {
    "he": {
        "power-quality-analyzers": (
            "מדידת צריכה ובקרת איכות החשמל באותה דלת. מערכת אלנט מנטרת את הרשת לפי EN50160, "
            "מפיקה דוחות ואירועים, ומאפשרת ניהול אנרגיה והפקת חשבונות צריכה."
        ),
        "building-automation": (
            "בקרת מבנים ומערכות אנרגיה — המפתח לבניין יעיל. שליטה, מדידה ובקרה על מיזוג אוויר, חשמל ושאר המערכות "
            "האלקטרו-מכניות, עם תוכנת BMS מבוססת TCP/IP ו-Web SCADA."
        ),
        "parking-control": (
            "ניטור גז CO במפלסי חניה ושליטה בתפוסת חניה חכמה — זיהוי מקום פנוי או תפוס והצגת סיגנל ירוק, אדום או כחול."
        ),
        "transfer-switches": (
            "רציפות אספקה וחיסכון באנרגיה: בקרי החלפה חברת חשמל / גנרטור, ובקרים לשיפור מקדם הספק — ElNet PFC, LTC ו-LTC10."
        ),
        "flood-detection-systems": (
            "מים במבנה — איתור הצפות לפני נזק למערכות האלקטרו-מכניות, ובקרת מפלס למשאבות ניקוז מי גשם או ביוב."
        ),
    },
    "en": {
        "power-quality-analyzers": (
            "Measure consumption and watch power quality in one place. ElNet monitors the network to EN50160, "
            "records events, and supports energy management and consumption billing."
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
        "transfer-switches": (
            "Keep supply continuous and improve efficiency: utility / generator transfer switch controllers, "
            "plus power factor improvement with ElNet PFC, LTC and LTC10."
        ),
        "flood-detection-systems": (
            "Water in the building — flood detection before electromechanical damage, and automatic rainwater "
            "or sewage level control for drainage pumps."
        ),
    },
    "es": {
        "power-quality-analyzers": (
            "Mida el consumo y vigile la calidad de energía en un solo lugar. ElNet monitorea la red según EN50160, "
            "registra eventos y apoya la gestión energética y la facturación del consumo."
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
        "transfer-switches": (
            "Mantenga el suministro continuo y mejore la eficiencia: controladores de transferencia red / generador "
            "y mejora del factor de potencia con ElNet PFC, LTC y LTC10."
        ),
        "flood-detection-systems": (
            "Agua en el edificio: detección de inundaciones antes del daño electromecánico, y control automático "
            "del nivel de lluvia o residuales para bombas de drenaje."
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
