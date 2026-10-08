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
import { ProductMediaEditor, type EditableMedia } from "@/components/product-media-editor";
import { SubmitButton } from "@/components/submit-button";
import { requireArea, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireArea("website");
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

  const mediaItems: EditableMedia[] = media.map((m) => ({
    kind: m.kind,
    url: m.url,
    urlHe: m.urlHe || "",
    urlEn: m.urlEn || "",
    urlEs: m.urlEs || "",
    alt: m.alt || "",
    label: m.label || "",
    sortOrder: m.sortOrder,
    enabled: m.enabled ?? true,
    enabledHe: m.enabledHe ?? true,
    enabledEn: m.enabledEn ?? true,
    enabledEs: m.enabledEs ?? true,
  }));
  const save = saveProductAction.bind(null, slug);
  const remove = deleteProductAction.bind(null, slug);

  return (
    <Shell
      title={`Edit: ${byLang.en?.title || slug}`}
      path="/products"
      backHref="/products"
      backLabel="Back to products"
    >
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      <form action={save} className="form-grid">
        <div className="card card-pad">
          <div className="muted" style={{ marginBottom: "0.75rem" }}>
            Slug: <code>{slug}</code>
          </div>
          <div className="checks">
            <label>
              <input type="checkbox" name="enabled" defaultChecked={product.enabled} />{" "}
              Show on website
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
          <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
            Uncheck &ldquo;Show on website&rdquo; to hide this product from the public site without
            deleting it. Language checkboxes hide it in one locale only.
          </p>
        </div>

        {(["en", "he", "es"] as const).map((lang) => (
          <div className="card card-pad" key={lang}>
            <h3>{lang.toUpperCase()}</h3>
            <div className="field">
              <label>Title</label>
              <input name={`title_${lang}`} defaultValue={byLang[lang]?.title || ""} />
            </div>
            <div className="field">
              <label>SEO meta description (optional)</label>
              <input
                name={`description_${lang}`}
                defaultValue={byLang[lang]?.description || ""}
                placeholder="Short summary for Google — not shown on the page"
                maxLength={300}
              />
              <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
                Not visible on the product page. Body below is the on-page text. Leave blank to
                auto-use the first line of the body.
              </p>
            </div>
            <div className="field">
              <label>Body (on-page text — line breaks preserved)</label>
              <textarea
                name={`body_${lang}`}
                rows={16}
                defaultValue={byLang[lang]?.body || ""}
              />
            </div>
          </div>
        ))}

        <div className="card card-pad">
          <h3>Solutions</h3>
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

        <div className="card card-pad">
          <h3>Industries</h3>
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

        <ProductMediaEditor initial={mediaItems} />

        <div className="form-actions">
          <SubmitButton pendingLabel="Saving…">Save product</SubmitButton>
        </div>
      </form>

      <form action={remove} className="form-danger">
        <SubmitButton className="btn danger" pendingLabel="Deleting…">
          Delete product
        </SubmitButton>
      </form>
    </Shell>
  );
}
