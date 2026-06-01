import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/lib/types/database";

export async function getUserGroupRole(
  groupId: string,
  userId: string
): Promise<MembershipRole | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .single();
  return data?.role ?? null;
}

export async function isHostOrCoHost(groupId: string, userId: string): Promise<boolean> {
  const role = await getUserGroupRole(groupId, userId);
  return role === "HOST" || role === "CO_HOST";
}

export async function ensureGroupMembership(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (existing) return;

  await supabase.from("group_memberships").insert({
    group_id: groupId,
    user_id: userId,
    role: "PLAYER",
    status: "ACTIVE",
  });
}

export async function getConfirmedCount(matchId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("match_participations")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId)
    .eq("status", "CONFIRMED");
  return count ?? 0;
}

export async function promoteEarliestStandby(matchId: string) {
  const supabase = await createClient();
  const { data: standby } = await supabase
    .from("match_participations")
    .select("id")
    .eq("match_id", matchId)
    .eq("status", "STANDBY")
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (standby) {
    await supabase
      .from("match_participations")
      .update({ status: "CONFIRMED", dropped_out_at: null })
      .eq("id", standby.id);
  }
}
