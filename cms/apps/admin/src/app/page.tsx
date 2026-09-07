import Link from "next/link";
import { products, productTranslations, solutions } from "@ddc/db";
import { count, eq, sql } from "@ddc/db";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function DashboardPage() {
  await requireAuth();
  const db = await getDb();

  const [productCount] = await db.select({ n: count() }).from(products);
  const [solutionCount] = await db.select({ n: count() }).from(solutions);
  const enabledProducts = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.enabled, true));

  const sample = await db
    .select({
      slug: products.slug,
      title: productTranslations.title,
      enabled: products.enabled,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      sql`${productTranslations.productId} = ${products.id} AND ${productTranslations.lang} = 'en'`,
    )
    .orderBy(products.sortOrder)
    .limit(8);

  return (
    <Shell title="Dashboard" path="/">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div className="muted">Products</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{productCount.n}</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div className="muted">Enabled products</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{enabledProducts[0].n}</div>
        </div>
        <div className="card" style={{ padding: "1rem" }}>
          <div className="muted">Solutions</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{solutionCount.n}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <table>
          <thead>
            <tr>
              <th>Sample products</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sample.map((row) => (
              <tr key={row.slug}>
                <td>
                  <strong>{row.title || row.slug}</strong>
                  <div className="muted">{row.slug}</div>
                </td>
                <td>
                  {row.enabled ? (
                    <span className="badge">enabled</span>
                  ) : (
                    <span className="badge off">disabled</span>
                  )}
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
