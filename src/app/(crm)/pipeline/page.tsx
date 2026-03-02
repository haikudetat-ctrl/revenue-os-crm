import { CrmPipelinePage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const snapshot = await getCrmSnapshot();

  return <CrmPipelinePage snapshot={snapshot} />;
}
