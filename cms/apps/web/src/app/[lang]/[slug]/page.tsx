import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSolution } from "@/lib/content";
import { UI, isLang, type Lang } from "@/lib/i18n";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const ui = UI[lang];

  const solution = await getSolution(lang, slug);
  if (solution) {
    const products = await getProducts(lang);
    const linked = products.filter((p) => solution.productSlugs.includes(p.slug));
    return (
      <div className="page-content solution-page">
        <header className="page-hero">
          <div className="page-hero-inner">
            <h1>{solution.title}</h1>
            {solution.lead ? <p className="page-lead">{solution.lead}</p> : null}
          </div>
        </header>
        <div className="content-wrap">
          {solution.body ? (
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: solution.body }} />
          ) : null}
          {linked.length ? (
            <section className="related-products">
              <h2 className="related-products-title">{ui.relatedProducts}</h2>
              <ul>
                {linked.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/${lang}/${p.slug}/`}>{p.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  const product = await getProduct(lang, slug);
  if (!product) notFound();

  const gallery = product.media.filter((m) => m.kind !== "document");
  const docs = product.media.filter((m) => m.kind === "document");

  return (
    <div className="page-content product-detail-page">
      <header className="page-hero">
        <div className="page-hero-inner">
          <h1>{product.title}</h1>
          {product.description ? <p className="page-lead">{product.description}</p> : null}
        </div>
      </header>
      <div className="content-wrap">
        {gallery.length ? (
          <div className="product-gallery">
            {gallery.map((item) => (
              <img key={`${item.url}-${item.sortOrder}`} src={item.url} alt={item.alt || product.title} />
            ))}
          </div>
        ) : null}
        {product.body ? (
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.body }} />
        ) : null}
        {docs.length ? (
          <ul className="product-docs">
            {docs.map((doc) => (
              <li key={doc.url}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  {doc.label || doc.url}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
