import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import * as bundled from "./credentials.server";

const COOKIE = "__session";

function creds() {
  return {
    username: bundled.username || process.env.ADMIN_USERNAME || "AdminDDC",
    password: bundled.password || process.env.ADMIN_PASSWORD || "6474998",
    sessionSecret:
      bundled.sessionSecret || process.env.SESSION_SECRET || "ddc-session-secret-change-in-prod-2026",
  };
}

function secret() {
  return creds().sessionSecret;
}

export function signSession(username: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username, t: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string;
      t?: number;
    };
    if (!data.u || !data.t) return false;
    if (Date.now() - data.t > 14 * 24 * 60 * 60 * 1000) return false;
    return data.u === creds().username;
  } catch {
    return false;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function setSessionCookie(username: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(username), {
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

export function checkCredentials(username: string, password: string): boolean {
  const c = creds();
  return username.trim() === c.username && password === c.password;
}
