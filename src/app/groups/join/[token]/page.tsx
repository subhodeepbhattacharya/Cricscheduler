import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JoinGroupButton } from "@/components/join-group-button";

export const dynamic = "force-dynamic";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/groups/join/${token}`)}`);
  }

  const supabase = await createClient();

  const { data: groups } = await supabase.rpc("get_group_by_invite_token", {
    p_token: token,
  });

  const group = Array.isArray(groups) ? groups[0] : groups;
  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_memberships")
    .select("status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const status = membership?.status as string | undefined;

  return (
    <div>
      <Link href="/groups" className="text-sm text-green-700 hover:underline">
        ← My groups
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-400">You&apos;re invited to join</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{group.name}</h1>
        {group.description && <p className="mt-2 text-sm text-gray-500">{group.description}</p>}

        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
          <p className="font-medium">Only WhatsApp group members should join.</p>
          <p className="mt-1 text-xs text-amber-700">
            The host will review each request and approve people who are part of the group&apos;s
            WhatsApp chat.
          </p>
          {group.whatsapp_group_link && (
            <a
              href={group.whatsapp_group_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-green-700 hover:underline"
            >
              Open the WhatsApp group →
            </a>
          )}
        </div>

        <div className="mt-5">
          {status === "ACTIVE" ? (
            <Link href={`/groups/${group.id}`}>
              <span className="inline-block rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700">
                Go to group →
              </span>
            </Link>
          ) : status === "PENDING" ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your request is pending host approval.
            </p>
          ) : status === "BANNED" ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              You can&apos;t join this group.
            </p>
          ) : (
            <JoinGroupButton token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
