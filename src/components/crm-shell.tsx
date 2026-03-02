import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/auth";
import { logoutAction } from "@/app/auth-actions";
import { CrmBrand } from "@/components/crm-brand";
import { CrmNav } from "@/components/crm-nav";

export function CrmShell({
  authEnabled,
  viewer,
  children,
}: {
  authEnabled: boolean;
  viewer?: AuthenticatedUser | null;
  children: ReactNode;
}) {
  return (
    <main className="brand-shell grid-lines min-h-screen px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-card sticky top-4 z-40 overflow-hidden rounded-[1.8rem] px-4 py-4 sm:px-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(157,100,65,0),rgba(157,100,65,0.45),rgba(77,91,134,0.5),rgba(30,102,104,0.45),rgba(157,100,65,0))]" />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3">
              <CrmBrand />
              <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
                Signal-first CRM for belief progression, leak exposure, and weighted revenue.
              </p>
            </div>

            <CrmNav />

            <div className="flex flex-wrap items-center gap-3">
              {authEnabled ? (
                <>
                  <div className="rounded-2xl border border-[rgba(33,42,52,0.08)] bg-[linear-gradient(135deg,rgba(77,91,134,0.14),rgba(30,102,104,0.12))] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                    Signed in as {viewer?.name ?? viewer?.email ?? "Unknown user"}
                  </div>
                  <form action={logoutAction}>
                    <button
                      className="rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[rgba(255,255,255,0.46)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[rgba(255,255,255,0.72)]"
                      type="submit"
                    >
                      Log Out
                    </button>
                  </form>
                </>
              ) : (
                <div className="rounded-2xl border border-[rgba(157,100,65,0.14)] bg-[rgba(197,148,79,0.13)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)]">
                  Add CRM_USER_* and CRM_SESSION_SECRET to turn on login.
                </div>
              )}
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
