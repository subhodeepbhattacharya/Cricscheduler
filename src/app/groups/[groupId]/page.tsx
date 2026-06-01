import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost } from "@/lib/match-logic";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/types/database";

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

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "SCHEDULED")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true });

  const { count: memberCount } = await supabase
    .from("group_memberships")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "ACTIVE");

  const matchIds = (matches ?? []).map((m) => m.id);
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

      <div className="mt-2">
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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming matches</h2>
        {canManage && (
          <Link href={`/groups/${groupId}/matches/new`}>
            <Button size="sm">+ Create match</Button>
          </Link>
        )}
      </div>

      {(matches ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No upcoming matches scheduled.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {(matches as Match[]).map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{match.title}</CardTitle>
                    <CardDescription>
                      {formatDate(match.date)} · {formatTime(match.start_time)} –{" "}
                      {formatTime(match.end_time)}
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
