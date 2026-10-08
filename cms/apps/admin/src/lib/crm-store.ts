import { firestore } from "@/lib/firebase";
import { listAssistantChats, listAssistantRequests } from "@/lib/assistant-store";
import { normalizeEmail, type AdminMember } from "@/lib/members-store";

export const CLIENT_STAGES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type ClientStage = (typeof CLIENT_STAGES)[number];
export type ClientSource = "assistant" | "manual" | "csv";

export const STAGE_LABELS: Record<ClientStage, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

const CLIENTS = "crmClients";

export type CrmClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: ClientSource;
  ownerMemberId: string;
  stage: ClientStage;
  nextFollowUp: string;
  notes: string;
  assistantChatIds: string[];
  assistantRequestIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
  createdByMemberId: string;
};

export type CrmActivity = {
  id: string;
  type: "created" | "imported" | "note" | "stage" | "owner" | "followup" | "linked";
  text: string;
  memberId: string;
  memberEmail: string;
  at: string | null;
};

export type AssistantContactInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  chatId: string;
  requestId: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,}$/;

export function isClientStage(value: string): value is ClientStage {
  return (CLIENT_STAGES as readonly string[]).includes(value);
}

export function normalizeClientEmail(value: string): string {
  const email = normalizeEmail(value);
  return EMAIL_RE.test(email) ? email : "";
}

function clean(value: string, max = 200): string {
  return value.trim().slice(0, max);
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

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function fromDoc(id: string, data: Record<string, unknown>): CrmClient {
  const stage = String(data.stage || "new");
  const source = String(data.source || "manual");
  return {
    id,
    name: String(data.name || ""),
    company: String(data.company || ""),
    email: normalizeClientEmail(String(data.email || "")),
    phone: String(data.phone || ""),
    source: source === "assistant" || source === "csv" || source === "manual" ? source : "manual",
    ownerMemberId: String(data.ownerMemberId || ""),
    stage: isClientStage(stage) ? stage : "new",
    nextFollowUp: String(data.nextFollowUp || ""),
    notes: String(data.notes || ""),
    assistantChatIds: stringList(data.assistantChatIds),
    assistantRequestIds: stringList(data.assistantRequestIds),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
    createdByMemberId: String(data.createdByMemberId || ""),
  };
}

function clients() {
  return firestore().collection(CLIENTS);
}

export async function listClients(): Promise<CrmClient[]> {
  const snap = await clients().limit(500).get();
  const rows = snap.docs.map((doc) => fromDoc(doc.id, doc.data() || {}));
  rows.sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  return rows;
}

export async function getClient(id: string): Promise<CrmClient | null> {
  const key = id.trim();
  if (!key) return null;
  const snap = await clients().doc(key).get();
  if (!snap.exists) return null;
  return fromDoc(snap.id, snap.data() || {});
}

export async function findClientByEmail(email: string): Promise<CrmClient | null> {
  const key = normalizeClientEmail(email);
  if (!key) return null;
  const snap = await clients().where("email", "==", key).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  return fromDoc(doc.id, doc.data() || {});
}

export async function listActivity(clientId: string): Promise<CrmActivity[]> {
  const snap = await clients().doc(clientId).collection("activity").limit(100).get();
  const rows = snap.docs.map((doc) => {
    const data = doc.data() || {};
    const type = String(data.type || "note");
    return {
      id: doc.id,
      type: (
        ["created", "imported", "note", "stage", "owner", "followup", "linked"] as const
      ).includes(type as CrmActivity["type"])
        ? (type as CrmActivity["type"])
        : "note",
      text: String(data.text || ""),
      memberId: String(data.memberId || ""),
      memberEmail: String(data.memberEmail || ""),
      at: asIso(data.at),
    };
  });
  rows.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  return rows;
}

async function addActivity(
  clientId: string,
  entry: Omit<CrmActivity, "id" | "at"> & { at?: string },
) {
  await clients()
    .doc(clientId)
    .collection("activity")
    .add({
      type: entry.type,
      text: entry.text.slice(0, 1000),
      memberId: entry.memberId,
      memberEmail: entry.memberEmail,
      at: entry.at || new Date().toISOString(),
    });
}

function fillEmpty(current: string, incoming: string): string {
  return current.trim() ? current : incoming.trim();
}

function docIdFor(input: { email: string; chatId: string; requestId: string }): string {
  if (input.email) return input.email;
  if (input.chatId) return `chat_${input.chatId}`;
  if (input.requestId) return `request_${input.requestId}`;
  return "";
}

function union(current: string[], extra: string[]): { next: string[]; added: string[] } {
  const next = [...current];
  const added: string[] = [];
  for (const item of extra) {
    if (!item || next.includes(item)) continue;
    next.push(item);
    added.push(item);
  }
  return { next, added };
}

/**
 * Create or refresh a client from the assistant.
 * Existing stage, owner, notes, and follow-up stay as they are.
 * A chat-only record is moved onto the email record once an email exists.
 */
export async function upsertAssistantClient(
  raw: AssistantContactInput,
  actor: { memberId: string; memberEmail: string },
): Promise<{ client: CrmClient; created: boolean; linked: boolean } | null> {
  const email = normalizeClientEmail(raw.email);
  const chatId = clean(raw.chatId, 80);
  const requestId = clean(raw.requestId, 80);
  const incoming = {
    name: clean(raw.name, 120),
    company: clean(raw.company, 160),
    phone: clean(raw.phone, 40),
    email,
  };
  if (!incoming.name && !incoming.email && !incoming.phone && !incoming.company && !chatId && !requestId) {
    return null;
  }
  const byEmail = email ? await findClientByEmail(email) : null;
  const targetId = byEmail?.id || docIdFor({ email, chatId, requestId });
  if (!targetId) return null;

  const orphanIds = [chatId ? `chat_${chatId}` : "", requestId ? `request_${requestId}` : ""].filter(
    (id) => id && id !== targetId,
  );
  const orphanSnaps = await Promise.all(orphanIds.map((id) => clients().doc(id).get()));
  const orphans = orphanSnaps
    .filter((snap) => snap.exists)
    .map((snap) => fromDoc(snap.id, snap.data() || {}));

  const targetSnap = await clients().doc(targetId).get();
  const existing = targetSnap.exists ? fromDoc(targetSnap.id, targetSnap.data() || {}) : null;
  const now = new Date().toISOString();

  const base: CrmClient = existing || {
    id: targetId,
    name: "",
    company: "",
    email,
    phone: "",
    source: "assistant",
    ownerMemberId: "",
    stage: "new",
    nextFollowUp: "",
    notes: "",
    assistantChatIds: [],
    assistantRequestIds: [],
    createdAt: now,
    updatedAt: now,
    createdByMemberId: actor.memberId,
  };

  if (!existing && email && orphans.length) {
    const moved = orphans[0];
    base.name = moved.name;
    base.company = moved.company;
    base.phone = moved.phone;
    base.ownerMemberId = moved.ownerMemberId;
    base.stage = moved.stage;
    base.nextFollowUp = moved.nextFollowUp;
    base.notes = moved.notes;
    base.source = moved.source;
    base.assistantChatIds = [...moved.assistantChatIds];
    base.assistantRequestIds = [...moved.assistantRequestIds];
    base.createdAt = moved.createdAt || now;
    base.createdByMemberId = moved.createdByMemberId;
  }

  base.name = fillEmpty(base.name, incoming.name);
  base.company = fillEmpty(base.company, incoming.company);
  base.phone = fillEmpty(base.phone, incoming.phone);
  base.email = email || base.email;
  for (const orphan of orphans) {
    base.name = fillEmpty(base.name, orphan.name);
    base.company = fillEmpty(base.company, orphan.company);
    base.phone = fillEmpty(base.phone, orphan.phone);
    base.assistantChatIds = union(base.assistantChatIds, orphan.assistantChatIds).next;
    base.assistantRequestIds = union(base.assistantRequestIds, orphan.assistantRequestIds).next;
  }

  const chats = union(base.assistantChatIds, chatId ? [chatId] : []);
  const requests = union(base.assistantRequestIds, requestId ? [requestId] : []);
  base.assistantChatIds = chats.next;
  base.assistantRequestIds = requests.next;
  const contactChanged =
    !existing ||
    base.name !== existing.name ||
    base.company !== existing.company ||
    base.phone !== existing.phone ||
    base.email !== existing.email;
  const linksChanged = chats.added.length > 0 || requests.added.length > 0 || orphans.length > 0;
  if (existing && !contactChanged && !linksChanged) {
    return { client: existing, created: false, linked: false };
  }
  base.updatedAt = now;
  if (!base.createdAt) base.createdAt = now;

  await clients().doc(targetId).set({
    name: base.name,
    company: base.company,
    email: base.email,
    phone: base.phone,
    source: base.source || "assistant",
    ownerMemberId: base.ownerMemberId,
    stage: base.stage,
    nextFollowUp: base.nextFollowUp,
    notes: base.notes,
    assistantChatIds: base.assistantChatIds,
    assistantRequestIds: base.assistantRequestIds,
    createdAt: base.createdAt,
    updatedAt: now,
    createdByMemberId: base.createdByMemberId,
  });

  const created = !existing && !(email && orphans.length);
  if (created) {
    await addActivity(targetId, {
      type: "created",
      text: "Created from the assistant",
      memberId: actor.memberId,
      memberEmail: actor.memberEmail,
    });
  }
  if (!existing && email && orphans.length) {
    await addActivity(targetId, {
      type: "linked",
      text: "Merged the assistant record onto this email",
      memberId: actor.memberId,
      memberEmail: actor.memberEmail,
    });
  }
  const linkedBits = [...chats.added.map((id) => `chat ${id}`), ...requests.added.map((id) => `request ${id}`)];
  if ((existing || orphans.length) && linkedBits.length) {
    await addActivity(targetId, {
      type: "linked",
      text: `Linked ${linkedBits.join(", ")}`,
      memberId: actor.memberId,
      memberEmail: actor.memberEmail,
    });
  }

  if (email) {
    for (const orphan of orphans) {
      if (orphan.id !== targetId) await clients().doc(orphan.id).delete();
    }
  }

  const client = await getClient(targetId);
  if (!client) return null;
  return { client, created, linked: linkedBits.length > 0 || Boolean(email && orphans.length) };
}

export async function createManualClient(
  input: {
    name: string;
    company: string;
    email: string;
    phone: string;
    stage: string;
    ownerMemberId: string;
    nextFollowUp: string;
    notes: string;
  },
  actor: AdminMember,
): Promise<CrmClient> {
  const email = normalizeClientEmail(input.email);
  if (email) {
    const dup = await findClientByEmail(email);
    if (dup) throw new Error("A client with this email already exists.");
  }
  const id = email || firestore().collection(CLIENTS).doc().id;
  const now = new Date().toISOString();
  const client: CrmClient = {
    id,
    name: clean(input.name, 120),
    company: clean(input.company, 160),
    email,
    phone: clean(input.phone, 40),
    source: "manual",
    ownerMemberId: input.ownerMemberId.trim(),
    stage: isClientStage(input.stage) ? input.stage : "new",
    nextFollowUp: clean(input.nextFollowUp, 10),
    notes: clean(input.notes, 4000),
    assistantChatIds: [],
    assistantRequestIds: [],
    createdAt: now,
    updatedAt: now,
    createdByMemberId: actor.id,
  };
  if (!client.name && !client.email && !client.company) {
    throw new Error("Enter a name, company, or email.");
  }
  await clients().doc(id).set({ ...client });
  await addActivity(id, {
    type: "created",
    text: "Added manually",
    memberId: actor.id,
    memberEmail: actor.email,
  });
  if (client.ownerMemberId) {
    await addActivity(id, {
      type: "owner",
      text: `Owner set to ${client.ownerMemberId}`,
      memberId: actor.id,
      memberEmail: actor.email,
    });
  }
  return client;
}

export async function updateClient(
  id: string,
  input: {
    name: string;
    company: string;
    email: string;
    phone: string;
    stage: string;
    ownerMemberId: string;
    nextFollowUp: string;
    notes: string;
  },
  actor: AdminMember,
  members: AdminMember[],
): Promise<void> {
  const current = await getClient(id);
  if (!current) throw new Error("Client not found.");
  const email = normalizeClientEmail(input.email);
  if (email && email !== current.email) {
    const dup = await findClientByEmail(email);
    if (dup && dup.id !== current.id) throw new Error("A client with this email already exists.");
  }
  const next = {
    name: clean(input.name, 120),
    company: clean(input.company, 160),
    email,
    phone: clean(input.phone, 40),
    stage: isClientStage(input.stage) ? input.stage : current.stage,
    ownerMemberId: input.ownerMemberId.trim(),
    nextFollowUp: clean(input.nextFollowUp, 10),
    notes: clean(input.notes, 4000),
    updatedAt: new Date().toISOString(),
  };
  await clients().doc(id).set(next, { merge: true });
  const memberName = (memberId: string) => {
    if (!memberId) return "Unassigned";
    return members.find((member) => member.id === memberId)?.email || memberId;
  };
  if (next.stage !== current.stage) {
    await addActivity(id, {
      type: "stage",
      text: `Stage changed from ${STAGE_LABELS[current.stage]} to ${STAGE_LABELS[next.stage]}`,
      memberId: actor.id,
      memberEmail: actor.email,
    });
  }
  if (next.ownerMemberId !== current.ownerMemberId) {
    await addActivity(id, {
      type: "owner",
      text: `Owner changed from ${memberName(current.ownerMemberId)} to ${memberName(next.ownerMemberId)}`,
      memberId: actor.id,
      memberEmail: actor.email,
    });
  }
  if (next.nextFollowUp !== current.nextFollowUp) {
    await addActivity(id, {
      type: "followup",
      text: next.nextFollowUp ? `Follow-up set to ${next.nextFollowUp}` : "Follow-up cleared",
      memberId: actor.id,
      memberEmail: actor.email,
    });
  }
  if (next.notes !== current.notes) {
    await addActivity(id, {
      type: "note",
      text: "Notes updated",
      memberId: actor.id,
      memberEmail: actor.email,
    });
  }
}

export async function addClientNote(id: string, text: string, actor: AdminMember) {
  const note = clean(text, 1000);
  if (!note) throw new Error("Enter a note.");
  const current = await getClient(id);
  if (!current) throw new Error("Client not found.");
  await addActivity(id, {
    type: "note",
    text: note,
    memberId: actor.id,
    memberEmail: actor.email,
  });
  await clients().doc(id).set({ updatedAt: new Date().toISOString() }, { merge: true });
}

export type CsvRowPlan = {
  line: number;
  status: "new" | "update" | "skip" | "error";
  message: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  stage: ClientStage | "";
  ownerMemberId: string;
  nextFollowUp: string;
  notes: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function headerKey(value: string): string {
  const key = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (key === "name" || key === "full name") return "name";
  if (key === "company" || key === "company name") return "company";
  if (key === "email" || key === "e mail") return "email";
  if (key === "phone" || key === "telephone") return "phone";
  if (key === "stage") return "stage";
  if (key === "owner" || key === "owner email") return "owner";
  if (key === "next follow up" || key === "follow up" || key === "followup") return "followup";
  if (key === "notes" || key === "note") return "notes";
  return "";
}

export function planCsvImport(
  text: string,
  members: AdminMember[],
  existing: CrmClient[],
): CsvRowPlan[] {
  const table = parseCsv(text);
  if (!table.length) return [];
  const headers = table[0].map(headerKey);
  const known = new Map(existing.filter((client) => client.email).map((client) => [client.email, client]));
  const seen = new Set<string>();
  const plans: CsvRowPlan[] = [];
  for (let i = 1; i < table.length && plans.length < 1000; i++) {
    const cells = table[i];
    const record: Record<string, string> = {};
    headers.forEach((key, index) => {
      if (key) record[key] = String(cells[index] || "").trim();
    });
    const line = i + 1;
    const email = normalizeClientEmail(record.email || "");
    if (!email) {
      plans.push({
        line,
        status: "error",
        message: "Email is required.",
        email: "",
        name: record.name || "",
        company: record.company || "",
        phone: record.phone || "",
        stage: "",
        ownerMemberId: "",
        nextFollowUp: "",
        notes: "",
      });
      continue;
    }
    if (seen.has(email)) {
      plans.push({
        line,
        status: "skip",
        message: "Duplicate email in this file.",
        email,
        name: record.name || "",
        company: "",
        phone: "",
        stage: "",
        ownerMemberId: "",
        nextFollowUp: "",
        notes: "",
      });
      continue;
    }
    seen.add(email);
    const stageRaw = (record.stage || "").trim().toLowerCase();
    if (stageRaw && !isClientStage(stageRaw)) {
      plans.push({
        line,
        status: "error",
        message: "Stage must be New, Contacted, Quoted, Won, Lost, or blank.",
        email,
        name: record.name || "",
        company: "",
        phone: "",
        stage: "",
        ownerMemberId: "",
        nextFollowUp: "",
        notes: "",
      });
      continue;
    }
    const ownerEmail = normalizeEmail(record.owner || "");
    let ownerMemberId = "";
    if (ownerEmail) {
      const owner = members.find((member) => member.email === ownerEmail);
      if (!owner) {
        plans.push({
          line,
          status: "error",
          message: `No member with email ${ownerEmail}.`,
          email,
          name: record.name || "",
          company: "",
          phone: "",
          stage: "",
          ownerMemberId: "",
          nextFollowUp: "",
          notes: "",
        });
        continue;
      }
      ownerMemberId = owner.id;
    }
    const follow = (record.followup || "").trim();
    if (follow && !/^\d{4}-\d{2}-\d{2}$/.test(follow)) {
      plans.push({
        line,
        status: "error",
        message: "Next follow-up must be YYYY-MM-DD or blank.",
        email,
        name: record.name || "",
        company: "",
        phone: "",
        stage: "",
        ownerMemberId: "",
        nextFollowUp: "",
        notes: "",
      });
      continue;
    }
    const current = known.get(email);
    plans.push({
      line,
      status: current ? "update" : "new",
      message: current ? "Fills empty contact fields. Stage, owner, notes, and follow-up stay as they are." : "New client",
      email,
      name: clean(record.name || "", 120),
      company: clean(record.company || "", 160),
      phone: clean(record.phone || "", 40),
      stage: stageRaw && isClientStage(stageRaw) ? stageRaw : "",
      ownerMemberId,
      nextFollowUp: follow,
      notes: clean(record.notes || "", 4000),
    });
  }
  return plans;
}

export async function applyCsvPlans(plans: CsvRowPlan[], actor: AdminMember): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  for (const plan of plans) {
    if (plan.status !== "new" && plan.status !== "update") continue;
    const existing = await findClientByEmail(plan.email);
    if (!existing && plan.status === "new") {
      const now = new Date().toISOString();
      await clients().doc(plan.email).set({
        name: plan.name,
        company: plan.company,
        email: plan.email,
        phone: plan.phone,
        source: "csv",
        ownerMemberId: plan.ownerMemberId,
        stage: plan.stage || "new",
        nextFollowUp: plan.nextFollowUp,
        notes: plan.notes,
        assistantChatIds: [],
        assistantRequestIds: [],
        createdAt: now,
        updatedAt: now,
        createdByMemberId: actor.id,
      });
      await addActivity(plan.email, {
        type: "imported",
        text: "Imported from CSV",
        memberId: actor.id,
        memberEmail: actor.email,
      });
      created++;
      continue;
    }
    if (!existing) continue;
    const patch = {
      name: fillEmpty(existing.name, plan.name),
      company: fillEmpty(existing.company, plan.company),
      phone: fillEmpty(existing.phone, plan.phone),
      updatedAt: new Date().toISOString(),
    };
    const changed =
      patch.name !== existing.name || patch.company !== existing.company || patch.phone !== existing.phone;
    if (changed) {
      await clients().doc(existing.id).set(patch, { merge: true });
      await addActivity(existing.id, {
        type: "imported",
        text: "Updated empty contact fields from CSV",
        memberId: actor.id,
        memberEmail: actor.email,
      });
      updated++;
    }
  }
  return { created, updated };
}

function phoneOrBlank(value: string): string {
  const phone = value.trim();
  if (!phone || EMAIL_RE.test(phone)) return "";
  return PHONE_RE.test(phone) || phone.length >= 6 ? phone : "";
}

function emailOrContact(email: string, contact: string): string {
  return normalizeClientEmail(email) || normalizeClientEmail(contact);
}

export async function syncAssistantClients(actor: AdminMember): Promise<{ createdOrLinked: number }> {
  const [chats, requests] = await Promise.all([listAssistantChats(500), listAssistantRequests(500)]);
  let createdOrLinked = 0;
  for (const chat of chats) {
    const email = emailOrContact(chat.email, chat.contact);
    const phone = phoneOrBlank(chat.contact);
    if (!chat.name && !email && !phone) continue;
    const saved = await upsertAssistantClient(
      {
        name: chat.name,
        company: "",
        email,
        phone,
        chatId: chat.id,
        requestId: "",
      },
      { memberId: actor.id, memberEmail: actor.email },
    );
    if (saved && (saved.created || saved.linked)) createdOrLinked++;
  }
  for (const request of requests) {
    const fields = request.fields;
    const email = normalizeClientEmail(fields.email || request.googleEmail || "");
    const name = fields.fullName || fields.contactName || "";
    const phone = fields.phone || "";
    if (!name && !email && !phone && !request.conversationId) continue;
    const saved = await upsertAssistantClient(
      {
        name,
        company: fields.companyName || "",
        email,
        phone,
        chatId: request.conversationId,
        requestId: request.id,
      },
      { memberId: actor.id, memberEmail: actor.email },
    );
    if (saved && (saved.created || saved.linked)) createdOrLinked++;
  }
  return { createdOrLinked };
}
