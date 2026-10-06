"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/components/shell-auth";
import {
  bulkDeleteAssistantChats,
  bulkDeleteAssistantRequests,
  bulkUpdateAssistantRequests,
  deleteAssistantChat,
  deleteAssistantRequest,
  saveAssistantFollowupSettings,
  saveAssistantNotes,
  updateAssistantRequest,
} from "@/lib/assistant-store";

function parseIds(formData: FormData): string[] {
  const multi = formData.getAll("ids").map((v) => String(v || "").trim());
  const csv = String(formData.get("idsCsv") || "")
    .split(/[\s,]+/)
    .map((v) => v.trim());
  return [...multi, ...csv].filter(Boolean);
}

export async function saveAssistantNotesAction(formData: FormData) {
  await requireAuth();
  const text = String(formData.get("notes") || "");
  if (text.length > 80_000) {
    throw new Error("Notes are too long");
  }
  await saveAssistantNotes(text);
  revalidatePath("/assistant");
  revalidatePath("/assistant/notes");
  redirect("/assistant/notes?saved=1");
}

export async function saveAssistantFollowupSettingsAction(formData: FormData) {
  await requireAuth();
  await saveAssistantFollowupSettings({
    googleReviewUrl: String(formData.get("googleReviewUrl") || ""),
    upsellTitle: String(formData.get("upsellTitle") || ""),
    upsellUrl: String(formData.get("upsellUrl") || ""),
    upsellBlurb: String(formData.get("upsellBlurb") || ""),
  });
  revalidatePath("/settings");
  revalidatePath("/assistant");
  redirect("/settings?saved=1&assistant=1");
}

export async function updateAssistantRequestAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "").trim();
  if (!id || id.length > 80) {
    throw new Error("Missing request id");
  }
  const status = String(formData.get("status") || "").trim();
  const adminNotes = String(formData.get("adminNotes") || "");
  const acknowledge = formData.get("acknowledge") === "1" || formData.get("acknowledge") === "on";
  const quoteSent = formData.get("quoteSent") === "1" || formData.get("quoteSent") === "on";
  await updateAssistantRequest(id, { status, adminNotes, acknowledge, quoteSent });
  revalidatePath("/assistant");
  revalidatePath(`/assistant/requests/${id}`);
  redirect(`/assistant/requests/${id}?saved=1`);
}

export async function deleteAssistantRequestAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "").trim();
  if (!id || id.length > 80) {
    throw new Error("Missing request id");
  }
  await deleteAssistantRequest(id);
  revalidatePath("/assistant");
  revalidatePath(`/assistant/requests/${id}`);
  redirect("/assistant?tab=requests&deleted=1");
}

export async function deleteAssistantChatAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") || "").trim();
  if (!id || id.length > 80) {
    throw new Error("Missing chat id");
  }
  await deleteAssistantChat(id);
  revalidatePath("/assistant");
  revalidatePath(`/assistant/${id}`);
  redirect("/assistant?tab=calls&deleted=1");
}

export async function bulkUpdateAssistantRequestsAction(formData: FormData) {
  await requireAuth();
  const ids = parseIds(formData);
  if (!ids.length) {
    throw new Error("No requests selected");
  }
  const status = String(formData.get("status") || "").trim();
  const acknowledge =
    formData.get("acknowledge") === "1" || formData.get("acknowledge") === "on";
  if (!status && !acknowledge) {
    throw new Error("Choose a status or acknowledge");
  }
  await bulkUpdateAssistantRequests(ids, {
    status: status || undefined,
    acknowledge,
  });
  revalidatePath("/assistant");
  redirect("/assistant?tab=requests&bulk=1");
}

export async function bulkDeleteAssistantRequestsAction(formData: FormData) {
  await requireAuth();
  const ids = parseIds(formData);
  if (!ids.length) {
    throw new Error("No requests selected");
  }
  await bulkDeleteAssistantRequests(ids);
  revalidatePath("/assistant");
  redirect("/assistant?tab=requests&deleted=1");
}

export async function bulkDeleteAssistantChatsAction(formData: FormData) {
  await requireAuth();
  const ids = parseIds(formData);
  if (!ids.length) {
    throw new Error("No conversations selected");
  }
  await bulkDeleteAssistantChats(ids);
  revalidatePath("/assistant");
  redirect("/assistant?tab=calls&deleted=1");
}
