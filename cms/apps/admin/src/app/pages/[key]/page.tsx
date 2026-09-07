import { pages, pageTranslations } from "@ddc/db";
import { eq } from "@ddc/db";
import { notFound } from "next/navigation";
import { savePageAction } from "@/app/actions/pages";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function PageEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const { key } = await params;
  const sp = await searchParams;
  const db = await getDb();
  const [row] = await db.select().from(pages).where(eq(pages.key, key)).limit(1);
  if (!row) notFound();
  const translations = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, row.id));
  const byLang = Object.fromEntries(translations.map((t) => [t.lang, t]));
  const save = savePageAction.bind(null, key);

  return (
    <Shell title={`Page: ${key}`} path="/pages">
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
        </div>
        {(["en", "he", "es"] as const).map((lang) => (
          <div className="card" key={lang} style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{lang.toUpperCase()}</h3>
            <div className="field">
              <label>Title</label>
              <input name={`title_${lang}`} defaultValue={byLang[lang]?.title || ""} />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea name={`body_${lang}`} defaultValue={byLang[lang]?.body || ""} />
            </div>
          </div>
        ))}
        <button className="btn primary" type="submit">
          Save page
        </button>
      </form>
    </Shell>
  );
}
