export type AdminArea = "website" | "assistant" | "clients";

export type MemberAccess = {
  owner: boolean;
  website: boolean;
  assistant: boolean;
  clients: boolean;
};

export type AdminMember = {
  id: string;
  email: string;
  name: string;
  owner: boolean;
  website: boolean;
  assistant: boolean;
  clients: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export const ACCESS_PRESETS: Record<string, MemberAccess> = {
  website: { owner: false, website: true, assistant: false, clients: false },
  assistant: { owner: false, website: false, assistant: true, clients: false },
  sales: { owner: false, website: false, assistant: false, clients: true },
  all: { owner: false, website: true, assistant: true, clients: true },
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function memberCan(member: Pick<AdminMember, "owner" | AdminArea>, area: AdminArea): boolean {
  if (member.owner) return true;
  return member[area];
}
