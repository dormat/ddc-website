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

/** Match live industries page heroes (not first scraped content image / logo). */
const INDUSTRY_IMAGES: Record<string, string> = {
  "public-buildings": "/assets/images/813b164e6ecd49b0b09f5f9913d34577.jpg",
  hospitals: "/assets/images/hospitals-hero.jpg",
  hotels: "/assets/images/hotels-hero.jpg",
  universities: "/assets/images/typical-projects-content-7-5.jpg",
  museums: "/assets/images/museums-hero.jpg",
  "shopping-malls": "/assets/images/shopping-malls-hero.jpg",
  "industrial-hi-tech": "/assets/images/typical-projects-content-8-4.png",
  "pharmaceutical-clean-rooms": "/assets/images/pharmaceutical-clean-rooms-hero.jpg",
};

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
  "© Copyright",
  "cal@ddc.co.il",
];

type ContentPage = {
  slug?: string;
  title?: string;
  description?: string;
  rich_text?: string[];
  content_html?: string;
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

function shortSeoDescription(value: string | undefined, body: string): string {
  const d = (value || "").trim();
  if (!d) return "";
  if (d.includes("\n") || d.length > 220) return "";
  const b = (body || "").trim();
  if (b && (d === b || b.startsWith(d) || d.startsWith(b.slice(0, 80)))) return "";
  return d;
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

function hebrewRatio(text: string): number {
  let he = 0;
  let letters = 0;
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      letters += 1;
      if (ch >= "\u0590" && ch <= "\u05FF") he += 1;
    }
  }
  return letters ? he / letters : 0;
}

function dropWrongScriptLines(plain: string, lang: (typeof LANGS)[number]): string {
  const kept: string[] = [];
  for (const line of plain.split("\n")) {
    const t = line.trim();
    if (!t) {
      kept.push("");
      continue;
    }
    const ratio = hebrewRatio(t);
    if (lang !== "he" && ratio > 0.35) continue;
    kept.push(line.replace(/[ \t]+$/g, ""));
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function plainTextFromHtml(input: string): string {
  if (!input) return "";
  let s = input;
  if (!/[<>]/.test(s)) return s.replace(/\u200b/g, "").trim();
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<br\s*\/?>\s*/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\u200b/g, "");
  const markers = [
    "יצירת קשר",
    "Contact Us",
    "making contact",
    "שעות פתיחה",
    "Opening Hour",
    "opening hours",
    "© Copyright",
    "cal@ddc.co.il",
    "mailto:",
    "Related Products",
    "Related Items",
    "מוצרים קשורים",
  ];
  const parts: string[] = [];
  for (const block of s.split(/\n\s*\n/)) {
    const t = block
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .trim();
    if (!t) continue;
    if (markers.some((m) => t.toLowerCase().includes(m.toLowerCase()))) break;
    parts.push(t);
  }
  return parts.join("\n\n").trim();
}

/** Prefer full HTML from the static content files; store plain text for admin editing. */
function pageBodyFromContent(content: ContentPage | null): string {
  if (!content) return "";
  const html = (content.content_html || "").trim();
  const fromRich = bodyFromRichText(content.rich_text);
  const source = html.length >= 40 && html.length >= fromRich.length ? html : fromRich || html;
  return plainTextFromHtml(source);
}

/**
 * Match live product pages: use content_html (keeps EN/HE line breaks), cut related/footer,
 * drop the duplicate heading block for non-ES, and remove wrong-script lines.
 */
function productBodyFromContent(content: ContentPage | null, lang: (typeof LANGS)[number]): string {
  if (!content) return "";
  if (lang === "es") {
    // Live ES pages are built from rich_text (content_html is often still English).
    const fromRich = bodyFromRichText(content.rich_text);
    if (fromRich) return dropWrongScriptLines(fromRich.replace(/\n{3,}/g, "\n\n"), lang);
  }
  let html = (content.content_html || "").trim();
  if (html) {
    const relatedSplit = html.split(/<div class="rich-text">/i);
    if (relatedSplit.length > 1) {
      const kept: string[] = [];
      for (let i = 0; i < relatedSplit.length; i++) {
        const part = relatedSplit[i];
        if (i === 0) {
          if (part.trim()) kept.push(part);
          continue;
        }
        const block = '<div class="rich-text">' + part;
        const plain = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (/related\s+products|related\s+items|מוצרים קשורים|productos relacionados/i.test(plain)) break;
        if (FOOTER_MARKERS.some((m) => plain.toLowerCase().includes(m.toLowerCase()))) break;
        kept.push(block);
      }
      html = kept.join("");
    }
    if (lang !== "es") {
      html = html.replace(/<div class="rich-text"><h[1-3][^>]*>[\s\S]*?<\/h[1-3]><\/div>\s*/i, "");
    }
    return dropWrongScriptLines(plainTextFromHtml(html), lang);
  }
  const fromRich = bodyFromRichText(content.rich_text);
  return dropWrongScriptLines(fromRich, lang);
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
      .returning();
    solutionIds.set(slug, row.id);
    for (const lang of LANGS) {
      await db.insert(solutionTranslations).values({
        solutionId: row.id,
        lang,
        title: SOLUTION_LABELS[lang][slug] || slug,
        lead: "",
        // Home-screen description; filled from live snapshot / admin (not scraped body).
        body: "",
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
      .returning();
    productIds.set(slug, row.id);

    for (const lang of LANGS) {
      const page = readJson<ContentPage>(path.join(CONTENT, lang, `${slug}.json`));
      const body = productBodyFromContent(page, lang);
      await db.insert(productTranslations).values({
        productId: row.id,
        lang,
        title: cleanTitle(page?.title || slug),
        description: shortSeoDescription(page?.description, body),
        body,
      });
    }

    const enPage = readJson<ContentPage>(path.join(CONTENT, "en", `${slug}.json`));
    let sort = 0;
    const mediaExport = readJson<Record<string, Array<{ kind?: string; url?: string; alt?: string; label?: string }>>>(
      path.join(REPO_ROOT, "cms/data/product-media-by-slug.json"),
    );
    const curated = mediaExport?.[slug];
    if (curated?.length) {
      for (const img of curated) {
        if (!img.url) continue;
        await db.insert(productMedia).values({
          productId: row.id,
          kind: img.kind || (sort === 0 ? "hero" : "image"),
          url: img.url,
          urlHe: "",
          urlEn: "",
          urlEs: "",
          alt: img.alt || "",
          label: img.label || img.alt || "",
          sortOrder: sort++,
          enabled: true,
          enabledHe: true,
          enabledEn: true,
          enabledEs: true,
        });
      }
    } else {
      // Fallback: only keep gallery-like images (drop scraped UI junk).
      const junkName = /home-content|screen-shot|screen%20shot|flag-|bullet_ball/i;
      if (enPage?.og_image && !junkName.test(enPage.og_image)) {
        await db.insert(productMedia).values({
          productId: row.id,
          kind: "hero",
          url: enPage.og_image.startsWith("http") || enPage.og_image.startsWith("/")
            ? enPage.og_image
            : `/assets/images/${enPage.og_image}`,
          urlHe: "",
          urlEn: "",
          urlEs: "",
          alt: "",
          sortOrder: sort++,
          enabled: true,
          enabledHe: true,
          enabledEn: true,
          enabledEs: true,
        });
      }
      for (const img of enPage?.images || []) {
        if (!img.src || junkName.test(img.src) || junkName.test(img.alt || "")) continue;
        if (/^screen/i.test(img.alt || "") || /Screen/.test(img.src)) continue;
        await db.insert(productMedia).values({
          productId: row.id,
          kind: sort === 0 ? "hero" : "image",
          url: img.src,
          urlHe: "",
          urlEn: "",
          urlEs: "",
          alt: img.alt || "",
          label: img.alt || "",
          sortOrder: sort++,
          enabled: true,
          enabledHe: true,
          enabledEn: true,
          enabledEs: true,
        });
      }
    }
    // Prefer Hebrew content documents (canonical labels).
    const hePage = readJson<ContentPage>(path.join(CONTENT, "he", `${slug}.json`));
    for (const doc of hePage?.documents || enPage?.documents || []) {
      const file = doc.file || "";
      const url = file ? `/assets/documents/${file}` : doc.url || "";
      if (!url) continue;
      const label = doc.label || "";
      const kind =
        label.includes("שרטוט") || label.toLowerCase().includes("schematic") || file.includes("sketch")
          ? "schematic"
          : "document";
      await db.insert(productMedia).values({
        productId: row.id,
        kind,
        url,
        urlHe: "",
        urlEn: "",
        urlEs: "",
        label: kind === "schematic" ? "Schematics" : "Download Docs",
        alt: "",
        sortOrder: sort++,
        enabled: true,
        enabledHe: true,
        enabledEn: true,
        enabledEs: true,
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
    const hero = INDUSTRY_IMAGES[slug] || "";
    const [row] = await db
      .insert(industries)
      .values({ slug, sortOrder: i, heroImageUrl: hero })
      .returning();
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

  // Pages: about only (contact is form + Settings; industries has its own section)
  for (const key of ["about"] as const) {
    const [page] = await db.insert(pages).values({ key }).returning();
    for (const lang of LANGS) {
      const fileSlug = key === "home" ? "index" : key;
      const content = readJson<ContentPage>(path.join(CONTENT, lang, `${fileSlug}.json`));
      await db.insert(pageTranslations).values({
        pageId: page.id,
        lang,
        title: cleanTitle(content?.title || key),
        body: pageBodyFromContent(content),
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
