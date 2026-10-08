import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { memberCan, type AdminArea, type AdminMember } from "@/lib/members-store";

export async function requireAuth(): Promise<AdminMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireArea(area: AdminArea): Promise<AdminMember> {
  const member = await requireAuth();
  if (!memberCan(member, area)) redirect("/?forbidden=1");
  return member;
}

export async function requireAnyArea(areas: AdminArea[]): Promise<AdminMember> {
  const member = await requireAuth();
  if (!areas.some((area) => memberCan(member, area))) redirect("/?forbidden=1");
  return member;
}

export async function requireOwner(): Promise<AdminMember> {
  const member = await requireAuth();
  if (!member.owner) redirect("/?forbidden=1");
  return member;
}
