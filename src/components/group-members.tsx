"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeGroupMember } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";
import { Badge, formatStatus, statusLabel } from "@/components/ui/badge";
import { formatPhone } from "@/lib/phone";
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
}: {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<ConfirmRemove | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          </p>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="space-y-2">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const canRemove = member.role !== "HOST" && !isSelf;
              const isConfirming = confirmRemove?.membershipId === member.membership_id;

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
                        disabled={pendingId === member.membership_id}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={pendingId === member.membership_id}
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
                      className="shrink-0 text-red-700 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
