import { getAuthenticatedUser, isAuthEnabled } from "@/lib/auth";
import { CrmDashboard } from "@/components/crm-dashboard";
import { getCrmSnapshot } from "@/lib/data";
import { FlashMessage } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const authEnabled = isAuthEnabled();
  const viewer = await getAuthenticatedUser();

  if (authEnabled && !viewer) {
    redirect("/login");
  }

  const snapshot = await getCrmSnapshot();
  const params = searchParams ? await searchParams : undefined;
  const flashMessage =
    params?.message && (params?.status === "success" || params?.status === "error")
      ? ({
          status: params.status,
          message: params.message,
        } satisfies FlashMessage)
      : null;

  return (
    <CrmDashboard
      snapshot={snapshot}
      flashMessage={flashMessage}
      viewer={viewer}
      authEnabled={authEnabled}
    />
  );
}
