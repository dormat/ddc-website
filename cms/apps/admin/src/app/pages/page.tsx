import Link from "next/link";
import { pages, pageTranslations } from "@ddc/db";
import { sql } from "@ddc/db";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function PagesPage() {
  await requireAuth();
  const db = await getDb();
  const rows = await db
    .select({
      key: pages.key,
      enabled: pages.enabled,
      title: pageTranslations.title,
    })
    .from(pages)
    .leftJoin(
      pageTranslations,
      sql`${pageTranslations.pageId} = ${pages.id} AND ${pageTranslations.lang} = 'en'`,
    )
    .orderBy(pages.key);

  return (
    <Shell title="Pages" path="/pages">
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>
                  <strong>{row.title || row.key}</strong>
                  <div className="muted">{row.key}</div>
                </td>
                <td>
                  {row.enabled ? <span className="badge">on</span> : <span className="badge off">off</span>}
                </td>
                <td>
                  <Link className="btn" href={`/pages/${row.key}`}>
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
