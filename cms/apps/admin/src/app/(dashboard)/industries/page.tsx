import Link from "next/link";
import { industries, industryTranslations } from "@ddc/db";
import { sql } from "@ddc/db";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function IndustriesPage() {
  await requireAuth();
  const db = await getDb();
  const rows = await db
    .select({
      slug: industries.slug,
      enabled: industries.enabled,
      title: industryTranslations.title,
    })
    .from(industries)
    .leftJoin(
      industryTranslations,
      sql`${industryTranslations.industryId} = ${industries.id} AND ${industryTranslations.lang} = 'en'`,
    )
    .orderBy(industries.sortOrder);

  return (
    <Shell title="Industries" path="/industries">
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Industry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug}>
                <td>
                  <strong>{row.title || row.slug}</strong>
                  <div className="muted">{row.slug}</div>
                </td>
                <td>
                  {row.enabled ? <span className="badge">on</span> : <span className="badge off">off</span>}
                </td>
                <td>
                  <Link className="btn" href={`/industries/${row.slug}`}>
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
