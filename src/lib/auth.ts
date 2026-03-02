import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AuthenticatedUser {
  email: string;
  name: string;
}

interface ConfiguredUser extends AuthenticatedUser {
  password: string;
}

interface SessionPayload {
  email: string;
  name: string;
  exp: number;
}

const SESSION_COOKIE_NAME = "revenue_os_crm_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

function getConfiguredUsers(): ConfiguredUser[] {
  const configuredUsers = [
    {
      email: process.env.CRM_USER_1_EMAIL?.trim() ?? "",
      password: process.env.CRM_USER_1_PASSWORD ?? "",
      name: process.env.CRM_USER_1_NAME?.trim() || "Owner 1",
    },
    {
      email: process.env.CRM_USER_2_EMAIL?.trim() ?? "",
      password: process.env.CRM_USER_2_PASSWORD ?? "",
      name: process.env.CRM_USER_2_NAME?.trim() || "Owner 2",
    },
  ];

  return configuredUsers.filter((user) => user.email && user.password);
}

function getSessionSecret() {
  return process.env.CRM_SESSION_SECRET ?? "";
}

function hasValidSecret() {
  return getSessionSecret().trim().length >= 16;
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function buildSessionToken(user: AuthenticatedUser) {
  const payload: SessionPayload = {
    email: user.email,
    name: user.name,
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function parseSessionToken(token: string): AuthenticatedUser | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.email || !payload.name || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function isAuthEnabled() {
  return getConfiguredUsers().length > 0 && hasValidSecret();
}

export function hasConfiguredUsers() {
  return getConfiguredUsers().length > 0;
}

export function isAuthFullyConfigured() {
  return hasConfiguredUsers() && hasValidSecret();
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return parseSessionToken(sessionToken);
}

export async function requireAuthenticatedUser() {
  if (!isAuthEnabled()) {
    return null;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?status=error&message=Please%20log%20in%20to%20access%20the%20CRM.");
  }

  return user;
}

export async function loginWithCredentials(email: string, password: string) {
  if (!isAuthFullyConfigured()) {
    return {
      ok: false as const,
      error:
        "Authentication is not fully configured. Set CRM_SESSION_SECRET and at least one CRM_USER_* credential pair.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const matchedUser = getConfiguredUsers().find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );

  if (!matchedUser || !safeEqual(password, matchedUser.password)) {
    return {
      ok: false as const,
      error: "Invalid email or password.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, buildSessionToken(matchedUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return {
    ok: true as const,
    user: {
      email: matchedUser.email,
      name: matchedUser.name,
    },
  };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
