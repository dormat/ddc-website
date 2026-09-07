import { settings } from "@ddc/db";
import { saveSettingsAction } from "@/app/actions/pages";
import { requireAuth, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const db = await getDb();
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <Shell title="Settings" path="/settings">
      {sp.saved ? <p className="muted">Saved.</p> : null}
      <form action={saveSettingsAction} className="card" style={{ padding: "1rem", maxWidth: 520 }}>
        <div className="field">
          <label>Brand name</label>
          <input name="brand_name" defaultValue={map.brand_name || ""} />
        </div>
        <div className="field">
          <label>Contact phone</label>
          <input name="contact_phone" defaultValue={map.contact_phone || ""} />
        </div>
        <div className="field">
          <label>Contact email</label>
          <input name="contact_email" defaultValue={map.contact_email || ""} />
        </div>
        <button className="btn primary" type="submit">
          Save settings
        </button>
      </form>
    </Shell>
  );
}
