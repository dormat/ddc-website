import { redirect } from "next/navigation";
import { requireArea } from "@/components/shell";

/** Legacy `/pages/[key]` routes redirect to the About editor. */
export default async function PageKeyRedirect() {
  await requireArea("website");
  redirect("/about");
}
