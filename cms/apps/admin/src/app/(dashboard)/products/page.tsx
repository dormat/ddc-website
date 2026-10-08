import Link from "next/link";
import { products, productTranslations } from "@ddc/db";
import { sql } from "@ddc/db";
import { createProductAction, toggleProductVisibilityAction } from "@/app/actions/products";
import { SubmitButton } from "@/components/submit-button";
import { requireArea, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function ProductsPage() {
  await requireArea("website");
  const db = await getDb();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      enabled: products.enabled,
      enabledHe: products.enabledHe,
      enabledEn: products.enabledEn,
      enabledEs: products.enabledEs,
      title: productTranslations.title,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      sql`${productTranslations.productId} = ${products.id} AND ${productTranslations.lang} = 'en'`,
    )
    .orderBy(products.sortOrder, products.slug);

  return (
    <Shell
      title="Products"
      path="/products"
      actions={
        <details>
          <summary className="btn primary">Add product</summary>
          <form
            action={createProductAction}
            className="card card-pad"
            style={{ marginTop: "0.5rem", minWidth: 280 }}
          >
            <div className="field">
              <label>Slug</label>
              <input name="slug" placeholder="elnet-new-meter" required />
            </div>
            <div className="field">
              <label>Title (EN)</label>
              <input name="title" placeholder="New product" />
            </div>
            <div className="form-actions">
              <SubmitButton pendingLabel="Creating…">Create</SubmitButton>
            </div>
          </form>
        </details>
      }
    >
      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        Hide a product from the website with Hide — it stays in admin and can be shown again later.
      </p>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>On website</th>
              <th>Languages</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const toggle = toggleProductVisibilityAction.bind(null, row.slug);
              return (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title || row.slug}</strong>
                    <div className="muted">{row.slug}</div>
                  </td>
                  <td>
                    {row.enabled ? (
                      <span className="badge">visible</span>
                    ) : (
                      <span className="badge off">hidden</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${row.enabledHe ? "" : "off"}`}>he</span>
                    <span className={`badge ${row.enabledEn ? "" : "off"}`}>en</span>
                    <span className={`badge ${row.enabledEs ? "" : "off"}`}>es</span>
                  </td>
                  <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <form action={toggle}>
                      <input type="hidden" name="enabled" value={row.enabled ? "0" : "1"} />
                      <SubmitButton
                        className="btn"
                        pendingLabel={row.enabled ? "Hiding…" : "Showing…"}
                      >
                        {row.enabled ? "Hide" : "Show"}
                      </SubmitButton>
                    </form>
                    <Link className="btn" href={`/products/${row.slug}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
