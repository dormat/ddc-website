export type Lang = "he" | "en" | "es";

export const LANGS: Lang[] = ["he", "en", "es"];

export function isLang(value: string): value is Lang {
  return LANGS.includes(value as Lang);
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "he" ? "rtl" : "ltr";
}

export const UI = {
  he: {
    home: "בית",
    solutions: "פתרונות",
    products: "מוצרים",
    industries: "תעשיות",
    about: "אודות",
    contact: "צור קשר",
    learnMore: "למידע נוסף",
    established: "הוקמה בשנת 1992",
    phone: "טלפון",
    email: "דוא״ל",
    company: "החברה",
    clients: "לקוחות",
    relatedProducts: "מוצרים קשורים",
  },
  en: {
    home: "Home",
    solutions: "Solutions",
    products: "Products",
    industries: "Industries",
    about: "About",
    contact: "Contact",
    learnMore: "More information",
    established: "Established 1992",
    phone: "Phone",
    email: "Email",
    company: "Company",
    clients: "Clients",
    relatedProducts: "Related products",
  },
  es: {
    home: "Inicio",
    solutions: "Soluciones",
    products: "Productos",
    industries: "Industrias",
    about: "Nosotros",
    contact: "Contacto",
    learnMore: "Más información",
    established: "Fundada en 1992",
    phone: "Teléfono",
    email: "Correo",
    company: "Empresa",
    clients: "Clientes",
    relatedProducts: "Productos relacionados",
  },
} as const;

export const GROUP_META: Record<
  string,
  { labels: Record<Lang, string>; leads: Record<Lang, string> }
> = {
  "building-automation": {
    labels: {
      he: "בקרת מבנים",
      en: "Building automation",
      es: "Automatización de edificios",
    },
    leads: {
      he: "בקרה, ניטור וניהול של מערכות אלקטרו-מכניות במבנה.",
      en: "Control, monitoring and management of electromechanical systems in the building.",
      es: "Control, monitoreo y gestión de sistemas electromecánicos en el edificio.",
    },
  },
  "power-meters": {
    labels: {
      he: "ניהול אנרגיה",
      en: "Energy management",
      es: "Gestión energética",
    },
    leads: {
      he: "מדידה, איכות חשמל, החלפת מקורות ושיפור מקדם הספק.",
      en: "Metering, power quality, source transfer and power factor improvement.",
      es: "Medición, calidad de energía, transferencia de fuentes y factor de potencia.",
    },
  },
};

export const GROUP_ORDER = ["building-automation", "power-meters"] as const;

export const HERO_COPY: Record<
  Lang,
  { title: string; subtitle: string; desc: string }
> = {
  he: {
    title: "ישומי בקרה",
    subtitle: "בקרת מבנים, מדידת חשמל ומערכות בקרה למבנים, אנרגיה ותעשייה.",
    desc: "החברה המובילה בישראל — איכות ויעילות המוכרות על ידי לקוחות ברחבי העולם.",
  },
  en: {
    title: "Control Applications",
    subtitle: "Building automation, power metering, and control systems for buildings, energy and industry.",
    desc: "The leading company in Israel — product quality and efficiency recognized by customers worldwide.",
  },
  es: {
    title: "Control Applications",
    subtitle: "Automatización de edificios, medición de energía y sistemas de control.",
    desc: "La empresa líder en Israel — calidad y eficiencia reconocidas por clientes en todo el mundo.",
  },
};
