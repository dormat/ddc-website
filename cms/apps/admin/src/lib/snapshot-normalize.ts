import type { PublicSnapshot } from "@ddc/db";
import { normalizePageBody, normalizeProductBody } from "@/lib/plain-text";

/** Ensure page/product bodies are clean plain text; bump updatedAt when changed. */
export function normalizeSnapshotPages(snap: PublicSnapshot): {
  snap: PublicSnapshot;
  changed: boolean;
} {
  let changed = false;
  const pages = (snap.pages || []).map((page) => {
    const translations = { ...page.translations };
    for (const lang of ["he", "en", "es"] as const) {
      const tr = translations[lang];
      if (!tr) continue;
      const body = normalizePageBody(tr.body || "");
      if (body !== (tr.body || "")) {
        changed = true;
        translations[lang] = { ...tr, body };
      }
    }
    return { ...page, translations };
  });

  const products = (snap.products || []).map((product) => {
    const translations = { ...product.translations };
    for (const lang of ["he", "en", "es"] as const) {
      const tr = translations[lang];
      if (!tr) continue;
      const body = normalizeProductBody(tr.body || "", lang);
      if (body !== (tr.body || "")) {
        changed = true;
        translations[lang] = { ...tr, body };
      }
    }
    return { ...product, translations };
  });

  if (!changed) return { snap, changed: false };
  return {
    snap: {
      ...snap,
      pages,
      products,
      updatedAt: new Date().toISOString(),
    },
    changed: true,
  };
}

export function pickNewestSnapshot(
  ...candidates: Array<PublicSnapshot | null | undefined>
): PublicSnapshot | null {
  const list = candidates.filter(Boolean) as PublicSnapshot[];
  if (!list.length) return null;
  list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return list[0];
}
