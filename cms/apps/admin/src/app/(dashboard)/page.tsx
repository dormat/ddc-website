import Link from "next/link";
import { products, productTranslations, solutions } from "@ddc/db";
import { count, eq, sql } from "@ddc/db";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";
import { memberCan } from "@/lib/members-store";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const member = await requireAuth();
  const sp = await searchParams;
  const website = memberCan(member, "website");
  const assistant = memberCan(member, "assistant");
  const clients = memberCan(member, "clients");

  let productCount = 0;
  let visibleCount = 0;
  let solutionCount = 0;
  let sample: Array<{ slug: string; title: string | null; enabled: boolean }> = [];
  if (website) {
    const db = await getDb();
    const [productsRow] = await db.select({ n: count() }).from(products);
    const [solutionsRow] = await db.select({ n: count() }).from(solutions);
    const enabledProducts = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.enabled, true));
    productCount = productsRow.n;
    solutionCount = solutionsRow.n;
    visibleCount = enabledProducts[0].n;
    sample = await db
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
  }

  return (
    <Shell title="Dashboard" path="/">
      {sp.forbidden ? <p className="error">You do not have access to that area.</p> : null}
      <div className="stats-grid">
        {website ? (
          <>
            <div className="card stat-card">
              <div className="muted">Products</div>
              <div className="stat-value">{productCount}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Visible on website</div>
              <div className="stat-value">{visibleCount}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Solutions</div>
              <div className="stat-value">{solutionCount}</div>
            </div>
          </>
        ) : null}
        {assistant ? (
          <Link href="/assistant" className="card stat-card">
            <div className="muted">Assistant</div>
            <div className="stat-value">Open</div>
          </Link>
        ) : null}
        {clients ? (
          <Link href="/clients" className="card stat-card">
            <div className="muted">Clients</div>
            <div className="stat-value">Open</div>
          </Link>
        ) : null}
      </div>
      {!website && !assistant && !clients ? (
        <p className="muted">An owner has not given this account access to an area yet.</p>
      ) : null}

      {website ? (
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
                      <span className="badge">visible</span>
                    ) : (
                      <span className="badge off">hidden</span>
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
      ) : null}
    </Shell>
  );
}
