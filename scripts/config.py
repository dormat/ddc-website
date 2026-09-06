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

SOLUTION_IMAGES = {
    "power-quality-analyzers": "pq-gr.png",
    "energy-meters": "power-meters-control-content-8-3.png",
    "building-automation": "building-automation.png",
    "parking-control": "building-automation-content-10-3.png",
    "flood-detection-systems": "sensor-de-inundaci-n.png",
    "transfer-switches": "building-automation-content-15-4.png",
    "power-factor-control": "building-automation-content-17-6.png",
    "plumbing-control": "elnet-xp-controller-content-5-5.png",
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
            "בקרת חניונים: ניטור גז CO במפלסי חניה, ושליטה בתפוסת חניה חכמה — המערכות המופיעות בקטלוג בקרת החניונים."
        ),
        "flood-detection-systems": (
            "מערכות לאיתור הצפות והחיישן המחובר אליהן — לזיהוי מים במבנה לפני שנגרם נזק למערכות האלקטרו-מכניות."
        ),
        "transfer-switches": (
            "בקרי החלפה חברת חשמל / גנרטור לשמירה על רציפות אספקה — אותם בקרי ElNet CO ו-COD שמופיעים בקטלוג."
        ),
        "power-factor-control": (
            "חיסכון באנרגיה ושמירה על הסביבה באמצעות בקרים לשיפור מקדם הספק — ElNet PFC, LTC ו-LTC10."
        ),
        "plumbing-control": (
            "בקר למשאבות ניקוז וביוב: בקרה אוטומטית על מפלס מי גשם או ביוב והחלפה בין משאבות, כפי שמתואר במוצר Elnet XP."
        ),
    },
    "en": {
        "power-quality-analyzers": (
            "Monitor your electrical network. The ElNet power quality system is built on accurate, reliable hardware "
            "and an EN50160 reports generator and events recorder — the same capability already described for ElNet power quality."
        ),
        "energy-meters": (
            "An energy management system starts by measuring consumption and keeping it to the minimum needed. "
            "Awareness of how much energy you use is how you lower cost and produce electricity and HVAC consumption bills."
        ),
        "building-automation": (
            "Building automation and BMS: control, measurement and monitoring of air conditioning, electrical and "
            "electromechanical systems. UniArt / UniWeb BMS is the distributed TCP/IP and Web SCADA platform already "
            "described for saving energy in public buildings and industry."
        ),
        "parking-control": (
            "Parking lot control: CO gas monitoring in parking levels, and smart parking occupancy — the systems "
            "already listed under parking control."
        ),
        "flood-detection-systems": (
            "Flood detecting and control systems, including the flooding sensor, for finding water in the building "
            "before it damages electromechanical systems."
        ),
        "transfer-switches": (
            "Automatic transfer switch controllers for utility / generator changeover — the ElNet CO and COD controllers "
            "already in the catalog."
        ),
        "power-factor-control": (
            "Save energy and protect the environment with power factor improvement controllers — ElNet PFC, LTC and LTC10."
        ),
        "plumbing-control": (
            "Plumbing control for drainage and sewage pumps: automatic level control and pump changeover, as already "
            "described for the Elnet XP controller."
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
            "electromecánicos. UniArt / UniWeb es la plataforma TCP/IP y Web SCADA ya descrita para ahorro de energía "
            "en edificios públicos e industria."
        ),
        "parking-control": (
            "Control de estacionamientos: monitoreo de gas CO y estacionamiento inteligente, los sistemas ya listados "
            "en control de estacionamientos."
        ),
        "flood-detection-systems": (
            "Sistemas de detección y control de inundaciones, incluido el sensor de inundación, para detectar agua "
            "en el edificio antes de que dañe los sistemas electromecánicos."
        ),
        "transfer-switches": (
            "Controladores de transferencia automática red / generador — los controladores ElNet CO y COD del catálogo."
        ),
        "power-factor-control": (
            "Ahorre energía y proteja el medio ambiente con controladores de factor de potencia — ElNet PFC, LTC y LTC10."
        ),
        "plumbing-control": (
            "Control de fontanería para bombas de drenaje y aguas residuales: control automático de nivel y conmutación "
            "de bombas, como ya se describe en el controlador Elnet XP."
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
