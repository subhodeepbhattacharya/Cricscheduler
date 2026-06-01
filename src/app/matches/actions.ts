"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  ensureGroupMembership,
  getConfirmedCount,
  promoteEarliestStandby,
  isHostOrCoHost,
} from "@/lib/match-logic";
import { buildUpiIntentUrl, generateTransactionRef } from "@/lib/utils";
import type { ParticipationStatus } from "@/lib/types/database";

async function upsertParticipation(
  matchId: string,
  userId: string,
  status: ParticipationStatus,
  extra?: { dropped_out_at?: string | null }
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
  await ensureGroupMembership(groupId, user.id);

  const supabase = await createClient();
  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const confirmedCount = await getConfirmedCount(matchId);
  const status: ParticipationStatus =
    confirmedCount < match.max_players ? "CONFIRMED" : "STANDBY";

  await upsertParticipation(matchId, user.id, status);
  revalidatePath(`/matches/${matchId}`);
  return { success: true, status };
}

export async function initiatePayment(matchId: string, groupId: string) {
  const user = await requireAuth();
  await ensureGroupMembership(groupId, user.id);

  const supabase = await createClient();
  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };
  if (!match.prepayment_required) return { error: "Prepayment not required" };

  const transactionRef = generateTransactionRef();
  const upiIntentUrl = buildUpiIntentUrl({
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
  await upsertParticipation(matchId, user.id, "STANDBY");

  revalidatePath(`/matches/${matchId}`);
  return { upiIntentUrl, transactionRef, status: "STANDBY" as const };
}

export async function declineSpot(matchId: string, groupId: string) {
  const user = await requireAuth();
  await ensureGroupMembership(groupId, user.id);
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

  const { data: match } = await supabase.from("matches").select("group_id").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const allowed = await isHostOrCoHost(match.group_id, user.id);
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

  const allowed = await isHostOrCoHost(match.group_id, user.id);
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

  const { data: match } = await supabase.from("matches").select("group_id").eq("id", matchId).single();
  if (!match) return { error: "Match not found" };

  const allowed = await isHostOrCoHost(match.group_id, user.id);
  if (!allowed) return { error: "Not authorized" };

  const { data: participation } = await supabase
    .from("match_participations")
    .select("status")
    .eq("id", participationId)
    .single();

  const wasConfirmed = participation?.status === "CONFIRMED";

  await supabase
    .from("match_participations")
    .update({ status: "DROPPED_OUT", dropped_out_at: new Date().toISOString() })
    .eq("id", participationId);

  if (wasConfirmed) {
    await promoteEarliestStandby(matchId);
  }

  revalidatePath(`/matches/${matchId}/manage`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
