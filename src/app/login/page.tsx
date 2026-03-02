import { loginAction } from "@/app/auth-actions";
import {
  getAuthenticatedUser,
  hasConfiguredUsers,
  isAuthEnabled,
  isAuthFullyConfigured,
} from "@/lib/auth";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authEnabled = isAuthEnabled();
  const authFullyConfigured = isAuthFullyConfigured();
  const configuredUsers = hasConfiguredUsers();
  const authenticatedUser = await getAuthenticatedUser();

  if (authEnabled && authenticatedUser) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : undefined;
  const status = params?.status === "success" ? "success" : params?.status === "error" ? "error" : null;
  const message = params?.message;

  return (
    <main className="grid-lines min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <section className="glass-card grid w-full max-w-5xl gap-6 rounded-[2rem] p-6 sm:grid-cols-[1.2fr_0.9fr] sm:p-8">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-[#102130] via-[#17334a] to-[#0f766e] p-6 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-100/80">
              Revenue OS CRM
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Protected access for you and your partner.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-cyan-50/85 sm:text-base">
              This CRM now supports two named accounts with separate credentials and a
              signed server-side session cookie. Shared passwords are deliberately avoided.
            </p>

            <div className="mt-6 rounded-3xl bg-white/10 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">
                Setup
              </p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-cyan-50/85">
                <li>`CRM_SESSION_SECRET` must be at least 16 characters.</li>
                <li>`CRM_USER_1_EMAIL`, `CRM_USER_1_PASSWORD`, `CRM_USER_1_NAME`</li>
                <li>`CRM_USER_2_EMAIL`, `CRM_USER_2_PASSWORD`, `CRM_USER_2_NAME`</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Sign In
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {authEnabled ? "Use your account credentials" : "Authentication not active yet"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {authEnabled
                ? "Only configured account holders can access the CRM."
                : authFullyConfigured
                  ? "Authentication is not active."
                  : configuredUsers
                    ? "User credentials exist, but CRM_SESSION_SECRET is missing or too short."
                    : "No CRM users are configured yet. Add the auth env vars to enable login."}
            </p>

            {message ? (
              <div
                className={`mt-5 rounded-3xl px-4 py-4 text-sm leading-6 ${
                  status === "success"
                    ? "bg-cyan-100 text-cyan-950"
                    : "bg-rose-100 text-rose-950"
                }`}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                  {status === "success" ? "Status" : "Error"}
                </span>
                <p className="mt-2">{message}</p>
              </div>
            ) : null}

            {authEnabled ? (
              <form action={loginAction} className="mt-6 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </span>
                  <input
                    className={inputClassName}
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Password
                  </span>
                  <input
                    className={inputClassName}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  type="submit"
                >
                  Log In
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Add the auth environment variables in Vercel, then reload this page. Until
                those are set, the CRM remains accessible without login.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600";
