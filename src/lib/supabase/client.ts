import { createBrowserClient } from "@supabase/ssr";
import { getAuthCookieOptions } from "@/lib/auth-cookies";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createClient() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey(),
    { cookieOptions: getAuthCookieOptions(host) }
  );
}
