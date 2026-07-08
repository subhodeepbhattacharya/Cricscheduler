import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canManageMatch } from "@/lib/match-logic";
import { normalizeMatchRpc } from "@/lib/rpc-result";
import { MatchForm } from "@/components/match-form";
import type { Match } from "@/lib/types/database";

export default async function EditMatchPage({
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

  if (!match) notFound();

  const allowed = await canManageMatch(match, user.id);
  if (!allowed) redirect(`/matches/${matchId}`);

  if (match.status !== "SCHEDULED") {
    redirect(`/matches/${matchId}`);
  }

  return (
    <div>
      <Link href={`/matches/${matchId}`} className="text-sm text-green-700 hover:underline">
        ← Back to match
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit match</h1>
      <p className="mt-1 text-sm text-gray-500">Update details for {match.title}</p>
      <div className="mt-6">
        <MatchForm mode="edit" groupId={match.group_id} match={match} />
      </div>
    </div>
  );
}
