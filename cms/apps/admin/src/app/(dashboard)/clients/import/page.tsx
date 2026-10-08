import { CsvImport } from "@/components/csv-import";
import { requireArea, Shell } from "@/components/shell";

export default async function ImportClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireArea("clients");
  const sp = await searchParams;
  return (
    <Shell title="Import clients" backHref="/clients" backLabel="Clients">
      {sp.error ? <p className="error">{sp.error}</p> : null}
      <CsvImport />
    </Shell>
  );
}
