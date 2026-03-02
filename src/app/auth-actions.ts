"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthFullyConfigured, loginWithCredentials, logout } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?status=error&message=Email%20and%20password%20are%20required.");
  }

  if (!isAuthFullyConfigured()) {
    redirect(
      "/login?status=error&message=Authentication%20is%20not%20configured.%20Add%20the%20CRM_USER_*%20and%20CRM_SESSION_SECRET%20env%20vars.",
    );
  }

  const result = await loginWithCredentials(email, password);

  if (!result.ok) {
    redirect(`/login?status=error&message=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/");
  redirect("/?status=success&message=Welcome%20back.");
}

export async function logoutAction() {
  await logout();
  revalidatePath("/");
  redirect("/login?status=success&message=Signed%20out.");
}
