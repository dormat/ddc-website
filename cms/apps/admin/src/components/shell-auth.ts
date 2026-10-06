import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/login");
}
