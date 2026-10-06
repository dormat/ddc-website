import { industries, industryTranslations } from "@ddc/db";
import { eq } from "@ddc/db";
import { notFound } from "next/navigation";
import { saveIndustryAction } from "@/app/actions/industries";
import { AssetUrlField } from "@/components/media-links";
import { SubmitButton } from "@/components/submit-button";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function IndustryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const { slug } = await params;
  const sp = await searchParams;
  const db = await getDb();
  const [row] = await db.select().from(industries).where(eq(industries.slug, slug)).limit(1);
  if (!row) notFound();
  const translations = await db
    .select()
    .from(industryTranslations)
    .where(eq(industryTranslations.industryId, row.id));
  const byLang = Object.fromEntries(translations.map((t) => [t.lang, t]));
  const save = saveIndustryAction.bind(null, slug);

  return (
    <Shell
      title={`Industry: ${byLang.en?.title || slug}`}
      path="/industries"
      backHref="/industries"
      backLabel="Back to industries"
    >
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      <form action={save} className="form-grid">
        <div className="card card-pad">
          <div className="checks">
            <label>
              <input type="checkbox" name="enabled" defaultChecked={row.enabled} /> Enabled
            </label>
            <label>
              <input type="checkbox" name="enabledHe" defaultChecked={row.enabledHe} /> HE
            </label>
            <label>
              <input type="checkbox" name="enabledEn" defaultChecked={row.enabledEn} /> EN
            </label>
            <label>
              <input type="checkbox" name="enabledEs" defaultChecked={row.enabledEs} /> ES
            </label>
          </div>
          <AssetUrlField name="heroImageUrl" label="Hero image URL" defaultValue={row.heroImageUrl} />
        </div>
        {(["en", "he", "es"] as const).map((lang) => (
          <div className="card card-pad" key={lang}>
            <h3>{lang.toUpperCase()}</h3>
            <div className="field">
              <label>Title</label>
              <input name={`title_${lang}`} defaultValue={byLang[lang]?.title || ""} />
            </div>
            <div className="field">
              <label>Offer text</label>
              <textarea name={`offer_${lang}`} defaultValue={byLang[lang]?.offer || ""} />
            </div>
            <div className="field">
              <label>Clients (one per line)</label>
              <textarea
                name={`clients_${lang}`}
                defaultValue={(byLang[lang]?.clients || []).join("\n")}
              />
            </div>
          </div>
        ))}
        <div className="form-actions">
          <SubmitButton pendingLabel="Saving…">Save industry</SubmitButton>
        </div>
      </form>
    </Shell>
  );
}
