import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost, getUserGroupRole } from "@/lib/match-logic";
import { formatDate, formatMatchTime, formatCurrency, getLocalTodayDateString } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { DeleteGroupButton } from "@/components/delete-group-button";
import { InviteShare } from "@/components/invite-share";
import { PendingRequests, type PendingRequest } from "@/components/pending-requests";
import type { Match } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireAuth();
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase.from("cricket_groups").select("*").eq("id", groupId).single();
  if (!group) notFound();

  const canManage = await isHostOrCoHost(groupId, user.id);
  const role = await getUserGroupRole(groupId, user.id);
  const canDeleteGroup = role === "HOST" || group.created_by_user_id === user.id;

  let pendingRequests: PendingRequest[] = [];
  if (canManage) {
    const { data } = await supabase.rpc("get_pending_join_requests", {
      p_group_id: groupId,
    });
    pendingRequests = (data as PendingRequest[] | null) ?? [];
  }

  const today = getLocalTodayDateString();

  const { data: matches, error: matchesError } = await supabase.rpc(
    "get_group_upcoming_matches",
    {
      p_group_id: groupId,
      p_from_date: today,
    }
  );

  // Fallback if RPC not deployed yet
  let upcomingMatches: Match[] = (matches as Match[] | null) ?? [];
  if (matchesError) {
    const { data: fallbackMatches } = await supabase
      .from("matches")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "SCHEDULED")
      .gte("date", today)
      .order("date", { ascending: true });
    upcomingMatches = fallbackMatches ?? [];
  }

  const { count: memberCount } = await supabase
    .from("group_memberships")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "ACTIVE");

  const matchIds = upcomingMatches.map((m) => m.id);
  let confirmedCounts: Record<string, number> = {};

  if (matchIds.length > 0) {
    const { data: participations } = await supabase
      .from("match_participations")
      .select("match_id")
      .in("match_id", matchIds)
      .eq("status", "CONFIRMED");

    confirmedCounts = (participations ?? []).reduce(
      (acc, p) => {
        acc[p.match_id] = (acc[p.match_id] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  return (
    <div>
      <Link href="/groups" className="text-sm text-green-700 hover:underline">
        ← Back to groups
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          {group.description && <p className="mt-1 text-sm text-gray-500">{group.description}</p>}
          <p className="mt-2 text-xs text-gray-400">{memberCount ?? 0} members</p>
          {group.whatsapp_group_link && (
            <a
              href={group.whatsapp_group_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-green-700 hover:underline"
            >
              Open WhatsApp group →
            </a>
          )}
        </div>
        {canDeleteGroup && (
          <DeleteGroupButton groupId={group.id} groupName={group.name} />
        )}
      </div>

      {canManage && (
        <div className="mt-6">
          <InviteShare groupId={group.id} initialToken={group.invite_token} />
        </div>
      )}

      {canManage && (
        <PendingRequests groupId={group.id} requests={pendingRequests} />
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming matches</h2>
        {canManage && (
          <Link
            href={`/groups/${groupId}/matches/new`}
            className={buttonVariants({ size: "sm" })}
          >
            + Create match
          </Link>
        )}
      </div>

      {upcomingMatches.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          {matchesError && upcomingMatches.length === 0
            ? "Could not load matches. Run supabase/migrations/006_get_group_matches_rpc.sql in Supabase SQL Editor, then refresh."
            : "No upcoming matches scheduled."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {upcomingMatches.map((match) => {
            const canEditMatch =
              canManage || match.created_by_user_id === user.id;

            return (
              <Card key={match.id}>
                <Link href={`/matches/${match.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{match.title}</CardTitle>
                      <CardDescription>
                        {formatDate(match.date)} · {formatMatchTime(match.start_time, match.end_time)}
                      </CardDescription>
                      <CardDescription>{match.location_name}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="confirmed">
                        {confirmedCounts[match.id] ?? 0} / {match.max_players}
                      </Badge>
                      {Number(match.fee_per_player) > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatCurrency(Number(match.fee_per_player))}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                {canEditMatch && (
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <Link
                      href={`/matches/${match.id}/edit`}
                      className={buttonVariants({ size: "sm", variant: "secondary" })}
                    >
                      Edit
                    </Link>
                    <DeleteMatchButton matchId={match.id} matchTitle={match.title} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
