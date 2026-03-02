import { CrmDashboard } from "@/components/crm-dashboard";
import { getCrmSnapshot } from "@/lib/data";
import { FlashMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const snapshot = await getCrmSnapshot();
  const params = searchParams ? await searchParams : undefined;
  const flashMessage =
    params?.message && (params?.status === "success" || params?.status === "error")
      ? ({
          status: params.status,
          message: params.message,
        } satisfies FlashMessage)
      : null;

  return <CrmDashboard snapshot={snapshot} flashMessage={flashMessage} />;
}
