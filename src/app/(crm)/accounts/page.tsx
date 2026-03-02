import { CrmAccountsPage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const snapshot = await getCrmSnapshot();

  return <CrmAccountsPage snapshot={snapshot} />;
}
