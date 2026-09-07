import { unstable_cache } from "next/cache";
import {
  buildPublicSnapshot,
  getDatabaseUrl,
  readPublicSnapshotFile,
  type PublicLang,
  type PublicSnapshot,
} from "@ddc/db";
import type { Lang } from "./i18n";

function langEnabled(
  row: { enabled: boolean; enabledHe: boolean; enabledEn: boolean; enabledEs: boolean },
  lang: Lang,
) {
  if (!row.enabled) return false;
  if (lang === "he") return row.enabledHe;
  if (lang === "en") return row.enabledEn;
  return row.enabledEs;
}

async function loadSnapshot(): Promise<PublicSnapshot> {
  const snap = readPublicSnapshotFile();
  if (snap) return snap;

  const remote = process.env.PUBLIC_SNAPSHOT_URL?.trim();
  if (remote) {
    const res = await fetch(remote, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch PUBLIC_SNAPSHOT_URL (${res.status})`);
    return (await res.json()) as PublicSnapshot;
  }

  if (getDatabaseUrl()) {
    return buildPublicSnapshot();
  }

  throw new Error(
    "Missing CMS snapshot — run db:seed, or set PUBLIC_SNAPSHOT_URL / DATABASE_URL.",
  );
}

export const getSnapshot = unstable_cache(loadSnapshot, ["public-snapshot"], {
  tags: ["cms"],
  revalidate: 60,
});

export async function getSettings() {
  const snap = await getSnapshot();
  return snap.settings;
}

export async function getSolutions(lang: Lang) {
  const snap = await getSnapshot();
  return snap.solutions
    .filter((s) => langEnabled(s, lang))
    .map((s) => ({
      ...s,
      title: s.translations[lang as PublicLang]?.title || s.slug,
      lead: s.translations[lang as PublicLang]?.lead || "",
      body: s.translations[lang as PublicLang]?.body || "",
    }));
}

export async function getSolution(lang: Lang, slug: string) {
  const list = await getSolutions(lang);
  return list.find((s) => s.slug === slug) || null;
}

export async function getProducts(lang: Lang) {
  const snap = await getSnapshot();
  return snap.products
    .filter((p) => langEnabled(p, lang))
    .map((p) => ({
      ...p,
      title: p.translations[lang as PublicLang]?.title || p.slug,
      description: p.translations[lang as PublicLang]?.description || "",
      body: p.translations[lang as PublicLang]?.body || "",
    }));
}

export async function getProduct(lang: Lang, slug: string) {
  const list = await getProducts(lang);
  return list.find((p) => p.slug === slug) || null;
}

export async function getIndustries(lang: Lang) {
  const snap = await getSnapshot();
  return snap.industries
    .filter((i) => langEnabled(i, lang))
    .map((i) => ({
      ...i,
      title: i.translations[lang as PublicLang]?.title || i.slug,
      offer: i.translations[lang as PublicLang]?.offer || "",
      clients: i.translations[lang as PublicLang]?.clients || [],
    }));
}

export async function getPage(lang: Lang, key: string) {
  const snap = await getSnapshot();
  const page = snap.pages.find((p) => p.key === key);
  if (!page || !langEnabled(page, lang)) return null;
  return {
    ...page,
    title: page.translations[lang as PublicLang]?.title || key,
    body: page.translations[lang as PublicLang]?.body || "",
  };
}
