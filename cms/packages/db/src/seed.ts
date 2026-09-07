import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createDb, closeDb } from "./client";
import { migrate } from "./migrate";
import {
  industries,
  industryTranslations,
  pages,
  pageTranslations,
  productIndustries,
  productMedia,
  products,
  productSolutions,
  productTranslations,
  settings,
  solutions,
  solutionTranslations,
} from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const CONTENT = path.join(REPO_ROOT, "content");
const LANGS = ["he", "en", "es"] as const;

const SOLUTION_ORDER = [
  "power-quality-analyzers",
  "energy-meters",
  "building-automation",
  "parking-control",
  "flood-detection-systems",
  "transfer-switches",
  "power-factor-control",
  "plumbing-control",
] as const;

const SOLUTION_GROUPS: Record<string, string> = {
  "building-automation": "building-automation",
  "parking-control": "building-automation",
  "flood-detection-systems": "building-automation",
  "plumbing-control": "building-automation",
  "power-quality-analyzers": "power-meters",
  "energy-meters": "power-meters",
  "transfer-switches": "power-meters",
  "power-factor-control": "power-meters",
};

const SOLUTION_PRODUCTS: Record<string, string[]> = {
  "power-quality-analyzers": [
    "elnet-pq-gr-meter",
    "elnet-lt-meter",
    "elnet-ltp-meter",
    "elnet-billing-software",
  ],
  "energy-meters": [
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
  ],
  "building-automation": [
    "digipoint-controller",
    "veropoint-controller",
    "superbrain-controller",
    "superbrain-dr-controller",
    "superbrain-fc-controller",
    "uniart-software",
    "uniweb-software",
  ],
  "parking-control": ["co-gas-monitoring", "smart-parking"],
  "flood-detection-systems": ["flooding-sensor"],
  "transfer-switches": ["elnet-cod-transfer-switch", "elnet-co-transfer-switch"],
  "power-factor-control": ["elnet-pfc-controller", "elnet-ltc10-controller", "elnet-ltc-controller"],
  "plumbing-control": ["elnet-xp-controller"],
};

const SOLUTION_LABELS: Record<string, Record<string, string>> = {
  he: {
    "power-quality-analyzers": "איכות חשמל",
    "energy-meters": "ניהול אנרגיה",
    "building-automation": "בקרת מבנים / BMS",
    "parking-control": "בקרת חניונים",
    "flood-detection-systems": "מערכות לאיתור הצפות",
    "transfer-switches": "בקרי החלפה",
    "power-factor-control": "מקדם הספק",
    "plumbing-control": "בקרת אינסטלציה",
  },
  en: {
    "power-quality-analyzers": "Power quality",
    "energy-meters": "Energy management",
    "building-automation": "Building automation / BMS",
    "parking-control": "Parking / CO",
    "flood-detection-systems": "Flood detection",
    "transfer-switches": "Generator / transfer switching",
    "power-factor-control": "Power factor",
    "plumbing-control": "Plumbing / drainage pumps",
  },
  es: {
    "power-quality-analyzers": "Calidad de energía",
    "energy-meters": "Gestión de energía",
    "building-automation": "Automatización de edificios / BMS",
    "parking-control": "Estacionamiento / CO",
    "flood-detection-systems": "Detección de inundaciones",
    "transfer-switches": "Transferencia / generador",
    "power-factor-control": "Factor de potencia",
    "plumbing-control": "Fontanería / bombas de drenaje",
  },
};

const SOLUTION_IMAGES: Record<string, string> = {
  "power-quality-analyzers": "/assets/images/home-content-5-2.jpg",
  "energy-meters": "/assets/images/energy-meters-content-5-5.jpg",
  "building-automation": "/assets/images/building-automation-content-5-5.jpg",
  "parking-control": "/assets/images/parking-control-content-5-5.jpg",
  "flood-detection-systems": "/assets/images/flood-detection-systems-content-5-5.jpg",
  "transfer-switches": "/assets/images/transfer-switches-content-5-5.jpg",
  "power-factor-control": "/assets/images/3d2098412dbf46189d3998ae4392e5bc.jpg",
  "plumbing-control": "/assets/images/plumbing-control-content-5-5.jpg",
};

const INDUSTRY_SLUGS = [
  "public-buildings",
  "hospitals",
  "hotels",
  "universities",
  "museums",
  "shopping-malls",
  "industrial-hi-tech",
  "pharmaceutical-clean-rooms",
] as const;

const INDUSTRY_TITLES: Record<string, Record<string, string>> = {
  he: {
    "public-buildings": "מבנים ציבוריים",
    hospitals: "בתי חולים",
    hotels: "בתי מלון",
    universities: "אוניברסיטאות",
    museums: "מוזיאונים",
    "shopping-malls": "קניונים ומרכזי מסחר",
    "industrial-hi-tech": "מפעלי תעשייה והיי-טק",
    "pharmaceutical-clean-rooms": "תעשיית התרופות וחדרים נקיים",
  },
  en: {
    "public-buildings": "Public Buildings",
    hospitals: "Hospitals",
    hotels: "Hotels",
    universities: "Universities",
    museums: "Museums",
    "shopping-malls": "Shopping Malls",
    "industrial-hi-tech": "Industrial & Hi-Tech",
    "pharmaceutical-clean-rooms": "Pharmaceutical & Clean Rooms",
  },
  es: {
    "public-buildings": "Edificios públicos",
    hospitals: "Hospitales",
    hotels: "Hoteles",
    universities: "Universidades",
    museums: "Museos",
    "shopping-malls": "Centros comerciales",
    "industrial-hi-tech": "Industrial y alta tecnología",
    "pharmaceutical-clean-rooms": "Farmacéutica y salas limpias",
  },
};

const FOOTER_MARKERS = [
  "Related Products",
  "מוצרים קשורים",
  "making contact",
  "Contact Us",
  "יצירת קשר",
  "opening hours",
  "Opening Hour",
  "שעות פתיחה",
  "Address",
  "Adress",
  "כתובת",
  "© Copyright",
  "Control Applications Ltd",
];

type ContentPage = {
  slug?: string;
  title?: string;
  description?: string;
  rich_text?: string[];
  images?: { src?: string; alt?: string }[];
  documents?: { label?: string; url?: string; file?: string }[];
  og_image?: string;
};

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\|\s*.*$/, "").trim();
}

function bodyFromRichText(blocks: string[] | undefined): string {
  if (!blocks?.length) return "";
  const parts: string[] = [];
  for (const block of blocks) {
    const plain = (block || "").replace(/\u200b/g, "").trim();
    if (!plain) continue;
    if (FOOTER_MARKERS.some((m) => plain.includes(m))) break;
    parts.push(plain);
  }
  return parts.join("\n\n").trim();
}

function clientsFromRichText(blocks: string[] | undefined, title: string): string[] {
  if (!blocks?.length) return [];
  const titleNorm = title.trim().toLowerCase();
  for (const block of blocks) {
    const plain = (block || "").replace(/\u200b/g, "").trim();
    if (!plain || plain.toLowerCase() === titleNorm) continue;
    if (FOOTER_MARKERS.some((m) => plain.includes(m))) continue;
    const lines = plain
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length >= 2) return lines;
  }
  return [];
}

function loadIndustryOffers(): Record<string, Record<string, string>> {
  // Prefer parsing from config.py via a lightweight extract if present in built content; fallback empty.
  const offers: Record<string, Record<string, string>> = { he: {}, en: {}, es: {} };
  const industriesJson = readJson<{ offers?: Record<string, Record<string, string>> }>(
    path.join(CONTENT, "en", "industries.json"),
  );
  if (industriesJson?.offers) return industriesJson.offers;
  return offers;
}

async function seed() {
  await migrate();
  const db = await createDb();
  console.log("Seeding…");

  // Clear in FK-safe order
  await db.delete(productIndustries);
  await db.delete(productSolutions);
  await db.delete(productMedia);
  await db.delete(productTranslations);
  await db.delete(products);
  await db.delete(solutionTranslations);
  await db.delete(solutions);
  await db.delete(industryTranslations);
  await db.delete(industries);
  await db.delete(pageTranslations);
  await db.delete(pages);
  await db.delete(settings);

  // Solutions
  const solutionIds = new Map<string, number>();
  for (let i = 0; i < SOLUTION_ORDER.length; i++) {
    const slug = SOLUTION_ORDER[i];
    const [row] = await db
      .insert(solutions)
      .values({
        slug,
        practiceGroup: SOLUTION_GROUPS[slug] || "power-meters",
        sortOrder: i,
        heroImageUrl: SOLUTION_IMAGES[slug] || "",
      })
      .returning({ id: solutions.id });
    solutionIds.set(slug, row.id);
    for (const lang of LANGS) {
      await db.insert(solutionTranslations).values({
        solutionId: row.id,
        lang,
        title: SOLUTION_LABELS[lang][slug] || slug,
        lead: "",
        body: bodyFromRichText(readJson<ContentPage>(path.join(CONTENT, lang, `${slug}.json`))?.rich_text),
      });
    }
  }

  // Products from SOLUTION_PRODUCTS unique set
  const productSlugs = [...new Set(Object.values(SOLUTION_PRODUCTS).flat())];
  const productIds = new Map<string, number>();
  for (let i = 0; i < productSlugs.length; i++) {
    const slug = productSlugs[i];
    const [row] = await db
      .insert(products)
      .values({ slug, sortOrder: i })
      .returning({ id: products.id });
    productIds.set(slug, row.id);

    for (const lang of LANGS) {
      const page = readJson<ContentPage>(path.join(CONTENT, lang, `${slug}.json`));
      await db.insert(productTranslations).values({
        productId: row.id,
        lang,
        title: cleanTitle(page?.title || slug),
        description: page?.description || "",
        body: bodyFromRichText(page?.rich_text),
      });
    }

    const enPage = readJson<ContentPage>(path.join(CONTENT, "en", `${slug}.json`));
    let sort = 0;
    if (enPage?.og_image) {
      await db.insert(productMedia).values({
        productId: row.id,
        kind: "hero",
        url: enPage.og_image.startsWith("http") || enPage.og_image.startsWith("/")
          ? enPage.og_image
          : `/assets/images/${enPage.og_image}`,
        alt: "",
        sortOrder: sort++,
      });
    }
    for (const img of enPage?.images || []) {
      if (!img.src) continue;
      await db.insert(productMedia).values({
        productId: row.id,
        kind: "image",
        url: img.src,
        alt: img.alt || "",
        sortOrder: sort++,
      });
    }
    for (const doc of enPage?.documents || []) {
      const url = doc.file ? `/assets/documents/${doc.file}` : doc.url || "";
      if (!url) continue;
      await db.insert(productMedia).values({
        productId: row.id,
        kind: "document",
        url,
        label: doc.label || "",
        alt: "",
        sortOrder: sort++,
      });
    }
  }

  // Product ↔ solution links
  for (const [solSlug, prodSlugs] of Object.entries(SOLUTION_PRODUCTS)) {
    const sid = solutionIds.get(solSlug);
    if (!sid) continue;
    for (let i = 0; i < prodSlugs.length; i++) {
      const pid = productIds.get(prodSlugs[i]);
      if (!pid) continue;
      await db.insert(productSolutions).values({
        productId: pid,
        solutionId: sid,
        sortOrder: i,
      });
    }
  }

  // Industries
  const offers = loadIndustryOffers();
  // Load offers from a JS file if we write one; also try reading INDUSTRY from sibling seed-data
  const offersPath = path.join(__dirname, "seed-industry-offers.json");
  const fileOffers = readJson<Record<string, Record<string, string>>>(offersPath);
  const industryOffers = fileOffers || offers;

  const industryIds = new Map<string, number>();
  for (let i = 0; i < INDUSTRY_SLUGS.length; i++) {
    const slug = INDUSTRY_SLUGS[i];
    const enPage = readJson<ContentPage>(path.join(CONTENT, "en", `${slug}.json`));
    const hero =
      enPage?.images?.find((im) => im.src)?.src ||
      (slug === "public-buildings"
        ? "/assets/images/813b164e6ecd49b0b09f5f9913d34577.jpg"
        : "");
    const [row] = await db
      .insert(industries)
      .values({ slug, sortOrder: i, heroImageUrl: hero })
      .returning({ id: industries.id });
    industryIds.set(slug, row.id);

    for (const lang of LANGS) {
      const page = readJson<ContentPage>(path.join(CONTENT, lang, `${slug}.json`));
      const title = INDUSTRY_TITLES[lang][slug] || cleanTitle(page?.title || slug);
      await db.insert(industryTranslations).values({
        industryId: row.id,
        lang,
        title,
        offer: industryOffers[lang]?.[slug] || "",
        clients: clientsFromRichText(page?.rich_text, title),
      });
    }
  }

  // Pages: about, home, contact, industries framing
  for (const key of ["about", "home", "contact", "industries"] as const) {
    const [page] = await db.insert(pages).values({ key }).returning({ id: pages.id });
    for (const lang of LANGS) {
      const fileSlug = key === "home" ? "index" : key;
      const content = readJson<ContentPage>(path.join(CONTENT, lang, `${fileSlug}.json`));
      await db.insert(pageTranslations).values({
        pageId: page.id,
        lang,
        title: cleanTitle(content?.title || key),
        body: bodyFromRichText(content?.rich_text),
      });
    }
  }

  await db.insert(settings).values([
    { key: "contact_phone", value: "+972-3-6474998" },
    { key: "contact_email", value: "info@ddc.co.il" },
    { key: "brand_name", value: "Control Applications" },
  ]);

  const [{ value: productCount }] = await db
    .select({ value: products.id })
    .from(products)
    .where(eq(products.slug, productSlugs[0]));
  void productCount;

  console.log(
    `Seeded ${productSlugs.length} products, ${SOLUTION_ORDER.length} solutions, ${INDUSTRY_SLUGS.length} industries.`,
  );

  const { exportPublicSnapshot } = await import("./public-snapshot");
  const out = await exportPublicSnapshot();
  console.log(`Public snapshot → ${out}`);
  await closeDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
