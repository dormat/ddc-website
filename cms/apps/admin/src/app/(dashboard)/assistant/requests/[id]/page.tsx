import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, Shell } from "@/components/shell";
import { deleteAssistantRequestAction, updateAssistantRequestAction } from "@/app/actions/assistant";
import { getAssistantRequest } from "@/lib/assistant-store";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { SubmitButton } from "@/components/submit-button";

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", { hour12: false });
  } catch {
    return iso;
  }
}

const FIELD_LABELS: Record<string, string> = {
  serialNumber: "מספר קריאה / Serial",
  fullName: "Full name",
  companyName: "Company",
  companyId: "Company / national ID",
  nationalId: "Company / national ID",
  email: "Email",
  phone: "Phone",
  country: "Country",
  product: "Product",
  quantity: "Quantity",
  products: "Products",
  notes: "Notes",
  openedAt: "Service call opened (תאריך פתיחה)",
  serviceCallDate: "Service call opened (תאריך פתיחה)",
  serviceAgreement: "Service agreement (הסכם שירות)",
  siteName: "Site / project",
  contactName: "Contact",
  deliveryDate: "Delivery date",
  equipmentType: "Equipment",
  model: "Model",
  faultDescription: "Fault description",
  signerName: "Signer",
  device: "Device in chat",
  marketingConsent: "Marketing consent",
  paymentTermsAccepted: "Payment terms accepted",
  overtimeTermsAccepted: "Overtime terms accepted",
  repeatCallTermsAccepted: "Repeat-call terms accepted",
  travelParkingTermsAccepted: "Travel and parking terms accepted",
};

function kindLabel(kind: string) {
  if (kind === "purchase") return "Sales / quote";
  if (kind === "lab") return "Service call";
  return kind || "Request";
}

export default async function AssistantRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireArea("assistant");
  const { id } = await params;
  const sp = await searchParams;
  const req = await getAssistantRequest(id);
  if (!req) notFound();

  const products = Array.isArray(req.fields.products) ? req.fields.products : null;
  const fieldEntries = Object.entries(req.fields)
    .filter(([key, v]) => {
      if (key === "products") return Array.isArray(v) && v.length > 0;
      if (products && products.length > 0 && (key === "product" || key === "quantity")) return false;
      if (Array.isArray(v)) return v.length > 0;
      return String(v || "").trim();
    })
    .map(([key, v]) => {
      if (key === "products" && Array.isArray(v)) {
        const lines = v
          .map((item) => {
            if (!item || typeof item !== "object") return "";
            const row = item as { product?: string; quantity?: string };
            const name = String(row.product || "").trim();
            const qty = String(row.quantity || "").trim();
            if (!name) return "";
            return qty ? `${name} × ${qty}` : name;
          })
          .filter(Boolean);
        return [key, lines.join("\n")] as [string, string];
      }
      return [key, String(v ?? "")] as [string, string];
    });
  const csat = req.csat;

  return (
    <Shell
      title={kindLabel(req.kind)}
      path={`/assistant/requests/${id}`}
      backHref="/assistant?tab=requests"
      backLabel="Requests"
    >
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}

      <div className="stats-grid" style={{ marginBottom: "1rem" }}>
        {req.serialNumber || req.fields.serialNumber ? (
          <div className="card stat-card">
            <div className="muted">מספר קריאה</div>
            <div className="stat-value" style={{ fontSize: "1.15rem" }}>
              {req.serialNumber || req.fields.serialNumber}
            </div>
          </div>
        ) : null}
        <div className="card stat-card">
          <div className="muted">Status</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {req.status || "new"}
            {req.hotLead ? " · 🔥 hot" : ""}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Created</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            {fmt(req.createdAt)}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Acknowledged</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            {fmt(req.acknowledgedAt)}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Done at</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            {fmt(req.doneAt)}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Emails</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            service {req.emailService ? "✓" : "—"} · customer {req.emailCustomer ? "✓" : "—"}
            {req.emailChannel ? ` (${req.emailChannel})` : ""}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Marketing consent</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {req.marketingConsent ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {csat ? (
        <div className="card card-pad" style={{ marginBottom: "1rem" }}>
          <h3 className="card-title">CSAT</h3>
          <dl className="assistant-dl">
            <div>
              <dt>Resolved (thumbs)</dt>
              <dd>
                {csat.resolved === null ? "—" : csat.resolved ? "👍 Yes" : "👎 No"}
              </dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{csat.rating ? `${csat.rating} / 5` : "—"}</dd>
            </div>
            <div>
              <dt>Comment</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{csat.comment || "—"}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{fmt(csat.submittedAt)}</dd>
            </div>
            <div>
              <dt>Invite sent</dt>
              <dd>{fmt(req.csatInviteSentAt)}</dd>
            </div>
          </dl>
        </div>
      ) : req.csatInviteSentAt ? (
        <div className="card card-pad" style={{ marginBottom: "1rem" }}>
          <h3 className="card-title">CSAT</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            Invite sent {fmt(req.csatInviteSentAt)} — waiting for reply.
          </p>
        </div>
      ) : null}

      <div className="card card-pad" style={{ marginBottom: "1rem" }}>
        <h3 className="card-title">Submitted fields</h3>
        {fieldEntries.length === 0 ? (
          <p className="muted">No fields stored.</p>
        ) : (
          <dl className="assistant-dl">
            {fieldEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{FIELD_LABELS[key] || key}</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {req.conversationId ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Chat:{" "}
            <Link href={`/assistant/${req.conversationId}`}>{req.conversationId.slice(0, 10)}…</Link>
          </p>
        ) : null}
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Admin</h3>
        <form action={updateAssistantRequestAction} className="stack-form">
          <input type="hidden" name="id" value={req.id} />
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={req.status || "new"}>
              <option value="new">new</option>
              <option value="acknowledged">acknowledged</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="closed">closed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="adminNotes">Details / notes</label>
            <textarea
              id="adminNotes"
              name="adminNotes"
              rows={6}
              defaultValue={req.adminNotes}
              placeholder="Internal notes, quote details, follow-up…"
            />
          </div>
          <label className="check-row">
            <input type="checkbox" name="acknowledge" value="1" defaultChecked={!req.acknowledgedAt} />
            Mark acknowledged now
          </label>
          {req.kind === "purchase" ? (
            <label className="check-row">
              <input
                type="checkbox"
                name="quoteSent"
                value="1"
                defaultChecked={Boolean(req.quoteSentAt)}
                disabled={Boolean(req.quoteSentAt)}
              />
              Quote sent
              {req.quoteSentAt ? ` (${fmt(req.quoteSentAt)})` : " — starts 3/7/14 day follow-ups"}
            </label>
          ) : null}
          {req.kind === "purchase" && req.quoteSentAt ? (
            <p className="muted" style={{ marginTop: 0 }}>
              Follow-ups: day3 {req.quoteFollowup3Sent ? "✓" : "—"} · day7{" "}
              {req.quoteFollowup7Sent ? "✓" : "—"} · day14 {req.quoteFollowup14Sent ? "✓" : "—"}
            </p>
          ) : null}
          <div className="form-actions">
            <SubmitButton>Save</SubmitButton>
          </div>
        </form>
      </div>

      <ConfirmDeleteForm
        action={deleteAssistantRequestAction}
        confirmMessage="Permanently delete this request from the database? This cannot be undone."
        hiddenFields={{ id: req.id }}
      >
        Delete request permanently
      </ConfirmDeleteForm>
    </Shell>
  );
}
