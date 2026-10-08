import Link from "next/link";
import { notFound } from "next/navigation";
import { addClientNoteAction, updateClientAction } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";
import { SubmitButton } from "@/components/submit-button";
import { requireArea, Shell } from "@/components/shell";
import { getClient, listActivity, STAGE_LABELS } from "@/lib/crm-store";
import { listMembers } from "@/lib/members-store";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireArea("clients");
  const { id } = await params;
  const sp = await searchParams;
  const [client, activity, members] = await Promise.all([
    getClient(id),
    listActivity(id),
    listMembers(),
  ]);
  if (!client) notFound();
  const memberName = new Map(members.map((member) => [member.id, member.name || member.email]));

  return (
    <Shell title={client.name || client.company || client.email || "Client"} backHref="/clients" backLabel="Clients">
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      {sp.error ? <p className="error">{sp.error}</p> : null}
      <p className="muted" style={{ marginTop: 0 }}>
        Source: {client.source}
        {client.assistantChatIds.length
          ? ` · ${client.assistantChatIds.map((chatId) => chatId).length} assistant chat${client.assistantChatIds.length === 1 ? "" : "s"}`
          : ""}
      </p>
      {client.assistantChatIds.length || client.assistantRequestIds.length ? (
        <p className="link-row">
          {client.assistantChatIds.map((chatId) => (
            <Link key={chatId} href={`/assistant/${chatId}`}>
              Chat
            </Link>
          ))}
          {client.assistantRequestIds.map((requestId) => (
            <Link key={requestId} href={`/assistant/requests/${requestId}`}>
              Request
            </Link>
          ))}
        </p>
      ) : null}
      <ClientForm
        action={updateClientAction.bind(null, client.id)}
        client={client}
        members={members}
        submitLabel="Save client"
      />
      <div className="card card-pad" style={{ marginTop: "1rem", maxWidth: 640 }}>
        <h3>Activity</h3>
        <form action={addClientNoteAction.bind(null, client.id)} className="stack-form">
          <div className="field">
            <label htmlFor="note">Add a note</label>
            <textarea id="note" name="note" rows={3} />
          </div>
          <SubmitButton className="btn" pendingLabel="Adding…">
            Add note
          </SubmitButton>
        </form>
        <ul className="activity-list">
          {activity.map((entry) => (
            <li key={entry.id}>
              <div>{entry.text}</div>
              <div className="muted">
                {entry.type}
                {entry.memberEmail ? ` · ${memberName.get(entry.memberId) || entry.memberEmail}` : ""}
                {entry.at ? ` · ${new Date(entry.at).toLocaleString()}` : ""}
              </div>
            </li>
          ))}
          {!activity.length ? <li className="muted">No activity yet.</li> : null}
        </ul>
      </div>
      <p className="muted">Stage: {STAGE_LABELS[client.stage]}</p>
    </Shell>
  );
}
