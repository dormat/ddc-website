import fs from "node:fs";
import path from "node:path";
import { asc } from "drizzle-orm";
import { createDb, resolveCmsRoot } from "./client";
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

export type PublicLang = "he" | "en" | "es";

export type PublicSnapshot = {
  version: number;
  updatedAt: string;
  settings: Record<string, string>;
  solutions: Array<{
    slug: string;
    practiceGroup: string;
    sortOrder: number;
    heroImageUrl: string;
    enabled: boolean;
    enabledHe: boolean;
    enabledEn: boolean;
    enabledEs: boolean;
    translations: Record<
      PublicLang,
      { title: string; lead: string; body: string }
    >;
    productSlugs: string[];
  }>;
  products: Array<{
    slug: string;
    sortOrder: number;
    enabled: boolean;
    enabledHe: boolean;
    enabledEn: boolean;
    enabledEs: boolean;
    translations: Record<
      PublicLang,
      { title: string; description: string; body: string }
    >;
    media: Array<{ kind: string; url: string; alt: string; label: string; sortOrder: number }>;
    solutionSlugs: string[];
    industrySlugs: string[];
  }>;
  industries: Array<{
    slug: string;
    sortOrder: number;
    heroImageUrl: string;
    enabled: boolean;
    enabledHe: boolean;
    enabledEn: boolean;
    enabledEs: boolean;
    translations: Record<
      PublicLang,
      { title: string; offer: string; clients: string[] }
    >;
  }>;
  pages: Array<{
    key: string;
    enabled: boolean;
    enabledHe: boolean;
    enabledEn: boolean;
    enabledEs: boolean;
    translations: Record<PublicLang, { title: string; body: string }>;
  }>;
};

const emptyTr = { title: "", lead: "", body: "" };
const emptyProd = { title: "", description: "", body: "" };
const emptyInd = { title: "", offer: "", clients: [] as string[] };
const emptyPage = { title: "", body: "" };

function publicJsonPath() {
  return path.join(resolveCmsRoot(), "data", "public.json");
}

export async function buildPublicSnapshot(): Promise<PublicSnapshot> {
  const db = await createDb();
  const langs: PublicLang[] = ["he", "en", "es"];

  const settingRows = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};
  for (const row of settingRows) settingsMap[row.key] = row.value;

  const solutionRows = await db.select().from(solutions).orderBy(asc(solutions.sortOrder));
  const solutionTr = await db.select().from(solutionTranslations);
  const productSolutionRows = await db.select().from(productSolutions);
  const productRows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.slug));
  const productTr = await db.select().from(productTranslations);
  const mediaRows = await db.select().from(productMedia).orderBy(asc(productMedia.sortOrder));
  const productIndustryRows = await db.select().from(productIndustries);
  const industryRows = await db.select().from(industries).orderBy(asc(industries.sortOrder));
  const industryTr = await db.select().from(industryTranslations);
  const pageRows = await db.select().from(pages);
  const pageTr = await db.select().from(pageTranslations);

  const productsById = new Map(productRows.map((p) => [p.id, p]));
  const solutionsById = new Map(solutionRows.map((s) => [s.id, s]));
  const industriesById = new Map(industryRows.map((i) => [i.id, i]));

  const snapshot: PublicSnapshot = {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: settingsMap,
    solutions: solutionRows.map((sol) => {
      const translations = Object.fromEntries(
        langs.map((lang) => {
          const tr = solutionTr.find((t) => t.solutionId === sol.id && t.lang === lang);
          return [lang, tr ? { title: tr.title, lead: tr.lead, body: tr.body } : { ...emptyTr }];
        }),
      ) as PublicSnapshot["solutions"][0]["translations"];
      const productSlugs = productSolutionRows
        .filter((ps) => ps.solutionId === sol.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ps) => productsById.get(ps.productId)?.slug)
        .filter((s): s is string => Boolean(s));
      return {
        slug: sol.slug,
        practiceGroup: sol.practiceGroup,
        sortOrder: sol.sortOrder,
        heroImageUrl: sol.heroImageUrl,
        enabled: sol.enabled,
        enabledHe: sol.enabledHe,
        enabledEn: sol.enabledEn,
        enabledEs: sol.enabledEs,
        translations,
        productSlugs,
      };
    }),
    products: productRows.map((prod) => {
      const translations = Object.fromEntries(
        langs.map((lang) => {
          const tr = productTr.find((t) => t.productId === prod.id && t.lang === lang);
          return [
            lang,
            tr
              ? { title: tr.title, description: tr.description, body: tr.body }
              : { ...emptyProd },
          ];
        }),
      ) as PublicSnapshot["products"][0]["translations"];
      const media = mediaRows
        .filter((m) => m.productId === prod.id)
        .map((m) => ({
          kind: m.kind,
          url: m.url,
          alt: m.alt,
          label: m.label,
          sortOrder: m.sortOrder,
        }));
      const solutionSlugs = productSolutionRows
        .filter((ps) => ps.productId === prod.id)
        .map((ps) => solutionsById.get(ps.solutionId)?.slug)
        .filter((s): s is string => Boolean(s));
      const industrySlugs = productIndustryRows
        .filter((pi) => pi.productId === prod.id)
        .map((pi) => industriesById.get(pi.industryId)?.slug)
        .filter((s): s is string => Boolean(s));
      return {
        slug: prod.slug,
        sortOrder: prod.sortOrder,
        enabled: prod.enabled,
        enabledHe: prod.enabledHe,
        enabledEn: prod.enabledEn,
        enabledEs: prod.enabledEs,
        translations,
        media,
        solutionSlugs,
        industrySlugs,
      };
    }),
    industries: industryRows.map((ind) => {
      const translations = Object.fromEntries(
        langs.map((lang) => {
          const tr = industryTr.find((t) => t.industryId === ind.id && t.lang === lang);
          return [
            lang,
            tr
              ? { title: tr.title, offer: tr.offer, clients: tr.clients || [] }
              : { ...emptyInd },
          ];
        }),
      ) as PublicSnapshot["industries"][0]["translations"];
      return {
        slug: ind.slug,
        sortOrder: ind.sortOrder,
        heroImageUrl: ind.heroImageUrl,
        enabled: ind.enabled,
        enabledHe: ind.enabledHe,
        enabledEn: ind.enabledEn,
        enabledEs: ind.enabledEs,
        translations,
      };
    }),
    pages: pageRows.map((page) => {
      const translations = Object.fromEntries(
        langs.map((lang) => {
          const tr = pageTr.find((t) => t.pageId === page.id && t.lang === lang);
          return [lang, tr ? { title: tr.title, body: tr.body } : { ...emptyPage }];
        }),
      ) as PublicSnapshot["pages"][0]["translations"];
      return {
        key: page.key,
        enabled: page.enabled,
        enabledHe: page.enabledHe,
        enabledEn: page.enabledEn,
        enabledEs: page.enabledEs,
        translations,
      };
    }),
  };

  return snapshot;
}

export async function exportPublicSnapshot(): Promise<string> {
  const snapshot = await buildPublicSnapshot();
  const out = publicJsonPath();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(snapshot), "utf8");
  return out;
}

/** Replace DB contents from a public snapshot (used on Cloud Functions cold start). */
export async function importPublicSnapshot(snapshot: PublicSnapshot): Promise<void> {
  const db = await createDb();
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

  const solutionIdBySlug = new Map<string, number>();
  for (const sol of snapshot.solutions) {
    const [row] = await db
      .insert(solutions)
      .values({
        slug: sol.slug,
        practiceGroup: sol.practiceGroup,
        sortOrder: sol.sortOrder,
        heroImageUrl: sol.heroImageUrl,
        enabled: sol.enabled,
        enabledHe: sol.enabledHe,
        enabledEn: sol.enabledEn,
        enabledEs: sol.enabledEs,
      })
      .returning();
    solutionIdBySlug.set(sol.slug, row.id);
    for (const lang of ["he", "en", "es"] as const) {
      const tr = sol.translations[lang];
      if (!tr) continue;
      await db.insert(solutionTranslations).values({
        solutionId: row.id,
        lang,
        title: tr.title,
        lead: tr.lead,
        body: tr.body,
      });
    }
  }

  const industryIdBySlug = new Map<string, number>();
  for (const ind of snapshot.industries) {
    const [row] = await db
      .insert(industries)
      .values({
        slug: ind.slug,
        sortOrder: ind.sortOrder,
        heroImageUrl: ind.heroImageUrl,
        enabled: ind.enabled,
        enabledHe: ind.enabledHe,
        enabledEn: ind.enabledEn,
        enabledEs: ind.enabledEs,
      })
      .returning();
    industryIdBySlug.set(ind.slug, row.id);
    for (const lang of ["he", "en", "es"] as const) {
      const tr = ind.translations[lang];
      if (!tr) continue;
      await db.insert(industryTranslations).values({
        industryId: row.id,
        lang,
        title: tr.title,
        offer: tr.offer,
        clients: tr.clients || [],
      });
    }
  }

  const productIdBySlug = new Map<string, number>();
  for (const prod of snapshot.products) {
    const [row] = await db
      .insert(products)
      .values({
        slug: prod.slug,
        sortOrder: prod.sortOrder,
        enabled: prod.enabled,
        enabledHe: prod.enabledHe,
        enabledEn: prod.enabledEn,
        enabledEs: prod.enabledEs,
      })
      .returning();
    productIdBySlug.set(prod.slug, row.id);
    for (const lang of ["he", "en", "es"] as const) {
      const tr = prod.translations[lang];
      if (!tr) continue;
      await db.insert(productTranslations).values({
        productId: row.id,
        lang,
        title: tr.title,
        description: tr.description,
        body: tr.body,
      });
    }
    for (const media of prod.media || []) {
      await db.insert(productMedia).values({
        productId: row.id,
        kind: media.kind,
        url: media.url,
        alt: media.alt,
        label: media.label,
        sortOrder: media.sortOrder,
      });
    }
    for (const slug of prod.solutionSlugs || []) {
      const solutionId = solutionIdBySlug.get(slug);
      if (solutionId) {
        await db.insert(productSolutions).values({ productId: row.id, solutionId });
      }
    }
    for (const slug of prod.industrySlugs || []) {
      const industryId = industryIdBySlug.get(slug);
      if (industryId) {
        await db.insert(productIndustries).values({ productId: row.id, industryId });
      }
    }
  }

  for (const page of snapshot.pages) {
    const [row] = await db
      .insert(pages)
      .values({
        key: page.key,
        enabled: page.enabled,
        enabledHe: page.enabledHe,
        enabledEn: page.enabledEn,
        enabledEs: page.enabledEs,
      })
      .returning();
    for (const lang of ["he", "en", "es"] as const) {
      const tr = page.translations[lang];
      if (!tr) continue;
      await db.insert(pageTranslations).values({
        pageId: row.id,
        lang,
        title: tr.title,
        body: tr.body,
      });
    }
  }

  for (const [key, value] of Object.entries(snapshot.settings || {})) {
    await db.insert(settings).values({ key, value });
  }
}

export function readPublicSnapshotFile(): PublicSnapshot | null {
  const file = publicJsonPath();
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as PublicSnapshot;
}

export function getPublicSnapshotPath() {
  return publicJsonPath();
}
