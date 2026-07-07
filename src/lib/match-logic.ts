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

export async function isGroupHost(groupId: string, userId: string): Promise<boolean> {
  const role = await getUserGroupRole(groupId, userId);
  return role === "HOST";
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

export type MatchAddCandidate = {
  user_id: string;
  name: string;
  phone: string | null;
  role: MembershipRole;
};

function roleSortOrder(role: MembershipRole): number {
  if (role === "HOST") return 0;
  if (role === "CO_HOST") return 1;
  return 2;
}

async function getMatchAddCandidatesFallback(
  matchId: string,
  groupId: string
): Promise<MatchAddCandidate[]> {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("match_participations")
    .select("user_id, status")
    .eq("match_id", matchId)
    .in("status", ["CONFIRMED", "STANDBY"]);

  const onMatch = new Set((participations ?? []).map((p) => p.user_id));

  const { data: memberships } = await supabase
    .from("group_memberships")
    .select("user_id, role")
    .eq("group_id", groupId)
    .eq("status", "ACTIVE");

  const memberIds = (memberships ?? [])
    .map((m) => m.user_id)
    .filter((id) => !onMatch.has(id));

  if (memberIds.length === 0) return [];

  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone")
    .in("id", memberIds);

  const usersById = (users ?? []).reduce(
    (acc, u) => {
      acc[u.id] = u;
      return acc;
    },
    {} as Record<string, { id: string; name: string; phone: string | null }>
  );

  return (memberships ?? [])
    .filter((m) => !onMatch.has(m.user_id) && usersById[m.user_id])
    .map((m) => ({
      user_id: m.user_id,
      name: usersById[m.user_id].name,
      phone: usersById[m.user_id].phone,
      role: m.role as MembershipRole,
    }))
    .sort((a, b) => {
      const roleDiff = roleSortOrder(a.role) - roleSortOrder(b.role);
      if (roleDiff !== 0) return roleDiff;
      return a.name.localeCompare(b.name);
    });
}

export async function getMatchAddCandidates(
  matchId: string,
  groupId: string
): Promise<{ candidates: MatchAddCandidate[]; addPlayerReady: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_match_add_candidates", {
    p_match_id: matchId,
  });

  if (!error && data) {
    return {
      candidates: data as MatchAddCandidate[],
      addPlayerReady: true,
    };
  }

  const rpcMissing =
    error?.code === "PGRST202" || error?.message?.includes("get_match_add_candidates");

  return {
    candidates: await getMatchAddCandidatesFallback(matchId, groupId),
    addPlayerReady: !rpcMissing,
  };
}
