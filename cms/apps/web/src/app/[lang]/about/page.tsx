import { notFound } from "next/navigation";
import { getPage } from "@/lib/content";
import { isLang, type Lang } from "@/lib/i18n";

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const page = await getPage(lang, "about");
  if (!page) notFound();

  return (
    <div className="page-content">
      <header className="page-hero">
        <div className="page-hero-inner">
          <h1>{page.title}</h1>
        </div>
      </header>
      <div className="content-wrap rich-text" dangerouslySetInnerHTML={{ __html: page.body }} />
    </div>
  );
}
