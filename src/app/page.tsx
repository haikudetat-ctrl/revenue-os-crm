import { CrmDashboard } from "@/components/crm-dashboard";
import { getCrmSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getCrmSnapshot();

  return <CrmDashboard snapshot={snapshot} />;
}
