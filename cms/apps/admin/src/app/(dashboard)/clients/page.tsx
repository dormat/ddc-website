import Link from "next/link";
import { syncAssistantClientsAction } from "@/app/actions/clients";
import { SubmitButton } from "@/components/submit-button";
import { requireArea, Shell } from "@/components/shell";
import { listClients, STAGE_LABELS, type ClientSource, type ClientStage } from "@/lib/crm-store";
import { isClientStage } from "@/lib/crm-store";
import { listMembers } from "@/lib/members-store";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireArea("clients");
  const sp = await searchParams;
  const stage = one(sp.stage);
  const owner = one(sp.owner);
  const source = one(sp.source);
  const [clients, members] = await Promise.all([listClients(), listMembers()]);
  const memberName = new Map(members.map((member) => [member.id, member.name || member.email]));
  const filtered = clients.filter((client) => {
    if (stage && client.stage !== stage) return false;
    if (owner === "unassigned" && client.ownerMemberId) return false;
    if (owner && owner !== "unassigned" && client.ownerMemberId !== owner) return false;
    if (source && client.source !== source) return false;
    return true;
  });

  return (
    <Shell
      title="Clients"
      actions={
        <>
          <Link className="btn" href="/clients/import">
            Import CSV
          </Link>
          <Link className="btn primary" href="/clients/new">
            Add client
          </Link>
        </>
      }
    >
      {sp.imported || sp.updated ? (
        <p className="flash-ok">
          Imported {one(sp.imported) || "0"} new, updated {one(sp.updated) || "0"}.
        </p>
      ) : null}
      {sp.synced ? <p className="flash-ok">Synced {one(sp.synced)} assistant records.</p> : null}

      <div className="filters">
        <form className="filters" method="get">
          <select name="stage" defaultValue={stage}>
            <option value="">All stages</option>
            {(Object.keys(STAGE_LABELS) as ClientStage[]).map((key) => (
              <option key={key} value={key}>
                {STAGE_LABELS[key]}
              </option>
            ))}
          </select>
          <select name="owner" defaultValue={owner}>
            <option value="">All owners</option>
            <option value="unassigned">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
              </option>
            ))}
          </select>
          <select name="source" defaultValue={source}>
            <option value="">All sources</option>
            <option value="assistant">Assistant</option>
            <option value="manual">Manual</option>
            <option value="csv">CSV</option>
          </select>
          <button className="btn" type="submit">
            Filter
          </button>
        </form>
        <form action={syncAssistantClientsAction}>
          <SubmitButton className="btn" pendingLabel="Syncing…">
            Sync from assistant
          </SubmitButton>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Stage</th>
              <th>Owner</th>
              <th>Source</th>
              <th>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id}>
                <td>
                  <Link href={`/clients/${encodeURIComponent(client.id)}`}>
                    <strong>{client.name || client.company || client.email || "Untitled"}</strong>
                  </Link>
                  <div className="muted">{[client.company, client.email, client.phone].filter(Boolean).join(" · ")}</div>
                </td>
                <td>{isClientStage(client.stage) ? STAGE_LABELS[client.stage] : client.stage}</td>
                <td>{client.ownerMemberId ? memberName.get(client.ownerMemberId) || "Unknown" : "Unassigned"}</td>
                <td>{client.source as ClientSource}</td>
                <td>{client.nextFollowUp || "—"}</td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={5} className="muted">
                  No clients match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
