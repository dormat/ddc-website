import Link from "next/link";
import { requireArea, Shell } from "@/components/shell";
import { AssistantChatsTable } from "@/components/assistant-chats-table";
import { AssistantRequestsTable } from "@/components/assistant-requests-table";
import { listAssistantChats, listAssistantRequests, loadAssistantNotes } from "@/lib/assistant-store";

function countBy(values: string[]) {
  const out: Record<string, number> = {};
  for (const value of values) {
    const key = value || "—";
    out[key] = (out[key] || 0) + 1;
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}

function hoursBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return (b - a) / 3_600_000;
}

function avgHours(values: Array<number | null>): string {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return "—";
  return (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1);
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; deleted?: string; bulk?: string }>;
}) {
  await requireArea("assistant");
  const sp = await searchParams;
  const tab =
    sp.tab === "calls" ? "calls" : sp.tab === "requests" ? "requests" : "dash";
  const [chats, notes, requests] = await Promise.all([
    listAssistantChats(),
    loadAssistantNotes(),
    listAssistantRequests(),
  ]);
  const turns = chats.reduce((sum, chat) => sum + chat.messageCount, 0);
  const handed = chats.filter((chat) => chat.handedOff).length;
  const rated = chats.filter((chat) => chat.rating > 0);
  const avgRating = rated.length
    ? (rated.reduce((sum, chat) => sum + chat.rating, 0) / rated.length).toFixed(1)
    : "—";
  const ratingBuckets = [5, 4, 3, 2, 1].map((stars) => [
    `${stars} ★`,
    rated.filter((chat) => chat.rating === stars).length,
  ] as const);
  const maxRatingBucket = Math.max(1, ...ratingBuckets.map(([, n]) => n));
  const devices = countBy(chats.map((chat) => chat.device || "LT22"));
  const channels = countBy(chats.map((chat) => (chat.channel === "whatsapp" ? "WhatsApp" : "Web")));
  const maxDevice = Math.max(1, ...devices.map(([, n]) => n));
  const newRequests = requests.filter((r) => (r.status || "new") === "new").length;
  const openStatuses = new Set(["new", "acknowledged", "in_progress"]);
  const openRequests = requests.filter((r) => openStatuses.has(r.status || "new")).length;
  const doneRequests = requests.filter((r) => r.status === "done").length;
  const purchaseCount = requests.filter((r) => r.kind === "purchase").length;
  const labCount = requests.filter((r) => r.kind === "lab").length;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inWeek = (iso: string | null) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return Number.isFinite(t) && t >= weekAgo;
  };
  const weekPurchases = requests.filter((r) => r.kind === "purchase" && inWeek(r.createdAt)).length;
  const weekLab = requests.filter((r) => r.kind === "lab" && inWeek(r.createdAt)).length;
  const hotLeads = requests.filter((r) => r.hotLead).length;
  const csatRated = requests.filter((r) => (r.csat?.rating || 0) > 0);
  const avgCsat = csatRated.length
    ? (csatRated.reduce((sum, r) => sum + (r.csat?.rating || 0), 0) / csatRated.length).toFixed(1)
    : "—";
  const avgAckHours = avgHours(
    requests.map((r) => hoursBetween(r.createdAt, r.acknowledgedAt)),
  );
  const avgDoneHours = avgHours(requests.map((r) => hoursBetween(r.createdAt, r.doneAt)));
  const topEquipment = countBy(
    requests
      .filter((r) => r.kind === "lab")
      .map((r) => r.fields.equipmentType || r.fields.product || r.fields.device || "—"),
  ).slice(0, 8);
  const maxEquip = Math.max(1, ...topEquipment.map(([, n]) => n));

  return (
    <Shell
      title="Assistant"
      path="/assistant"
      actions={
        <Link className="btn primary" href="/assistant/notes">
          Edit notes
        </Link>
      }
    >
      {sp.deleted ? <p className="flash-ok">Deleted permanently.</p> : null}
      {sp.bulk ? <p className="flash-ok">Bulk update saved.</p> : null}

      <div className="assistant-tabs">
        <Link className={tab === "dash" ? "on" : undefined} href="/assistant">
          Dashboard
        </Link>
        <Link className={tab === "calls" ? "on" : undefined} href="/assistant?tab=calls">
          תמיכה טכנית
        </Link>
        <Link className={tab === "requests" ? "on" : undefined} href="/assistant?tab=requests">
          מכירות / קריאות שירות{newRequests ? ` (${newRequests})` : ""}
        </Link>
        <Link href="/assistant/notes">Notes</Link>
        <Link href="/settings">Follow-up settings</Link>
      </div>

      {tab === "dash" ? (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="muted">This week · purchase / lab</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>
                {weekPurchases} / {weekLab}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Open / done</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>
                {openRequests} / {doneRequests}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Avg CSAT</div>
              <div className="stat-value">
                {avgCsat}
                {avgCsat !== "—" ? " ★" : ""}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Hot leads</div>
              <div className="stat-value">{hotLeads}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Avg hours to ack</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>
                {avgAckHours}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Avg hours to done</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>
                {avgDoneHours}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Conversations</div>
              <div className="stat-value">{chats.length}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Question turns</div>
              <div className="stat-value">{turns}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Handed to a person</div>
              <div className="stat-value">{handed}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Chat ratings</div>
              <div className="stat-value">{rated.length}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Avg chat rating</div>
              <div className="stat-value">{avgRating}{avgRating !== "—" ? " ★" : ""}</div>
            </div>
            <div className="card stat-card">
              <div className="muted">Purchase / lab (all)</div>
              <div className="stat-value" style={{ fontSize: "1.15rem" }}>
                {purchaseCount} / {labCount}
              </div>
            </div>
            <div className="card stat-card">
              <div className="muted">Extra notes</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {notes.text.trim() ? "On" : "Empty"}
              </div>
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: "1rem" }}>
            <h3 className="card-title">Top equipment / products by lab faults</h3>
            {topEquipment.length === 0 ? (
              <p className="muted">No lab requests yet.</p>
            ) : (
              topEquipment.map(([label, n]) => (
                <div className="assistant-bar" key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${(n / maxEquip) * 55}%` }} />
                  <span>{n}</span>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad" style={{ marginTop: "1rem" }}>
            <h3 className="card-title">Chat ratings</h3>
            {rated.length === 0 ? (
              <p className="muted">No star ratings yet.</p>
            ) : (
              ratingBuckets.map(([label, n]) => (
                <div className="assistant-bar" key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${(n / maxRatingBucket) * 55}%` }} />
                  <span>{n}</span>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad" style={{ marginTop: "1rem" }}>
            <h3 className="card-title">By device</h3>
            {devices.length === 0 ? (
              <p className="muted">No conversations yet.</p>
            ) : (
              devices.map(([label, n]) => (
                <div className="assistant-bar" key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${(n / maxDevice) * 55}%` }} />
                  <span>{n}</span>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad" style={{ marginTop: "1rem" }}>
            <h3 className="card-title">By channel</h3>
            {channels.length === 0 ? (
              <p className="muted">No conversations yet.</p>
            ) : (
              channels.map(([label, n]) => (
                <div className="assistant-bar" key={label}>
                  <span>{label}</span>
                  <i style={{ width: `${(n / Math.max(1, chats.length)) * 55}%` }} />
                  <span>{n}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : tab === "requests" ? (
        <AssistantRequestsTable requests={requests} />
      ) : (
        <AssistantChatsTable chats={chats} />
      )}
    </Shell>
  );
}
