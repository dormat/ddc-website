"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  bulkDeleteAssistantRequestsAction,
  bulkUpdateAssistantRequestsAction,
  deleteAssistantRequestAction,
} from "@/app/actions/assistant";
import type { AssistantRequest } from "@/lib/assistant-store";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { SubmitButton } from "@/components/submit-button";

type SortKey = "kind" | "summary" | "email" | "status" | "createdAt";

const STATUSES = ["new", "acknowledged", "in_progress", "done", "closed"] as const;

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

function kindLabel(kind: string) {
  if (kind === "purchase") return "Purchase";
  if (kind === "lab") return "Lab / service";
  return kind || "—";
}

function summary(req: AssistantRequest) {
  const f = req.fields;
  if (req.kind === "purchase") {
    return [f.fullName, f.companyName, f.product, f.quantity ? `×${f.quantity}` : ""]
      .filter(Boolean)
      .join(" · ");
  }
  return [f.contactName || f.fullName, f.companyName, f.equipmentType || f.product]
    .filter(Boolean)
    .join(" · ");
}

function emailLabel(req: AssistantRequest) {
  if (req.emailService || req.emailCustomer) {
    return `svc ${req.emailService ? "✓" : "—"} / cust ${req.emailCustomer ? "✓" : "—"}`;
  }
  return "—";
}

function statusClass(status: string) {
  if (status === "new") return "badge off";
  return "badge";
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<{ key: string; day: number | null; inMonth: boolean }> = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ key: `pad-${i}`, day: null, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key, day, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `end-${cells.length}`, day: null, inMonth: false });
  }
  return cells;
}

export function AssistantRequestsTable({ requests }: { requests: AssistantRequest[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkStatus, setBulkStatus] = useState("acknowledged");

  const countsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const req of requests) {
      const key = dayKey(req.createdAt);
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = requests.filter((req) => {
      if (status !== "all" && (req.status || "new") !== status) return false;
      if (kind !== "all" && req.kind !== kind) return false;
      if (day && dayKey(req.createdAt) !== day) return false;
      if (!needle) return true;
      return [
        req.kind,
        kindLabel(req.kind),
        req.status,
        summary(req),
        emailLabel(req),
        req.id,
        req.conversationId,
        req.adminNotes,
        ...Object.values(req.fields),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      let av = "";
      let bv = "";
      if (sortKey === "kind") {
        av = kindLabel(a.kind);
        bv = kindLabel(b.kind);
      } else if (sortKey === "summary") {
        av = summary(a);
        bv = summary(b);
      } else if (sortKey === "email") {
        av = emailLabel(a);
        bv = emailLabel(b);
      } else if (sortKey === "status") {
        av = a.status || "new";
        bv = b.status || "new";
      } else {
        av = a.createdAt || "";
        bv = b.createdAt || "";
      }
      return av.localeCompare(bv, undefined, { sensitivity: "base", numeric: true }) * dir;
    });
    return rows;
  }, [requests, q, status, kind, day, sortKey, sortDir]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, on]) => on).map(([id]) => id),
    [selected],
  );

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((req) => selected[req.id]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "createdAt" ? "desc" : "asc");
  }

  function sortMark(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const next = { ...selected };
      for (const req of filtered) delete next[req.id];
      setSelected(next);
      return;
    }
    const next = { ...selected };
    for (const req of filtered) next[req.id] = true;
    setSelected(next);
  }

  const calendarDays = buildCalendarDays(month);

  return (
    <div className="card card-pad">
      <div className="assistant-toolbar">
        <div className="field">
          <label htmlFor="assistant-req-search">Search</label>
          <input
            id="assistant-req-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, company, product…"
          />
        </div>
        <div className="field">
          <label htmlFor="assistant-req-status">Status</label>
          <select
            id="assistant-req-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assistant-req-kind">Type</label>
          <select id="assistant-req-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All types</option>
            <option value="purchase">Purchase</option>
            <option value="lab">Lab / service</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="assistant-req-day">Date</label>
          <input
            id="assistant-req-day"
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

      <div className="assistant-calendar-wrap">
        <div className="assistant-calendar-head">
          <button
            type="button"
            className="btn compact"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            ‹
          </button>
          <strong>{monthLabel(month)}</strong>
          <button
            type="button"
            className="btn compact"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            ›
          </button>
        </div>
        <div className="assistant-calendar">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="assistant-calendar-dow">
              {label}
            </div>
          ))}
          {calendarDays.map((cell) => {
            if (!cell.inMonth || cell.day == null) {
              return <div key={cell.key} className="assistant-calendar-day empty" />;
            }
            const count = countsByDay[cell.key] || 0;
            const active = day === cell.key;
            return (
              <button
                key={cell.key}
                type="button"
                className={`assistant-calendar-day${active ? " on" : ""}${count ? " has" : ""}`}
                onClick={() => setDay(active ? "" : cell.key)}
                title={count ? `${count} request(s)` : "No requests"}
              >
                <span>{cell.day}</span>
                {count ? <i>{count}</i> : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="assistant-bulk-bar">
          <span>
            <strong>{selectedIds.length}</strong> selected
          </span>
          <form action={bulkUpdateAssistantRequestsAction} className="assistant-bulk-form">
            {selectedIds.map((id) => (
              <input key={`ack-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="acknowledge" value="1" />
            <SubmitButton className="btn compact" pendingLabel="Saving…">
              Acknowledge
            </SubmitButton>
          </form>
          <form action={bulkUpdateAssistantRequestsAction} className="assistant-bulk-form">
            {selectedIds.map((id) => (
              <input key={`status-${id}`} type="hidden" name="ids" value={id} />
            ))}
            <select
              name="status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              aria-label="Bulk status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <SubmitButton className="btn compact" pendingLabel="Saving…">
              Set status
            </SubmitButton>
          </form>
          <form
            action={bulkDeleteAssistantRequestsAction}
            className="assistant-bulk-form"
            onSubmit={(e) => {
              if (
                !confirm(
                  `Permanently delete ${selectedIds.length} request(s)? This cannot be undone.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {selectedIds.map((id) => (
              <input key={`del-${id}`} type="hidden" name="ids" value={id} />
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
        Showing {filtered.length} of {requests.length}
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
                <button type="button" className="th-sort" onClick={() => toggleSort("kind")}>
                  Type{sortMark("kind")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("summary")}>
                  Summary{sortMark("summary")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("email")}>
                  Email{sortMark("email")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("status")}>
                  Status{sortMark("status")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("createdAt")}>
                  Created{sortMark("createdAt")}
                </button>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No requests match.
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id} className={selected[req.id] ? "row-selected" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[req.id])}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [req.id]: e.target.checked }))
                      }
                      aria-label={`Select ${summary(req) || req.id}`}
                    />
                  </td>
                  <td>
                    <strong>{kindLabel(req.kind)}</strong>
                  </td>
                  <td>{summary(req) || "—"}</td>
                  <td>{emailLabel(req)}</td>
                  <td>
                    <span className={statusClass(req.status)}>{req.status || "new"}</span>
                  </td>
                  <td>{fmt(req.createdAt)}</td>
                  <td className="table-actions">
                    <Link href={`/assistant/requests/${req.id}`}>Open</Link>
                    {" · "}
                    <ConfirmDeleteForm
                      action={deleteAssistantRequestAction}
                      confirmMessage="Permanently delete this request? This cannot be undone."
                      hiddenFields={{ id: req.id }}
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
