"use server";

import { redirect } from "next/navigation";
import { checkCredentials, clearSessionCookie, setSessionCookie } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  if (!checkCredentials(username, password)) {
    redirect("/login?error=1");
  }
  await setSessionCookie(username);
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
