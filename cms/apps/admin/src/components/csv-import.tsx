"use client";

import { useState } from "react";
import { importCsvAction, previewCsvAction } from "@/app/actions/clients";
import { SubmitButton } from "@/components/submit-button";
import type { CsvRowPlan } from "@/lib/crm-store";

export function CsvImport() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<CsvRowPlan[] | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const contents = await file.text();
    setText(contents);
    setRows(null);
    setError("");
  }

  async function preview() {
    setPending(true);
    setError("");
    try {
      const result = await previewCsvAction(text);
      if (result.error) {
        setError(result.error);
        setRows(null);
      } else {
        setRows(result.rows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setPending(false);
    }
  }

  const counts = {
    new: rows?.filter((row) => row.status === "new").length || 0,
    update: rows?.filter((row) => row.status === "update").length || 0,
    skip: rows?.filter((row) => row.status === "skip").length || 0,
    error: rows?.filter((row) => row.status === "error").length || 0,
  };

  return (
    <div className="stack-form" style={{ maxWidth: 860 }}>
      <div className="card card-pad">
        <p className="muted" style={{ marginTop: 0 }}>
          Columns: name, company, email, phone, stage, owner email, next follow-up, notes. Email is required.
          Dates use YYYY-MM-DD. Stage is New, Contacted, Quoted, Won, or Lost.
        </p>
        <div className="field">
          <label htmlFor="csv">CSV file</label>
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </div>
        <button className="btn" type="button" onClick={preview} disabled={!text || pending}>
          {pending ? "Checking…" : "Preview"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {rows ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card-pad">
            <p>
              {counts.new} new, {counts.update} updates, {counts.skip} skipped, {counts.error} errors.
            </p>
            <form action={importCsvAction.bind(null, text)}>
              <SubmitButton className="btn primary" pendingLabel="Importing…" disabled={counts.new + counts.update === 0}>
                Import {counts.new + counts.update} rows
              </SubmitButton>
            </form>
          </div>
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Status</th>
                <th>Email</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.line}-${row.email}`}>
                  <td>{row.line}</td>
                  <td>{row.status}</td>
                  <td>{row.email || row.name || "—"}</td>
                  <td>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
