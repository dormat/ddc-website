"use server";

import { pages, pageTranslations, settings } from "@ddc/db";
import { and, eq } from "@ddc/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { publishToPublicSite } from "@/lib/publish";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function savePageAction(key: string, formData: FormData) {
  const db = await getDb();
  const [row] = await db.select().from(pages).where(eq(pages.key, key)).limit(1);
  if (!row) throw new Error("Missing page");

  await db
    .update(pages)
    .set({
      enabled: flag(formData, "enabled"),
      enabledHe: flag(formData, "enabledHe"),
      enabledEn: flag(formData, "enabledEn"),
      enabledEs: flag(formData, "enabledEs"),
      updatedAt: new Date(),
    })
    .where(eq(pages.id, row.id));

  for (const lang of ["he", "en", "es"] as const) {
    const values = {
      title: String(formData.get(`title_${lang}`) || ""),
      body: String(formData.get(`body_${lang}`) || ""),
    };
    const [existing] = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, row.id), eq(pageTranslations.lang, lang)))
      .limit(1);
    if (existing) {
      await db.update(pageTranslations).set(values).where(eq(pageTranslations.id, existing.id));
    } else {
      await db.insert(pageTranslations).values({ pageId: row.id, lang, ...values });
    }
  }

  revalidatePath("/pages");
  await publishToPublicSite();
  redirect(`/pages/${key}?saved=1`);
}

export async function saveSettingsAction(formData: FormData) {
  const db = await getDb();
  for (const key of ["contact_phone", "contact_email", "brand_name"] as const) {
    const value = String(formData.get(key) || "");
    const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existing) {
      await db.update(settings).set({ value }).where(eq(settings.id, existing.id));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }
  revalidatePath("/settings");
  await publishToPublicSite();
  redirect("/settings?saved=1");
}
