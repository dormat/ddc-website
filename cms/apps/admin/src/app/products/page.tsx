import Link from "next/link";
import { products, productTranslations } from "@ddc/db";
import { sql } from "@ddc/db";
import { createProductAction } from "@/app/actions/products";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function ProductsPage() {
  await requireAuth();
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
          <form action={createProductAction} className="card" style={{ padding: "1rem", marginTop: "0.5rem" }}>
            <div className="field">
              <label>Slug</label>
              <input name="slug" placeholder="elnet-new-meter" required />
            </div>
            <div className="field">
              <label>Title (EN)</label>
              <input name="title" placeholder="New product" />
            </div>
            <button className="btn primary" type="submit">
              Create
            </button>
          </form>
        </details>
      }
    >
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Enabled</th>
              <th>Languages</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.title || row.slug}</strong>
                  <div className="muted">{row.slug}</div>
                </td>
                <td>
                  {row.enabled ? (
                    <span className="badge">on</span>
                  ) : (
                    <span className="badge off">off</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${row.enabledHe ? "" : "off"}`}>he</span>
                  <span className={`badge ${row.enabledEn ? "" : "off"}`}>en</span>
                  <span className={`badge ${row.enabledEs ? "" : "off"}`}>es</span>
                </td>
                <td>
                  <Link className="btn" href={`/products/${row.slug}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
