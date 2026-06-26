import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isHostOrCoHost } from "@/lib/match-logic";
import { GroupForm } from "@/components/group-form";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requireAuth();
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("cricket_groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const canManage = await isHostOrCoHost(groupId, user.id);
  if (!canManage) redirect(`/groups/${groupId}`);

  return (
    <div>
      <Link href={`/groups/${groupId}`} className="text-sm text-green-700 hover:underline">
        ← Back to {group.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit group</h1>
      <p className="mt-1 text-sm text-gray-500">
        Update the group name, description, or WhatsApp link.
      </p>
      <div className="mt-6">
        <GroupForm mode="edit" group={group} />
      </div>
    </div>
  );
}
