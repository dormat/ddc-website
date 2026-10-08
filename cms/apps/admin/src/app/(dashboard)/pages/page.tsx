import { redirect } from "next/navigation";
import { requireArea } from "@/components/shell";

export default async function PagesPage() {
  await requireArea("website");
  redirect("/about");
}
