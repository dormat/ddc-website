"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bulkDeleteAssistantChatsAction, deleteAssistantChatAction } from "@/app/actions/assistant";
import type { AssistantChat } from "@/lib/assistant-store";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { SubmitButton } from "@/components/submit-button";

type SortKey =
  | "name"
  | "contact"
  | "device"
  | "channel"
  | "messageCount"
  | "rating"
  | "status"
  | "updatedAt";

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("he-IL", { hour12: false });
  } catch {
    return iso;
  }
}

function dayKey(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function channelLabel(channel: string) {
  return channel === "whatsapp" ? "WhatsApp" : "Web";
}

function statusLabel(handedOff: boolean) {
  return handedOff ? "handed off" : "open";
}

export function AssistantChatsTable({ chats }: { chats: AssistantChat[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [device, setDevice] = useState("all");
  const [channel, setChannel] = useState("all");
  const [day, setDay] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const devices = useMemo(() => {
    const set = new Set(chats.map((c) => c.device || "LT22"));
    return Array.from(set).sort();
  }, [chats]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = chats.filter((chat) => {
      if (status === "open" && chat.handedOff) return false;
      if (status === "handed" && !chat.handedOff) return false;
      if (device !== "all" && (chat.device || "LT22") !== device) return false;
      if (channel !== "all") {
        const ch = chat.channel === "whatsapp" ? "whatsapp" : "web";
        if (ch !== channel) return false;
      }
      if (day && dayKey(chat.updatedAt || chat.createdAt) !== day) return false;
      if (!needle) return true;
      return [chat.name, chat.contact, chat.device, chat.channel, chat.id, statusLabel(chat.handedOff)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      if (sortKey === "messageCount" || sortKey === "rating") {
        return ((a[sortKey] || 0) - (b[sortKey] || 0)) * dir;
      }
      if (sortKey === "status") {
        return (Number(a.handedOff) - Number(b.handedOff)) * dir;
      }
      if (sortKey === "channel") {
        return channelLabel(a.channel).localeCompare(channelLabel(b.channel)) * dir;
      }
      if (sortKey === "updatedAt") {
        return (
          String(a.updatedAt || a.createdAt || "").localeCompare(
            String(b.updatedAt || b.createdAt || ""),
          ) * dir
        );
      }
      const av = String(a[sortKey] || "");
      const bv = String(b[sortKey] || "");
      return av.localeCompare(bv, undefined, { sensitivity: "base", numeric: true }) * dir;
    });
    return rows;
  }, [chats, q, status, device, channel, day, sortKey, sortDir]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, on]) => on).map(([id]) => id),
    [selected],
  );
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((chat) => selected[chat.id]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "updatedAt" || key === "messageCount" || key === "rating" ? "desc" : "asc");
  }

  function sortMark(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const next = { ...selected };
      for (const chat of filtered) delete next[chat.id];
      setSelected(next);
      return;
    }
    const next = { ...selected };
    for (const chat of filtered) next[chat.id] = true;
    setSelected(next);
  }

  return (
    <div className="card card-pad">
      <div className="assistant-toolbar">
        <div className="field">
          <label htmlFor="assistant-search">Search</label>
          <input
            id="assistant-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, phone, device…"
          />
        </div>
        <div className="field">
          <label htmlFor="assistant-chat-status">Status</label>
          <select
            id="assistant-chat-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="open">open</option>
            <option value="handed">handed off</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="assistant-chat-device">Device</label>
          <select
            id="assistant-chat-device"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            <option value="all">All devices</option>
            {devices.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assistant-chat-channel">Channel</label>
          <select
            id="assistant-chat-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="all">All channels</option>
            <option value="web">Web</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="assistant-chat-day">Updated date</label>
          <input
            id="assistant-chat-day"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        {day ? (
          <button type="button" className="btn compact" onClick={() => setDay("")}>
            Clear date
          </button>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div className="assistant-bulk-bar">
          <span>
            <strong>{selectedIds.length}</strong> selected
          </span>
          <form
            action={bulkDeleteAssistantChatsAction}
            className="assistant-bulk-form"
            onSubmit={(e) => {
              if (
                !confirm(
                  `Permanently delete ${selectedIds.length} conversation(s)? This cannot be undone.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <SubmitButton className="btn danger compact" pendingLabel="Deleting…">
              Delete selected
            </SubmitButton>
          </form>
          <button type="button" className="btn compact" onClick={() => setSelected({})}>
            Clear selection
          </button>
        </div>
      ) : null}

      <p className="muted" style={{ margin: "0.35rem 0 0.65rem" }}>
        Showing {filtered.length} of {chats.length}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all visible"
                />
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("name")}>
                  Name{sortMark("name")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("contact")}>
                  Phone{sortMark("contact")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("device")}>
                  Device{sortMark("device")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("channel")}>
                  Channel{sortMark("channel")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("messageCount")}>
                  Turns{sortMark("messageCount")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("rating")}>
                  Rating{sortMark("rating")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("status")}>
                  Status{sortMark("status")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("updatedAt")}>
                  Updated{sortMark("updatedAt")}
                </button>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted">
                  No conversations match.
                </td>
              </tr>
            ) : (
              filtered.map((chat) => (
                <tr key={chat.id} className={selected[chat.id] ? "row-selected" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[chat.id])}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [chat.id]: e.target.checked }))
                      }
                      aria-label={`Select ${chat.name || chat.id}`}
                    />
                  </td>
                  <td>
                    <strong>{chat.name || "—"}</strong>
                  </td>
                  <td>{chat.contact || "—"}</td>
                  <td>{chat.device || "LT22"}</td>
                  <td>{channelLabel(chat.channel)}</td>
                  <td>{chat.messageCount}</td>
                  <td title={chat.rating ? `${chat.rating} of 5` : "No rating"}>
                    {chat.rating ? "★".repeat(chat.rating) + "☆".repeat(5 - chat.rating) : "—"}
                  </td>
                  <td>
                    {chat.handedOff ? (
                      <span className="badge off">handed off</span>
                    ) : (
                      <span className="badge">open</span>
                    )}
                  </td>
                  <td className="muted">{fmt(chat.updatedAt || chat.createdAt)}</td>
                  <td className="table-actions">
                    <Link href={`/assistant/${chat.id}`}>Open</Link>
                    {" · "}
                    <ConfirmDeleteForm
                      action={deleteAssistantChatAction}
                      confirmMessage="Permanently delete this conversation? This cannot be undone."
                      hiddenFields={{ id: chat.id }}
                      inline
                      buttonClassName="btn danger compact"
                    >
                      Delete
                    </ConfirmDeleteForm>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
