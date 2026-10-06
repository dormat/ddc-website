import { getApps, initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  type CollectionReference,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

const NOTES_DOC = "assistantConfig/notes";
const SETTINGS_DOC = "assistantConfig/settings";
const CHATS = "assistantChats";
const REQUESTS = "assistantRequests";

export type AssistantNotes = {
  text: string;
  updatedAt: string | null;
};

export type AssistantFollowupSettings = {
  googleReviewUrl: string;
  upsellTitle: string;
  upsellUrl: string;
  upsellBlurb: string;
  updatedAt: string | null;
};

export type AssistantChat = {
  id: string;
  name: string;
  contact: string;
  device: string;
  channel: string;
  messageCount: number;
  handedOff: boolean;
  rating: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AssistantRequestKind = "purchase" | "lab" | string;
export type AssistantRequestStatus = "new" | "acknowledged" | "in_progress" | "done" | "closed" | string;

export type AssistantCsat = {
  resolved: boolean | null;
  rating: number;
  comment: string;
  submittedAt: string | null;
};

export type AssistantRequest = {
  id: string;
  kind: AssistantRequestKind;
  status: AssistantRequestStatus;
  fields: Record<string, string>;
  conversationId: string;
  adminNotes: string;
  createdAt: string | null;
  updatedAt: string | null;
  acknowledgedAt: string | null;
  doneAt: string | null;
  quoteSentAt: string | null;
  hotLead: boolean;
  marketingConsent: boolean;
  csat: AssistantCsat | null;
  csatInviteSentAt: string | null;
  quoteFollowup3Sent: string | null;
  quoteFollowup7Sent: string | null;
  quoteFollowup14Sent: string | null;
  emailService: boolean;
  emailCustomer: boolean;
  emailChannel: string;
};

export type AssistantMessage = {
  id: string;
  role: string;
  text: string;
  kind: string;
  photoPath: string;
  figureIds: number[];
  seq: number;
  createdAt: string | null;
};

function ensureFirebaseApp() {
  if (getApps().length) return;
  initializeApp();
}

function db() {
  ensureFirebaseApp();
  return getFirestore();
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function loadAssistantNotes(): Promise<AssistantNotes> {
  try {
    const snap = await db().doc(NOTES_DOC).get();
    if (!snap.exists) return { text: "", updatedAt: null };
    const data = snap.data() || {};
    return {
      text: typeof data.text === "string" ? data.text : "",
      updatedAt: asIso(data.updatedAt),
    };
  } catch (err) {
    console.warn("loadAssistantNotes failed", err);
    return { text: "", updatedAt: null };
  }
}

export async function saveAssistantNotes(text: string): Promise<void> {
  const cleaned = text.replace(/\r\n/g, "\n").trimEnd();
  await db().doc(NOTES_DOC).set(
    {
      text: cleaned,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function loadAssistantFollowupSettings(): Promise<AssistantFollowupSettings> {
  try {
    const snap = await db().doc(SETTINGS_DOC).get();
    if (!snap.exists) {
      return {
        googleReviewUrl: "",
        upsellTitle: "",
        upsellUrl: "",
        upsellBlurb: "",
        updatedAt: null,
      };
    }
    const data = snap.data() || {};
    return {
      googleReviewUrl: String(data.googleReviewUrl || ""),
      upsellTitle: String(data.upsellTitle || ""),
      upsellUrl: String(data.upsellUrl || ""),
      upsellBlurb: String(data.upsellBlurb || ""),
      updatedAt: asIso(data.updatedAt),
    };
  } catch (err) {
    console.warn("loadAssistantFollowupSettings failed", err);
    return {
      googleReviewUrl: "",
      upsellTitle: "",
      upsellUrl: "",
      upsellBlurb: "",
      updatedAt: null,
    };
  }
}

export async function saveAssistantFollowupSettings(
  patch: Omit<AssistantFollowupSettings, "updatedAt">,
): Promise<void> {
  await db().doc(SETTINGS_DOC).set(
    {
      googleReviewUrl: String(patch.googleReviewUrl || "").trim().slice(0, 500),
      upsellTitle: String(patch.upsellTitle || "").trim().slice(0, 200),
      upsellUrl: String(patch.upsellUrl || "").trim().slice(0, 500),
      upsellBlurb: String(patch.upsellBlurb || "").trim().slice(0, 1000),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

function chatFromDoc(doc: QueryDocumentSnapshot): AssistantChat {
  const data = doc.data() || {};
  const rating = Number(data.rating || 0);
  return {
    id: doc.id,
    name: String(data.name || ""),
    contact: String(data.contact || ""),
    device: String(data.device || "LT22"),
    channel: String(data.channel || "web"),
    messageCount: Number(data.messageCount || 0),
    handedOff: Boolean(data.handedOff),
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0,
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}

export async function listAssistantChats(limit = 300): Promise<AssistantChat[]> {
  try {
    const snap = await db().collection(CHATS).limit(Math.min(limit, 500)).get();
    const rows: AssistantChat[] = snap.docs.map(chatFromDoc);
    rows.sort((a: AssistantChat, b: AssistantChat) =>
      String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")),
    );
    return rows;
  } catch (err) {
    console.warn("listAssistantChats failed", err);
    return [];
  }
}

export async function getAssistantChat(id: string): Promise<AssistantChat | null> {
  try {
    const snap = await db().collection(CHATS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() || {};
    const rating = Number(data.rating || 0);
    return {
      id: snap.id,
      name: String(data.name || ""),
      contact: String(data.contact || ""),
      device: String(data.device || "LT22"),
      channel: String(data.channel || "web"),
      messageCount: Number(data.messageCount || 0),
      handedOff: Boolean(data.handedOff),
      rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0,
      createdAt: asIso(data.createdAt),
      updatedAt: asIso(data.updatedAt),
    };
  } catch (err) {
    console.warn("getAssistantChat failed", err);
    return null;
  }
}

export async function listAssistantMessages(chatId: string): Promise<AssistantMessage[]> {
  try {
    const snap = await db()
      .collection(CHATS)
      .doc(chatId)
      .collection("messages")
      .orderBy("seq")
      .get();
    return snap.docs.map((doc: QueryDocumentSnapshot): AssistantMessage => {
      const data = doc.data() || {};
      const figures = Array.isArray(data.figureIds)
        ? data.figureIds
            .map((n: unknown) => Number(n))
            .filter((n: number) => Number.isFinite(n))
        : [];
      return {
        id: doc.id,
        role: String(data.role || ""),
        text: String(data.text || ""),
        kind: String(data.kind || ""),
        photoPath: String(data.photoPath || ""),
        figureIds: figures,
        seq: Number(data.seq || 0),
        createdAt: asIso(data.createdAt),
      };
    });
  } catch (err) {
    console.warn("listAssistantMessages failed", err);
    return [];
  }
}

function fieldsFromData(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[String(key)] = String(value);
    }
  }
  return out;
}

function requestFromData(id: string, data: Record<string, unknown>): AssistantRequest {
  const email = data.email && typeof data.email === "object" ? (data.email as Record<string, unknown>) : {};
  const csatRaw = data.csat && typeof data.csat === "object" ? (data.csat as Record<string, unknown>) : null;
  const fields = fieldsFromData(data.fields);
  const marketingFromFields = /^(כן|yes|true|1)$/i.test(String(fields.marketingConsent || "").trim());
  const csat: AssistantCsat | null = csatRaw
    ? {
        resolved:
          typeof csatRaw.resolved === "boolean"
            ? csatRaw.resolved
            : csatRaw.resolved == null
              ? null
              : Boolean(csatRaw.resolved),
        rating: Number(csatRaw.rating || 0) || 0,
        comment: String(csatRaw.comment || ""),
        submittedAt: asIso(csatRaw.submittedAt),
      }
    : null;
  return {
    id,
    kind: String(data.kind || ""),
    status: String(data.status || "new"),
    fields,
    conversationId: String(data.conversationId || ""),
    adminNotes: String(data.adminNotes || ""),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
    acknowledgedAt: asIso(data.acknowledgedAt),
    doneAt: asIso(data.doneAt),
    quoteSentAt: asIso(data.quoteSentAt),
    hotLead: Boolean(data.hotLead),
    marketingConsent: Boolean(data.marketingConsent) || marketingFromFields,
    csat,
    csatInviteSentAt: asIso(data.csatInviteSentAt),
    quoteFollowup3Sent: asIso(data.quoteFollowup3Sent),
    quoteFollowup7Sent: asIso(data.quoteFollowup7Sent),
    quoteFollowup14Sent: asIso(data.quoteFollowup14Sent),
    emailService: Boolean(email.service),
    emailCustomer: Boolean(email.customer),
    emailChannel: String(email.channel || ""),
  };
}

export async function listAssistantRequests(limit = 300): Promise<AssistantRequest[]> {
  try {
    const snap = await db().collection(REQUESTS).limit(Math.min(limit, 500)).get();
    const rows = snap.docs.map((doc) => requestFromData(doc.id, doc.data() || {}));
    rows.sort((a, b) =>
      String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")),
    );
    return rows;
  } catch (err) {
    console.warn("listAssistantRequests failed", err);
    return [];
  }
}

export async function listAssistantRequestsForChat(chatId: string): Promise<AssistantRequest[]> {
  if (!chatId) return [];
  try {
    const snap = await db().collection(REQUESTS).where("conversationId", "==", chatId).limit(50).get();
    const rows = snap.docs.map((doc) => requestFromData(doc.id, doc.data() || {}));
    rows.sort((a, b) =>
      String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")),
    );
    return rows;
  } catch (err) {
    console.warn("listAssistantRequestsForChat failed", err);
    return [];
  }
}

export async function getAssistantRequest(id: string): Promise<AssistantRequest | null> {
  try {
    const snap = await db().collection(REQUESTS).doc(id).get();
    if (!snap.exists) return null;
    return requestFromData(snap.id, snap.data() || {});
  } catch (err) {
    console.warn("getAssistantRequest failed", err);
    return null;
  }
}

export async function updateAssistantRequest(
  id: string,
  patch: {
    status?: string;
    adminNotes?: string;
    acknowledge?: boolean;
    quoteSent?: boolean;
  },
): Promise<void> {
  const ref = db().collection(REQUESTS).doc(id);
  const existing = await ref.get();
  const prev = existing.exists ? existing.data() || {} : {};
  const prevStatus = String(prev.status || "new");
  const data: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (typeof patch.status === "string" && patch.status.trim()) {
    data.status = patch.status.trim().slice(0, 40);
  }
  if (typeof patch.adminNotes === "string") {
    data.adminNotes = patch.adminNotes.replace(/\r\n/g, "\n").slice(0, 20_000);
  }
  if (patch.acknowledge) {
    data.status = String(data.status || "acknowledged");
    if (!data.status || data.status === "new") data.status = "acknowledged";
    data.acknowledgedAt = new Date().toISOString();
  }
  const nextStatus = String(data.status || prevStatus);
  if (nextStatus === "done" && prevStatus !== "done" && !prev.doneAt) {
    data.doneAt = new Date().toISOString();
  }
  if (patch.quoteSent && !prev.quoteSentAt) {
    data.quoteSentAt = new Date().toISOString();
  }
  await ref.set(data, { merge: true });
}

async function deleteCollectionDocs(
  collectionRef: CollectionReference,
  batchSize = 500,
): Promise<void> {
  const limit = Math.min(Math.max(batchSize, 1), 500);
  for (;;) {
    const snap = await collectionRef.limit(limit).get();
    if (snap.empty) return;
    const batch = db().batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    if (snap.size < limit) return;
  }
}

export async function deleteAssistantRequest(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 80) {
    throw new Error("Invalid request id");
  }
  await db().collection(REQUESTS).doc(trimmed).delete();
}

function cleanIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = String(raw || "").trim();
    if (!id || id.length > 80 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.slice(0, 200);
}

export async function bulkUpdateAssistantRequests(
  ids: string[],
  patch: { status?: string; acknowledge?: boolean },
): Promise<number> {
  const cleaned = cleanIds(ids);
  if (!cleaned.length) return 0;
  const firestore = db();
  let updated = 0;
  for (let i = 0; i < cleaned.length; i += 400) {
    const chunk = cleaned.slice(i, i + 400);
    const snaps = await Promise.all(chunk.map((id) => firestore.collection(REQUESTS).doc(id).get()));
    const batch = firestore.batch();
    const now = new Date().toISOString();
    for (let j = 0; j < chunk.length; j += 1) {
      const id = chunk[j];
      const prev = snaps[j]?.exists ? snaps[j].data() || {} : {};
      const prevStatus = String(prev.status || "new");
      const data: Record<string, unknown> = { updatedAt: now };
      if (typeof patch.status === "string" && patch.status.trim()) {
        data.status = patch.status.trim().slice(0, 40);
      }
      if (patch.acknowledge) {
        const status = String(data.status || "").trim();
        data.status = !status || status === "new" ? "acknowledged" : status;
        data.acknowledgedAt = now;
      }
      const nextStatus = String(data.status || prevStatus);
      if (nextStatus === "done" && prevStatus !== "done" && !prev.doneAt) {
        data.doneAt = now;
      }
      batch.set(firestore.collection(REQUESTS).doc(id), data, { merge: true });
      updated += 1;
    }
    await batch.commit();
  }
  return updated;
}

export async function bulkDeleteAssistantRequests(ids: string[]): Promise<number> {
  const cleaned = cleanIds(ids);
  if (!cleaned.length) return 0;
  const firestore = db();
  let deleted = 0;
  for (let i = 0; i < cleaned.length; i += 400) {
    const chunk = cleaned.slice(i, i + 400);
    const batch = firestore.batch();
    for (const id of chunk) {
      batch.delete(firestore.collection(REQUESTS).doc(id));
      deleted += 1;
    }
    await batch.commit();
  }
  return deleted;
}

export async function deleteAssistantChat(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 80) {
    throw new Error("Invalid chat id");
  }
  const chatRef = db().collection(CHATS).doc(trimmed);
  await deleteCollectionDocs(chatRef.collection("messages"));
  await chatRef.delete();
}

export async function bulkDeleteAssistantChats(ids: string[]): Promise<number> {
  const cleaned = cleanIds(ids);
  let deleted = 0;
  for (const id of cleaned) {
    await deleteAssistantChat(id);
    deleted += 1;
  }
  return deleted;
}
