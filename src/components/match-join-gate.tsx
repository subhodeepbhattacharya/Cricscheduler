import Link from "next/link";
import { JoinGroupButton } from "@/components/join-group-button";
import { buttonVariants } from "@/components/ui/button";

export type MatchJoinContext = {
  match_title: string;
  group_id: string;
  group_name: string;
  group_description: string | null;
  whatsapp_group_link: string | null;
  invite_token: string;
  membership_status: string | null;
};

type Props = {
  matchId: string;
  context: MatchJoinContext;
};

export function MatchJoinGate({ matchId, context }: Props) {
  const status = context.membership_status ?? undefined;

  return (
    <div>
      <Link href="/groups" className="text-sm text-green-700 hover:underline">
        ← My groups
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-medium uppercase text-gray-400">Match link</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Join {context.group_name} to view this match
        </h1>
        <p className="mt-2 text-sm text-gray-600">{context.match_title}</p>
        {context.group_description && (
          <p className="mt-2 text-sm text-gray-500">{context.group_description}</p>
        )}

        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
          <p className="font-medium">Only WhatsApp group members should join.</p>
          <p className="mt-1 text-xs text-amber-700">
            The host will review each request and approve people who are part of the group&apos;s
            WhatsApp chat.
          </p>
        </div>

        <div className="mt-5">
          {status === "ACTIVE" ? (
            <Link
              href={`/matches/${matchId}`}
              className={buttonVariants({ size: "lg" })}
            >
              View match →
            </Link>
          ) : status === "PENDING" ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your request to join {context.group_name} is pending host approval. Once approved,
              open this link again to view the match and RSVP.
            </p>
          ) : status === "BANNED" ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              You can&apos;t join this group.
            </p>
          ) : (
            <JoinGroupButton token={context.invite_token} />
          )}
        </div>
      </div>
    </div>
  );
}
