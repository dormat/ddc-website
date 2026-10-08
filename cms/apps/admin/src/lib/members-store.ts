import { firestore } from "@/lib/firebase";
import {
  memberCan,
  normalizeEmail,
  type AdminArea,
  type AdminMember,
  type MemberAccess,
} from "@/lib/member-access";

export type { AdminArea, AdminMember, MemberAccess };
export { ACCESS_PRESETS, memberCan, normalizeEmail } from "@/lib/member-access";

const COLLECTION = "adminMembers";

/** Created on first admin sign-in if they are not already on the list. Later edits in Members are kept. */
const SEED_MEMBERS: Array<{ email: string; access: MemberAccess }> = [
  {
    email: "sharon.mat64@gmail.com",
    access: { owner: true, website: true, assistant: true, clients: true },
  },
  {
    email: "doron@ddc.co.il",
    access: { owner: true, website: true, assistant: true, clients: true },
  },
  {
    email: "ronen@ddc.co.il",
    access: { owner: true, website: true, assistant: true, clients: true },
  },
  {
    email: "service@ddc.co.il",
    access: { owner: false, website: false, assistant: true, clients: true },
  },
];

let seedPromise: Promise<void> | null = null;

export function ensureSeedMembers(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const row of SEED_MEMBERS) {
        const existing = await getMember(row.email);
        if (existing) continue;
        await saveMember({ email: row.email, access: row.access });
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
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

function fromDoc(id: string, data: Record<string, unknown>): AdminMember {
  return {
    id,
    email: normalizeEmail(String(data.email || id)),
    name: String(data.name || ""),
    owner: Boolean(data.owner),
    website: Boolean(data.website),
    assistant: Boolean(data.assistant),
    clients: Boolean(data.clients),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}

export async function getMember(id: string): Promise<AdminMember | null> {
  const key = normalizeEmail(id);
  if (!key) return null;
  const snap = await firestore().collection(COLLECTION).doc(key).get();
  if (!snap.exists) return null;
  return fromDoc(snap.id, snap.data() || {});
}

export async function getMemberByEmail(email: string): Promise<AdminMember | null> {
  return getMember(normalizeEmail(email));
}

export async function listMembers(): Promise<AdminMember[]> {
  const snap = await firestore().collection(COLLECTION).limit(200).get();
  const rows = snap.docs.map((doc) => fromDoc(doc.id, doc.data() || {}));
  rows.sort((a, b) => a.email.localeCompare(b.email));
  return rows;
}

export async function countOwners(): Promise<number> {
  const members = await listMembers();
  return members.filter((member) => member.owner).length;
}

export async function saveMember(input: {
  email: string;
  name?: string;
  access: MemberAccess;
  keepName?: boolean;
}): Promise<AdminMember> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  const ref = firestore().collection(COLLECTION).doc(email);
  const existing = await ref.get();
  const now = new Date().toISOString();
  const previous = existing.exists ? fromDoc(existing.id, existing.data() || {}) : null;
  const name = input.keepName
    ? previous?.name || ""
    : String(input.name ?? previous?.name ?? "").trim().slice(0, 120);
  const data = {
    email,
    name,
    owner: input.access.owner,
    website: input.access.owner || input.access.website,
    assistant: input.access.owner || input.access.assistant,
    clients: input.access.owner || input.access.clients,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
  await ref.set(data);
  return fromDoc(email, data);
}

export async function deleteMember(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;
  await firestore().collection(COLLECTION).doc(key).delete();
}

/** Break-glass owner from ADMIN_OWNER_EMAIL. Promotes that account on sign-in. */
export async function ensureOwnerEmail(email: string, name = ""): Promise<AdminMember | null> {
  const ownerEmail = normalizeEmail(email);
  if (!ownerEmail) return null;
  const existing = await getMember(ownerEmail);
  if (existing?.owner) {
    if (name && !existing.name) {
      return saveMember({
        email: ownerEmail,
        name,
        access: {
          owner: true,
          website: true,
          assistant: true,
          clients: true,
        },
      });
    }
    return existing;
  }
  return saveMember({
    email: ownerEmail,
    name: name || existing?.name || "",
    access: { owner: true, website: true, assistant: true, clients: true },
  });
}
