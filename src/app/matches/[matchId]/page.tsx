import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getConfirmedCount, canManageMatch } from "@/lib/match-logic";
import { formatDate, formatMatchTime, formatMatchFee, isMatchElapsed } from "@/lib/utils";
import { RsvpActions } from "@/components/rsvp-actions";
import { MatchTeamsDisplay } from "@/components/match-teams-display";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { MatchShareLink } from "@/components/match-share-link";
import { MatchJoinGate } from "@/components/match-join-gate";
import { MatchAccessMessage } from "@/components/match-access-message";
import { buttonVariants } from "@/components/ui/button";
import { Badge, statusLabel, formatStatus } from "@/components/ui/badge";
import {
  firstRpcRow,
  isMatchJoinContext,
  normalizeMatchRpc,
} from "@/lib/rpc-result";
import type { Match, MatchParticipation, Payment } from "@/lib/types/database";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const user = await requireAuth();
  const { matchId } = await params;
  const supabase = await createClient();

  const { data: rpcMatch } = await supabase.rpc("get_match_for_user", {
    p_match_id: matchId,
  });

  let match = normalizeMatchRpc(rpcMatch);
  if (!match) {
    const { data: fallbackMatch } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();
    match = normalizeMatchRpc(fallbackMatch);
  }

  if (!match) {
    const { data: joinContext, error: joinError } = await supabase.rpc("get_match_join_context", {
      p_match_id: matchId,
    });

    if (joinError) {
      return (
        <MatchAccessMessage
          message="We couldn't load this match right now. Ask the group host for an invite link, then try the match link again."
        />
      );
    }

    const context = firstRpcRow(joinContext);
    if (!isMatchJoinContext(context)) notFound();
    return <MatchJoinGate matchId={matchId} context={context} />;
  }

  const { data: group } = await supabase
    .from("cricket_groups")
    .select("name")
    .eq("id", match.group_id)
    .single();

  const confirmedCount = await getConfirmedCount(matchId);
  const canManage = await canManageMatch(match, user.id);

  const { data: participation } = await supabase
    .from("match_participations")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  const { data: latestPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("match_id", matchId)
    .eq("payer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const typedMatch = match;
  const typedParticipation = participation as MatchParticipation | null;
  const typedPayment = latestPayment as Payment | null;

  let teamRoster: {
    teamA: { userId: string; name: string }[];
    teamB: { userId: string; name: string }[];
    unassigned: { userId: string; name: string }[];
  } | null = null;

  if (typedMatch.status === "SCHEDULED") {
    const { data: confirmedParticipations } = await supabase
      .from("match_participations")
      .select("user_id, team")
      .eq("match_id", matchId)
      .eq("status", "CONFIRMED")
      .order("joined_at", { ascending: true });

    if (confirmedParticipations && confirmedParticipations.length > 0) {
      const rosterUserIds = confirmedParticipations.map((p) => p.user_id);
      const { data: rosterUsers } = await supabase
        .from("users")
        .select("id, name")
        .in("id", rosterUserIds);

      const nameByUserId = (rosterUsers ?? []).reduce(
        (acc, u) => {
          acc[u.id] = u.name;
          return acc;
        },
        {} as Record<string, string>
      );

      const toPlayer = (userId: string) => ({
        userId,
        name: nameByUserId[userId] ?? "Player",
      });

      teamRoster = {
        teamA: confirmedParticipations
          .filter((p) => p.team === "A")
          .map((p) => toPlayer(p.user_id)),
        teamB: confirmedParticipations
          .filter((p) => p.team === "B")
          .map((p) => toPlayer(p.user_id)),
        unassigned: confirmedParticipations
          .filter((p) => !p.team)
          .map((p) => toPlayer(p.user_id)),
      };
    }
  }

  return (
    <div>
      <Link href={`/groups/${match.group_id}`} className="text-sm text-green-700 hover:underline">
        ← Back to {group?.name ?? "group"}
      </Link>

      <div className="mt-2">
        <p className="text-sm text-gray-500">{group?.name}</p>
        <h1 className="text-2xl font-bold text-gray-900">{typedMatch.title}</h1>
        <div className="mt-2">
          <Badge variant={statusLabel(typedMatch.status)}>{formatStatus(typedMatch.status)}</Badge>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">When</p>
          <p className="text-gray-900">
            {formatDate(typedMatch.date)} · {formatMatchTime(typedMatch.start_time, typedMatch.end_time)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Where</p>
          <p className="font-medium text-gray-900">{typedMatch.location_name}</p>
          <p className="text-sm text-gray-500">{typedMatch.location_address}</p>
          {typedMatch.google_maps_link && (
            <a
              href={typedMatch.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:underline"
            >
              Open in Maps →
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Players</p>
            <p className="text-lg font-semibold text-green-700">
              {confirmedCount} / {typedMatch.max_players}
            </p>
            <p className="text-xs text-gray-500">confirmed</p>
          </div>
          <div>
            {Number(typedMatch.fee_per_player) > 0 ? (
              <>
                <p className="text-xs font-medium uppercase text-gray-400">Fee</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatMatchFee(Number(typedMatch.fee_per_player))}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-gray-900">
                {formatMatchFee(Number(typedMatch.fee_per_player))}
              </p>
            )}
            {typedMatch.prepayment_required && (
              <>
                <p className="text-xs text-amber-600">Prepayment required</p>
                {typedMatch.host_upi_vpa && (
                  <p className="text-xs text-gray-500">Pay host via UPI</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {typedMatch.status === "SCHEDULED" && <MatchShareLink matchId={matchId} />}

      {canManage && typedMatch.status === "SCHEDULED" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/matches/${matchId}/edit`}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            Edit match
          </Link>
          <DeleteMatchButton matchId={matchId} matchTitle={typedMatch.title} />
        </div>
      )}

      {canManage && (
        <Link
          href={`/matches/${matchId}/manage`}
          className="mt-4 block text-center text-sm text-green-700 hover:underline"
        >
          Manage participants →
        </Link>
      )}

      {teamRoster && (
        <MatchTeamsDisplay
          teamAName={typedMatch.team_a_name ?? null}
          teamBName={typedMatch.team_b_name ?? null}
          teamA={teamRoster.teamA}
          teamB={teamRoster.teamB}
          unassigned={teamRoster.unassigned}
          currentUserId={user.id}
        />
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Your response</h2>
        <RsvpActions
          matchId={matchId}
          groupId={match.group_id}
          prepaymentRequired={typedMatch.prepayment_required}
          confirmedCount={confirmedCount}
          maxPlayers={typedMatch.max_players}
          participation={typedParticipation}
          latestPayment={typedPayment}
          elapsed={isMatchElapsed(typedMatch.date, typedMatch.start_time)}
        />
      </div>
    </div>
  );
}
