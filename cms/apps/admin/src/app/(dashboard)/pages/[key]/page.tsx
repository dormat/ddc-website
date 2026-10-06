import { redirect } from "next/navigation";
import { requireAuth } from "@/components/shell";

/** Legacy `/pages/[key]` routes redirect to the About editor. */
export default async function PageKeyRedirect() {
  await requireAuth();
  redirect("/about");
}
