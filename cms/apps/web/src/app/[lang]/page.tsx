import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolutions } from "@/lib/content";
import { GROUP_META, GROUP_ORDER, HERO_COPY, UI, isLang, type Lang } from "@/lib/i18n";

function firstSentence(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : cleaned).trim();
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const solutions = await getSolutions(lang);
  const ui = UI[lang];
  const hero = HERO_COPY[lang];

  const groups = GROUP_ORDER.map((groupId, groupIndex) => {
    const meta = GROUP_META[groupId];
    const items = solutions.filter((s) => s.practiceGroup === groupId);
    return { id: groupId, groupIndex, meta, items };
  });

  return (
    <div className="home-page">
      <section className="home-hero home-hero--photo" aria-label={hero.title}>
        <div
          className="home-hero-photo"
          style={{ backgroundImage: "url('/assets/images/home-hero-abstract.png')" }}
        />
        <div className="home-hero-shade" />
        <div className="home-hero-inner">
          <p className="home-hero-kicker">{ui.established}</p>
          <h1 className="home-hero-title">{hero.title}</h1>
          <p className="home-text-subtitle">{hero.subtitle}</p>
          <p className="home-text-desc">{hero.desc}</p>
        </div>
      </section>

      <section className="home-solutions" id="solutions" aria-label={ui.solutions}>
        <div className="home-solutions-inner">
          <header className="home-section-head home-solutions-head">
            <h2 className="home-section-title">{ui.solutions}</h2>
          </header>
          <div className="home-solution-groups">
            {groups.map((group) => (
              <article
                className="home-solution-group"
                data-group={group.id}
                style={{ ["--group-i" as string]: group.groupIndex }}
                key={group.id}
              >
                <header className="home-solution-group-head">
                  <div className="home-solution-group-head-copy">
                    <span className="home-solution-group-index">
                      {String(group.groupIndex + 1).padStart(2, "0")}
                    </span>
                    <h3 className="home-solution-group-title">{group.meta.labels[lang]}</h3>
                    <p className="home-solution-group-lead">{group.meta.leads[lang]}</p>
                  </div>
                </header>
                <div className="home-solution-group-list">
                  {group.items.map((item, index) => (
                    <Link
                      className="home-solution-group-item"
                      href={`/${lang}/${item.slug}/`}
                      style={{ ["--item-i" as string]: index }}
                      key={item.slug}
                    >
                      <span className="home-solution-group-copy">
                        <span className="home-solution-group-item-title">{item.title}</span>
                        {item.lead ? (
                          <span className="home-solution-group-item-text">
                            {firstSentence(item.lead)}
                          </span>
                        ) : null}
                        <span className="home-solution-group-item-more">{ui.learnMore}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
