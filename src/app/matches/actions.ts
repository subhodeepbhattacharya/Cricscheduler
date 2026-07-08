"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isActiveMember,
  getConfirmedCount,
  promoteEarliestStandby,
  canManageMatch,
} from "@/lib/match-logic";

const NOT_A_MEMBER_ERROR =
  "You must be an approved member of this group to RSVP. Ask the host for an invite link.";
import {
  buildUpiIntentUrl,
  normalizeUpiVpa,
  isValidUpiVpa,
  generateTransactionRef,
  getLocalTodayDateString,
  isMatchElapsed,
  normalizeOptionalTeamName,
} from "@/lib/utils";

const MATCH_ELAPSED_ERROR = "This match has already started and can no longer be joined.";
import type { ParticipationStatus, MatchTeam } from "@/lib/types/database";

async function upsertParticipation(
  matchId: string,
  userId: string,
  status: ParticipationStatus,
  extra?: { dropped_out_at?: string | null; team?: MatchTeam | null }
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("match_participations")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("match_participations")
      .update({ status, ...extra })
      .eq("id", existing.id);
  } else {
    await supabase.from("match_participations").insert({
      match_id: matchId,
      user_id: userId,
      status,
      ...extra,
    });
  }
}

export async function confirmSpot(matchId: string, groupId: string) {
  const user = await requireAuth();
  if (!(await isActiveMember(groupId, user.id))) return { error: NOT_A_MEMBER_ERROR };

  const supabase = await createClient();
  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };
  if (isMatchElapsed(match.date, match.start_time)) return { error: MATCH_ELAPSED_ERROR };

  const confirmedCount = await getConfirmedCount(matchId);
  const status: ParticipationStatus =
    confirmedCount < match.max_players ? "CONFIRMED" : "STANDBY";

  await upsertParticipation(matchId, user.id, status, { dropped_out_at: null });
  revalidatePath(`/matches/${matchId}`);
  return { success: true, status };
}

export async function initiatePayment(matchId: string, groupId: string) {
  const user = await requireAuth();
  if (!(await isActiveMember(groupId, user.id))) return { error: NOT_A_MEMBER_ERROR };

  const supabase = await createClient();
  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };
  if (isMatchElapsed(match.date, match.start_time)) return { error: MATCH_ELAPSED_ERROR };
  if (!match.prepayment_required) return { error: "Prepayment not required" };

  const hostVpa = match.host_upi_vpa?.trim();
  if (!hostVpa) {
    return {
      error: "This match has no host UPI ID configured. Ask the host to edit the match.",
    };
  }

  const transactionRef = generateTransactionRef();
  const upiIntentUrl = buildUpiIntentUrl({
    vpa: hostVpa,
    amount: Number(match.fee_per_player),
    transactionRef,
    note: `${match.title} - ${transactionRef}`,
  });

  const { error: paymentError } = await supabase.from("payments").insert({
    match_id: matchId,
    payer_user_id: user.id,
    amount: match.fee_per_player,
    currency: "INR",
    upi_intent_url: upiIntentUrl,
    status: "PENDING",
    provider: "UPI_INTENT",
    transaction_ref: transactionRef,
  });

  if (paymentError) return { error: paymentError.message };

  // Hold spot as standby until host verifies payment
  await upsertParticipation(matchId, user.id, "STANDBY", { dropped_out_at: null });

  revalidatePath(`/matches/${matchId}`);
  return { upiIntentUrl, transactionRef, status: "STANDBY" as const };
}

export async function declineSpot(matchId: string, groupId: string) {
  const user = await requireAuth();
  if (!(await isActiveMember(groupId, user.id))) return { error: NOT_A_MEMBER_ERROR };
  await upsertParticipation(matchId, user.id, "DECLINED");
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function dropOut(matchId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: participation } = await supabase
    .from("match_participations")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (!participation || participation.status !== "CONFIRMED") {
    return { error: "Not confirmed for this match" };
  }

  await upsertParticipation(matchId, user.id, "DROPPED_OUT", {
    dropped_out_at: new Date().toISOString(),
    team: null,
  });
  await promoteEarliestStandby(matchId);

  revalidatePath(`/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}/manage`);
  return { success: true };
}

export async function updatePaymentStatus(
  paymentId: string,
  matchId: string,
  status: "SUCCESS" | "FAILED"
) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("group_id, created_by_user_id").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) return { error: "Not authorized" };

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!payment) return { error: "Payment not found" };

  await supabase.from("payments").update({ status }).eq("id", paymentId);

  if (status === "SUCCESS") {
    const confirmedCount = await getConfirmedCount(matchId);
    const { data: matchData } = await supabase
      .from("matches")
      .select("max_players")
      .eq("id", matchId)
      .single();
    const newStatus: ParticipationStatus =
      matchData && confirmedCount < matchData.max_players ? "CONFIRMED" : "STANDBY";
    await upsertParticipation(matchId, payment.payer_user_id, newStatus, {
      dropped_out_at: null,
    });
  } else if (status === "FAILED") {
    const { data: participation } = await supabase
      .from("match_participations")
      .select("status")
      .eq("match_id", matchId)
      .eq("user_id", payment.payer_user_id)
      .single();

    if (participation?.status === "CONFIRMED") {
      await upsertParticipation(matchId, payment.payer_user_id, "DROPPED_OUT", {
        dropped_out_at: new Date().toISOString(),
      });
      await promoteEarliestStandby(matchId);
    }
  }

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function promoteStandby(participationId: string, matchId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) return { error: "Not authorized" };

  const confirmedCount = await getConfirmedCount(matchId);
  if (confirmedCount >= match.max_players) {
    return { error: "Match is full" };
  }

  await supabase
    .from("match_participations")
    .update({ status: "CONFIRMED", dropped_out_at: null })
    .eq("id", participationId);

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function markDroppedOut(participationId: string, matchId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("group_id, created_by_user_id").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) return { error: "Not authorized" };

  const { data: participation } = await supabase
    .from("match_participations")
    .select("status")
    .eq("id", participationId)
    .single();

  const wasConfirmed = participation?.status === "CONFIRMED";

  await supabase
    .from("match_participations")
    .update({ status: "DROPPED_OUT", dropped_out_at: new Date().toISOString(), team: null })
    .eq("id", participationId);

  if (wasConfirmed) {
    await promoteEarliestStandby(matchId);
  }

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function assignParticipantTeam(
  participationId: string,
  matchId: string,
  team: MatchTeam | null
) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };
  if (match.status !== "SCHEDULED") {
    return { error: "Teams can only be assigned for scheduled matches" };
  }

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) return { error: "Not authorized" };

  const { data: participation } = await supabase
    .from("match_participations")
    .select("status")
    .eq("id", participationId)
    .eq("match_id", matchId)
    .single();

  if (!participation) return { error: "Participant not found" };
  if (participation.status !== "CONFIRMED") {
    return { error: "Only confirmed players can be assigned to a team" };
  }

  const { error } = await supabase
    .from("match_participations")
    .update({ team })
    .eq("id", participationId);

  if (error) return { error: error.message };

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

const TEAM_NAME_MAX_LENGTH = 40;

export async function updateMatchTeamNames(
  matchId: string,
  teamAName: string,
  teamBName: string
) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };
  if (match.status !== "SCHEDULED") {
    return { error: "Team names can only be changed for scheduled matches" };
  }

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) return { error: "Not authorized" };

  function normalize(name: string): { ok: true; value: string | null } | { ok: false; error: string } {
    const trimmed = name.trim();
    if (!trimmed) return { ok: true, value: null };
    if (trimmed.length > TEAM_NAME_MAX_LENGTH) {
      return { ok: false, error: `Team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer` };
    }
    return { ok: true, value: trimmed };
  }

  const normalizedA = normalize(teamAName);
  if (!normalizedA.ok) return { error: normalizedA.error };
  const normalizedB = normalize(teamBName);
  if (!normalizedB.ok) return { error: normalizedB.error };

  const { error } = await supabase
    .from("matches")
    .update({
      team_a_name: normalizedA.value,
      team_b_name: normalizedB.value,
    })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

async function getMatchForManagement(matchId: string, userId: string) {
  const supabase = await createClient();

  const { data: rpcMatch } = await supabase.rpc("get_match_for_user", {
    p_match_id: matchId,
  });

  type ManageableMatch = {
    id: string;
    group_id: string;
    created_by_user_id: string;
    status: string;
    date: string;
  };

  const match = rpcMatch as ManageableMatch | null;

  if (!match) {
    return { error: "Match not found." as const };
  }

  const allowed = await canManageMatch(match, userId);
  if (!allowed) return { error: "You do not have permission to manage this match." as const };

  return { match, supabase };
}

export async function addParticipantToMatch(matchId: string, userId: string) {
  const user = await requireAuth();
  const result = await getMatchForManagement(matchId, user.id);
  if ("error" in result) return { error: result.error };

  const { match, supabase } = result;
  if (match.status !== "SCHEDULED") {
    return { error: "Only scheduled matches accept new players." };
  }

  const { data: status, error } = await supabase.rpc("add_participant_to_match", {
    p_match_id: matchId,
    p_user_id: userId,
  });

  if (error) {
    const rpcMissing =
      error.code === "PGRST202" || error.message.includes("add_participant_to_match");
    if (rpcMissing) {
      return {
        error:
          "Add player is not available yet. Run supabase/migrations/023_add_participant_rpc.sql in the Supabase SQL Editor.",
      };
    }
    return { error: error.message };
  }

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true, status: status as ParticipationStatus };
}

function parseMatchFormData(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const opponentTeamNameRaw = ((formData.get("opponentTeamName") as string) || "").trim();
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const locationName = (formData.get("locationName") as string).trim();
  const locationAddress = (formData.get("locationAddress") as string).trim();
  const googleMapsLink = ((formData.get("googleMapsLink") as string) || "").trim() || null;
  const maxPlayers = parseInt(formData.get("maxPlayers") as string, 10);
  const feePerPlayer = parseFloat(formData.get("feePerPlayer") as string) || 0;
  const prepaymentRequired = formData.get("prepaymentRequired") === "on";
  const hostUpiVpaRaw = ((formData.get("hostUpiVpa") as string) || "").trim();

  return {
    title,
    opponentTeamNameRaw,
    date,
    startTime,
    locationName,
    locationAddress,
    googleMapsLink,
    maxPlayers,
    feePerPlayer,
    prepaymentRequired,
    hostUpiVpaRaw,
  };
}

export async function updateMatch(matchId: string, formData: FormData) {
  const user = await requireAuth();
  const result = await getMatchForManagement(matchId, user.id);
  if ("error" in result) return { error: result.error };

  const { match } = result;
  if (match.status !== "SCHEDULED") {
    return { error: "Only scheduled matches can be edited." };
  }

  const parsed = parseMatchFormData(formData);
  const todayStr = getLocalTodayDateString();
  if (parsed.date < todayStr) {
    return { error: "Match date cannot be in the past." };
  }

  if (!parsed.locationName || !parsed.locationAddress) {
    return { error: "Location name and address are required." };
  }

  if (parsed.maxPlayers < 2) {
    return { error: "Max players must be at least 2." };
  }

  if (parsed.prepaymentRequired && parsed.feePerPlayer <= 0) {
    return { error: "Fee per player must be greater than ₹0 when UPI prepayment is required." };
  }

  const normalizedOpponent = normalizeOptionalTeamName(parsed.opponentTeamNameRaw);
  if (!normalizedOpponent.ok) return { error: normalizedOpponent.error };

  let hostUpiVpa: string | null = null;
  if (parsed.prepaymentRequired) {
    if (!parsed.hostUpiVpaRaw) {
      return { error: "Enter your UPI ID (e.g. name@okicici) when prepayment is required." };
    }
    hostUpiVpa = normalizeUpiVpa(parsed.hostUpiVpaRaw);
    if (!isValidUpiVpa(hostUpiVpa)) {
      return { error: "Enter a valid UPI ID (e.g. 9876543210@paytm or name@okicici)." };
    }
  }

  const confirmedCount = await getConfirmedCount(matchId);
  if (parsed.maxPlayers < confirmedCount) {
    return {
      error: `Max players cannot be less than confirmed players (${confirmedCount}).`,
    };
  }

  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("update_match_for_user", {
    p_match_id: matchId,
    p_title: parsed.title,
    p_date: parsed.date,
    p_start_time: parsed.startTime,
    p_location_name: parsed.locationName,
    p_location_address: parsed.locationAddress,
    p_google_maps_link: parsed.googleMapsLink ?? "",
    p_max_players: parsed.maxPlayers,
    p_fee_per_player: parsed.feePerPlayer,
    p_prepayment_required: parsed.prepaymentRequired,
    p_host_upi_vpa: hostUpiVpa ?? "",
  });

  if (rpcError) {
    const rpcMissing =
      rpcError.code === "PGRST202" ||
      rpcError.message.includes("update_match_for_user");

    if (rpcMissing) {
      return {
        error:
          "Match update is not available yet. Run supabase/migrations/009_update_match_rpc.sql, 010_fix_matches_rls_recursion.sql, and 022_match_host_upi_vpa.sql in the Supabase SQL Editor.",
      };
    }

    return { error: rpcError.message };
  }

  const { error: teamNameError } = await supabase
    .from("matches")
    .update({ team_b_name: normalizedOpponent.value })
    .eq("id", matchId);

  if (teamNameError) return { error: teamNameError.message };

  revalidatePath(`/groups/${match.group_id}`, "page");
  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}

export async function deleteMatch(matchId: string) {
  const user = await requireAuth();
  const result = await getMatchForManagement(matchId, user.id);
  if ("error" in result) return { error: result.error };

  const { match } = result;
  if (match.status !== "SCHEDULED") {
    return { error: "Only scheduled matches can be deleted." };
  }

  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("delete_match_for_user", {
    p_match_id: matchId,
  });

  if (rpcError) {
    const rpcMissing =
      rpcError.code === "PGRST202" ||
      rpcError.message.includes("delete_match_for_user");

    if (!rpcMissing) {
      return { error: rpcError.message };
    }

    const { error } = await supabase.from("matches").delete().eq("id", matchId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/groups/${match.group_id}`, "page");
  redirect(`/groups/${match.group_id}`);
}
