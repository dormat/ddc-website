/** Client-side CSV / Google Sheets helpers for assistant tables. */

export function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  // BOM so Excel / Sheets open Hebrew correctly
  return `\uFEFF${lines.join("\n")}`;
}

export function rowsToTsv(headers: string[], rows: string[][]): string {
  const lines = [headers.join("\t")];
  for (const row of rows) {
    lines.push(
      row
        .map((cell) => String(cell ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " "))
        .join("\t"),
    );
  }
  return lines.join("\n");
}

export function downloadTextFile(filename: string, contents: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Copy TSV then open a blank Google Sheet so the user can paste. */
export async function exportToGoogleSheets(headers: string[], rows: string[][]): Promise<"ok" | "copy-failed"> {
  const tsv = rowsToTsv(headers, rows);
  const copied = await copyText(tsv);
  window.open("https://sheets.new", "_blank", "noopener,noreferrer");
  return copied ? "ok" : "copy-failed";
}
