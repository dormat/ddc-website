"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminMember } from "@/lib/member-access";
import { memberCan } from "@/lib/member-access";

const NAV: Array<{ href: string; label: string; area?: "website" | "assistant" | "clients" | "owner" }> = [
  { href: "/", label: "Dashboard" },
  { href: "/assistant", label: "Assistant", area: "assistant" },
  { href: "/clients", label: "Clients", area: "clients" },
  { href: "/products", label: "Products", area: "website" },
  { href: "/solutions", label: "Solutions", area: "website" },
  { href: "/industries", label: "Industries", area: "website" },
  { href: "/about", label: "About", area: "website" },
  { href: "/settings", label: "Settings", area: "website" },
  { href: "/members", label: "Members", area: "owner" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function visible(member: AdminMember, item: (typeof NAV)[number]) {
  if (item.href === "/settings") {
    return memberCan(member, "website") || memberCan(member, "assistant");
  }
  if (!item.area) return true;
  if (item.area === "owner") return member.owner;
  return memberCan(member, item.area);
}

export function SideNav({ member }: { member: AdminMember }) {
  const pathname = usePathname() || "/";
  const items = NAV.filter((item) => visible(member, item));
  return (
    <nav>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(pathname, item.href) ? "active" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
