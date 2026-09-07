"use server";

import { industries, industryTranslations } from "@ddc/db";
import { and, eq } from "@ddc/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { publishToPublicSite } from "@/lib/publish";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function saveIndustryAction(slug: string, formData: FormData) {
  const db = await getDb();
  const [row] = await db.select().from(industries).where(eq(industries.slug, slug)).limit(1);
  if (!row) throw new Error("Missing industry");

  await db
    .update(industries)
    .set({
      enabled: flag(formData, "enabled"),
      enabledHe: flag(formData, "enabledHe"),
      enabledEn: flag(formData, "enabledEn"),
      enabledEs: flag(formData, "enabledEs"),
      heroImageUrl: String(formData.get("heroImageUrl") || ""),
      updatedAt: new Date(),
    })
    .where(eq(industries.id, row.id));

  for (const lang of ["he", "en", "es"] as const) {
    const clients = String(formData.get(`clients_${lang}`) || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const values = {
      title: String(formData.get(`title_${lang}`) || ""),
      offer: String(formData.get(`offer_${lang}`) || ""),
      clients,
    };
    const [existing] = await db
      .select()
      .from(industryTranslations)
      .where(
        and(eq(industryTranslations.industryId, row.id), eq(industryTranslations.lang, lang)),
      )
      .limit(1);
    if (existing) {
      await db
        .update(industryTranslations)
        .set(values)
        .where(eq(industryTranslations.id, existing.id));
    } else {
      await db.insert(industryTranslations).values({ industryId: row.id, lang, ...values });
    }
  }

  revalidatePath("/industries");
  await publishToPublicSite();
  redirect(`/industries/${slug}?saved=1`);
}
