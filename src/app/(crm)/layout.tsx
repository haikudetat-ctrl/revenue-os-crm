import type { ReactNode } from "react";
import { CrmShell } from "@/components/crm-shell";
import { requireCrmAccess } from "@/lib/crm-page";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { authEnabled, viewer } = await requireCrmAccess();

  return (
    <CrmShell authEnabled={authEnabled} viewer={viewer}>
      {children}
    </CrmShell>
  );
}
