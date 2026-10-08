"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  bulkDeleteAssistantRequestsAction,
  bulkUpdateAssistantRequestsAction,
  deleteAssistantRequestAction,
} from "@/app/actions/assistant";
import type { AssistantRequest } from "@/lib/assistant-store";
import {
  downloadTextFile,
  exportToGoogleSheets,
  rowsToCsv,
} from "@/lib/assistant-export";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { SubmitButton } from "@/components/submit-button";

type SortKey = "kind" | "agreement" | "summary" | "email" | "status" | "createdAt";
type Category = "all" | "sales" | "service" | "service_yes" | "service_no";

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

function agreementValue(req: AssistantRequest): "כן" | "לא" | "" {
  const raw = String(req.fields.serviceAgreement || "").trim();
  if (raw === "כן" || /^yes$/i.test(raw)) return "כן";
  if (raw === "לא" || /^no$/i.test(raw)) return "לא";
  return "";
}

function categoryLabel(req: AssistantRequest): string {
  if (req.kind === "purchase") return "מכירות";
  if (req.kind === "lab") {
    const ag = agreementValue(req);
    if (ag === "כן") return "קריאת שירות · בהסכם שירות";
    if (ag === "לא") return "קריאת שירות · לא בהסכם שירות";
    return "קריאת שירות";
  }
  return req.kind || "—";
}

function kindLabel(kind: string) {
  if (kind === "purchase") return "מכירות";
  if (kind === "lab") return "קריאת שירות";
  return kind || "—";
}

function summary(req: AssistantRequest) {
  const f = req.fields;
  if (req.kind === "purchase") {
    const products = Array.isArray(f.products) ? f.products : null;
    const productSummary =
      products && products.length
        ? products
            .map((item) => {
              if (!item || typeof item !== "object") return "";
              const row = item as { product?: string; quantity?: string };
              const name = String(row.product || "").trim();
              const qty = String(row.quantity || "").trim();
              if (!name) return "";
              return qty ? `${name} ×${qty}` : name;
            })
            .filter(Boolean)
            .join(", ")
        : [f.product, f.quantity ? `×${f.quantity}` : ""].filter(Boolean).join(" ");
    return [f.fullName, f.companyName, productSummary].filter(Boolean).join(" · ");
  }
  return [
    req.serialNumber || f.serialNumber,
    f.contactName || f.fullName,
    f.companyName,
    f.equipmentType || f.product,
  ]
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

function matchesCategory(req: AssistantRequest, category: Category): boolean {
  if (category === "all") return true;
  if (category === "sales") return req.kind === "purchase";
  if (category === "service") return req.kind === "lab";
  if (category === "service_yes") return req.kind === "lab" && agreementValue(req) === "כן";
  if (category === "service_no") return req.kind === "lab" && agreementValue(req) === "לא";
  return true;
}

const EXPORT_HEADERS = [
  "Category",
  "Type",
  "Serial",
  "Service agreement",
  "Status",
  "Summary",
  "Name",
  "Company",
  "Email",
  "Phone",
  "Product / equipment",
  "Quantity",
  "Notes / fault",
  "Hot lead",
  "Created",
  "Request ID",
  "Admin link path",
];

function exportProductFields(f: AssistantRequest["fields"]): { product: string; quantity: string } {
  const products = Array.isArray(f.products) ? f.products : null;
  if (products && products.length) {
    const lines = products
      .map((item) => {
        if (!item || typeof item !== "object") return { product: "", quantity: "" };
        const row = item as { product?: string; quantity?: string };
        return {
          product: String(row.product || "").trim(),
          quantity: String(row.quantity || "").trim(),
        };
      })
      .filter((row) => row.product);
    return {
      product: lines.map((row) => row.product).join("; "),
      quantity: lines.map((row) => row.quantity || "1").join("; "),
    };
  }
  return {
    product: String(f.product || f.equipmentType || f.model || ""),
    quantity: String(f.quantity || ""),
  };
}

function exportRows(rows: AssistantRequest[]): string[][] {
  return rows.map((req) => {
    const f = req.fields;
    const productFields = exportProductFields(f);
    return [
      categoryLabel(req),
      kindLabel(req.kind),
      req.serialNumber || f.serialNumber || "",
      agreementValue(req) || "—",
      req.status || "new",
      summary(req),
      f.fullName || f.contactName || "",
      f.companyName || "",
      f.email || "",
      f.phone || "",
      productFields.product,
      productFields.quantity,
      f.notes || f.faultDescription || "",
      req.hotLead ? "yes" : "no",
      req.createdAt || "",
      req.id,
      `/assistant/requests/${req.id}`,
    ];
  });
}

export function AssistantRequestsTable({ requests }: { requests: AssistantRequest[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState<Category>("all");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkStatus, setBulkStatus] = useState("acknowledged");
  const [exportNote, setExportNote] = useState("");

  const counts = useMemo(() => {
    const sales = requests.filter((r) => r.kind === "purchase").length;
    const service = requests.filter((r) => r.kind === "lab").length;
    const serviceYes = requests.filter((r) => r.kind === "lab" && agreementValue(r) === "כן").length;
    const serviceNo = requests.filter((r) => r.kind === "lab" && agreementValue(r) === "לא").length;
    return { all: requests.length, sales, service, serviceYes, serviceNo };
  }, [requests]);

  const countsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const req of requests) {
      if (!matchesCategory(req, category)) continue;
      const key = dayKey(req.createdAt);
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [requests, category]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = requests.filter((req) => {
      if (!matchesCategory(req, category)) return false;
      if (status !== "all" && (req.status || "new") !== status) return false;
      if (day && dayKey(req.createdAt) !== day) return false;
      if (!needle) return true;
      return [
        req.kind,
        kindLabel(req.kind),
        categoryLabel(req),
        req.serialNumber,
        agreementValue(req),
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
        av = categoryLabel(a);
        bv = categoryLabel(b);
      } else if (sortKey === "agreement") {
        av = agreementValue(a);
        bv = agreementValue(b);
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
  }, [requests, q, status, category, day, sortKey, sortDir]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, on]) => on).map(([id]) => id),
    [selected],
  );

  const selectedRows = useMemo(
    () => filtered.filter((req) => selected[req.id]),
    [filtered, selected],
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

  function exportTargetRows(): AssistantRequest[] {
    if (selectedRows.length > 0) return selectedRows;
    return filtered;
  }

  function handleCsvExport() {
    const rows = exportTargetRows();
    if (!rows.length) {
      setExportNote("Nothing to export.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `assistant-requests-${stamp}.csv`,
      rowsToCsv(EXPORT_HEADERS, exportRows(rows)),
    );
    setExportNote(
      selectedRows.length
        ? `Downloaded CSV for ${rows.length} selected row(s).`
        : `Downloaded CSV for ${rows.length} filtered row(s).`,
    );
  }

  async function handleSheetsExport() {
    const rows = exportTargetRows();
    if (!rows.length) {
      setExportNote("Nothing to export.");
      return;
    }
    const result = await exportToGoogleSheets(EXPORT_HEADERS, exportRows(rows));
    setExportNote(
      result === "ok"
        ? `Copied ${rows.length} row(s). A new Google Sheet opened — paste with ⌘V / Ctrl+V.`
        : `Opened Google Sheets, but copy failed. Use Download CSV instead.`,
    );
  }

  const calendarDays = buildCalendarDays(month);

  const categoryChips: Array<{ id: Category; label: string; count: number }> = [
    { id: "all", label: "הכל", count: counts.all },
    { id: "sales", label: "מכירות", count: counts.sales },
    { id: "service", label: "קריאות שירות", count: counts.service },
    { id: "service_yes", label: "בהסכם שירות", count: counts.serviceYes },
    { id: "service_no", label: "לא בהסכם שירות", count: counts.serviceNo },
  ];

  return (
    <div className="card card-pad">
      <div className="assistant-category-bar" role="tablist" aria-label="Categories">
        {categoryChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={category === chip.id}
            className={`assistant-category-chip${category === chip.id ? " on" : ""}${
              chip.id === "service_yes" || chip.id === "service_no" ? " sub" : ""
            }`}
            onClick={() => {
              setCategory(chip.id);
              setSelected({});
            }}
          >
            {chip.label}
            <span>{chip.count}</span>
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        תמיכה טכנית (שיחות בצ׳אט) נמצאת בלשונית{" "}
        <Link href="/assistant?tab=calls">Calls · תמיכה טכנית</Link>.
      </p>

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

      <div className="assistant-export-bar">
        <button type="button" className="btn compact" onClick={handleCsvExport}>
          Download CSV{selectedRows.length ? ` (${selectedRows.length})` : " (filtered)"}
        </button>
        <button type="button" className="btn compact primary" onClick={handleSheetsExport}>
          Copy to Google Sheets{selectedRows.length ? ` (${selectedRows.length})` : ""}
        </button>
        {exportNote ? <span className="muted">{exportNote}</span> : null}
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
        {selectedRows.length ? ` · ${selectedRows.length} selected for export` : ""}
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
                  Category{sortMark("kind")}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort("agreement")}>
                  Agreement{sortMark("agreement")}
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
                <td colSpan={8} className="muted">
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
                  <td>
                    {req.kind === "lab" ? (
                      agreementValue(req) === "כן" ? (
                        <span className="badge">בהסכם</span>
                      ) : agreementValue(req) === "לא" ? (
                        <span className="badge off">לא בהסכם</span>
                      ) : (
                        "—"
                      )
                    ) : (
                      "—"
                    )}
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
