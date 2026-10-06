"use client";

import { useMemo, useState } from "react";
import { isProbablyImageUrl, publicAssetUrl } from "@/lib/public-url";

export type EditableMedia = {
  kind: string;
  url: string;
  urlHe: string;
  urlEn: string;
  urlEs: string;
  alt: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
  enabledHe: boolean;
  enabledEn: boolean;
  enabledEs: boolean;
};

type Props = {
  initial: EditableMedia[];
};

function normalize(items: EditableMedia[]): EditableMedia[] {
  return items.map((item, i) => ({
    kind: item.kind || "image",
    url: item.url || "",
    urlHe: item.urlHe || "",
    urlEn: item.urlEn || "",
    urlEs: item.urlEs || "",
    alt: item.alt || "",
    label: item.label || "",
    sortOrder: i,
    enabled: item.enabled !== false,
    enabledHe: item.enabledHe !== false,
    enabledEn: item.enabledEn !== false,
    enabledEs: item.enabledEs !== false,
  }));
}

function LangChecks({
  item,
  onChange,
}: {
  item: EditableMedia;
  onChange: (next: Partial<EditableMedia>) => void;
}) {
  return (
    <div className="lang-checks">
      {(
        [
          ["enabledHe", "HE"],
          ["enabledEn", "EN"],
          ["enabledEs", "ES"],
        ] as const
      ).map(([key, label]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={Boolean(item[key])}
            onChange={(e) => onChange({ [key]: e.target.checked })}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export function ProductMediaEditor({ initial }: Props) {
  const [items, setItems] = useState<EditableMedia[]>(() => normalize(initial));
  const [newImageUrl, setNewImageUrl] = useState("");

  const images = useMemo(
    () => items.filter((m) => m.kind === "hero" || m.kind === "image" || m.kind === "gallery"),
    [items],
  );
  const docs = useMemo(
    () => items.filter((m) => m.kind === "schematic" || m.kind === "document"),
    [items],
  );

  function replaceAll(nextImages: EditableMedia[], nextDocs: EditableMedia[]) {
    const merged = [
      ...nextImages.map((m, i) => ({
        ...m,
        kind: i === 0 ? "hero" : "image",
        sortOrder: i,
      })),
      ...nextDocs.map((m, i) => ({ ...m, sortOrder: nextImages.length + i })),
    ];
    setItems(normalize(merged));
  }

  function updateImage(index: number, patch: Partial<EditableMedia>) {
    const next = images.map((m, i) => (i === index ? { ...m, ...patch } : m));
    replaceAll(next, docs);
  }

  function removeImage(index: number) {
    replaceAll(
      images.filter((_, i) => i !== index),
      docs,
    );
  }

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    replaceAll(
      [
        ...images,
        {
          kind: "image",
          url,
          urlHe: "",
          urlEn: "",
          urlEs: "",
          alt: "",
          label: "",
          sortOrder: images.length,
          enabled: true,
          enabledHe: true,
          enabledEn: true,
          enabledEs: true,
        },
      ],
      docs,
    );
    setNewImageUrl("");
  }

  function updateDoc(index: number, patch: Partial<EditableMedia>) {
    const next = docs.map((m, i) => (i === index ? { ...m, ...patch } : m));
    replaceAll(images, next);
  }

  function removeDoc(index: number) {
    replaceAll(
      images,
      docs.filter((_, i) => i !== index),
    );
  }

  function addDoc(kind: "schematic" | "document") {
    replaceAll(images, [
      ...docs,
      {
        kind,
        url: "",
        urlHe: "",
        urlEn: "",
        urlEs: "",
        alt: "",
        label: kind === "schematic" ? "Schematics" : "Download Docs",
        sortOrder: docs.length,
        enabled: true,
        enabledHe: true,
        enabledEn: true,
        enabledEs: true,
      },
    ]);
  }

  return (
    <>
      <input type="hidden" name="media_json" value={JSON.stringify(normalize(items))} />

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Carousel images</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Only these images appear in the product slider. Click a thumbnail to open it. Choose which
          languages each image appears in.
        </p>
        {images.length === 0 ? <p className="muted">No carousel images yet.</p> : null}
        <ul className="media-edit-grid">
          {images.map((item, index) => {
            const href = publicAssetUrl(item.url);
            return (
              <li key={`img-${index}-${item.url}`} className="media-edit-card">
                <a href={href || "#"} target="_blank" rel="noreferrer" className="media-edit-thumb-wrap">
                  {isProbablyImageUrl(item.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={href} alt="" className="media-edit-thumb" loading="lazy" />
                  ) : (
                    <span className="media-thumb media-thumb-doc">img</span>
                  )}
                </a>
                <div className="media-edit-side">
                  <LangChecks item={item} onChange={(patch) => updateImage(index, patch)} />
                  <button type="button" className="btn danger" onClick={() => removeImage(index)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="media-add-row">
          <input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="/assets/images/product.png"
            aria-label="New image URL"
          />
          <button type="button" className="btn" onClick={addImage}>
            Add image
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Schematics &amp; documents</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Separate from carousel images. Use a default file, then optional per-language overrides.
          Toggle whether each file is shown, and in which languages.
        </p>
        {docs.length === 0 ? <p className="muted">No schematics or documents yet.</p> : null}
        <div className="doc-edit-list">
          {docs.map((item, index) => {
            const href = publicAssetUrl(item.url);
            return (
              <div key={`doc-${index}-${item.kind}`} className="doc-edit-card">
                <div className="doc-edit-top">
                  <label className="checks" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateDoc(index, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                  <select
                    value={item.kind}
                    onChange={(e) => updateDoc(index, { kind: e.target.value })}
                    aria-label="Document kind"
                  >
                    <option value="schematic">Schematics</option>
                    <option value="document">Download docs</option>
                  </select>
                  <button type="button" className="btn danger" onClick={() => removeDoc(index)}>
                    Remove
                  </button>
                </div>
                <div className="field">
                  <label>Default URL</label>
                  <input
                    value={item.url}
                    onChange={(e) => updateDoc(index, { url: e.target.value })}
                    placeholder="/assets/documents/product-sketch.pdf"
                  />
                  {href ? (
                    <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
                      Open:{" "}
                      <a href={href} target="_blank" rel="noreferrer">
                        {href}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {(
                    [
                      ["urlHe", "HE URL (optional)"],
                      ["urlEn", "EN URL (optional)"],
                      ["urlEs", "ES URL (optional)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div className="field" key={key} style={{ marginBottom: 0 }}>
                      <label>{label}</label>
                      <input
                        value={item[key]}
                        onChange={(e) => updateDoc(index, { [key]: e.target.value })}
                        placeholder="Leave blank to use default"
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <div className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.35rem" }}>
                    Show in languages
                  </div>
                  <LangChecks item={item} onChange={(patch) => updateDoc(index, patch)} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="media-add-row" style={{ marginTop: "0.85rem" }}>
          <button type="button" className="btn" onClick={() => addDoc("schematic")}>
            Add schematics
          </button>
          <button type="button" className="btn" onClick={() => addDoc("document")}>
            Add download docs
          </button>
        </div>
      </div>
    </>
  );
}
