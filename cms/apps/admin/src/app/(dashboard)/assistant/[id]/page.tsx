import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAssistantChatAction } from "@/app/actions/assistant";
import { requireAuth, Shell } from "@/components/shell";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import {
  getAssistantChat,
  listAssistantMessages,
  listAssistantRequestsForChat,
} from "@/lib/assistant-store";

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", { hour12: false });
  } catch {
    return iso;
  }
}

function kindLabel(kind: string) {
  if (kind === "purchase") return "Sales / quote";
  if (kind === "lab") return "Service call";
  return kind || "Request";
}

function kindMeta(kind: string, role: string) {
  if (kind === "ui") return role === "user" ? "choice / reply" : "bot copy";
  if (kind === "form") return "form";
  if (kind === "gemini") return "AI";
  if (kind === "system") return "system";
  return kind ? kind : "AI";
}

export default async function AssistantChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const chat = await getAssistantChat(id);
  if (!chat) notFound();
  const [messages, linkedRequests] = await Promise.all([
    listAssistantMessages(id),
    listAssistantRequestsForChat(id),
  ]);

  return (
    <Shell title={chat.name || "Conversation"} path={`/assistant/${id}`} backHref="/assistant?tab=calls" backLabel="Calls">
      <div className="stats-grid" style={{ marginBottom: "1rem" }}>
        <div className="card stat-card">
          <div className="muted">Phone</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {chat.contact || "—"}
          </div>
        </div>
        {chat.email ? (
          <div className="card stat-card">
            <div className="muted">Email</div>
            <div className="stat-value" style={{ fontSize: "1.15rem" }}>
              {chat.email}
            </div>
          </div>
        ) : null}
        {chat.authProvider === "google" || chat.googleUid ? (
          <div className="card stat-card">
            <div className="muted">Google</div>
            <div className="stat-value" style={{ fontSize: "1rem" }}>
              {chat.email || chat.googleUid || "signed in"}
            </div>
          </div>
        ) : null}
        <div className="card stat-card">
          <div className="muted">Device</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {chat.device || "LT22"}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Channel</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {chat.channel === "whatsapp" ? "WhatsApp" : "Web"}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Status</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {chat.handedOff ? "Handed off" : "Open"}
          </div>
        </div>
        <div className="card stat-card">
          <div className="muted">Rating</div>
          <div className="stat-value" style={{ fontSize: "1.15rem" }}>
            {chat.rating ? `${chat.rating} ★` : "—"}
          </div>
        </div>
      </div>

      {linkedRequests.length > 0 ? (
        <div className="card card-pad" style={{ marginBottom: "1rem" }}>
          <p className="muted" style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            Linked forms
          </p>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
            {linkedRequests.map((req) => (
              <li key={req.id} style={{ marginBottom: "0.35rem" }}>
                <Link href={`/assistant/requests/${req.id}`}>
                  {kindLabel(req.kind)} · {req.status || "new"} · {fmt(req.createdAt)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="card card-pad">
        <p className="muted" style={{ marginTop: 0 }}>
          Started {fmt(chat.createdAt)} · Updated {fmt(chat.updatedAt)}
        </p>
        <div className="assistant-thread">
          {messages.length === 0 ? (
            <div>
              <p className="muted" style={{ marginBottom: "0.5rem" }}>
                No chat messages were saved for this conversation.
              </p>
              {linkedRequests.length > 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  A form was submitted — open it under Linked forms above, or in the{" "}
                  <Link href="/assistant?tab=requests">Requests</Link> tab.
                </p>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Service-call and purchase forms also appear in the{" "}
                  <Link href="/assistant?tab=requests">Requests</Link> tab.
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`assistant-msg assistant-msg-${message.role === "user" ? "user" : "bot"}`}
              >
                <div className="assistant-msg-meta">
                  {message.role === "user" ? "Visitor" : "Assistant"} ·{" "}
                  {kindMeta(message.kind, message.role)} · {fmt(message.createdAt)}
                  {message.photoPath ? " · photo attached" : ""}
                  {message.figureIds.length ? ` · figures ${message.figureIds.join(", ")}` : ""}
                </div>
                <div className="assistant-msg-body" style={{ whiteSpace: "pre-wrap" }}>
                  {message.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDeleteForm
        action={deleteAssistantChatAction}
        confirmMessage="Permanently delete this conversation and all messages? This cannot be undone."
        hiddenFields={{ id: chat.id }}
      >
        Delete conversation permanently
      </ConfirmDeleteForm>
    </Shell>
  );
}
