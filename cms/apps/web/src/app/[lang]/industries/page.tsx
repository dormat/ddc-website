import { notFound } from "next/navigation";
import { getIndustries } from "@/lib/content";
import { UI, isLang, type Lang } from "@/lib/i18n";

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const industries = await getIndustries(lang);
  const ui = UI[lang];

  return (
    <div className="page-content industries-page">
      <header className="page-hero">
        <div className="page-hero-inner">
          <h1>{ui.industries}</h1>
        </div>
      </header>
      <div className="content-wrap">
        {industries.map((industry) => (
          <section className="industry-section" id={industry.slug} key={industry.slug}>
            <h2>{industry.title}</h2>
            {industry.offer ? <p className="industry-offer">{industry.offer}</p> : null}
            {industry.clients?.length ? (
              <div className="industry-clients">
                <h3>{ui.clients}</h3>
                <ul className="industry-client-list">
                  {industry.clients.map((client) => (
                    <li key={client}>{client}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
