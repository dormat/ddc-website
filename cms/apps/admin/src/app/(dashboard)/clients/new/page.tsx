import { createClientAction } from "@/app/actions/clients";
import { ClientForm } from "@/components/client-form";
import { requireArea, Shell } from "@/components/shell";
import { listMembers } from "@/lib/members-store";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireArea("clients");
  const sp = await searchParams;
  const members = await listMembers();

  return (
    <Shell title="Add client" backHref="/clients" backLabel="Clients">
      {sp.error ? <p className="error">{sp.error}</p> : null}
      <ClientForm action={createClientAction} members={members} submitLabel="Add client" />
    </Shell>
  );
}
