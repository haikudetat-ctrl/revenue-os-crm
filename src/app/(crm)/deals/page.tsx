import { CrmDealsPage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const snapshot = await getCrmSnapshot();

  return <CrmDealsPage snapshot={snapshot} />;
}
