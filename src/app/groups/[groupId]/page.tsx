import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth, getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost, getUserGroupRole, isActiveMember } from "@/lib/match-logic";
import { isMatchElapsed, getMatchStartMs } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DeleteGroupButton } from "@/components/delete-group-button";
import { InviteShare } from "@/components/invite-share";
import { PendingRequests, type PendingRequest } from "@/components/pending-requests";
import { GroupMembers, type GroupMember } from "@/components/group-members";
import { UpcomingMatchesByDate } from "@/components/upcoming-matches-by-date";
import { PastMatchesSection } from "@/components/past-matches-section";
import type { MatchCreatorInfo } from "@/components/match-creator-link";
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
  const viewerProfile = await getUserProfile(user.id);

  const { data: group } = await supabase.from("cricket_groups").select("*").eq("id", groupId).single();
  if (!group) notFound();

  const canManage = await isHostOrCoHost(groupId, user.id);
  const canCreateMatch = await isActiveMember(groupId, user.id);
  const role = await getUserGroupRole(groupId, user.id);
  const canManageCoHosts = role === "HOST";
  const canDeleteGroup = role === "HOST" || group.created_by_user_id === user.id;

  let pendingRequests: PendingRequest[] = [];
  if (canManage) {
    const { data } = await supabase.rpc("get_pending_join_requests", {
      p_group_id: groupId,
    });
    const rows = (data as (PendingRequest & { email?: string | null })[] | null) ?? [];
    pendingRequests = rows.map((row) => ({
      ...row,
      phone: row.phone ?? row.email ?? null,
    }));
  }

  let groupMembers: GroupMember[] = [];
  if (canManage) {
    const { data } = await supabase.rpc("get_group_members", { p_group_id: groupId });
    groupMembers = (data as GroupMember[] | null) ?? [];
  }

  const { data: allMatches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("group_id", groupId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  const matchList: Match[] = (allMatches as Match[] | null) ?? [];

  // Upcoming = scheduled and not yet started; Past = already elapsed (or no
  // longer scheduled). Sort upcoming soonest-first, past most-recent-first.
  const upcomingMatches = matchList
    .filter((m) => m.status === "SCHEDULED" && !isMatchElapsed(m.date, m.start_time))
    .sort((a, b) => getMatchStartMs(a.date, a.start_time) - getMatchStartMs(b.date, b.start_time));

  const pastMatches = matchList
    .filter((m) => !(m.status === "SCHEDULED" && !isMatchElapsed(m.date, m.start_time)))
    .sort((a, b) => getMatchStartMs(b.date, b.start_time) - getMatchStartMs(a.date, a.start_time));

  const { count: memberCount } = await supabase
    .from("group_memberships")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "ACTIVE");

  const matchIds = matchList.map((m) => m.id);
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

  const creatorIds = [...new Set(matchList.map((m) => m.created_by_user_id))];
  let creators: Record<string, MatchCreatorInfo> = {};
  if (creatorIds.length > 0) {
    const { data: creatorRows } = await supabase
      .from("users")
      .select("id, name, phone")
      .in("id", creatorIds);

    creators = (creatorRows ?? []).reduce(
      (acc, u) => {
        acc[u.id] = { name: u.name, phone: u.phone };
        return acc;
      },
      {} as Record<string, MatchCreatorInfo>
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
          <div className="flex shrink-0 flex-col items-end gap-2">
            {canManage && (
              <Link
                href={`/groups/${group.id}/edit`}
                className={buttonVariants({ size: "sm", variant: "secondary" })}
              >
                Edit group
              </Link>
            )}
            <DeleteGroupButton groupId={group.id} groupName={group.name} />
          </div>
        )}
        {!canDeleteGroup && canManage && (
          <Link
            href={`/groups/${group.id}/edit`}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            Edit group
          </Link>
        )}
      </div>

      {canManage && (
        <div className="mt-6">
          <InviteShare groupId={group.id} initialToken={group.invite_token} />
        </div>
      )}

      {canManage && (
        <PendingRequests groupId={group.id} groupName={group.name} requests={pendingRequests} />
      )}

      {canManage && (
        <GroupMembers
          groupId={group.id}
          members={groupMembers}
          currentUserId={user.id}
          canManageCoHosts={canManageCoHosts}
          leadershipCount={groupMembers.filter(
            (m) => m.role === "HOST" || m.role === "CO_HOST"
          ).length}
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming matches</h2>
        {canCreateMatch && (
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
          {matchesError
            ? "Could not load matches. Please refresh."
            : "No upcoming matches scheduled."}
        </p>
      ) : (
        <UpcomingMatchesByDate
          matches={upcomingMatches}
          confirmedCounts={confirmedCounts}
          creators={creators}
          canManage={canManage}
          userId={user.id}
          userName={viewerProfile?.name ?? null}
        />
      )}

      <PastMatchesSection
        matches={pastMatches}
        confirmedCounts={confirmedCounts}
        creators={creators}
        userId={user.id}
        userName={viewerProfile?.name ?? null}
      />
    </div>
  );
}
