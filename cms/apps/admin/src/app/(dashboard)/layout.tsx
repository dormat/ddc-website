import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { SideNav } from "@/components/side-nav";
import { SubmitButton } from "@/components/submit-button";
import { requireAuth } from "@/components/shell-auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAuth();

  return (
    <div className="shell">
      <aside className="side">
        <h1>DDC Admin</h1>
        <SideNav />
        <form action={logoutAction} className="side-logout">
          <SubmitButton className="btn" pendingLabel="Signing out…">
            Log out
          </SubmitButton>
        </form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
