import { redirect } from "next/navigation";
import { requireAuth } from "@/components/shell";

export default async function PagesPage() {
  await requireAuth();
  redirect("/about");
}
