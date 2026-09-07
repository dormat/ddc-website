import { notFound } from "next/navigation";
import { getPage, getSettings } from "@/lib/content";
import { UI, isLang, type Lang } from "@/lib/i18n";

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const [page, settings] = await Promise.all([getPage(lang, "contact"), getSettings()]);
  const ui = UI[lang];

  return (
    <div className="page-content">
      <header className="page-hero">
        <div className="page-hero-inner">
          <h1>{page?.title || ui.contact}</h1>
        </div>
      </header>
      <div className="content-wrap">
        {page?.body ? (
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: page.body }} />
        ) : null}
        <div className="contact-details">
          {settings.contact_phone ? (
            <p>
              <strong>{ui.phone}:</strong>{" "}
              <a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a>
            </p>
          ) : null}
          {settings.contact_email ? (
            <p>
              <strong>{ui.email}:</strong>{" "}
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
