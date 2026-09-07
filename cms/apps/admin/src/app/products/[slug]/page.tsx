import {
  industries,
  industryTranslations,
  productIndustries,
  productMedia,
  products,
  productSolutions,
  productTranslations,
  solutions,
  solutionTranslations,
} from "@ddc/db";
import { eq, sql } from "@ddc/db";
import { notFound } from "next/navigation";
import { deleteProductAction, saveProductAction } from "@/app/actions/products";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function ProductEditPage({
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

  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) notFound();

  const translations = await db
    .select()
    .from(productTranslations)
    .where(eq(productTranslations.productId, product.id));
  const byLang = Object.fromEntries(translations.map((t) => [t.lang, t]));

  const media = await db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, product.id))
    .orderBy(productMedia.sortOrder);

  const linkedSolutions = await db
    .select({ slug: solutions.slug })
    .from(productSolutions)
    .innerJoin(solutions, eq(productSolutions.solutionId, solutions.id))
    .where(eq(productSolutions.productId, product.id));
  const linkedSolutionSet = new Set(linkedSolutions.map((r) => r.slug));

  const linkedIndustries = await db
    .select({ slug: industries.slug })
    .from(productIndustries)
    .innerJoin(industries, eq(productIndustries.industryId, industries.id))
    .where(eq(productIndustries.productId, product.id));
  const linkedIndustrySet = new Set(linkedIndustries.map((r) => r.slug));

  const allSolutions = await db
    .select({
      slug: solutions.slug,
      title: solutionTranslations.title,
    })
    .from(solutions)
    .leftJoin(
      solutionTranslations,
      sql`${solutionTranslations.solutionId} = ${solutions.id} AND ${solutionTranslations.lang} = 'en'`,
    )
    .orderBy(solutions.sortOrder);

  const allIndustries = await db
    .select({
      slug: industries.slug,
      title: industryTranslations.title,
    })
    .from(industries)
    .leftJoin(
      industryTranslations,
      sql`${industryTranslations.industryId} = ${industries.id} AND ${industryTranslations.lang} = 'en'`,
    )
    .orderBy(industries.sortOrder);

  const mediaLines = media.map((m) => `${m.kind}|${m.url}|${m.label || m.alt || ""}`).join("\n");
  const save = saveProductAction.bind(null, slug);
  const remove = deleteProductAction.bind(null, slug);

  return (
    <Shell title={`Edit: ${byLang.en?.title || slug}`} path="/products">
      {sp.saved ? <p className="muted">Saved.</p> : null}
      <form action={save} className="form-grid">
        <div className="card" style={{ padding: "1rem" }}>
          <div className="muted" style={{ marginBottom: "0.75rem" }}>
            Slug: <code>{slug}</code>
          </div>
          <div className="checks">
            <label>
              <input type="checkbox" name="enabled" defaultChecked={product.enabled} /> Enabled
            </label>
            <label>
              <input type="checkbox" name="enabledHe" defaultChecked={product.enabledHe} /> HE
            </label>
            <label>
              <input type="checkbox" name="enabledEn" defaultChecked={product.enabledEn} /> EN
            </label>
            <label>
              <input type="checkbox" name="enabledEs" defaultChecked={product.enabledEs} /> ES
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
              <label>Description</label>
              <input name={`description_${lang}`} defaultValue={byLang[lang]?.description || ""} />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea name={`body_${lang}`} defaultValue={byLang[lang]?.body || ""} />
            </div>
          </div>
        ))}

        <div className="card" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Solutions</h3>
          <div className="checks">
            {allSolutions.map((sol) => (
              <label key={sol.slug}>
                <input
                  type="checkbox"
                  name="solutions"
                  value={sol.slug}
                  defaultChecked={linkedSolutionSet.has(sol.slug)}
                />
                {sol.title || sol.slug}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Industries</h3>
          <div className="checks">
            {allIndustries.map((ind) => (
              <label key={ind.slug}>
                <input
                  type="checkbox"
                  name="industries"
                  value={ind.slug}
                  defaultChecked={linkedIndustrySet.has(ind.slug)}
                />
                {ind.title || ind.slug}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Media</h3>
          <p className="muted">One per line: kind|url|label (kinds: hero, image, document, gallery)</p>
          <div className="field">
            <textarea name="media_lines" defaultValue={mediaLines} style={{ minHeight: 180 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn primary" type="submit">
            Save product
          </button>
        </div>
      </form>

      <form action={remove} style={{ marginTop: "1.25rem" }}>
        <button className="btn danger" type="submit">
          Delete product
        </button>
      </form>
    </Shell>
  );
}
