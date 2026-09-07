import { industries, industryTranslations } from "@ddc/db";
import { eq } from "@ddc/db";
import { notFound } from "next/navigation";
import { saveIndustryAction } from "@/app/actions/industries";
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
    <Shell title={`Industry: ${byLang.en?.title || slug}`} path="/industries">
      {sp.saved ? <p className="muted">Saved.</p> : null}
      <form action={save} className="form-grid">
        <div className="card" style={{ padding: "1rem" }}>
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
          <div className="field" style={{ marginTop: "1rem" }}>
            <label>Hero image URL</label>
            <input name="heroImageUrl" defaultValue={row.heroImageUrl} />
          </div>
        </div>
        {(["en", "he", "es"] as const).map((lang) => (
          <div className="card" key={lang} style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{lang.toUpperCase()}</h3>
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
        <button className="btn primary" type="submit">
          Save industry
        </button>
      </form>
    </Shell>
  );
}
