import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/auth";
import { logoutAction } from "@/app/auth-actions";
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
    <main className="grid-lines min-h-screen px-4 py-4 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-card sticky top-4 z-40 rounded-[1.75rem] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-800">
                Revenue OS CRM
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Signal-first CRM for belief progression, leak exposure, and weighted revenue.
              </p>
            </div>

            <CrmNav />

            <div className="flex flex-wrap items-center gap-3">
              {authEnabled ? (
                <>
                  <div className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
                    Signed in as {viewer?.name ?? viewer?.email ?? "Unknown user"}
                  </div>
                  <form action={logoutAction}>
                    <button
                      className="rounded-full border border-slate-300 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                      type="submit"
                    >
                      Log Out
                    </button>
                  </form>
                </>
              ) : (
                <div className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-950">
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
