import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}
