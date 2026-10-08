"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/components/shell-auth";
import {
  countOwners,
  deleteMember,
  getMember,
  normalizeEmail,
  saveMember,
  type MemberAccess,
} from "@/lib/members-store";

function accessFromForm(formData: FormData): MemberAccess {
  const on = (name: string) => formData.get(name) === "on";
  const owner = on("owner");
  return {
    owner,
    website: owner || on("website"),
    assistant: owner || on("assistant"),
    clients: owner || on("clients"),
  };
}

export async function inviteMemberAction(formData: FormData) {
  const actor = await requireOwner();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const name = String(formData.get("name") || "");
  try {
    await saveMember({ email, name, access: accessFromForm(formData) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not invite that member.";
    redirect(`/members?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/members");
  redirect("/members?saved=1");
  void actor;
}

export async function updateMemberAction(formData: FormData) {
  const actor = await requireOwner();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const access = accessFromForm(formData);
  const current = await getMember(email);
  if (!current) redirect("/members?error=Member%20not%20found");
  if (current.owner && !access.owner) {
    const owners = await countOwners();
    if (owners <= 1) {
      redirect("/members?error=Keep%20at%20least%20one%20owner");
    }
  }
  if (actor.email === email && current.owner && !access.owner) {
    const owners = await countOwners();
    if (owners <= 1) redirect("/members?error=Keep%20at%20least%20one%20owner");
  }
  await saveMember({ email, name: current.name, access, keepName: true });
  revalidatePath("/members");
  redirect("/members?saved=1");
}

export async function removeMemberAction(formData: FormData) {
  const actor = await requireOwner();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const current = await getMember(email);
  if (!current) redirect("/members");
  if (current.owner) {
    const owners = await countOwners();
    if (owners <= 1) redirect("/members?error=Keep%20at%20least%20one%20owner");
  }
  if (actor.email === email && current.owner) {
    const owners = await countOwners();
    if (owners <= 1) redirect("/members?error=Keep%20at%20least%20one%20owner");
  }
  await deleteMember(email);
  revalidatePath("/members");
  redirect("/members?removed=1");
}
