"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function ensureUserProfile(user: { id: string; email?: string; user_metadata?: { name?: string } }) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();

  if (profile) return;

  await supabase.from("users").insert({
    id: user.id,
    name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
  });
}

export async function createGroup(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  await ensureUserProfile(user);

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const whatsappGroupLink = (formData.get("whatsappGroupLink") as string) || null;

  const { data: group, error } = await supabase
    .from("cricket_groups")
    .insert({
      name,
      description,
      whatsapp_group_link: whatsappGroupLink,
      created_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !group) return { error: error?.message ?? "Failed to create group" };

  const { error: membershipError } = await supabase.from("group_memberships").insert({
    group_id: group.id,
    user_id: user.id,
    role: "HOST",
    status: "ACTIVE",
  });

  if (membershipError) return { error: membershipError.message };

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function createMatch(groupId: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const locationName = formData.get("locationName") as string;
  const locationAddress = formData.get("locationAddress") as string;
  const maxPlayers = parseInt(formData.get("maxPlayers") as string, 10);
  const feePerPlayer = parseFloat(formData.get("feePerPlayer") as string) || 0;
  const prepaymentRequired = formData.get("prepaymentRequired") === "on";

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      group_id: groupId,
      created_by_user_id: user.id,
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      location_name: locationName,
      location_address: locationAddress,
      max_players: maxPlayers,
      fee_per_player: feePerPlayer,
      prepayment_required: prepaymentRequired,
      status: "SCHEDULED",
    })
    .select("id")
    .single();

  if (error || !match) return { error: error?.message ?? "Failed to create match" };

  revalidatePath(`/groups/${groupId}`);
  redirect(`/matches/${match.id}`);
}
