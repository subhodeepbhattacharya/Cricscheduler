import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost } from "@/lib/match-logic";
import { MatchForm } from "@/components/match-form";

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireAuth();
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase.from("cricket_groups").select("name").eq("id", groupId).single();
  if (!group) notFound();

  const canCreate = await isHostOrCoHost(groupId, user.id);
  if (!canCreate) redirect(`/groups/${groupId}`);

  return (
    <div>
      <Link href={`/groups/${groupId}`} className="text-sm text-green-700 hover:underline">
        ← Back to {group.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Create a match</h1>
      <p className="mt-1 text-sm text-gray-500">Schedule a new cricket match for your group.</p>
      <div className="mt-6">
        <MatchForm mode="create" groupId={groupId} />
      </div>
    </div>
  );
}
