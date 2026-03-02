import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAuthEnabled } from "@/lib/auth";
import { CRM_APP_PATHS } from "@/lib/crm-nav";
import { FlashMessage } from "@/lib/types";

export interface CrmSearchParams {
  status?: string;
  message?: string;
}

export async function requireCrmAccess() {
  const authEnabled = isAuthEnabled();
  const viewer = await getAuthenticatedUser();

  if (authEnabled && !viewer) {
    redirect("/login");
  }

  return {
    authEnabled,
    viewer,
  };
}

export async function resolveFlashMessage(
  searchParams?: Promise<CrmSearchParams>,
): Promise<FlashMessage | null> {
  const params = searchParams ? await searchParams : undefined;

  if (!params?.message || (params.status !== "success" && params.status !== "error")) {
    return null;
  }

  return {
    status: params.status,
    message: params.message,
  };
}

export function resolveReturnPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/workspace";
  }

  return CRM_APP_PATHS.includes(value as (typeof CRM_APP_PATHS)[number]) ? value : "/workspace";
}
