"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireArea } from "@/components/shell-auth";
import {
  addClientNote,
  applyCsvPlans,
  createManualClient,
  planCsvImport,
  syncAssistantClients,
  updateClient,
  type CsvRowPlan,
} from "@/lib/crm-store";
import { listClients } from "@/lib/crm-store";
import { listMembers } from "@/lib/members-store";

function clientInput(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    company: String(formData.get("company") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    stage: String(formData.get("stage") || ""),
    ownerMemberId: String(formData.get("ownerMemberId") || ""),
    nextFollowUp: String(formData.get("nextFollowUp") || ""),
    notes: String(formData.get("notes") || ""),
  };
}

export async function createClientAction(formData: FormData) {
  const member = await requireArea("clients");
  let clientId = "";
  try {
    const client = await createManualClient(clientInput(formData), member);
    clientId = client.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add the client.";
    redirect(`/clients/new?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/clients");
  redirect(`/clients/${encodeURIComponent(clientId)}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const member = await requireArea("clients");
  const members = await listMembers();
  try {
    await updateClient(id, clientInput(formData), member, members);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the client.";
    redirect(`/clients/${encodeURIComponent(id)}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${encodeURIComponent(id)}?saved=1`);
}

export async function addClientNoteAction(id: string, formData: FormData) {
  const member = await requireArea("clients");
  try {
    await addClientNote(id, String(formData.get("note") || ""), member);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add the note.";
    redirect(`/clients/${encodeURIComponent(id)}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${encodeURIComponent(id)}?saved=1`);
}

export async function previewCsvAction(text: string): Promise<{ rows: CsvRowPlan[]; error?: string }> {
  await requireArea("clients");
  if (text.length > 1_500_000) return { rows: [], error: "That file is too large." };
  const [members, existing] = await Promise.all([listMembers(), listClients()]);
  return { rows: planCsvImport(text, members, existing) };
}

export async function importCsvAction(text: string) {
  const member = await requireArea("clients");
  if (text.length > 1_500_000) {
    redirect("/clients/import?error=That%20file%20is%20too%20large");
  }
  const [members, existing] = await Promise.all([listMembers(), listClients()]);
  const plans = planCsvImport(text, members, existing);
  const result = await applyCsvPlans(plans, member);
  revalidatePath("/clients");
  redirect(`/clients?imported=${result.created}&updated=${result.updated}`);
}

export async function syncAssistantClientsAction() {
  const member = await requireArea("clients");
  const result = await syncAssistantClients(member);
  revalidatePath("/clients");
  redirect(`/clients?synced=${result.createdOrLinked}`);
}
