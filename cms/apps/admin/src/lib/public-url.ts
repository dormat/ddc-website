/** Public marketing site origin — used to resolve /assets/* links in admin. */
export function publicSiteOrigin(): string {
  return (
    process.env.PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.trim() ||
    "https://ddc-cms.web.app"
  ).replace(/\/$/, "");
}

/** Turn a CMS media path into an absolute URL that opens on the public site. */
export function publicAssetUrl(path: string | null | undefined): string {
  const raw = (path || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${publicSiteOrigin()}${raw}`;
  return `${publicSiteOrigin()}/${raw.replace(/^\.\//, "")}`;
}

export function isProbablyImageUrl(path: string): boolean {
  const p = path.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg|avif)$/.test(p) || p.includes("/assets/images/");
}
