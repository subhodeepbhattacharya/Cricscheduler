import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
