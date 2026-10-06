import Link from "next/link";
import type { ReactNode } from "react";

/** Page header inside the persistent dashboard shell (sidebar stays mounted). */
export function Shell({
  title,
  children,
  actions,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** @deprecated Sidebar path highlighting is optional; kept for call-site compatibility */
  path?: string;
  /** When set, shows a Back link above the page title (edit/detail pages). */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      {backHref ? (
        <Link href={backHref} className="back-link">
          <span className="back-link-arrow" aria-hidden>
            ←
          </span>
          {backLabel}
        </Link>
      ) : null}
      <div className="topbar">
        <h2>{title}</h2>
        {actions ? <div className="topbar-actions">{actions}</div> : null}
      </div>
      {children}
    </>
  );
}

export { requireAuth } from "@/components/shell-auth";
