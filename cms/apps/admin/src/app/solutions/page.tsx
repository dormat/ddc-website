import Link from "next/link";
import { solutions, solutionTranslations } from "@ddc/db";
import { sql } from "@ddc/db";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function SolutionsPage() {
  await requireAuth();
  const db = await getDb();
  const rows = await db
    .select({
      slug: solutions.slug,
      enabled: solutions.enabled,
      group: solutions.practiceGroup,
      title: solutionTranslations.title,
    })
    .from(solutions)
    .leftJoin(
      solutionTranslations,
      sql`${solutionTranslations.solutionId} = ${solutions.id} AND ${solutionTranslations.lang} = 'en'`,
    )
    .orderBy(solutions.sortOrder);

  return (
    <Shell title="Solutions" path="/solutions">
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Solution</th>
              <th>Group</th>
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
                <td>{row.group}</td>
                <td>
                  {row.enabled ? <span className="badge">on</span> : <span className="badge off">off</span>}
                </td>
                <td>
                  <Link className="btn" href={`/solutions/${row.slug}`}>
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
