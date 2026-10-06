import { isProbablyImageUrl, publicAssetUrl } from "@/lib/public-url";

type MediaItem = {
  kind: string;
  url: string;
  label?: string | null;
  alt?: string | null;
};

export function MediaLinks({ items }: { items: MediaItem[] }) {
  if (!items.length) {
    return <p className="muted">No media yet.</p>;
  }

  return (
    <ul className="media-link-list">
      {items.map((item, i) => {
        const href = publicAssetUrl(item.url);
        const label = item.label || item.alt || item.url;
        const showThumb = isProbablyImageUrl(item.url);
        return (
          <li key={`${item.url}-${i}`} className="media-link-item">
            {showThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={href} alt="" className="media-thumb" loading="lazy" />
            ) : (
              <span className="media-thumb media-thumb-doc">{item.kind}</span>
            )}
            <div className="media-link-meta">
              <div className="muted" style={{ fontSize: "0.78rem" }}>
                {item.kind}
              </div>
              <a href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
              <div className="muted" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                {item.url}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AssetUrlField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const value = defaultValue || "";
  const href = publicAssetUrl(value);
  return (
    <div className="field">
      <label>{label}</label>
      <input name={name} defaultValue={value} />
      {href ? (
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
          Open:{" "}
          <a href={href} target="_blank" rel="noreferrer">
            {href}
          </a>
        </p>
      ) : null}
      {href && isProbablyImageUrl(value) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={href} alt="" className="media-thumb media-thumb-lg" loading="lazy" />
      ) : null}
    </div>
  );
}
