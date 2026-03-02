import { CrmWorkspacePage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";
import { CrmSearchParams, resolveFlashMessage } from "@/lib/crm-page";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<CrmSearchParams>;
}) {
  const [snapshot, flashMessage] = await Promise.all([
    getCrmSnapshot(),
    resolveFlashMessage(searchParams),
  ]);

  return <CrmWorkspacePage flashMessage={flashMessage} snapshot={snapshot} />;
}
