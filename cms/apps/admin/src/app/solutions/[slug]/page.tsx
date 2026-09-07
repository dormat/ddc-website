import { solutions, solutionTranslations } from "@ddc/db";
import { eq } from "@ddc/db";
import { notFound } from "next/navigation";
import { saveSolutionAction } from "@/app/actions/solutions";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function SolutionEditPage({
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
  const [row] = await db.select().from(solutions).where(eq(solutions.slug, slug)).limit(1);
  if (!row) notFound();
  const translations = await db
    .select()
    .from(solutionTranslations)
    .where(eq(solutionTranslations.solutionId, row.id));
  const byLang = Object.fromEntries(translations.map((t) => [t.lang, t]));
  const save = saveSolutionAction.bind(null, slug);

  return (
    <Shell title={`Solution: ${byLang.en?.title || slug}`} path="/solutions">
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
            <label>Practice group</label>
            <select name="practiceGroup" defaultValue={row.practiceGroup}>
              <option value="building-automation">building-automation</option>
              <option value="power-meters">power-meters</option>
            </select>
          </div>
          <div className="field">
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
              <label>Lead</label>
              <input name={`lead_${lang}`} defaultValue={byLang[lang]?.lead || ""} />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea name={`body_${lang}`} defaultValue={byLang[lang]?.body || ""} />
            </div>
          </div>
        ))}
        <button className="btn primary" type="submit">
          Save solution
        </button>
      </form>
    </Shell>
  );
}
