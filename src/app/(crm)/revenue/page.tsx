import { CrmRevenuePage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";
import { CrmSearchParams, resolveFlashMessage } from "@/lib/crm-page";

export const dynamic = "force-dynamic";

export default async function RevenuePage({
  searchParams,
}: {
  searchParams?: Promise<CrmSearchParams>;
}) {
  const [snapshot, flashMessage] = await Promise.all([
    getCrmSnapshot(),
    resolveFlashMessage(searchParams),
  ]);

  return <CrmRevenuePage flashMessage={flashMessage} snapshot={snapshot} />;
}
