import { CrmContactsPage } from "@/components/crm-pages";
import { getCrmSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const snapshot = await getCrmSnapshot();

  return <CrmContactsPage snapshot={snapshot} />;
}
