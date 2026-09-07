"use server";

import { solutions, solutionTranslations } from "@ddc/db";
import { and, eq } from "@ddc/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { publishToPublicSite } from "@/lib/publish";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export async function saveSolutionAction(slug: string, formData: FormData) {
  const db = await getDb();
  const [row] = await db.select().from(solutions).where(eq(solutions.slug, slug)).limit(1);
  if (!row) throw new Error("Missing solution");

  await db
    .update(solutions)
    .set({
      enabled: flag(formData, "enabled"),
      enabledHe: flag(formData, "enabledHe"),
      enabledEn: flag(formData, "enabledEn"),
      enabledEs: flag(formData, "enabledEs"),
      practiceGroup: String(formData.get("practiceGroup") || row.practiceGroup),
      heroImageUrl: String(formData.get("heroImageUrl") || ""),
      updatedAt: new Date(),
    })
    .where(eq(solutions.id, row.id));

  for (const lang of ["he", "en", "es"] as const) {
    const values = {
      title: String(formData.get(`title_${lang}`) || ""),
      lead: String(formData.get(`lead_${lang}`) || ""),
      body: String(formData.get(`body_${lang}`) || ""),
    };
    const [existing] = await db
      .select()
      .from(solutionTranslations)
      .where(
        and(eq(solutionTranslations.solutionId, row.id), eq(solutionTranslations.lang, lang)),
      )
      .limit(1);
    if (existing) {
      await db
        .update(solutionTranslations)
        .set(values)
        .where(eq(solutionTranslations.id, existing.id));
    } else {
      await db.insert(solutionTranslations).values({ solutionId: row.id, lang, ...values });
    }
  }

  revalidatePath("/solutions");
  await publishToPublicSite();
  redirect(`/solutions/${slug}?saved=1`);
}
