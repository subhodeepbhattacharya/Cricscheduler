import type { CookieOptions } from "@supabase/ssr";

/** Apex + subdomains of the production app host share auth cookies. */
export function getAuthCookieDomain(hostname: string): string | undefined {
  const host = hostname.split(":")[0].toLowerCase();
  if (host === "cricscheduler.com" || host.endsWith(".cricscheduler.com")) {
    return ".cricscheduler.com";
  }
  const fromEnv = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return fromEnv || undefined;
}

export function getAuthCookieOptions(hostname: string): CookieOptions {
  const domain = getAuthCookieDomain(hostname);
  return {
    ...(domain ? { domain } : {}),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
