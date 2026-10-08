"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, loginWithGoogleIdToken } from "@/lib/auth";

export async function loginWithGoogleAction(idToken: string) {
  return loginWithGoogleIdToken(idToken);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
