/** Strip HTML to editable plain text (paragraphs separated by blank lines). */
export function htmlToPlainText(input: string): string {
  if (!input) return "";
  let s = input;
  if (!/[<>]/.test(s)) {
    return s.replace(/\u200b/g, "").replace(/\r\n/g, "\n").trim();
  }
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<br\s*\/?>\s*/gi, "\n");
  s = s.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u200b/g, "");
  s = s
    .split(/\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

const FOOTER_MARKERS = [
  "יצירת קשר",
  "Contact Us",
  "making contact",
  "שעות פתיחה",
  "Opening Hour",
  "opening hours",
  "© Copyright",
  "cal@ddc.co.il",
  "כתובת",
  "Address",
  "Adress",
  "mailto:",
  "tel:",
];

const RELATED_MARKERS = [
  "Related Products",
  "Related products",
  "Related Items",
  "מוצרים קשורים",
  "Productos relacionados",
];

/** Drop scraped footer / contact blocks from plain page copy. */
export function stripFooterJunk(plain: string): string {
  const parts = plain.split(/\n\s*\n/);
  const kept: string[] = [];
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    const lower = t.toLowerCase();
    if (RELATED_MARKERS.some((m) => t.includes(m) || lower === m.toLowerCase())) break;
    if (FOOTER_MARKERS.some((m) => lower.includes(m.toLowerCase()))) break;
    kept.push(t);
  }
  return kept.join("\n\n").trim();
}

function hebrewRatio(text: string): number {
  let he = 0;
  let letters = 0;
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      letters += 1;
      if (ch >= "\u0590" && ch <= "\u05FF") he += 1;
    }
  }
  return letters ? he / letters : 0;
}

/** Drop lines that clearly belong to another language script. */
export function dropWrongScriptLines(plain: string, lang: "he" | "en" | "es"): string {
  const lines = plain.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      kept.push("");
      continue;
    }
    const ratio = hebrewRatio(t);
    if (lang === "he") {
      // Keep Hebrew + mixed product names; drop long Latin-only footer-ish lines that snuck in
      if (ratio < 0.08 && t.length > 80 && !/[0-9%]/.test(t)) continue;
    } else if (ratio > 0.35) {
      // EN/ES must not contain Hebrew sentences from the scraper
      continue;
    }
    kept.push(line.replace(/[ \t]+$/g, ""));
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Normalize page body for storage: plain text only. */
export function normalizePageBody(input: string): string {
  return stripFooterJunk(htmlToPlainText(input));
}

/**
 * Product body for admin: match live site copy (no related/footer, preserve line breaks).
 * Prefer content_html when present (EN/HE source of truth); rich_text often mixes scripts.
 */
export function normalizeProductBody(input: string, lang: "he" | "en" | "es" = "en"): string {
  let plain = htmlToPlainText(input);
  plain = stripFooterJunk(plain);
  plain = dropWrongScriptLines(plain, lang);
  return plain;
}

/** Turn product content_html into CMS plain text the way the static site filters it. */
export function productBodyFromContentHtml(html: string, lang: "he" | "en" | "es"): string {
  if (!html) return "";
  let s = html;
  // Cut at related-products marker blocks (same idea as build_site.split_content_before_related)
  const relatedSplit = s.split(/<div class="rich-text">/i);
  if (relatedSplit.length > 1) {
    const kept: string[] = [];
    for (let i = 0; i < relatedSplit.length; i++) {
      const part = relatedSplit[i];
      if (i === 0) {
        if (part.trim()) kept.push(part);
        continue;
      }
      const block = '<div class="rich-text">' + part;
      const plain = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (/related\s+products|related\s+items|מוצרים קשורים|productos relacionados/i.test(plain)) break;
      kept.push(block);
    }
    s = kept.join("");
  }
  // EN/HE live pages drop the first heading-only rich-text block
  if (lang !== "es") {
    s = s.replace(/<div class="rich-text"><h[1-3][^>]*>[\s\S]*?<\/h[1-3]><\/div>\s*/i, "");
  }
  return normalizeProductBody(s, lang);
}
