import { CrmOverviewPage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";
import { CrmSearchParams, resolveFlashMessage } from "@/lib/crm-page";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStartupChecklistProgress } from "@/lib/startup-checklist-progress";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: Promise<CrmSearchParams>;
}) {
  const viewer = await getAuthenticatedUser();
  const [snapshot, flashMessage, checklistProgress] = await Promise.all([
    getCrmSnapshot(),
    resolveFlashMessage(searchParams),
    getStartupChecklistProgress(viewer?.email),
  ]);

  return (
    <CrmOverviewPage
      checklistProgress={checklistProgress}
      flashMessage={flashMessage}
      snapshot={snapshot}
      viewerEmail={viewer?.email}
    />
  );
}
