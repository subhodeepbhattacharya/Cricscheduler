import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { needsProfileName } from "@/lib/profile-name";

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(options?: { allowIncompleteProfile?: boolean }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  if (!options?.allowIncompleteProfile) {
    const profile = await getUserProfile(user.id);
    if (needsProfileName(profile?.name, user)) {
      const h = await headers();
      let next = h.get("x-url") ?? "/groups";
      if (next.startsWith("/auth")) next = "/groups";
      redirect(`/auth/profile?next=${encodeURIComponent(next)}`);
    }
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}
