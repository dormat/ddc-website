import { pages, pageTranslations } from "@ddc/db";
import { eq } from "@ddc/db";
import { notFound } from "next/navigation";
import { savePageAction } from "@/app/actions/pages";
import { SubmitButton } from "@/components/submit-button";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";
import { normalizePageBody } from "@/lib/plain-text";

const PAGE_KEY = "about";

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const db = await getDb();
  const [row] = await db.select().from(pages).where(eq(pages.key, PAGE_KEY)).limit(1);
  if (!row) notFound();
  const translations = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, row.id));
  const byLang = Object.fromEntries(
    translations.map((t) => [
      t.lang,
      { ...t, body: normalizePageBody(t.body || "") },
    ]),
  );
  const save = savePageAction.bind(null, PAGE_KEY);

  return (
    <Shell title="About" path="/about">
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      <p className="muted" style={{ marginTop: 0 }}>
        Edit plain text only — blank line = new paragraph. Layout, images, and styling stay on the
        public site.
      </p>
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
        </div>
        {(["en", "he", "es"] as const).map((lang) => (
          <div className="card card-pad" key={lang}>
            <h3>{lang.toUpperCase()}</h3>
            <div className="field">
              <label>Title</label>
              <input name={`title_${lang}`} defaultValue={byLang[lang]?.title || ""} />
            </div>
            <div className="field">
              <label>Body (plain text)</label>
              <textarea
                name={`body_${lang}`}
                rows={14}
                defaultValue={byLang[lang]?.body || ""}
                style={{ fontFamily: "inherit", lineHeight: 1.5 }}
              />
            </div>
          </div>
        ))}
        <div className="form-actions">
          <SubmitButton pendingLabel="Saving…">Save page</SubmitButton>
        </div>
      </form>
    </Shell>
  );
}
