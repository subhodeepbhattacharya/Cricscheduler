import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost, getConfirmedCount } from "@/lib/match-logic";
import { formatDate, formatTime } from "@/lib/utils";
import { ManageParticipants } from "@/components/manage-participants";
import { TeamAssignment } from "@/components/team-assignment";
import type { ParticipationWithUser, User, Payment } from "@/lib/types/database";

export default async function ManageMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const user = await requireAuth();
  const { matchId } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
  if (!match) notFound();

  const canManage = await isHostOrCoHost(match.group_id, user.id);
  if (!canManage) redirect(`/matches/${matchId}`);

  const confirmedCount = await getConfirmedCount(matchId);

  const { data: participations } = await supabase
    .from("match_participations")
    .select("*")
    .eq("match_id", matchId)
    .order("joined_at", { ascending: true });

  type ParticipantUser = Pick<User, "id" | "name" | "phone">;
  const userIds = (participations ?? []).map((p) => p.user_id);
  let usersMap: Record<string, ParticipantUser> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, name, phone").in("id", userIds);
    usersMap = (users ?? []).reduce(
      (acc, u) => {
        acc[u.id] = u as ParticipantUser;
        return acc;
      },
      {} as Record<string, ParticipantUser>
    );
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });

  const latestPaymentByUser: Record<string, Payment> = {};
  for (const payment of payments ?? []) {
    if (!latestPaymentByUser[payment.payer_user_id]) {
      latestPaymentByUser[payment.payer_user_id] = payment as Payment;
    }
  }

  const participants: ParticipationWithUser[] = (participations ?? []).map((p) => ({
    ...p,
    team: p.team ?? null,
    user: usersMap[p.user_id] ?? { id: p.user_id, name: "Unknown", phone: null },
    payment: latestPaymentByUser[p.user_id] ?? null,
  }));

  return (
    <div>
      <Link href={`/matches/${matchId}`} className="text-sm text-green-700 hover:underline">
        ← Back to match
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-gray-900">Manage match</h1>
      <p className="mt-1 text-sm text-gray-500">
        {match.title} · {formatDate(match.date)} · {formatTime(match.start_time)}
      </p>
      <p className="mt-2 text-sm text-green-700">
        {confirmedCount} / {match.max_players} confirmed
      </p>

      <div className="mt-6 space-y-6">
        <TeamAssignment
          matchId={matchId}
          matchStatus={match.status}
          teamAName={match.team_a_name ?? null}
          teamBName={match.team_b_name ?? null}
          confirmed={participants.filter((p) => p.status === "CONFIRMED")}
        />
        <ManageParticipants
          matchId={matchId}
          prepaymentRequired={match.prepayment_required}
          participants={participants}
        />
      </div>
    </div>
  );
}
