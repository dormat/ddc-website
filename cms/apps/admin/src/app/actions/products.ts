"use server";

import {
  industries,
  productIndustries,
  productMedia,
  products,
  productSolutions,
  productTranslations,
  solutions,
} from "@ddc/db";
import { and, eq } from "@ddc/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireArea } from "@/components/shell-auth";
import { getDb } from "@/lib/db";
import { publishToPublicSite } from "@/lib/publish";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function saveProductAction(slug: string, formData: FormData) {
  await requireArea("website");
  const db = await getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) throw new Error("Product not found");

  await db
    .update(products)
    .set({
      enabled: flag(formData, "enabled"),
      enabledHe: flag(formData, "enabledHe"),
      enabledEn: flag(formData, "enabledEn"),
      enabledEs: flag(formData, "enabledEs"),
      updatedAt: new Date(),
    })
    .where(eq(products.id, product.id));

  for (const lang of ["he", "en", "es"] as const) {
    const values = {
      title: String(formData.get(`title_${lang}`) || ""),
      description: String(formData.get(`description_${lang}`) || ""),
      body: String(formData.get(`body_${lang}`) || ""),
    };
    const [existing] = await db
      .select()
      .from(productTranslations)
      .where(
        and(eq(productTranslations.productId, product.id), eq(productTranslations.lang, lang)),
      )
      .limit(1);
    if (existing) {
      await db.update(productTranslations).set(values).where(eq(productTranslations.id, existing.id));
    } else {
      await db.insert(productTranslations).values({ productId: product.id, lang, ...values });
    }
  }

  const selectedSolutions = new Set(formData.getAll("solutions").map(String));
  await db.delete(productSolutions).where(eq(productSolutions.productId, product.id));
  const solRows = await db.select().from(solutions);
  for (const sol of solRows) {
    if (!selectedSolutions.has(sol.slug)) continue;
    await db.insert(productSolutions).values({ productId: product.id, solutionId: sol.id });
  }

  const selectedIndustries = new Set(formData.getAll("industries").map(String));
  await db.delete(productIndustries).where(eq(productIndustries.productId, product.id));
  const indRows = await db.select().from(industries);
  for (const ind of indRows) {
    if (!selectedIndustries.has(ind.slug)) continue;
    await db.insert(productIndustries).values({ productId: product.id, industryId: ind.id });
  }

  const rawMedia = String(formData.get("media_json") || "[]");
  let mediaItems: Array<{
    kind?: string;
    url?: string;
    urlHe?: string;
    urlEn?: string;
    urlEs?: string;
    alt?: string;
    label?: string;
    enabled?: boolean;
    enabledHe?: boolean;
    enabledEn?: boolean;
    enabledEs?: boolean;
  }> = [];
  try {
    const parsed = JSON.parse(rawMedia);
    if (Array.isArray(parsed)) mediaItems = parsed;
  } catch {
    mediaItems = [];
  }

  await db.delete(productMedia).where(eq(productMedia.productId, product.id));
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    const kind = String(item.kind || "").trim();
    const url = String(item.url || "").trim();
    if (!kind || (!url && kind !== "schematic" && kind !== "document")) continue;
    if ((kind === "schematic" || kind === "document") && !url && !item.urlHe && !item.urlEn && !item.urlEs) {
      continue;
    }
    await db.insert(productMedia).values({
      productId: product.id,
      kind,
      url: url || String(item.urlHe || item.urlEn || item.urlEs || ""),
      urlHe: String(item.urlHe || ""),
      urlEn: String(item.urlEn || ""),
      urlEs: String(item.urlEs || ""),
      alt: String(item.alt || ""),
      label: String(item.label || ""),
      sortOrder: i,
      enabled: item.enabled !== false,
      enabledHe: item.enabledHe !== false,
      enabledEn: item.enabledEn !== false,
      enabledEs: item.enabledEs !== false,
    });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  await publishToPublicSite();
  redirect(`/products/${slug}?saved=1`);
}

export async function createProductAction(formData: FormData) {
  await requireArea("website");
  const db = await getDb();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) redirect("/products?error=slug");

  const [row] = await db.insert(products).values({ slug }).returning();
  for (const lang of ["he", "en", "es"] as const) {
    await db.insert(productTranslations).values({
      productId: row.id,
      lang,
      title: String(formData.get("title") || slug),
    });
  }
  await publishToPublicSite();
  redirect(`/products/${slug}`);
}

export async function deleteProductAction(slug: string) {
  await requireArea("website");
  const db = await getDb();
  await db.delete(products).where(eq(products.slug, slug));
  revalidatePath("/products");
  await publishToPublicSite();
  redirect("/products");
}

/** Hide or show a product on the public website without deleting it. */
export async function toggleProductVisibilityAction(slug: string, formData: FormData) {
  await requireArea("website");
  const db = await getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) throw new Error("Product not found");

  const next = formData.get("enabled") === "1" || formData.get("enabled") === "true";
  await db
    .update(products)
    .set({
      enabled: next,
      updatedAt: new Date(),
    })
    .where(eq(products.id, product.id));

  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  await publishToPublicSite();
  redirect("/products");
}
