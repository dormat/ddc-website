import Link from "next/link";
import Script from "next/script";
import { getIndustries, getSettings, getSolutions } from "@/lib/content";
import { GROUP_META, GROUP_ORDER, UI, type Lang } from "@/lib/i18n";

export async function SiteShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const [solutions, industries, settings] = await Promise.all([
    getSolutions(lang),
    getIndustries(lang),
    getSettings(),
  ]);
  const ui = UI[lang];
  const brand = settings.brand_name || "Control Applications";
  const phone = settings.contact_phone || "";
  const email = settings.contact_email || "";

  const byGroup = GROUP_ORDER.map((groupId) => ({
    id: groupId,
    label: GROUP_META[groupId].labels[lang],
    items: solutions.filter((s) => s.practiceGroup === groupId),
  }));

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href={`/${lang}/`} className={`logo-link logo-link-${lang}`}>
            <img
              src="/assets/images/logo-icon.png"
              alt={brand}
              className={`logo logo-${lang}-icon`}
              width={44}
              height={44}
            />
            {lang !== "he" ? <span className={`logo-${lang}-text`}>{brand}</span> : null}
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <ul className="nav-list">
              <li className="nav-item">
                <Link className="nav-link" href={`/${lang}/`}>
                  {ui.home}
                </Link>
              </li>
              <li className="nav-item has-dropdown has-mega">
                <Link className="nav-link" href={`/${lang}/#solutions`}>
                  {ui.solutions}
                </Link>
                <div className="dropdown mega-dropdown" role="menu">
                  {byGroup.map((group) => (
                    <div className="mega-dropdown-col" data-group={group.id} key={group.id}>
                      <p className="mega-dropdown-heading">{group.label}</p>
                      <ul>
                        {group.items.map((item) => (
                          <li key={item.slug}>
                            <Link href={`/${lang}/${item.slug}/`}>{item.title}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href={`/${lang}/products/`}>
                  {ui.products}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href={`/${lang}/industries/`}>
                  {ui.industries}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href={`/${lang}/about/`}>
                  {ui.about}
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href={`/${lang}/contact/`}>
                  {ui.contact}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="header-actions">
            <div className="lang-switcher">
              {(["he", "en", "es"] as Lang[]).map((code) => (
                <Link
                  key={code}
                  href={`/${code}/`}
                  className={code === lang ? "lang-active" : undefined}
                >
                  {code.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-brand-name">{brand}</p>
          </div>
          <nav className="footer-sitemap" aria-label={ui.solutions}>
            <h3>{ui.solutions}</h3>
            <ul>
              {solutions.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${lang}/${s.slug}/`}>{s.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="footer-sitemap" aria-label={ui.industries}>
            <h3>{ui.industries}</h3>
            <ul>
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link href={`/${lang}/industries/#${i.slug}`}>{i.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="footer-sitemap" aria-label={ui.company}>
            <h3>{ui.company}</h3>
            <ul>
              <li>
                <Link href={`/${lang}/`}>{ui.home}</Link>
              </li>
              <li>
                <Link href={`/${lang}/about/`}>{ui.about}</Link>
              </li>
              <li>
                <Link href={`/${lang}/industries/`}>{ui.industries}</Link>
              </li>
              <li>
                <Link href={`/${lang}/products/`}>{ui.products}</Link>
              </li>
              <li>
                <Link href={`/${lang}/contact/`}>{ui.contact}</Link>
              </li>
            </ul>
          </nav>
          <div className="footer-contact">
            <h3>{ui.contact}</h3>
            {phone ? (
              <p>
                <strong>{ui.phone}:</strong> <a href={`tel:${phone}`}>{phone}</a>
              </p>
            ) : null}
            {email ? (
              <p>
                <strong>{ui.email}:</strong> <a href={`mailto:${email}`}>{email}</a>
              </p>
            ) : null}
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {brand}</p>
        </div>
      </footer>
      <Script src="/assets/js/main.js" strategy="afterInteractive" />
    </>
  );
}
