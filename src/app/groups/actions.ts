"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocalTodayDateString } from "@/lib/utils";
import { isHostOrCoHost } from "@/lib/match-logic";

async function ensureUserProfile(user: {
  id: string;
  phone?: string;
  email?: string;
  user_metadata?: { name?: string };
}) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();

  if (profile) return;

  const phone = user.phone ? (user.phone.startsWith("+") ? user.phone : `+${user.phone}`) : null;

  const { error } = await supabase.from("users").insert({
    id: user.id,
    name: user.user_metadata?.name ?? "Player",
    phone,
    email: user.email ?? null,
  });

  if (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
}

export async function createGroup(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  await ensureUserProfile(user);

  const name = (formData.get("name") as string).trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const whatsappRaw = ((formData.get("whatsappGroupLink") as string) || "").trim();
  const whatsappGroupLink = whatsappRaw || null;

  const groupId = randomUUID();

  // Avoid insert().select() — SELECT RLS blocks reading the row before membership exists.
  const { error } = await supabase.from("cricket_groups").insert({
    id: groupId,
    name,
    description,
    whatsapp_group_link: whatsappGroupLink,
    created_by_user_id: user.id,
  });

  if (error) return { error: error.message };

  const { error: membershipError } = await supabase.from("group_memberships").insert({
    group_id: groupId,
    user_id: user.id,
    role: "HOST",
    status: "ACTIVE",
  });

  if (membershipError) return { error: membershipError.message };

  revalidatePath("/groups");
  redirect(`/groups/${groupId}`);
}

export async function updateGroup(groupId: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const canManage = await isHostOrCoHost(groupId, user.id);
  if (!canManage) {
    return { error: "Only the group host can edit this group." };
  }

  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "Group name is required." };

  const description = ((formData.get("description") as string) || "").trim() || null;
  const whatsappRaw = ((formData.get("whatsappGroupLink") as string) || "").trim();
  const whatsappGroupLink = whatsappRaw || null;

  const { error } = await supabase
    .from("cricket_groups")
    .update({
      name,
      description,
      whatsapp_group_link: whatsappGroupLink,
    })
    .eq("id", groupId);

  if (error) return { error: error.message };

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`, "page");
  redirect(`/groups/${groupId}`);
}

export async function createMatch(groupId: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;

  const todayStr = getLocalTodayDateString();
  if (date < todayStr) {
    return { error: "Match date cannot be in the past." };
  }

  const locationName = (formData.get("locationName") as string).trim();
  const locationAddress = (formData.get("locationAddress") as string).trim();
  const googleMapsLink = ((formData.get("googleMapsLink") as string) || "").trim() || null;
  const maxPlayers = parseInt(formData.get("maxPlayers") as string, 10);
  const feePerPlayer = parseFloat(formData.get("feePerPlayer") as string) || 0;
  const prepaymentRequired = formData.get("prepaymentRequired") === "on";

  if (prepaymentRequired && feePerPlayer <= 0) {
    return { error: "Fee per player must be greater than ₹0 when UPI prepayment is required." };
  }

  const matchId = randomUUID();

  const { error } = await supabase.from("matches").insert({
    id: matchId,
    group_id: groupId,
    created_by_user_id: user.id,
    title,
    date,
    start_time: startTime,
    end_time: startTime,
    location_name: locationName,
    location_address: locationAddress,
    google_maps_link: googleMapsLink,
    max_players: maxPlayers,
    fee_per_player: feePerPlayer,
    prepayment_required: prepaymentRequired,
    status: "SCHEDULED",
  });

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}`, "page");
  revalidatePath(`/groups/${groupId}`, "layout");
  redirect(`/groups/${groupId}`);
}

export async function deleteGroup(groupId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: role } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  const { data: group } = await supabase
    .from("cricket_groups")
    .select("created_by_user_id")
    .eq("id", groupId)
    .single();

  const isHost = role?.role === "HOST";
  const isCreator = group?.created_by_user_id === user.id;

  if (!isHost && !isCreator) {
    return { error: "Only the group host can delete this group." };
  }

  const { error: rpcError } = await supabase.rpc("delete_group_for_user", {
    p_group_id: groupId,
  });

  if (rpcError) {
    const rpcMissing =
      rpcError.code === "PGRST202" ||
      rpcError.message.includes("delete_group_for_user");

    if (!rpcMissing) {
      return { error: rpcError.message };
    }

    // RPC not deployed — try a direct delete. RLS may silently affect 0 rows,
    // so request the deleted rows back and verify something was removed.
    const { data: deleted, error } = await supabase
      .from("cricket_groups")
      .delete()
      .eq("id", groupId)
      .select("id");

    if (error) return { error: error.message };

    if (!deleted || deleted.length === 0) {
      return {
        error:
          "Could not delete the group. Run supabase/migrations/011_delete_group_rpc.sql in the Supabase SQL Editor, then try again.",
      };
    }
  }

  revalidatePath("/groups");
  redirect("/groups");
}

export async function requestToJoinGroup(token: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  await ensureUserProfile(user);

  const { data, error } = await supabase.rpc("request_to_join_group", {
    p_token: token,
  });

  if (error) return { error: error.message };

  revalidatePath("/groups");
  return { status: (data as string) ?? "REQUESTED" };
}

export async function regenerateInvite(groupId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("regenerate_group_invite", {
    p_group_id: groupId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}`, "page");
  return { token: data as string };
}

export async function approveJoinRequest(membershipId: string, groupId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_join_request", {
    p_membership_id: membershipId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}`, "page");
  return { success: true };
}

export async function denyJoinRequest(membershipId: string, groupId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.rpc("deny_join_request", {
    p_membership_id: membershipId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/groups/${groupId}`, "page");
  return { success: true };
}
