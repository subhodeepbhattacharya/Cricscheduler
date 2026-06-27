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

export async function canManageMatch(
  match: { group_id: string; created_by_user_id: string },
  userId: string
): Promise<boolean> {
  if (match.created_by_user_id === userId) return true;
  return isHostOrCoHost(match.group_id, userId);
}

export async function isActiveMember(groupId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  return Boolean(data);
}

export async function getConfirmedCount(matchId: string): Promise<number> {
  const supabase = await createClient();

  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    "get_confirmed_count_for_match",
    { p_match_id: matchId }
  );

  if (!rpcError && typeof rpcCount === "number") {
    return rpcCount;
  }

  const { count } = await supabase
    .from("match_participations")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId)
    .eq("status", "CONFIRMED");
  return count ?? 0;
}

export async function promoteEarliestStandby(matchId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("promote_earliest_standby_for_match", {
    p_match_id: matchId,
  });

  if (error) {
    console.error("Failed to promote standby:", error.message);
  }
}
