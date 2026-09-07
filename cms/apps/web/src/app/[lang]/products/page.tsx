import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getSolutions } from "@/lib/content";
import { GROUP_META, GROUP_ORDER, UI, isLang, type Lang } from "@/lib/i18n";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const [products, solutions] = await Promise.all([getProducts(lang), getSolutions(lang)]);
  const ui = UI[lang];
  const solBySlug = new Map(solutions.map((s) => [s.slug, s]));

  return (
    <div className="page-content products-page">
      <header className="page-hero">
        <div className="page-hero-inner">
          <h1>{ui.products}</h1>
        </div>
      </header>
      <div className="content-wrap">
        {GROUP_ORDER.map((groupId) => {
          const groupSolutions = solutions.filter((s) => s.practiceGroup === groupId);
          const groupProducts = products.filter((p) =>
            p.solutionSlugs.some((slug) => solBySlug.get(slug)?.practiceGroup === groupId),
          );
          if (!groupProducts.length) return null;
          return (
            <section className="products-group" key={groupId}>
              <h2>{GROUP_META[groupId].labels[lang]}</h2>
              <p className="muted">{GROUP_META[groupId].leads[lang]}</p>
              <div className="products-grid">
                {groupProducts.map((product) => {
                  const hero =
                    product.media.find((m) => m.kind === "hero" || m.kind === "image") ||
                    product.media[0];
                  return (
                    <Link className="product-card" href={`/${lang}/${product.slug}/`} key={product.slug}>
                      {hero?.url ? (
                        <img src={hero.url} alt={hero.alt || product.title} />
                      ) : null}
                      <h3>{product.title}</h3>
                      {product.description ? <p>{product.description}</p> : null}
                    </Link>
                  );
                })}
              </div>
              {groupSolutions.length ? (
                <p className="muted">
                  {ui.solutions}:{" "}
                  {groupSolutions.map((s, i) => (
                    <span key={s.slug}>
                      {i > 0 ? " · " : ""}
                      <Link href={`/${lang}/${s.slug}/`}>{s.title}</Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
