import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import * as bundled from "./credentials.server";
import { ensureFirebaseApp } from "@/lib/firebase";
import {
  ensureOwnerEmail,
  ensureSeedMembers,
  getMember,
  normalizeEmail,
  type AdminMember,
} from "@/lib/members-store";

const COOKIE = "__session";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
};

function secret() {
  return bundled.sessionSecret || process.env.SESSION_SECRET || "ddc-session-secret-change-in-prod-2026";
}

export function ownerEmail(): string {
  return normalizeEmail(bundled.ownerEmail || process.env.ADMIN_OWNER_EMAIL || "");
}

export function signSession(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, t: Date.now() }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id?: string;
      email?: string;
      t?: number;
    };
    if (!data.id || !data.email || !data.t) return null;
    if (Date.now() - data.t > MAX_AGE_MS) return null;
    return { id: normalizeEmail(data.id), email: normalizeEmail(data.email) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSession(jar.get(COOKIE)?.value);
}

export async function getCurrentMember(): Promise<AdminMember | null> {
  const session = await getSession();
  if (!session) return null;
  const member = await getMember(session.id);
  if (!member || member.email !== session.email) return null;
  return member;
}

export async function isLoggedIn(): Promise<boolean> {
  return Boolean(await getCurrentMember());
}

export async function setSessionCookie(user: SessionUser) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type GoogleLoginResult =
  | { ok: true }
  | { ok: false; error: "not_invited" | "invalid" | "config" };

export async function loginWithGoogleIdToken(idToken: string): Promise<GoogleLoginResult> {
  const token = idToken.trim();
  if (!token) return { ok: false, error: "invalid" };
  ensureFirebaseApp();
  let email = "";
  let name = "";
  try {
    const decoded = await getAuth().verifyIdToken(token);
    email = normalizeEmail(String(decoded.email || ""));
    name = String(decoded.name || "").trim();
    if (!email || !decoded.email_verified) return { ok: false, error: "invalid" };
  } catch (err) {
    console.warn("Google sign-in verification failed", err);
    return { ok: false, error: "invalid" };
  }

  try {
    await ensureSeedMembers();
  } catch (err) {
    console.warn("Could not seed admin members", err);
  }

  const bootstrap = ownerEmail();
  let member = await getMember(email);
  if (bootstrap && email === bootstrap) {
    member = await ensureOwnerEmail(email, name);
  }
  if (!member) return { ok: false, error: "not_invited" };
  if (name && !member.name) {
    const { saveMember } = await import("@/lib/members-store");
    member = await saveMember({
      email: member.email,
      name,
      access: {
        owner: member.owner,
        website: member.website,
        assistant: member.assistant,
        clients: member.clients,
      },
    });
  }
  await setSessionCookie({ id: member.id, email: member.email });
  return { ok: true };
}

export function firebaseWebConfig(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
} | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || "";
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}
