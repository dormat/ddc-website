import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/SiteShell";
import { dirFor, isLang, type Lang } from "@/lib/i18n";

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;

  return (
    <div className={`lang-root lang-${lang}`} lang={lang} dir={dirFor(lang)}>
      <SiteShell lang={lang}>{children}</SiteShell>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(lang)};document.documentElement.dir=${JSON.stringify(dirFor(lang))};document.body.className=${JSON.stringify(`lang-${lang}`)};`,
        }}
      />
    </div>
  );
}
