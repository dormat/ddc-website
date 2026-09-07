import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { isLoggedIn } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/industries", label: "Industries" },
  { href: "/pages", label: "Pages" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Login page has its own layout path under /login — this layout wraps authenticated routes via (app) group.
  return children;
}

export async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/login");
}

export function Shell({
  title,
  children,
  actions,
  path,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  path: string;
}) {
  return (
    <div className="shell">
      <aside className="side">
        <h1>DDC Admin</h1>
        <nav>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={path === item.href ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} style={{ marginTop: "1.5rem" }}>
          <button className="btn" type="submit" style={{ width: "100%" }}>
            Log out
          </button>
        </form>
      </aside>
      <main className="main">
        <div className="topbar">
          <h2>{title}</h2>
          <div>{actions}</div>
        </div>
        {children}
      </main>
    </div>
  );
}
