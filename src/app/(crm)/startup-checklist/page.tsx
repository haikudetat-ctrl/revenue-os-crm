import { CrmStartupChecklistPage } from "@/components/crm-pages";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStartupChecklistProgress } from "@/lib/startup-checklist-progress";

export const dynamic = "force-dynamic";

export default async function StartupChecklistPage() {
  const viewer = await getAuthenticatedUser();
  const checklistProgress = await getStartupChecklistProgress(viewer?.email);

  return (
    <CrmStartupChecklistPage
      checklistProgress={checklistProgress}
      viewerEmail={viewer?.email}
    />
  );
}
