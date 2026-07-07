"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeGroupMember,
  promoteMemberToCoHost,
  demoteCoHostToPlayer,
} from "@/app/groups/actions";
import { Button } from "@/components/ui/button";
import { Badge, formatStatus, statusLabel } from "@/components/ui/badge";
import { formatPhone } from "@/lib/phone";
import { MAX_GROUP_HOSTS_AND_COHOSTS } from "@/lib/group-limits";
import type { MembershipRole } from "@/lib/types/database";

export interface GroupMember {
  membership_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  role: MembershipRole;
  joined_at: string;
}

type ConfirmRemove = {
  membershipId: string;
  name: string;
};

export function GroupMembers({
  groupId,
  members,
  currentUserId,
  canManageCoHosts,
  leadershipCount,
}: {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  canManageCoHosts: boolean;
  leadershipCount: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<ConfirmRemove | null>(null);
  const [error, setError] = useState<string | null>(null);

  const atLeadershipLimit = leadershipCount >= MAX_GROUP_HOSTS_AND_COHOSTS;

  if (members.length === 0) return null;

  async function handleRemove(membershipId: string) {
    setPendingId(membershipId);
    setError(null);

    const result = await removeGroupMember(membershipId, groupId);

    if (result?.error) {
      setError(result.error);
    } else {
      setConfirmRemove(null);
    }

    setPendingId(null);
    router.refresh();
  }

  async function handlePromote(membershipId: string) {
    setPendingId(membershipId);
    setError(null);

    const result = await promoteMemberToCoHost(membershipId, groupId);

    if (result?.error) {
      setError(result.error);
    }

    setPendingId(null);
    router.refresh();
  }

  async function handleDemote(membershipId: string) {
    setPendingId(membershipId);
    setError(null);

    const result = await demoteCoHostToPlayer(membershipId, groupId);

    if (result?.error) {
      setError(result.error);
    }

    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
      >
        <div>
          <p className="font-semibold text-gray-900">Members</p>
          <p className="text-xs text-gray-500">
            {members.length} {members.length === 1 ? "member" : "members"}
            {canManageCoHosts && (
              <span>
                {" "}
                · {leadershipCount}/{MAX_GROUP_HOSTS_AND_COHOSTS} hosts &amp; co-hosts
              </span>
            )}
          </p>
        </div>
        <span
          className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-3">
          <p className="mb-3 text-xs text-gray-500">
            Removing a member revokes their access. They can request to join again via the invite
            link.
            {canManageCoHosts && (
              <>
                {" "}
                As host, you can promote players to co-host (up to{" "}
                {MAX_GROUP_HOSTS_AND_COHOSTS} hosts and co-hosts combined).
              </>
            )}
          </p>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="space-y-2">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const canRemove = member.role !== "HOST" && !isSelf;
              const canPromote =
                canManageCoHosts && member.role === "PLAYER" && !atLeadershipLimit;
              const canDemote = canManageCoHosts && member.role === "CO_HOST";
              const isConfirming = confirmRemove?.membershipId === member.membership_id;
              const isPending = pendingId === member.membership_id;

              if (isConfirming) {
                return (
                  <div
                    key={member.membership_id}
                    className="rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <p className="text-sm font-medium text-red-900">
                      Remove {member.name} from this group?
                    </p>
                    <p className="mt-1 text-xs text-red-800">
                      They will lose access to group matches and RSVPs. They can request to join
                      again later using the invite link.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmRemove(null)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={isPending}
                        onClick={() => handleRemove(member.membership_id)}
                      >
                        Yes, remove member
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={member.membership_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {member.name}
                        {isSelf && (
                          <span className="ml-1 text-xs font-normal text-gray-400">(you)</span>
                        )}
                      </p>
                      <Badge variant={statusLabel(member.role)}>{formatStatus(member.role)}</Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {member.phone ? formatPhone(member.phone) : "Phone not available"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                    {canPromote && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={isPending}
                        onClick={() => handlePromote(member.membership_id)}
                      >
                        Make co-host
                      </Button>
                    )}
                    {canDemote && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        loading={isPending}
                        onClick={() => handleDemote(member.membership_id)}
                        className="text-gray-600"
                      >
                        Remove co-host
                      </Button>
                    )}
                    {canRemove && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setConfirmRemove({
                            membershipId: member.membership_id,
                            name: member.name,
                          })
                        }
                        className="text-red-700 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
