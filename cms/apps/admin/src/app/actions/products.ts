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
import { getDb } from "@/lib/db";
import { publishToPublicSite } from "@/lib/publish";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function saveProductAction(slug: string, formData: FormData) {
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

  const lines = String(formData.get("media_lines") || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  await db.delete(productMedia).where(eq(productMedia.productId, product.id));
  for (let i = 0; i < lines.length; i++) {
    const [kind, url, label = ""] = lines[i].split("|").map((p) => p.trim());
    if (!kind || !url) continue;
    await db.insert(productMedia).values({
      productId: product.id,
      kind,
      url,
      label,
      sortOrder: i,
    });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  await publishToPublicSite();
  redirect(`/products/${slug}?saved=1`);
}

export async function createProductAction(formData: FormData) {
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
  const db = await getDb();
  await db.delete(products).where(eq(products.slug, slug));
  revalidatePath("/products");
  await publishToPublicSite();
  redirect("/products");
}
