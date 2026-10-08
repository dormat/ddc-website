import { settings } from "@ddc/db";
import { saveSettingsAction } from "@/app/actions/pages";
import { saveAssistantFollowupSettingsAction } from "@/app/actions/assistant";
import { SubmitButton } from "@/components/submit-button";
import { requireAnyArea, Shell } from "@/components/shell";
import { getDb } from "@/lib/db";
import { loadAssistantFollowupSettings } from "@/lib/assistant-store";
import { memberCan } from "@/lib/members-store";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; assistant?: string }>;
}) {
  const member = await requireAnyArea(["website", "assistant"]);
  const sp = await searchParams;
  const website = memberCan(member, "website");
  const assistant = memberCan(member, "assistant");
  const map: Record<string, string> = {};
  if (website) {
    const db = await getDb();
    const rows = await db.select().from(settings);
    for (const row of rows) map[row.key] = row.value;
  }
  const followup = assistant ? await loadAssistantFollowupSettings() : null;

  return (
    <Shell title="Settings" path="/settings">
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      {website ? (
        <form action={saveSettingsAction} className="card card-pad" style={{ maxWidth: 520 }}>
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
          <div className="form-actions">
            <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
          </div>
        </form>
      ) : null}

      {followup ? (
        <form
          action={saveAssistantFollowupSettingsAction}
          className="card card-pad"
          style={{ maxWidth: 520, marginTop: website ? "1.25rem" : 0 }}
        >
          <h3 className="card-title">Assistant follow-up</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Shown after a positive CSAT (4–5) when the customer opted into marketing.
          </p>
          <div className="field">
            <label htmlFor="googleReviewUrl">Google review URL</label>
            <input
              id="googleReviewUrl"
              name="googleReviewUrl"
              defaultValue={followup.googleReviewUrl}
              placeholder="https://g.page/r/…"
            />
          </div>
          <div className="field">
            <label htmlFor="upsellTitle">Upsell title</label>
            <input id="upsellTitle" name="upsellTitle" defaultValue={followup.upsellTitle} />
          </div>
          <div className="field">
            <label htmlFor="upsellUrl">Upsell URL</label>
            <input id="upsellUrl" name="upsellUrl" defaultValue={followup.upsellUrl} />
          </div>
          <div className="field">
            <label htmlFor="upsellBlurb">Upsell blurb</label>
            <textarea id="upsellBlurb" name="upsellBlurb" rows={3} defaultValue={followup.upsellBlurb} />
          </div>
          {followup.updatedAt ? (
            <p className="muted">Last saved {new Date(followup.updatedAt).toLocaleString()}</p>
          ) : null}
          <div className="form-actions">
            <SubmitButton pendingLabel="Saving…">Save assistant settings</SubmitButton>
          </div>
        </form>
      ) : null}
    </Shell>
  );
}
